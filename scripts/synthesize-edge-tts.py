#!/usr/bin/env python3
"""
Batch-renders studio neural intercom MP3 lines for Quarantine Gate 0: 2036
from `public/media-manifest.json` using Microsoft Edge Neural TTS + FFmpeg radio mastering.
"""

import argparse
import asyncio
import json
import os
import pathlib
import shutil
import subprocess
import tempfile
from typing import Dict, Tuple

# Distinct regional/character neural voice casting per (visitorId, locale) -> (voice, rate, pitch)
VOICE_CAST: Dict[str, Dict[str, Tuple[str, str, str]]] = {
    # V-01 Dr. Elena Vance — Canadian Chief Surgeon (clipped, impatient, clinical)
    "V-01": {
        "en": ("en-CA-ClaraNeural", "+5%", "-3Hz"),
        "zh": ("zh-CN-XiaoxiaoNeural", "+5%", "-4Hz"),
        "ja": ("ja-JP-NanamiNeural", "+4%", "-4Hz"),
    },
    # V-02 Leo Sato — Apprentice Mechanic (nervous, eager to please, talks fast)
    "V-02": {
        "en": ("en-US-BrianNeural", "+12%", "+6Hz"),
        "zh": ("zh-CN-YunxiNeural", "+12%", "+5Hz"),
        "ja": ("ja-JP-KeitaNeural", "+12%", "+7Hz"),
    },
    # V-03 Arthur Sterling — British Compliance Auditor (clipped Oxford bureaucratic cadence)
    "V-03": {
        "en": ("en-GB-ThomasNeural", "-4%", "-4Hz"),
        "zh": ("zh-CN-YunyangNeural", "-4%", "-4Hz"),
        "ja": ("ja-JP-KeitaNeural", "-5%", "-4Hz"),
    },
    # V-04 Capt. Marcus Chen — Security Captain (gruff, barks orders, hides kindness)
    "V-04": {
        "en": ("en-US-ChristopherNeural", "-5%", "-10Hz"),
        "zh": ("zh-CN-YunjianNeural", "-4%", "-8Hz"),
        "ja": ("ja-JP-KeitaNeural", "-7%", "-11Hz"),
    },
    # V-05 Ana Ribeiro — Brazilian Saturation Diver (blunt, laconic, zero sentimentality)
    "V-05": {
        "en": ("pt-BR-ThalitaMultilingualNeural", "-2%", "-5Hz"),
        "zh": ("zh-CN-liaoning-XiaobeiNeural", "-2%", "-5Hz"),
        "ja": ("ja-JP-NanamiNeural", "-4%", "-8Hz"),
    },
    # V-06 Dr. Ingrid Solberg — Norwegian Psychologist (velvety, soothing clinical calm)
    "V-06": {
        "en": ("en-GB-SoniaNeural", "-7%", "+2Hz"),
        "zh": ("zh-TW-HsiaoChenNeural", "-7%", "+1Hz"),
        "ja": ("ja-JP-NanamiNeural", "-8%", "+3Hz"),
    },
    # V-07 Dr. Lin Mei — Cryo-Biologist (quiet, precise, terse)
    "V-07": {
        "en": ("en-US-MichelleNeural", "-3%", "-2Hz"),
        "zh": ("zh-TW-HsiaoYuNeural", "-3%", "-2Hz"),
        "ja": ("ja-JP-NanamiNeural", "-3%", "-1Hz"),
    },
    # V-08 Hannah Weiss — German Life-Support Tech (sharp, rigid technical precision)
    "V-08": {
        "en": ("en-US-AriaNeural", "+6%", "+1Hz"),
        "zh": ("zh-CN-XiaoyiNeural", "+6%", "+1Hz"),
        "ja": ("ja-JP-NanamiNeural", "+7%", "+5Hz"),
    },
    # OP-09 Night 5 Doppelgänger — Calm, eerie 100%-consistent mirror voice
    "OP-09": {
        "en": ("en-US-AndrewMultilingualNeural", "-5%", "-4Hz"),
        "zh": ("zh-CN-YunyangNeural", "-6%", "-8Hz"),
        "ja": ("ja-JP-KeitaNeural", "-4%", "-2Hz"),
    },
}

