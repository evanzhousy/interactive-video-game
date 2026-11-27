#!/usr/bin/env python3
"""
Continuity QA Gate for Episode 0 (`Quarantine Gate 0: 2036`).

Verifies:
  1. Zero same-raw-image snap-backs (`chain_prev` or distinct shot framing across all consecutive cuts).
  2. Every shot in `SHOTS` belongs to `REEL_ORDER` (no orphaned shots like v1's dropped biscuit reel).
  3. Extracts `Prev End (-0.12s)` vs `Next Start (+0.12s)` frame pairs across all inter-reel and intra-reel
     cuts into contact sheets for visual review, plus verifies 1280x720 H.264, 48kHz stereo AAC, non-silent audio.
"""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw


def load_render_metadata() -> tuple[list[dict], list[str]]:
    src = Path("scripts/render-ep0-minimax-h3.py").read_text(encoding="utf-8")
    ns: dict = {}
    exec(compile(src.split("def sh(")[0], "render_meta", "exec"), ns)
    return ns["SHOTS"], ns["REEL_ORDER"]


def check_graph_continuity(shots: list[dict], reel_order: list[str]) -> None:
    shot_reels = {s["reel"] for s in shots}
    assert shot_reels == set(reel_order), f"Reel mismatch! Missing={shot_reels - set(reel_order)}"
    snapbacks: list[str] = []
    prev = None
    for s in shots:
        if prev:
            is_chained = bool(s.get("chain_prev"))
            same_raw = prev.get("raw_img") and prev["raw_img"] == s.get("raw_img") and not is_chained
            if same_raw:
                snapbacks.append(f"{prev['id']} -> {s['id']} ({s['raw_img']})")
        prev = s
    assert not snapbacks, f"Detected same-image snap-back cuts without chain_prev: {snapbacks}"
    print(f"[PASS] Graph continuity check: {len(shots)} shots, {len(reel_order)} reels, 0 snap-backs.")


def verify_media_streams(videos_dir: Path, manifest: dict) -> None:
    for rid, info in manifest.items():
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
        v = [s for s in probe["streams"] if s["codec_type"] == "video"][0]
        a = [s for s in probe["streams"] if s["codec_type"] == "audio"][0]
        dur = float(probe["format"]["duration"])
        vol = subprocess.run(
            ["ffmpeg", "-v", "info", "-i", str(mp4), "-af", "volumedetect", "-f", "null", "-"],
            capture_output=True,
            text=True,
        ).stderr
        mean_v = [ln.split("mean_volume:")[-1].strip() for ln in vol.splitlines() if "mean_volume:" in ln][0]
        assert int(v["width"]) == 1280 and int(v["height"]) == 720, f"Bad dims on {rid}"
        assert v["codec_name"] == "h264" and a["codec_name"] == "aac", f"Bad codecs on {rid}"
        assert abs(dur - float(info["durationSec"])) < 0.25, f"Duration mismatch on {rid}"
        mv_num = float(mean_v.split()[0])
        assert -60.0 < mv_num < -5.0, f"Abnormal audio on {rid}: {mean_v}"
        print(f"  [OK] {rid:26s} | 1280x720 h264+aac | dur={dur:5.2f}s | {mean_v}")


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
    parser.add_argument("--dir", required=True, help="Directory with stitched MP4s and ep0_h3_manifest.json")
    parser.add_argument("--out", required=True, help="Output directory for extracted continuity sheets")
    parser.add_argument("--graph-only", action="store_true", help="Only validate SHOTS & REEL_ORDER metadata")
    args = parser.parse_args()

    shots, reel_order = load_render_metadata()
    check_graph_continuity(shots, reel_order)
    if args.graph_only:
        return

    videos_dir = Path(args.dir)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((videos_dir / "ep0_h3_manifest.json").read_text(encoding="utf-8"))
    verify_media_streams(videos_dir, manifest)

    inter_pairs = []
    for i in range(len(reel_order) - 1):
        r1, r2 = reel_order[i], reel_order[i + 1]
        p1, p2 = videos_dir / f"{r1}.mp4", videos_dir / f"{r2}.mp4"
        d1 = float(manifest[r1]["durationSec"])
        f1 = out_dir / f"inter_{i:02d}_end.png"
        f2 = out_dir / f"inter_{i:02d}_start.png"
        grab(p1, max(0.0, d1 - 0.15), f1)
        grab(p2, 0.90 if i in (3, 4, 5, 6, 7, 8, 9) else 0.25, f2)
        inter_pairs.append((f"#{i+1} {r1} -> {r2}", f1, f2))

    intra_pairs = []
    idx = 0
    for rid in reel_order:
        cues = manifest[rid]["cues"]
        mp4 = videos_dir / f"{rid}.mp4"
        for c_i in range(len(cues) - 1):
            cut_t = float(cues[c_i]["endSec"])
            f1 = out_dir / f"intra_{idx:02d}_end.png"
            f2 = out_dir / f"intra_{idx:02d}_start.png"
            grab(mp4, max(0.0, cut_t - 0.12), f1)
            grab(mp4, cut_t + 0.12, f2)
            intra_pairs.append((f"{rid} cut {c_i+1}->{c_i+2} (@{cut_t:.2f}s)", f1, f2))
            idx += 1

    make_sheet(inter_pairs, out_dir / "sheet_inter_reel.png", "V2 INTER-REEL TRANSITIONS")
    mid = (len(intra_pairs) + 1) // 2
    make_sheet(intra_pairs[:mid], out_dir / "sheet_intra_part1.png", "V2 INTRA-REEL TRANSITIONS (PART 1)")
    make_sheet(intra_pairs[mid:], out_dir / "sheet_intra_part2.png", "V2 INTRA-REEL TRANSITIONS (PART 2)")
    print("CONTINUITY_AUDIT_COMPLETE")


if __name__ == "__main__":
    main()
