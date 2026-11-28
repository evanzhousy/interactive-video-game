#!/usr/bin/env python3
"""
Unified Continuity QA Gate for Quarantine Gate 0: 2036 (Ep0, Stage 1 N1, Stage 2 N2-4, Stage 3 N5).

Verifies:
  1. Graph integrity: REEL_ORDER == set(shot reels), unique shot IDs, valid chain_prev links,
     valid IMAGES registry with raw.githubusercontent.com portrait URLs, and 0 same-raw-image snap-backs.
  2. Media integrity (unless --graph-only): manifest coverage, 1280x720 H.264 + 48kHz stereo AAC,
     duration parity, and volumedetect (-60 dB < mean_volume < -5 dB).
  3. Visual contact sheets: `sheet_inter_reel.png` and chunked `sheet_intra_part*.png` comparing
     `Prev End` vs `Next Start` frames across every cut.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import math
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw

RAW_GH_PREFIX = "https://raw.githubusercontent.com/evanzhousy/interactive-video-game/main/public/portraits/"


def load_render_metadata(script_path: Path) -> dict:
    spec = importlib.util.spec_from_file_location("render_script_meta", str(script_path))
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load render script: {script_path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return {
        "shots": getattr(mod, "SHOTS"),
        "reel_order": getattr(mod, "REEL_ORDER"),
        "reel_fades": getattr(mod, "REEL_FADES", {}),
        "images": getattr(mod, "IMAGES", {}),
        "manifest_name": getattr(mod, "MANIFEST_NAME", None),
    }


def check_graph_continuity(meta: dict) -> None:
    shots: list[dict] = meta["shots"]
    reel_order: list[str] = meta["reel_order"]
    images: dict[str, str] = meta["images"]

    assert reel_order, "REEL_ORDER must not be empty"
    assert len(reel_order) == len(set(reel_order)), "Duplicate reel IDs in REEL_ORDER"

    shot_reels = {s["reel"] for s in shots}
    missing_from_order = shot_reels - set(reel_order)
    empty_in_order = set(reel_order) - shot_reels
    assert not missing_from_order, f"Orphaned reel(s) missing from REEL_ORDER: {missing_from_order}"
    assert not empty_in_order, f"Empty reel(s) in REEL_ORDER with no shots: {empty_in_order}"

    shot_ids = [s["id"] for s in shots]
    assert len(shot_ids) == len(set(shot_ids)), "Duplicate shot IDs in SHOTS"

    if images:
        bad_urls = [k for k, u in images.items() if not u.startswith(RAW_GH_PREFIX)]
        assert not bad_urls, f"IMAGES entries must start with {RAW_GH_PREFIX}: {bad_urls}"

    seen_ids: set[str] = set()
    by_id: dict[str, dict] = {}
    snapbacks: list[str] = []
    prev_global: dict | None = None
    prev_by_reel: dict[str, dict] = {}

    for s in shots:
        sid = s["id"]
        rid = s["reel"]
        raw_img = s.get("raw_img")
        if images:
            assert raw_img in images, f"Shot {sid} raw_img '{raw_img}' missing from IMAGES"
            lf = s.get("last_frame_img")
            if lf:
                lf_raw = lf.removeprefix("h3_1344_")
                assert lf_raw in images, f"Shot {sid} last_frame_img '{lf}' missing from IMAGES"

        cp = s.get("chain_prev")
        if cp:
            assert cp in seen_ids, f"Shot {sid} chain_prev '{cp}' does not reference an earlier shot"
            assert by_id[cp]["reel"] == rid, f"Shot {sid} chain_prev '{cp}' crosses reels ({by_id[cp]['reel']} -> {rid})"

        prev_in_reel = prev_by_reel.get(rid)
        if prev_in_reel and prev_in_reel.get("raw_img") == raw_img and not cp:
            snapbacks.append(f"[intra:{rid}] {prev_in_reel['id']} -> {sid} ({raw_img})")
        if prev_global and prev_global["reel"] != rid and prev_global.get("raw_img") == raw_img and not cp:
            snapbacks.append(f"[inter:{prev_global['reel']}->{rid}] {prev_global['id']} -> {sid} ({raw_img})")

        seen_ids.add(sid)
        by_id[sid] = s
        prev_by_reel[rid] = s
        prev_global = s

    assert not snapbacks, f"Detected same-image snap-back cuts without chain_prev: {snapbacks}"
    total_frames = sum(int(s["length"]) for s in shots)
    print(
        f"[PASS] Graph continuity check: {len(shots)} shots, {len(reel_order)} reels, "
        f"~{total_frames / 24.0:.1f}s est, 0 snap-backs."
    )


def find_manifest(videos_dir: Path, preferred_name: str | None) -> Path:
    if preferred_name and (videos_dir / preferred_name).exists():
        return videos_dir / preferred_name
    candidates = sorted(videos_dir.glob("*_manifest.json"))
    if not candidates:
        raise FileNotFoundError(f"No *_manifest.json found in {videos_dir}")
    return candidates[0]


def verify_media_streams(videos_dir: Path, manifest: dict, reel_order: list[str]) -> None:
    missing_reels = [rid for rid in reel_order if rid not in manifest]
    assert not missing_reels, f"Reels missing from manifest: {missing_reels}"

    for rid in reel_order:
        info = manifest[rid]
        mp4 = videos_dir / f"{rid}.mp4"
        assert mp4.exists(), f"Missing {mp4}"
        probe = json.loads(
            subprocess.check_output(
                [
                    "ffprobe",
                    "-v",
                    "error",
                    "-show_entries",
                    "format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels",
                    "-of",
                    "json",
                    str(mp4),
                ],
                text=True,
            )
        )
        v_streams = [s for s in probe["streams"] if s["codec_type"] == "video"]
        a_streams = [s for s in probe["streams"] if s["codec_type"] == "audio"]
        assert v_streams, f"No video stream in {rid}"
        assert a_streams, f"No audio stream in {rid}"
        v, a = v_streams[0], a_streams[0]
        dur = float(probe["format"]["duration"])

        vol = subprocess.run(
            ["ffmpeg", "-v", "info", "-i", str(mp4), "-af", "volumedetect", "-f", "null", "-"],
            capture_output=True,
            text=True,
        ).stderr
        mean_lines = [ln.split("mean_volume:")[-1].strip() for ln in vol.splitlines() if "mean_volume:" in ln]
        assert mean_lines, f"Could not detect audio mean_volume on {rid}"
        mean_v = mean_lines[0]

        assert int(v["width"]) == 1280 and int(v["height"]) == 720, f"Bad dims on {rid}: {v['width']}x{v['height']}"
        assert v["codec_name"] == "h264" and a["codec_name"] == "aac", f"Bad codecs on {rid}: {v['codec_name']}/{a['codec_name']}"
        assert str(a.get("sample_rate")) == "48000" and int(a.get("channels", 0)) == 2, f"Bad audio format on {rid}: {a}"
        assert abs(dur - float(info["durationSec"])) < 0.30, f"Duration mismatch on {rid}: {dur} vs {info['durationSec']}"
        mv_num = float(mean_v.split()[0])
        assert -60.0 < mv_num < -5.0, f"Abnormal audio on {rid}: {mean_v}"
        print(f"  [OK] {rid:30s} | 1280x720 h264+aac | dur={dur:6.2f}s | {mean_v}")


def grab(mp4: Path, t: float, dst: Path) -> None:
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-ss",
            f"{max(0.0, t):.3f}",
            "-i",
            str(mp4),
            "-frames:v",
            "1",
            "-vf",
            "scale=384:216",
            str(dst),
        ],
        check=True,
    )


def make_sheet(pairs: list[tuple[str, Path, Path]], dst: Path, title: str) -> None:
    if not pairs:
        return
    w, h, pad, label_h = 384, 216, 10, 26
    canvas = Image.new("RGB", (w * 2 + pad * 3, (h + label_h + pad) * len(pairs) + 40), (16, 18, 22))
    draw = ImageDraw.Draw(canvas)
    draw.text((pad, 10), title, fill=(245, 196, 81))
    for r, (lbl, f1, f2) in enumerate(pairs):
        y = 40 + r * (h + label_h + pad)
        draw.text((pad, y), f"{lbl}  |  LEFT: PREV END   RIGHT: NEXT START", fill=(220, 230, 240))
        canvas.paste(Image.open(f1), (pad, y + label_h))
        canvas.paste(Image.open(f2), (w + pad * 2, y + label_h))
    canvas.save(dst)
    print(f"[SHEET] {dst}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--script", default="scripts/render-ep0-minimax-h3.py", help="Render script path")
    parser.add_argument("--dir", required=True, help="Directory with stitched MP4s and *_manifest.json")
    parser.add_argument("--out", required=True, help="Output directory for extracted continuity sheets")
    parser.add_argument("--graph-only", action="store_true", help="Only validate SHOTS, IMAGES & REEL_ORDER metadata")
    args = parser.parse_args()

    meta = load_render_metadata(Path(args.script))
    check_graph_continuity(meta)
    if args.graph_only:
        return

    videos_dir = Path(args.dir)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = find_manifest(videos_dir, meta["manifest_name"])
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    reel_order: list[str] = meta["reel_order"]
    reel_fades: dict[str, tuple[float, float]] = meta["reel_fades"]

    verify_media_streams(videos_dir, manifest, reel_order)

    inter_pairs: list[tuple[str, Path, Path]] = []
    for i in range(len(reel_order) - 1):
        r1, r2 = reel_order[i], reel_order[i + 1]
        p1, p2 = videos_dir / f"{r1}.mp4", videos_dir / f"{r2}.mp4"
        d1 = float(manifest[r1]["durationSec"])
        d2 = float(manifest[r2]["durationSec"])
        fade_out_1 = float(reel_fades.get(r1, (0.0, 0.0))[1])
        fade_in_2 = float(reel_fades.get(r2, (0.0, 0.0))[0])
        t_end = max(0.0, d1 - (fade_out_1 + 0.15 if fade_out_1 > 0 else 0.15))
        t_start = min(max(0.25, fade_in_2 + 0.15), max(0.25, d2 - 0.15)) if fade_in_2 > 0 else 0.25
        f1 = out_dir / f"inter_{i:02d}_end.png"
        f2 = out_dir / f"inter_{i:02d}_start.png"
        grab(p1, t_end, f1)
        grab(p2, t_start, f2)
        inter_pairs.append((f"#{i+1} {r1} -> {r2}", f1, f2))

    intra_pairs: list[tuple[str, Path, Path]] = []
    idx = 0
    for rid in reel_order:
        cues = manifest[rid]["cues"]
        mp4 = videos_dir / f"{rid}.mp4"
        for c_i in range(len(cues) - 1):
            cut_t = float(cues[c_i]["endSec"])
            f1 = out_dir / f"intra_{idx:03d}_end.png"
            f2 = out_dir / f"intra_{idx:03d}_start.png"
            grab(mp4, max(0.0, cut_t - 0.12), f1)
            grab(mp4, cut_t + 0.12, f2)
            intra_pairs.append((f"{rid} cut {c_i+1}->{c_i+2} (@{cut_t:.2f}s)", f1, f2))
            idx += 1

    make_sheet(inter_pairs, out_dir / "sheet_inter_reel.png", f"INTER-REEL TRANSITIONS ({manifest_path.stem})")
    if intra_pairs:
        per_sheet = 22
        parts = max(1, math.ceil(len(intra_pairs) / per_sheet))
        for p_idx in range(parts):
            chunk = intra_pairs[p_idx * per_sheet : (p_idx + 1) * per_sheet]
            make_sheet(
                chunk,
                out_dir / f"sheet_intra_part{p_idx + 1}.png",
                f"INTRA-REEL TRANSITIONS PART {p_idx + 1}/{parts}",
            )
    print("CONTINUITY_AUDIT_COMPLETE")


if __name__ == "__main__":
    main()