DEFAULT_CAST: Dict[str, Tuple[str, str, str]] = {
    "en": ("en-US-AriaNeural", "+0%", "+0Hz"),
    "zh": ("zh-CN-XiaoxiaoNeural", "+0%", "+0Hz"),
    "ja": ("ja-JP-NanamiNeural", "+0%", "+0Hz"),
}


def master_intercom_mp3(raw_mp3: str, final_mp3: str, has_ffmpeg: bool) -> None:
    pathlib.Path(final_mp3).parent.mkdir(parents=True, exist_ok=True)
    if not has_ffmpeg:
        shutil.move(raw_mp3, final_mp3)
        return
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            raw_mp3,
            "-af",
            "highpass=f=300,lowpass=f=3500,acompressor=threshold=-18dB:ratio=3:attack=5:release=60,loudnorm=I=-16:TP=-1.5:LRA=9",
            "-ar",
            "24000",
            "-ac",
            "1",
            "-c:a",
            "libmp3lame",
            "-b:a",
            "48k",
            final_mp3,
        ],
        check=True,
    )
    os.remove(raw_mp3)


async def render_item(
    sem: asyncio.Semaphore,
    item: dict,
    root_dir: pathlib.Path,
    has_ffmpeg: bool,
    force: bool,
    idx: int,
    total: int,
) -> str:
    import edge_tts

    out_path = root_dir / item["targetMp3"]
    if not force and out_path.exists() and out_path.stat().st_size > 512:
        return "skipped"

    locale = item["locale"]
    vid = item["visitorId"]
    voice, rate, pitch = VOICE_CAST.get(vid, DEFAULT_CAST).get(locale, DEFAULT_CAST[locale])
    text = item["spokenText"]

    async with sem:
        last_err = None
        for attempt in range(1, 5):
            fd, tmp_raw = tempfile.mkstemp(suffix=".raw.mp3")
            os.close(fd)
            try:
                comm = edge_tts.Communicate(text=text, voice=voice, rate=rate, pitch=pitch)
                await comm.save(tmp_raw)
                if os.path.getsize(tmp_raw) < 256:
                    raise RuntimeError("Empty audio buffer")
                await asyncio.to_thread(master_intercom_mp3, tmp_raw, str(out_path), has_ffmpeg)
                if idx % 25 == 0 or idx == total:
                    print(
                        f"✓ [{idx}/{total}] {item['targetMp3']} ({voice}, {out_path.stat().st_size} B)",
                        flush=True,
                    )
                return "rendered"
            except Exception as err:
                last_err = err
                if os.path.exists(tmp_raw):
                    os.remove(tmp_raw)
                await asyncio.sleep(0.6 * attempt)
        raise RuntimeError(f"Failed TTS for {item['targetMp3']}: {last_err}")


async def main_async() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", default="public/media-manifest.json")
    parser.add_argument("--locale", default="")
    parser.add_argument("--visitor", default="")
    parser.add_argument("--concurrency", type=int, default=6)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    root_dir = pathlib.Path.cwd()
    manifest = json.loads((root_dir / args.manifest).read_text(encoding="utf-8"))
    lines = manifest["voiceLines"]
    if args.locale:
        lines = [x for x in lines if x["locale"] == args.locale]
    if args.visitor:
        lines = [x for x in lines if x["visitorId"] == args.visitor or x["slug"] == args.visitor]

    has_ffmpeg = shutil.which("ffmpeg") is not None
    sem = asyncio.Semaphore(max(1, args.concurrency))

    tasks = [
        render_item(sem, item, root_dir, has_ffmpeg, args.force, i + 1, len(lines))
        for i, item in enumerate(lines)
    ]
    results = await asyncio.gather(*tasks)
    rendered = sum(1 for r in results if r == "rendered")
    skipped = sum(1 for r in results if r == "skipped")
    print(f"Done (Edge Neural TTS): rendered={rendered}, skipped={skipped}, total={len(lines)}")


if __name__ == "__main__":
    asyncio.run(main_async())
