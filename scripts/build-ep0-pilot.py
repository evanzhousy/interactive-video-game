#!/usr/bin/env python3
"""
Builds the complete Episode 0 Pilot (07:15 = 435.0s) for `Quarantine Gate 0: 2036`
strictly aligned to locked screenplay `docs/screenplay-30min.md` (v1.3):
  - 11 multi-shot 1280x720 24fps H.264 + AAC MP4 clips in `videos/ep0-pilot/`
  - Multi-character Chinese neural voiceover (`edge-tts`) with spatial EQ
  - Procedural 48kHz stereo cinema foley & underscore with automatic speech ducking
  - Emits `src/game/ep0-cues.generated.ts` with synced trilingual `EP0_SUBTITLE_CUES`
"""

import asyncio
import json
import math
import pathlib
import shutil
import subprocess
import tempfile
import wave
from dataclasses import dataclass
from typing import Callable

import edge_tts
import numpy as np

REPO = pathlib.Path("/Users/evansmacbookpro/Desktop/Projects/interactive-video-game")
STILLS_STORY = REPO / "public" / "portraits" / "story"
STILLS_EP0 = STILLS_STORY / "ep0"
OUT_VIDEOS = REPO / "videos" / "ep0-pilot"
OUT_CUES_TS = REPO / "src" / "game" / "ep0-cues.generated.ts"
SR = 48000


@dataclass(frozen=True)
class VoiceLine:
    speaker_key: str
    voice: str
    rate: str
    pitch: str
    space: str  # outdoor | canteen | whisper | radio | briefing | booth | door | cassette
    target_start: float
    speaker_zh: str
    speaker_en: str
    speaker_ja: str
    text_zh: str
    text_en: str
    text_ja: str


@dataclass(frozen=True)
class VisualCut:
    image: pathlib.Path
    duration: float
    motion: str  # push_in | pull_out | pan_right | pan_left | slow_drift
    xfade_after: float = 0.45


def run_ffmpeg(args: list[str]) -> None:
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *args], check=True)


def probe_duration(path: pathlib.Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=nw=1:nk=1",
            str(path),
        ],
        text=True,
    ).strip()
    return float(out)


def space_filter(space: str) -> str:
    trim = (
        "silenceremove=start_periods=1:start_threshold=-42dB:detection=peak,"
        "areverse,silenceremove=start_periods=1:start_threshold=-42dB:detection=peak,areverse"
    )
    filters = {
        "outdoor": f"{trim},highpass=f=120,lowpass=f=7600,acompressor=threshold=-18dB:ratio=3:attack=5:release=60,loudnorm=I=-15:TP=-1.5:LRA=7",
        "canteen": f"{trim},highpass=f=90,lowpass=f=8800,aecho=0.8:0.85:18:0.08,acompressor=threshold=-18dB:ratio=2.8:attack=6:release=70,loudnorm=I=-15:TP=-1.5:LRA=7",
        "whisper": f"{trim},highpass=f=110,lowpass=f=6500,acompressor=threshold=-20dB:ratio=3.5:attack=4:release=60,loudnorm=I=-16:TP=-1.5:LRA=6",
        "radio": f"{trim},highpass=f=360,lowpass=f=2900,acompressor=threshold=-20dB:ratio=6:attack=3:release=45,acrusher=bits=10:mode=log,loudnorm=I=-14:TP=-1.5:LRA=6",
        "briefing": f"{trim},highpass=f=95,lowpass=f=8200,aecho=0.8:0.85:24:0.10,acompressor=threshold=-18dB:ratio=3:attack=5:release=70,loudnorm=I=-15:TP=-1.5:LRA=7",
        "booth": f"{trim},highpass=f=110,lowpass=f=7200,aecho=0.8:0.85:12:0.05,acompressor=threshold=-18dB:ratio=3:attack=5:release=65,loudnorm=I=-15:TP=-1.5:LRA=7",
        "door": f"{trim},highpass=f=160,lowpass=f=1450,aecho=0.8:0.75:20:0.12,acompressor=threshold=-18dB:ratio=4:attack=4:release=55,loudnorm=I=-15:TP=-1.5:LRA=6",
        "cassette": f"{trim},highpass=f=320,lowpass=f=3200,acompressor=threshold=-19dB:ratio=4.5:attack=3:release=50,acrusher=bits=11:mode=log,loudnorm=I=-14:TP=-1.5:LRA=6",
    }
    return filters[space]


def bump_rate(rate_str: str, delta_pct: int) -> str:
    val = int(rate_str.replace("%", "").replace("+", ""))
    new_val = max(-20, min(40, val + delta_pct))
    return f"+{new_val}%" if new_val >= 0 else f"{new_val}%"


async def synth_line_wav(
    line: VoiceLine, out_wav: pathlib.Path, max_dur: float | None = None
) -> float:
    with tempfile.TemporaryDirectory() as td:
        tmp = pathlib.Path(td)
        rate = line.rate
        for attempt in range(4):
            raw_mp3 = tmp / f"raw_{attempt}.mp3"
            for retry in range(4):
                try:
                    comm = edge_tts.Communicate(
                        text=line.text_zh, voice=line.voice, rate=rate, pitch=line.pitch
                    )
                    await comm.save(str(raw_mp3))
                    if raw_mp3.stat().st_size > 256:
                        break
                except Exception:
                    await asyncio.sleep(0.7 * (retry + 1))
            if not raw_mp3.exists() or raw_mp3.stat().st_size <= 256:
                raise RuntimeError(f"Failed TTS for: {line.text_zh[:20]}")

            run_ffmpeg(
                [
                    "-i",
                    str(raw_mp3),
                    "-af",
                    space_filter(line.space),
                    "-ar",
                    str(SR),
                    "-ac",
                    "2",
                    str(out_wav),
                ]
            )
            dur = probe_duration(out_wav)
            if max_dur is None or dur <= max_dur or attempt == 3:
                return dur
            rate = bump_rate(rate, 10)
        return probe_duration(out_wav)


def load_wav_stereo(path: pathlib.Path) -> np.ndarray:
    with wave.open(str(path), "rb") as wf:
        assert wf.getnchannels() == 2 and wf.getframerate() == SR
        pcm = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16)
    return (pcm.reshape(-1, 2).astype(np.float64)) / 32768.0


def save_wav_stereo(path: pathlib.Path, stereo: np.ndarray) -> None:
    clipped = np.clip(stereo, -0.98, 0.98)
    pcm = (clipped * 32767.0).astype(np.int16)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())


# --- Foley / Sound Design DSP Helpers ---
def bandpass_fft(x: np.ndarray, lo: float, hi: float) -> np.ndarray:
    freqs = np.fft.rfftfreq(len(x), d=1.0 / SR)
    spec = np.fft.rfft(x)
    mask = (1.0 / np.sqrt(1.0 + (lo / np.maximum(freqs, 1.0)) ** 4)) * (
        1.0 / np.sqrt(1.0 + (freqs / hi) ** 4)
    )
    return np.fft.irfft(spec * mask, n=len(x))


def lowpass_fft(x: np.ndarray, cutoff: float) -> np.ndarray:
    freqs = np.fft.rfftfreq(len(x), d=1.0 / SR)
    spec = np.fft.rfft(x)
    mask = 1.0 / np.sqrt(1.0 + (freqs / cutoff) ** 4)
    return np.fft.irfft(spec * mask, n=len(x))


def add_mono(buf_l: np.ndarray, buf_r: np.ndarray, start_s: float, sig: np.ndarray, gl: float = 1.0, gr: float = 1.0) -> None:
    i0 = max(0, int(start_s * SR))
    if i0 >= len(buf_l):
        return
    end = min(len(buf_l), i0 + len(sig))
    seg = sig[: end - i0]
    buf_l[i0:end] += seg * gl
    buf_r[i0:end] += seg * gr


def make_wind(rng: np.random.Generator, dur: float, amp: float = 0.22, lo: float = 75.0, hi: float = 560.0) -> tuple[np.ndarray, np.ndarray]:
    n = int(dur * SR)
    t = np.linspace(0, dur, n, endpoint=False)
    wl = bandpass_fft(rng.standard_normal(n), lo, hi) * amp * (0.78 + 0.22 * np.sin(2 * math.pi * 0.16 * t))
    wr = bandpass_fft(rng.standard_normal(n), lo + 12, hi + 40) * amp * (0.78 + 0.22 * np.cos(2 * math.pi * 0.13 * t))
    return wl, wr


def make_sub_drone(dur: float, f1: float = 41.2, amp: float = 0.16) -> np.ndarray:
    n = int(dur * SR)
    t = np.linspace(0, dur, n, endpoint=False)
    env = np.minimum(1.0, t / 1.5) * np.minimum(1.0, (dur - t) / 1.2)
    return env * amp * (0.68 * np.sin(2 * math.pi * f1 * t) + 0.24 * np.sin(2 * math.pi * (f1 * 1.5) * t) + 0.08 * np.sin(2 * math.pi * (f1 * 2.0) * t))


def make_knock(amp: float = 0.78, freq: float = 175.0) -> np.ndarray:
    lt = np.linspace(0, 0.24, int(0.24 * SR), endpoint=False)
    body = np.sin(2 * math.pi * freq * lt) * np.exp(-lt * 25.0)
    ring = 0.52 * np.sin(2 * math.pi * (freq * 1.65) * lt) * np.exp(-lt * 32.0)
    tap = bandpass_fft(np.random.default_rng(77).standard_normal(len(lt)), 650, 2300) * np.exp(-lt * 58.0) * 0.42
    return amp * (body + ring + tap)


def make_door_thud(rng: np.random.Generator, amp: float = 0.65) -> np.ndarray:
    lt = np.linspace(0, 0.55, int(0.55 * SR), endpoint=False)
    thump = np.sin(2 * math.pi * (95 * np.exp(-lt * 10) + 34) * lt) * np.exp(-lt * 8.0)
    clack = bandpass_fft(rng.standard_normal(len(lt)), 420, 2400) * np.exp(-lt * 18.0) * 0.55
    return amp * (thump + clack)


def make_foghorn(dur_s: float = 3.6, amp: float = 0.28) -> np.ndarray:
    lt = np.linspace(0, dur_s, int(dur_s * SR), endpoint=False)
    env = np.minimum(1.0, lt / 0.35) * np.minimum(1.0, (dur_s - lt) / 0.85)
    sig = 0.65 * np.sin(2 * math.pi * 66.0 * lt) + 0.35 * np.sin(2 * math.pi * 99.0 * lt) + 0.16 * np.sin(2 * math.pi * 132.0 * lt)
    return lowpass_fft(sig, 260) * env * amp


def make_chime(freq: float = 880.0, dur_s: float = 1.4, amp: float = 0.25) -> np.ndarray:
    lt = np.linspace(0, dur_s, int(dur_s * SR), endpoint=False)
    return amp * (np.sin(2 * math.pi * freq * lt) + 0.38 * np.sin(2 * math.pi * freq * 1.5 * lt)) * np.exp(-lt * 2.6)


# --- Per-Clip Foley Generators ---
def bed_arrival(dur: float) -> np.ndarray:
    rng = np.random.default_rng(101)
    n = int(dur * SR)
    t = np.linspace(0, dur, n, endpoint=False)
    l, r = make_wind(rng, dur, amp=0.25, lo=80, hi=680)
    # Mi-26 heavy twin rotor blade-slap fading down over 0..22s
    rotor_noise = bandpass_fft(rng.standard_normal(n), 38, 220)
    blade_mod = 0.55 + 0.45 * np.sin(2 * math.pi * 9.5 * t)
    rotor_env = np.exp(-t / 14.0) * 0.42
    l += rotor_noise * blade_mod * rotor_env
    r += rotor_noise * blade_mod * rotor_env
    # Three distant icebreaker horn blasts
    for ts in (1.4, 19.0, 38.0):
        add_mono(l, r, ts, make_foghorn(3.4, 0.24), 0.7, 1.0)
    # Airlock hiss + seal close near end
    hiss_len = int(3.2 * SR)
    ht = np.linspace(0, 3.2, hiss_len, endpoint=False)
    hiss = bandpass_fft(rng.standard_normal(hiss_len), 900, 4600) * np.minimum(1.0, ht / 0.2) * np.exp(-ht * 0.75) * 0.22
    add_mono(l, r, 55.2, hiss, 0.9, 0.9)
    add_mono(l, r, 58.9, make_door_thud(rng, 0.72), 1.0, 1.0)
    # Dark cold synth floor
    sub = make_sub_drone(dur, 41.2, 0.13)
    return np.stack([l + sub, r + sub], axis=1)


def bed_canteen_crew(dur: float) -> np.ndarray:
    rng = np.random.default_rng(102)
    n = int(dur * SR)
    t = np.linspace(0, dur, n, endpoint=False)
    # Airlock slams shut cutting off outside wind in first 1.2s
    wl, wr = make_wind(rng, 1.4, amp=0.28)
    l = np.zeros(n)
    r = np.zeros(n)
    w_len = len(wl)
    fade = np.linspace(1.0, 0.0, w_len)
    l[:w_len] += wl * fade
    r[:w_len] += wr * fade
    add_mono(l, r, 0.55, make_door_thud(rng, 0.75), 1.0, 1.0)
    # Warm indoor canteen hum + faint tray clinks
    room = lowpass_fft(rng.standard_normal(n), 280) * 0.055
    pad = 0.06 * (np.sin(2 * math.pi * 65.41 * t) + 0.5 * np.sin(2 * math.pi * 98.0 * t)) * np.minimum(1.0, t / 3.0)
    l += room + pad
    r += room + pad
    for ct in (4.5, 13.0, 26.5, 42.0, 56.0):
        add_mono(l, r, ct, make_chime(2150.0, 0.35, 0.06), 0.7, 1.0)
    return np.stack([l, r], axis=1)


def bed_canteen_clash(dur: float) -> np.ndarray:
    rng = np.random.default_rng(103)
    n = int(dur * SR)
    room = lowpass_fft(rng.standard_normal(n), 280) * 0.055
    l, r = room.copy(), room.copy()
    sub = make_sub_drone(dur, 49.0, 0.09)
    l += sub
    r += sub
    # Marcus table slam at 1.4s
    add_mono(l, r, 1.35, make_door_thud(rng, 0.65), 1.0, 0.92)
    # Metal stew bowl slide at 18.8s
    s_len = int(0.8 * SR)
    st = np.linspace(0, 0.8, s_len, endpoint=False)
    scrape = bandpass_fft(rng.standard_normal(s_len), 320, 1500) * np.exp(-st * 2.5) * 0.22
    add_mono(l, r, 18.6, scrape, 0.85, 1.0)
    # Forceps clink into surgical kidney dish at 33.4s
    add_mono(l, r, 33.4, make_chime(2950.0, 0.55, 0.16), 0.9, 1.0)
    return np.stack([l, r], axis=1)


def bed_canteen_corners(dur: float) -> np.ndarray:
    rng = np.random.default_rng(104)
    n = int(dur * SR)
    t = np.linspace(0, dur, n, endpoint=False)
    room = lowpass_fft(rng.standard_normal(n), 250) * 0.045
    # Cold industrial pulse slowly fading in across the 4 corners
    cool_ramp = np.minimum(1.0, t / 32.0)
    drone = make_sub_drone(dur, 46.2, 0.14) * (0.4 + 0.6 * cool_ramp)
    l = room + drone
    r = room + drone
    # Subtle ticks on vignette transitions
    for ts in (12.5, 25.0, 37.5):
        add_mono(l, r, ts, make_chime(1480.0, 0.25, 0.08), 0.85, 0.95)
    # Pen tap at 5s and mug slide at 41s
    add_mono(l, r, 5.2, make_knock(0.18, 520.0), 0.8, 1.0)
    add_mono(l, r, 41.2, make_knock(0.22, 340.0), 1.0, 0.8)
    return np.stack([l, r], axis=1)


def bed_blowout(dur: float) -> np.ndarray:
    rng = np.random.default_rng(105)
    n = int(dur * SR)
    t = np.linspace(0, dur, n, endpoint=False)
    # Rising bedrock pressure tremble 0..7.5s
    rumble = lowpass_fft(rng.standard_normal(n), 150) * (0.18 + 0.26 * np.exp(-((t - 7.5) ** 2) / 18.0))
    l = rumble + make_sub_drone(dur, 36.7, 0.24)
    r = rumble + make_sub_drone(dur, 36.7, 0.24)
    # Explosive BOP blowout roar at 6.8s
    steam_len = int(9.0 * SR)
    st = np.linspace(0, 9.0, steam_len, endpoint=False)
    steam = bandpass_fft(rng.standard_normal(steam_len), 180, 3200) * np.minimum(1.0, st / 0.15) * np.exp(-st * 0.24) * 0.55
    add_mono(l, r, 6.8, steam, 1.0, 0.96)
    add_mono(l, r, 6.85, make_door_thud(rng, 0.88), 1.0, 1.0)
    # Emergency pulsing klaxon 9.0..36.0s
    klaxon_t = 8.6
    while klaxon_t < 35.8:
        klen = int(0.45 * SR)
        kt = np.linspace(0, 0.45, klen, endpoint=False)
        horn = (0.55 * np.sin(2 * math.pi * 784.0 * kt) + 0.45 * np.sin(2 * math.pi * 587.3 * kt)) * np.minimum(1.0, kt / 0.03) * np.minimum(1.0, (0.45 - kt) / 0.05) * 0.22
        add_mono(l, r, klaxon_t, horn, 0.9, 1.0)
        klaxon_t += 1.45
    return np.stack([l, r], axis=1)


def bed_briefing(dur: float) -> np.ndarray:
    rng = np.random.default_rng(106)
    n = int(dur * SR)
    hvac = bandpass_fft(rng.standard_normal(n), 60, 340) * 0.075
    sub = make_sub_drone(dur, 41.2, 0.15)
    l = hvac + sub
    r = hvac + sub
    # Holographic sector lock ticks at 6s, 12s, 18s
    for ts in (5.0, 10.5, 16.0):
        add_mono(l, r, ts, make_chime(980.0, 0.4, 0.10), 0.85, 1.0)
    # Recorder click at 32.0s before personal audit
    add_mono(l, r, 32.0, make_knock(0.45, 720.0), 1.0, 0.85)
    return np.stack([l, r], axis=1)


def bed_lonely_watch(dur: float) -> np.ndarray:
    rng = np.random.default_rng(107)
    n = int(dur * SR)
    t = np.linspace(0, dur, n, endpoint=False)
    wl, wr = make_wind(rng, dur, amp=0.08, lo=60, hi=320)
    crt_hum = 0.04 * np.sin(2 * math.pi * 120.0 * t) + 0.025 * np.sin(2 * math.pi * 60.0 * t)
    sub = make_sub_drone(dur, 38.9, 0.14)
    l = wl + crt_hum + sub
    r = wr + crt_hum + sub
    add_mono(l, r, 33.4, make_door_thud(rng, 0.62), 0.9, 1.0)
    return np.stack([l, r], axis=1)


def bed_inner_knock(dur: float) -> np.ndarray:
    rng = np.random.default_rng(108)
    n = int(dur * SR)
    t = np.linspace(0, dur, n, endpoint=False)
    wl, wr = make_wind(rng, dur, amp=0.07, lo=55, hi=260)
    crt_hum = 0.045 * np.sin(2 * math.pi * 120.0 * t)
    sub = make_sub_drone(dur, 36.7, 0.15)
    l = wl + crt_hum + sub
    r = wr + crt_hum + sub
    # Kill drone cleanly just before yellow alarm & knock at 9.7s
    k_i = int(9.65 * SR)
    l[int(9.5 * SR):k_i] *= np.linspace(1.0, 0.0, k_i - int(9.5 * SR))
    r[int(9.5 * SR):k_i] *= np.linspace(1.0, 0.0, k_i - int(9.5 * SR))
    # Yellow panel alert beep + 3 unmistakable gloved wire-mesh glass knocks!
    add_mono(l, r, 9.75, make_chime(1180.0, 0.32, 0.24), 0.9, 0.9)
    add_mono(l, r, 10.65, make_knock(0.88, 175.0), 1.0, 0.95)
    add_mono(l, r, 11.15, make_knock(0.92, 168.0), 0.95, 1.0)
    add_mono(l, r, 11.65, make_knock(0.95, 162.0), 1.0, 0.96)
    return np.stack([l, r], axis=1)


def bed_empty_booth(dur: float) -> np.ndarray:
    rng = np.random.default_rng(109)
    n = int(dur * SR)
    sub = make_sub_drone(dur, 38.9, 0.16)
    l, r = sub.copy(), sub.copy()
    # 07:00 station bell
    add_mono(l, r, 0.8, make_chime(528.0, 1.8, 0.24), 0.9, 1.0)
    # Empty locker rattle at 4.5s
    add_mono(l, r, 4.5, make_door_thud(rng, 0.35), 0.85, 1.0)
    # Peeling yellow electrical tape under console (10.5s) + cassette deck latch snap (15.5s)
    tape_len = int(1.1 * SR)
    tt = np.linspace(0, 1.1, tape_len, endpoint=False)
    tape = bandpass_fft(rng.standard_normal(tape_len), 1400, 5200) * np.minimum(1.0, tt / 0.08) * np.exp(-tt * 2.2) * 0.24
    add_mono(l, r, 10.6, tape, 1.0, 0.9)
    add_mono(l, r, 15.6, make_knock(0.68, 620.0), 0.95, 1.0)
    return np.stack([l, r], axis=1)


def bed_tape_reveal(dur: float) -> np.ndarray:
    rng = np.random.default_rng(110)
    n = int(dur * SR)
    t = np.linspace(0, dur, n, endpoint=False)
    # Authentic magnetic cassette hiss + 50Hz pinch-roller hum
    hiss = bandpass_fft(rng.standard_normal(n), 900, 6200) * 0.065
    motor = 0.03 * np.sin(2 * math.pi * 50.0 * t) + 0.015 * np.sin(2 * math.pi * 100.0 * t)
    sub = make_sub_drone(dur, 36.7, 0.13)
    l = hiss + motor + sub
    r = hiss + motor + sub
    # Mechanical play clunk (0.25s) and magnetic stop click (26.35s)
    add_mono(l, r, 0.25, make_knock(0.75, 480.0), 1.0, 0.95)
    add_mono(l, r, 26.35, make_knock(0.82, 540.0), 0.95, 1.0)
    # Zero out hiss cleanly after 26.5s stop click
    cut_i = int(26.55 * SR)
    l[cut_i:] *= 0.1
    r[cut_i:] *= 0.1
    return np.stack([l, r], axis=1)


def bed_ep0_finale(dur: float) -> np.ndarray:
    rng = np.random.default_rng(111)
    n = int(dur * SR)
    t = np.linspace(0, dur, n, endpoint=False)
    wl, wr = make_wind(rng, dur, amp=0.28, lo=90, hi=950)
    # Violent antenna snap at 1.2s
    add_mono(wl, wr, 1.15, make_door_thud(rng, 0.85), 1.0, 0.95)
    add_mono(wl, wr, 1.25, bandpass_fft(rng.standard_normal(int(0.8 * SR)), 1200, 4200) * np.exp(-np.linspace(0, 0.8, int(0.8 * SR)) * 6.0) * 0.45, 0.85, 1.0)
    # Hardwire dock teletype ping at 6.5s
    add_mono(wl, wr, 6.5, make_chime(1046.5, 1.2, 0.26), 0.9, 1.0)
    # Resonant low cinema brass swell 7.5..15.0s
    braaam = np.zeros(n)
    b_i = int(7.5 * SR)
    bt = t[b_i:] - 7.5
    b_sig = lowpass_fft(
        0.5 * np.sin(2 * math.pi * 36.71 * bt)
        + 0.32 * np.sin(2 * math.pi * 73.42 * bt)
        + 0.22 * np.sin(2 * math.pi * 110.0 * bt),
        380,
    ) * np.minimum(1.0, bt / 0.45) * np.exp(-bt * 0.24) * 0.55
    braaam[b_i:] = b_sig
    return np.stack([wl + braaam, wr + braaam], axis=1)


@dataclass(frozen=True)
class ClipSpec:
    id: str
    target_duration: float
    cuts: list[VisualCut]
    lines: list[VoiceLine]
    bed_fn: Callable[[float], np.ndarray]
    intro_cue: tuple[float, float, str, str, str, str, str, str] | None = None
    outro_cue: tuple[float, float, str, str, str, str, str, str] | None = None
    is_tape_lipsync: bool = False


CLIPS: list[ClipSpec] = [
    # --- PROLOGUE 01 (315.0s = 05:15) ---
    ClipSpec(
        id="ep0_sc00a1_arrival",
        target_duration=60.0,
        cuts=[
            VisualCut(STILLS_STORY / "ep0_heli_arrival.jpg", 16.0, "push_in", 0.45),
            VisualCut(STILLS_EP0 / "ep0_helipad_marcus_grab.jpg", 18.0, "pan_right", 0.45),
            VisualCut(STILLS_STORY / "ep0_heli_arrival.jpg", 13.0, "pull_out", 0.45),
            VisualCut(STILLS_EP0 / "ep0_helipad_marcus_grab.jpg", 14.35, "push_in", 0.0),
        ],
        bed_fn=bed_arrival,
        intro_cue=(
            0.0,
            7.2,
            "字幕卡 // 2036.10.14",
            "TITLE CARD // OCT 14, 2036",
            "字幕 // 2036.10.14",
            "2036.10.14 · 斯瓦尔巴零号站（78°13'N）· 室外 -46°C · 距离极夜还有 12 天",
            "OCT 14, 2036 · SVALBARD OUTPOST 0 (78°13'N) · -46°C · 12 DAYS TO POLAR NIGHT",
            "2036.10.14 · スヴァールバル第0基地（北緯78°13'）· 屋外 -46°C · 極夜まで12日",
        ),
        lines=[
            VoiceLine(
                speaker_key="marcus",
                voice="zh-CN-YunjianNeural",
                rate="+0%",
                pitch="-8Hz",
                space="outdoor",
                target_start=8.0,
                speaker_zh="V-04 // 安保队长 马库斯",
                speaker_en="CAPTAIN MARCUS CHEN",
                speaker_ja="警備隊長 マーカス",
                text_zh="特罗姆瑟那帮文职没教过你下冰坡先锁紧左膝碳纤护带？往里滚——暖风外闸两分钟后泄压！",
                text_en="Didn't those Tromsø desk jockeys teach you to lock your left carbon knee brace on ice? Get inside—heated airlock cycles in two minutes!",
                text_ja="トロムソの事務屋は氷坂で左膝のカーボン装具を締めろと教えなかったのか？中へ入れ——外門は2分で減圧するぞ！",
            ),
            VoiceLine(
                speaker_key="op09",
                voice="zh-CN-YunyangNeural",
                rate="-2%",
                pitch="-3Hz",
                space="outdoor",
                target_start=23.5,
                speaker_zh="新任值班员 // 主角 #09",
                speaker_en="INCOMING OPERATOR #09",
                speaker_ja="新任当直官 // #09",
                text_zh="刚才那班船……四个月内不会再回来了吧？",
                text_en="That supply icebreaker... won't be back for four months, will it?",
                text_ja="さっきの砕氷補給船……4ヶ月は戻ってこないんですよね？",
            ),
            VoiceLine(
                speaker_key="marcus",
                voice="zh-CN-YunjianNeural",
                rate="-2%",
                pitch="-8Hz",
                space="outdoor",
                target_start=32.5,
                speaker_zh="V-04 // 安保队长 马库斯",
                speaker_en="CAPTAIN MARCUS CHEN",
                speaker_ja="警備隊長 マーカス",
                text_zh="想回家就现在顺着尾桨爬回去。赶紧去食堂找莱奥领块热饼干把身子暖过来——记住，站里暖气全靠主泵硬顶着，今天顶缺口就剩你一个，外头零下四十六度可不等人！",
                text_en="Want to go home? Climb onto the tail rotor now. Head to the mess hall, grab a hot biscuit from Leo. Station heat runs on one main pump—today you're our only relief man, and minus forty-six waits for nobody!",
                text_ja="帰りたければ今すぐ尾翼にしがみつけ。食堂へ行ってレオから温かいビスケットを貰って温まれ——暖房は主ポンプ一本頼みだ。零下46度は待ってくれんぞ！",
            ),
        ],
    ),
    ClipSpec(
        id="ep0_sc00a2_canteen_crew",
        target_duration=65.0,
        cuts=[
            VisualCut(STILLS_STORY / "ep0_crew_dinner.jpg", 15.0, "pull_out", 0.45),
            VisualCut(STILLS_EP0 / "ep0_canteen_leo_thor.jpg", 29.0, "push_in", 0.45),
            VisualCut(STILLS_EP0 / "ep0_canteen_leo_biscuit.jpg", 21.9, "push_in", 0.0),
        ],
        bed_fn=bed_canteen_crew,
        lines=[
            VoiceLine(
                speaker_key="laozhou",
                voice="zh-CN-YunjianNeural",
                rate="-8%",
                pitch="-2Hz",
                space="canteen",
                target_start=3.2,
                speaker_zh="焊工 // 老周",
                speaker_en="WELDER ZHOU",
                speaker_ja="溶接工・老周",
                text_zh="新来的，别信莱奥这副热心肠！上个月二号液压阀手轮滑丝是谁偷偷找别人替工？",
                text_en="Hey rookie, don't fall for Leo's eager-beaver act! Who stripped the Valve 2 handwheel last month and quietly swapped shifts to cover it up?",
                text_ja="新入り、レオのお人好し面に騙されるな！先月2番油圧弁のネジ山を潰して、こっそり代打を頼んだのは誰だ？",
            ),
            VoiceLine(
                speaker_key="leo",
                voice="zh-CN-YunxiNeural",
                rate="+8%",
                pitch="+5Hz",
                space="canteen",
                target_start=14.8,
                speaker_zh="V-02 // 实习机械师 莱奥",
                speaker_en="V-02 // LEO SATO",
                speaker_ja="V-02 // レオ・サトウ",
                text_zh="周师兄您可别泼脏水，那是密封圈自己不耐寒——再说我莱奥一条底线：搞砸了零件我第一个站出来认，绝不叫同班兄弟替我背锅！",
                text_en="Come on, Zhou, that seal cracked from the freeze on its own—and you know my rule: if I break a part, I step up first. Never letting a shiftmate take the blame for me!",
                text_ja="周さん、濡れ衣ですよ！パッキンが寒さで割れたんです——それに俺の流儀は一つ、ミスしたら真っ先に名乗り出る。仲間に泥は被せません！",
            ),
            VoiceLine(
                speaker_key="thor",
                voice="zh-CN-YunjianNeural",
                rate="-6%",
                pitch="-12Hz",
                space="canteen",
                target_start=31.2,
                speaker_zh="资深钻井工 // 托尔·伯格",
                speaker_en="SENIOR DRILLER // THOR BERG",
                speaker_ja="ベテラン掘削員 // トール・ベルグ",
                text_zh="我下个月回奥斯陆看我小女儿索菲亚买琴——对了零八，上回打赌那两盒红双喜别忘了欠账！",
                text_en="Next month I fly back to Oslo to buy my little girl Sofia a piano—and #08, don't forget those two packs of Double Happiness cigarettes you owe me from our bet!",
                text_ja="来月オスロへ帰って娘のソフィアにピアノを買うんだ——おい#08、賭けで負けた紅双喜2箱の貸し、忘れるなよ！",
            ),
            VoiceLine(
                speaker_key="leo_whisper",
                voice="zh-CN-YunxiNeural",
                rate="-3%",
                pitch="+2Hz",
                space="whisper",
                target_start=45.5,
                speaker_zh="V-02 // 莱奥（压低嗓音）",
                speaker_en="LEO SATO (WHISPERING)",
                speaker_ja="レオ・サトウ（小声で）",
                text_zh="……哥，我离三个月转正评估就差一个月。真哪晚干活笨手笨脚捅了小漏子，您可别当着工头大喇叭点我名儿，二号舱灶台夜里总温着姜茶。",
                text_en="...Hey, I'm one month shy of my three-month probation pass. If I ever mess up some small job on night watch, please don't call me out over the PA... I keep hot ginger tea on Bay 2's stove every night.",
                text_ja="……先輩、本採用まであと1ヶ月なんです。夜勤で俺がヘマをしても、班長の前で名指しだけは勘弁を。第2区画のストーブには毎晩生姜湯を温めてますから。",
            ),
        ],
    ),
    ClipSpec(
        id="ep0_sc00a2_canteen_clash",
        target_duration=50.0,
        cuts=[
            VisualCut(STILLS_EP0 / "ep0_canteen_marcus_stew.jpg", 20.5, "pull_out", 0.45),
            VisualCut(STILLS_EP0 / "ep0_canteen_marcus_stew.jpg", 13.0, "push_in", 0.45),
            VisualCut(STILLS_EP0 / "ep0_canteen_elena_scalpel.jpg", 17.4, "push_in", 0.0),
        ],
        bed_fn=bed_canteen_clash,
        lines=[
            VoiceLine(
                speaker_key="marcus_roar",
                voice="zh-CN-YunjianNeural",
                rate="+6%",
                pitch="-8Hz",
                space="canteen",
                target_start=2.0,
                speaker_zh="V-04 // 马库斯（拍桌怒吼）",
                speaker_en="MARCUS CHEN (BARKING)",
                speaker_ja="マーカス（一喝）",
                text_zh="长没长眼？！连续熬夜端热锅扣三天淡水配额——滚去三号厕所拿钢丝球刷一个月！",
                text_en="Watch where you're walking! Pulling all-nighters spilling soup docks you three days' fresh water—take steel wool to Latrine 3 for a whole month!",
                text_ja="目がついてるのか？！水配給3日分カットだ——第3トイレへ行って1ヶ月スチールウールで磨いてこい！",
            ),
            VoiceLine(
                speaker_key="marcus_soft",
                voice="zh-CN-YunjianNeural",
                rate="-6%",
                pitch="-11Hz",
                space="whisper",
                target_start=18.2,
                speaker_zh="V-04 // 马库斯（别开眼神低骂）",
                speaker_en="MARCUS CHEN (MUTTERING)",
                speaker_ja="マーカス（小声で）",
                text_zh="端走吃了再刷！冻发烧了占床位，艾琳娜大夫明天真能让你抽签等死！",
                text_en="Take mine, eat it first, then scrub! Catch a fever and hog a bunk, and Dr. Vance will draw lots over your life tomorrow!",
                text_ja="これ持って食ってから磨け！凍えて熱出してベッドを塞いだら、エレナ医師は明日にでも籤引きで切り捨てるぞ！",
            ),
            VoiceLine(
                speaker_key="elena",
                voice="zh-CN-XiaoxiaoNeural",
                rate="+4%",
                pitch="-4Hz",
                space="canteen",
                target_start=34.0,
                speaker_zh="V-01 // 首席外科 艾琳娜",
                speaker_en="V-01 // DR. ELENA VANCE",
                speaker_ja="V-01 // エレナ・ヴァンス医師",
                text_zh="老陈嘴臭心软。但在 B 区手术台上，唯有抽签与绝对公平才配叫文明，人情填不饱三十张病床的止痛针。",
                text_en="Old Chen barks loud and caves soft. But on Sector B's operating table, only triage lots and blind fairness qualify as civilization. Sentiment won't stretch morphine across thirty beds.",
                text_ja="チェン隊長は口が悪いだけ。でもB区の手術台では、抽選と絶対的公平だけが文明よ。情けは30床分の鎮痛剤を増やしてはくれない。",
            ),
        ],
    ),
    ClipSpec(
        id="ep0_sc00a2_canteen_corners",
        target_duration=50.0,
        cuts=[
            VisualCut(STILLS_EP0 / "ep0_corner_arthur_holm.jpg", 12.8, "push_in", 0.45),
            VisualCut(STILLS_EP0 / "ep0_corner_ana.jpg", 12.8, "pan_left", 0.45),
            VisualCut(STILLS_EP0 / "ep0_corner_ingrid.jpg", 12.8, "push_in", 0.45),
            VisualCut(STILLS_EP0 / "ep0_corner_linmei_hannah.jpg", 12.95, "pan_right", 0.0),
        ],
        bed_fn=bed_canteen_corners,
        lines=[
            VoiceLine(
                speaker_key="arthur",
                voice="zh-CN-YunyangNeural",
                rate="-4%",
                pitch="-6Hz",
                space="whisper",
                target_start=2.0,
                speaker_zh="V-03 // 行政审计 亚瑟（与霍尔姆角落会签）",
                speaker_en="V-03 // ARTHUR STERLING",
                speaker_ja="V-03 // アーサー・スターリング",
                text_zh="形式要件审完了——出事按签字人追溯。",
                text_en="Formal compliance checked. If this goes wrong, liability traces strictly to the signatory.",
                text_ja="形式要件は確認済みだ——問題が起きれば署名者へ遡及する。",
            ),
            VoiceLine(
                speaker_key="ana",
                voice="zh-CN-liaoning-XiaobeiNeural",
                rate="-2%",
                pitch="-5Hz",
                space="canteen",
                target_start=15.0,
                speaker_zh="V-05 // 高压潜水员 安娜",
                speaker_en="V-05 // ANA RIBEIRO",
                speaker_ja="V-05 // アナ・リベイロ",
                text_zh="字签在上面了。",
                text_en="My signature's already on the penalty slip.",
                text_ja="署名はそこにあるだろ。",
            ),
            VoiceLine(
                speaker_key="ingrid",
                voice="zh-TW-HsiaoChenNeural",
                rate="-6%",
                pitch="+1Hz",
                space="whisper",
                target_start=26.5,
                speaker_zh="V-06 // 心理医生 英格丽（安抚汉森，悄改心理评估）",
                speaker_en="V-06 // DR. INGRID SOLBERG",
                speaker_ja="V-06 // イングリッド・ソルベルグ医師",
                text_zh="只是极夜前嗜睡焦虑，撑撑就过去了。",
                text_en="Just pre-polar-night fatigue and nerves. Hang in there—it passes.",
                text_ja="極夜前の軽い不安と眠気よ。もう少し耐えれば落ち着くわ。",
            ),
            VoiceLine(
                speaker_key="linmei",
                voice="zh-TW-HsiaoYuNeural",
                rate="-3%",
                pitch="-2Hz",
                space="canteen",
                target_start=38.0,
                speaker_zh="V-07 // 低温生物 林梅",
                speaker_en="V-07 // DR. LIN MEI",
                speaker_ja="V-07 // リン・メイ博士",
                text_zh="去休息吧，四号冷库别碰。",
                text_en="Go rest. Don't touch Vault 4.",
                text_ja="休みなさい。第4冷凍庫には触れないで。",
            ),
            VoiceLine(
                speaker_key="claire",
                voice="zh-CN-shaanxi-XiaoniNeural",
                rate="+4%",
                pitch="+2Hz",
                space="whisper",
                target_start=42.2,
                speaker_zh="室友 // 克莱尔",
                speaker_en="ROOMMATE CLAIRE",
                speaker_ja="同僚 クレア",
                text_zh="老滤芯读数放宽十格，补贴咱俩分？",
                text_en="Pad those old canister readings by ten ticks and split the bonus?",
                text_ja="古いフィルターの数値を10目盛り緩めて、手当を山分けしない？",
            ),
            VoiceLine(
                speaker_key="hannah",
                voice="zh-CN-XiaoyiNeural",
                rate="+6%",
                pitch="+1Hz",
                space="canteen",
                target_start=46.6,
                speaker_zh="V-08 // 维生技师 汉娜（推开热可可）",
                speaker_en="V-08 // HANNAH WEISS",
                speaker_ja="V-08 // ハンナ・ヴァイス",
                text_zh="不用。原始串口已锁定。",
                text_en="No. Raw serial port is already locked.",
                text_ja="結構。シリアル生データは固定済みよ。",
            ),
        ],
    ),
    ClipSpec(
        id="prequel_icecore_breach",
        target_duration=38.0,
        cuts=[
            VisualCut(STILLS_STORY / "prequel_icecore_breach.jpg", 18.0, "push_in", 0.12),
            VisualCut(STILLS_STORY / "prequel_icecore_breach.jpg", 20.12, "pan_right", 0.0),
        ],
        bed_fn=bed_blowout,
        intro_cue=(
            0.0,
            8.0,
            "第 14 天 02:14 // 3,800m 古生代基岩主井",
            "DAY 14 · 02:14 // 3,800M BEDROCK RIG",
            "14日目 02:14 // 地下3,800m基盤岩掘削室",
            "第 14 天 02:14 · 钻头穿透 280m 永冻层跌入 3,800 米超热液空腔，压力表自 340 bar 瞬间顶爆 490 bar，两套防喷器液压阀死卡！",
            "DAY 14 · 02:14 · At 3,800m beneath permafrost, the rig breaks into a superheated brine cavity. Pressure spikes from 340 to 490 bar; dual BOP valves jam shut!",
            "14日目 02:14 · 永久凍土下の3,800m熱水空洞に到達。井圧が340→490barへ急騰し、防噴装置の油圧弁がロック！",
        ),
        lines=[
            VoiceLine(
                speaker_key="rig_pa",
                voice="zh-CN-YunjianNeural",
                rate="+12%",
                pitch="+2Hz",
                space="radio",
                target_start=11.5,
                speaker_zh="钻井公频 // 紧急失真通讯",
                speaker_en="DRILL RIG PA // EMERGENCY",
                speaker_ja="掘削室無線 // 緊急通信",
                text_zh="平衡舱锁扣爆了！托尔和老孙冲进回风道了——封外闸！",
                text_en="Balance lock blew! Thor and Lao Sun dashed into the return duct—seal the outer gate!",
                text_ja="均衡室のロックが吹き飛んだ！トールと老孫が還気坑に飛び込んだ——外門を閉じろ！",
            ),
        ],
        outro_cue=(
            19.0,
            38.0,
            "第 14 天 02:19 // 全站一级物理封锁",
            "DAY 14 · 02:19 // LEVEL-1 PHYSICAL LOCKDOWN",
            "14日目 02:19 // 第1種物理封鎖発令",
            "蒸汽倒灌震碎灯管，全站坠入血红应急灯——托尔·伯格与老孙生死未卜，站长林德奎斯特下令物理切断八座外环通道。",
            "Superheated steam shatters the lights into crimson emergency glare. Thor Berg and Lao Sun vanish into the shaft; Commander Lindqvist orders outer corridors severed.",
            "蒸気の逆流で照明が砕け、全基地は赤い非常灯へ。トールと老孫が行方不明となり、リンqvist所長は外環通路の物理遮断を命じた。",
        ),
    ),
    ClipSpec(
        id="prologue_01_main",
        target_duration=52.0,
        cuts=[
            VisualCut(STILLS_EP0 / "ep0_briefing_topology.jpg", 31.5, "push_in", 0.45),
            VisualCut(STILLS_STORY / "prologue_01_handover.jpg", 20.95, "push_in", 0.0),
        ],
        bed_fn=bed_briefing,
        lines=[
            VoiceLine(
                speaker_key="lindqvist_map",
                voice="zh-CN-YunyangNeural",
                rate="+0%",
                pitch="-11Hz",
                space="briefing",
                target_start=1.2,
                speaker_zh="站长 林德奎斯特 // 立体拓扑简报",
                speaker_en="COMMANDER LINDQVIST // TOPOLOGY BRIEFING",
                speaker_ja="リンドクヴィスト所長 // 構造説明",
                text_zh="听清楚全站拓扑：食堂、母本库、宿舍与码头竖井合称中枢主站；外围B区医疗、二号动力、行政、安保风道、潜水舱、通讯舱、四号冷库与外风井八座孤舱外廊昨晚已物理断流，五夜内供暖将逐一枯竭。你守的零号闸是外环进入中枢的唯一气密口——核验未过严禁开内闸，违者按叛逃论处。",
                text_en="Memorize station topology: Mess hall, Specimen Vault, bunks, and Sub Shaft form the Central Hub. Last night all eight outer pods lost connecting corridor power; heating will fail one by one within five nights. Gate 0 is the sole airlock from the Outer Ring into the Hub—open without clearance and it's desertion.",
                text_ja="基地構造を叩き込め。食堂・母本庫・宿舎・潜水艦立坑が中枢だ。昨夜、外環8区画への連絡通路は物理遮断され、5夜以内に暖房が順次停止する。第0関門は外環から中枢への唯一の空気閘だ。",
            ),
            VoiceLine(
                speaker_key="lindqvist_audit",
                voice="zh-CN-YunyangNeural",
                rate="-4%",
                pitch="-11Hz",
                space="briefing",
                target_start=33.0,
                speaker_zh="站长 林德奎斯特 // 人事复核录音",
                speaker_en="COMMANDER LINDQVIST // INTAKE AUDIT",
                speaker_ja="リンドクヴィスト所長 // 人事査問",
                text_zh="托尔两人仍失踪在零下四十六度井区。接掌零号位前复核最后一栏旧账：过去你们小组漏报隐患连累同事受伤，复盘会上你当时怎么说的？",
                text_en="Thor and Sun remain missing out in the minus-46 shaft. Before you take Gate 0, confirm your Tromsø file: when your old team failed to report a hazard and got a colleague injured, what did you say at the review?",
                text_ja="トールたち2名は零下46度の坑区で行方不明のまま。第0関門の着任前に過去記録の最終確認をする——以前お前の班が危険を見落とし同僚が負傷した時、監査で何と答えた？",
            ),
        ],
    ),
    # --- PROLOGUE 02 (60.0s = 01:00) ---
    ClipSpec(
        id="ep0_lonely_watch",
        target_duration=36.0,
        cuts=[
            VisualCut(STILLS_STORY / "ep0_lonely_watch.jpg", 18.0, "pan_right", 0.45),
            VisualCut(STILLS_STORY / "ep0_lonely_watch.jpg", 18.45, "push_in", 0.0),
        ],
        bed_fn=bed_lonely_watch,
        lines=[
            VoiceLine(
                speaker_key="op08_handover",
                voice="zh-TW-YunJheNeural",
                rate="-6%",
                pitch="-6Hz",
                space="booth",
                target_start=2.0,
                speaker_zh="前任值班员 #08 // 第 16 天 02:40",
                speaker_en="OUTGOING OPERATOR #08 // 02:40",
                speaker_ja="前任当直官 #08 // 02:40",
                text_zh="零九……剩下的下半夜交给你了，别多问，天亮前替我盯住这扇门。记住——别靠太近盯着那块防爆玻璃，也别单凭熟人嗓门拉开关。",
                text_en="#09... take the rest of the night shift. Don't ask why—watch that blast glass till dawn. Keep back from the pane, and never pull the lever just on a familiar voice.",
                text_ja="#09……残りの夜番は任せた。何も聞かず夜明けまでこの扉を見張れ。いいか——防爆ガラスに顔を近づけるな。馴染みの声だけでレバーを引くなよ。",
            ),
            VoiceLine(
                speaker_key="op09_ask",
                voice="zh-CN-YunyangNeural",
                rate="+0%",
                pitch="-3Hz",
                space="booth",
                target_start=20.0,
                speaker_zh="主角 #09",
                speaker_en="OPERATOR #09",
                speaker_ja="主角 #09",
                text_zh="老前辈，你手抖得连签字笔都捏不住了——到底外头出什么事了？",
                text_en="Wait—your hands are shaking so hard you dropped your pen. What happened out there?",
                text_ja="先輩、手が震えてペンも握れてないじゃないですか——外で何が起きたんです？",
            ),
            VoiceLine(
                speaker_key="op08_exit",
                voice="zh-TW-YunJheNeural",
                rate="-6%",
                pitch="-6Hz",
                space="booth",
                target_start=27.2,
                speaker_zh="前任值班员 #08",
                speaker_en="OUTGOING OPERATOR #08",
                speaker_ja="前任当直官 #08",
                text_zh="按表盯住就是。天亮你就什么都懂了。",
                text_en="Just watch the gauges. You'll understand everything at dawn.",
                text_ja="計器通りに監視していろ。夜が明けたら何もかも分かる。",
            ),
        ],
    ),
    ClipSpec(
        id="prologue_02_main",
        target_duration=24.0,
        cuts=[
            VisualCut(STILLS_STORY / "ep0_lonely_watch.jpg", 9.8, "push_in", 0.08),
            VisualCut(STILLS_EP0 / "ep0_inner_door_knock.jpg", 14.28, "pull_out", 0.0),
        ],
        bed_fn=bed_inner_knock,
        intro_cue=(
            0.0,
            9.7,
            "第 16 天 04:15 // 连续清醒满 20 小时",
            "DAY 16 · 04:15 // 20 HOURS AWAKE",
            "16日目 04:15 // 連続覚醒20時間",
            "替发烧室友汉森连顶白班后你已连续清醒满 20 小时，头一歪抵着温热控制台合上了眼……",
            "After covering sick roommate Hansen's entire day shift, 20 straight hours awake pull your chin down onto the warm console...",
            "発熱した同室者ハンセンの代務から連続20時間。眠気に抗えず、温かい操作盤に額を落としたその瞬間——",
        ),
        lines=[
            VoiceLine(
                speaker_key="supervisor",
                voice="zh-CN-YunjianNeural",
                rate="+2%",
                pitch="-4Hz",
                space="door",
                target_start=12.6,
                speaker_zh="值班主管 // 内侧走廊门小窗",
                speaker_en="SHIFT SUPERVISOR // INNER DOOR",
                speaker_ja="当直監督 // 内側廊下小窓",
                text_zh="零号门灯跳黄三分钟没消警！零九，你刚才在值班台底下睡过去了？！",
                text_en="Gate Zero's amber alert flashed three whole minutes unacknowledged! #09, were you asleep under the console?!",
                text_ja="第0関門の黄灯が3分も鳴りっぱなしだぞ！#09、お前まさかブースで居眠りしていたのか？！",
            ),
        ],
    ),
    # --- PROLOGUE 03 (60.0s = 01:00) ---
    ClipSpec(
        id="ep0_empty_booth",
        target_duration=18.0,
        cuts=[
            VisualCut(STILLS_STORY / "ep0_empty_booth.jpg", 8.8, "pan_right", 0.45),
            VisualCut(STILLS_EP0 / "ep0_override_cut_seal.jpg", 9.65, "push_in", 0.0),
        ],
        bed_fn=bed_empty_booth,
        intro_cue=(
            0.0,
            8.5,
            "第 17 天 07:00 // 储物柜空置 · 闸门日志归零",
            "DAY 17 · 07:00 // EMPTY LOCKER · GATE LOG: 0",
            "17日目 07:00 // ロッカー空 · 通常開閉記録：0",
            "早钟响过，#08 个人储物柜全空，主机显示零号气密闸及内门正常开关次数为零。",
            "Morning bell rings. #08's locker stands empty; primary airlock logs show ZERO normal gate cycles.",
            "朝の鐘が鳴るが#08の姿も私物もない。主記録では第0関門の通常開閉回数はゼロ。",
        ),
        outro_cue=(
            8.5,
            18.0,
            "手动越权面板 // 铜丝铅封已被剪断",
            "MANUAL OVERRIDE // COPPER LEAD SEAL SNIPPED",
            "手動オーバーライド盤 // 銅線封印が切断",
            "「手动机械越权面板」铜丝铅封被硬生生剪断、越权日志清空——钢台底沿用黄色电工胶布粘着一盘黑磁带！",
            "On the manual override box, the copper lead seal has been snipped clean and logs wiped—beneath the desk lip hangs a black cassette taped with yellow insulation tape!",
            "手動オーバーライド盤の鉛封がペンチで切断され記録が消去されている——操作盤の裏には黄色い絶縁テープで貼られた黒いカセットが！",
        ),
        lines=[],
    ),
    ClipSpec(
        id="prequel_op08_warning",
        target_duration=27.0,
        cuts=[],  # Handled by composite lip-sync video builder
        bed_fn=bed_tape_reveal,
        is_tape_lipsync=True,
        lines=[
            VoiceLine(
                speaker_key="op08_tape",
                voice="zh-TW-YunJheNeural",
                rate="+10%",
                pitch="-5Hz",
                space="cassette",
                target_start=0.8,
                speaker_zh="前任值班员 #08 // 02:30 黄色胶布黑磁带",
                speaker_en="OPERATOR #08 // 02:30 CASSETTE TAPE",
                speaker_ja="前任当直官 #08 // 02:30 遺言テープ",
                text_zh="零九，别凭熟人声开门。昨晚失踪的托尔就站在闸室里，连欠我两盒红双喜、给女儿索菲亚买琴都一字不差背得出。记住：它们只照你嘴上宣称过的体面人设去演，却不知道活人真疼时背叛诺言的裂痕。和自我介绍分毫不差的，不是人。今晚两点我在玻璃外看见了自己，出去确认。若我从外门回来，别开！",
                text_en="#09, never open for a familiar voice. Missing driller Thor stood inside the lock last night reciting Sofia's piano and the two packs of Double Happiness word-for-word. Listen: they only perform who you CLAIM to be—never the crack where a real person betrays their own promise when it hurts. Anything matching its own bio is NOT human. Tonight at two I saw myself outside the glass. If I come back through the outer door—do NOT open!",
                text_ja="#09、馴染みの声で扉を開けるな。行方不明のトールが昨夜あの関門に立ち、ソフィアのピアノも紅双喜2箱の貸しも一字一句違わず暗唱してみせた。奴らは人間が口にする綺麗な建前だけを演じ、痛みに耐えかねて誓いを破る裂け目を知らない。今夜2時、ガラスの外に俺自身が立っていた。確認しに出る。外扉から俺が戻ってきても、絶対に開けるな！",
            ),
        ],
    ),
    ClipSpec(
        id="prologue_03_main",
        target_duration=15.0,
        cuts=[
            VisualCut(STILLS_STORY / "prologue_03.jpg", 15.0, "push_in", 0.0),
        ],
        bed_fn=bed_ep0_finale,
        intro_cue=(
            0.0,
            6.5,
            "第 17 天 23:55 // -46°C 暴雪扯断主天线",
            "DAY 17 · 23:55 // MAIN ANTENNA SNAPPED",
            "17日目 23:55 // 主アンテナ破断・全線孤立",
            "暴雪扯断卫星主天线，屏幕底行只余绿色微光：码头铠装硬线联通「鹦鹉螺 0 号（06:00 待命）」。",
            "The blizzard snaps the main satellite mast. Only one green teletype line survives: ARMORED DOCK HARDWIRE LINK — NAUTILUS-0 (STANDING BY 06:00).",
            "吹雪が主衛星アンテナを引きちぎる。残る通信はただ一行：埠頭装甲有線直通『ノーチラス0号（06:00 待機）』。",
        ),
        outro_cue=(
            6.5,
            15.0,
            "抉择点 03 // 最后艇席独白",
            "DECISION 03 // THE LAST SUBMARINE SEAT",
            "決断 03 // 最後の潜水艦席",
            "冰冷的钢制密钥压在掌心。想起往昔只剩最后一个艇位却留给自己的那一夜，你对自己低声说：",
            "The cold steel gate key presses into your palm. Remembering that night when only one evacuation seat remained and you kept it for yourself, you whisper:",
            "冷たい鋼の鍵が掌に食い込む。ただ一席残された脱出枠を自分に選んだあの夜を思い出し、あなたは呟く——",
        ),
        lines=[],
    ),
]


def build_image_motion_cmd(
    img: pathlib.Path,
    dur: float,
    motion: str,
    out_mp4: pathlib.Path,
) -> None:
    frames = max(24, int(round(dur * 24)))
    if motion == "push_in":
        zp = f"zoompan=z='min(1.0+0.0005*on,1.14)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:fps=24:s=1280x720"
    elif motion == "pull_out":
        zp = f"zoompan=z='max(1.13-0.00048*on,1.0)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:fps=24:s=1280x720"
    elif motion == "pan_right":
        zp = f"zoompan=z='1.10':x='(iw-iw/zoom)*on/{frames}':y='ih/2-(ih/zoom/2)':d={frames}:fps=24:s=1280x720"
    elif motion == "pan_left":
        zp = f"zoompan=z='1.10':x='(iw-iw/zoom)*(1-on/{frames})':y='ih/2-(ih/zoom/2)':d={frames}:fps=24:s=1280x720"
    else:
        zp = f"zoompan=z='min(1.02+0.0003*on,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:fps=24:s=1280x720"

    vf = f"scale=2560:1440:force_original_aspect_ratio=increase,crop=2560:1440,{zp},format=yuv420p"
    # Single-frame input (NEVER combine -loop 1 -t with zoompan!)
    run_ffmpeg(
        [
            "-i",
            str(img),
            "-vf",
            vf,
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "20",
            "-pix_fmt",
            "yuv420p",
            str(out_mp4),
        ]
    )


def render_clip_video_track(spec: ClipSpec, tmp: pathlib.Path, out_video_only: pathlib.Path) -> None:
    if spec.is_tape_lipsync:
        src_lip = REPO / "videos" / "story"  # unused check below
        lip_mp4 = REPO / "public" / "videos" / "story" / "prequel_op08_warning.mp4"
        cut_img = STILLS_EP0 / "ep0_override_cut_seal.jpg"
        part_a = tmp / "tape_a.mp4"
        part_b = tmp / "tape_b.mp4"
        part_c = tmp / "tape_c.mp4"
        # First 11.5s lip-sync with subtle CRT scanline & VHS vignette
        crt_vf = (
            "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=24,"
            "eq=saturation=0.62:contrast=1.12:brightness=-0.04,"
            "drawgrid=w=1280:h=4:t=1:c=black@0.22,"
            "vignette=PI/4,format=yuv420p"
        )
        run_ffmpeg(["-stream_loop", "-1", "-i", str(lip_mp4), "-t", "11.8", "-an", "-vf", crt_vf, "-c:v", "libx264", "-preset", "fast", "-crf", "20", str(part_a)])
        build_image_motion_cmd(cut_img, 4.4, "push_in", part_b)
        run_ffmpeg(["-stream_loop", "-1", "-i", str(lip_mp4), "-ss", "2.0", "-t", "11.5", "-an", "-vf", crt_vf, "-c:v", "libx264", "-preset", "fast", "-crf", "20", str(part_c)])
        # xfade 11.8 + 4.4 - 0.3 + 11.5 - 0.3 = 27.1 -> trim exact 27.0s
        run_ffmpeg(
            [
                "-i", str(part_a),
                "-i", str(part_b),
                "-i", str(part_c),
                "-filter_complex",
                "[0:v][1:v]xfade=transition=fade:duration=0.3:offset=11.5[v01];"
                "[v01][2:v]xfade=transition=fade:duration=0.3:offset=15.6,trim=duration=27.0,setpts=PTS-STARTPTS[v]",
                "-map", "[v]",
                "-c:v", "libx264", "-preset", "fast", "-crf", "21", "-pix_fmt", "yuv420p",
                str(out_video_only),
            ]
        )
        return

    parts: list[pathlib.Path] = []
    for idx, cut in enumerate(spec.cuts):
        p = tmp / f"cut_{idx}.mp4"
        build_image_motion_cmd(cut.image, cut.duration, cut.motion, p)
        parts.append(p)

    if len(parts) == 1:
        run_ffmpeg(
            [
                "-i", str(parts[0]),
                "-vf", f"trim=duration={spec.target_duration:.3f},setpts=PTS-STARTPTS",
                "-c:v", "libx264", "-preset", "fast", "-crf", "21", "-pix_fmt", "yuv420p",
                str(out_video_only),
            ]
        )
        return

    # Chain xfade filters accurately
    inputs: list[str] = []
    for p in parts:
        inputs.extend(["-i", str(p)])

    filter_parts: list[str] = []
    cur_label = "[0:v]"
    offset = spec.cuts[0].duration - spec.cuts[0].xfade_after
    for i in range(1, len(parts)):
        xf = spec.cuts[i - 1].xfade_after
        next_label = f"[v{i}]" if i < len(parts) - 1 else "[vraw]"
        filter_parts.append(
            f"{cur_label}[{i}:v]xfade=transition=fade:duration={xf:.3f}:offset={offset:.3f}{next_label}"
        )
        cur_label = next_label
        if i < len(parts) - 1:
            offset += spec.cuts[i].duration - spec.cuts[i].xfade_after

    # Subtle pulsing red emergency strobe in preamp/blowout
    extra = ",eq=saturation=1.18:contrast=1.08" if spec.id == "prequel_icecore_breach" else ""
    filter_parts.append(
        f"[vraw]trim=duration={spec.target_duration:.3f},setpts=PTS-STARTPTS{extra}[v]"
    )

    run_ffmpeg(
        [
            *inputs,
            "-filter_complex",
            ";".join(filter_parts),
            "-map",
            "[v]",
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "21",
            "-pix_fmt",
            "yuv420p",
            str(out_video_only),
        ]
    )


async def build_clip(spec: ClipSpec) -> list[dict]:
    OUT_VIDEOS.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        tmp = pathlib.Path(td)

        # 1. Generate bed track
        bed = spec.bed_fn(spec.target_duration)
        n = len(bed)
        speech = np.zeros((n, 2), dtype=np.float64)
        cues: list[dict] = []

        if spec.intro_cue:
            s0, e0, szh, sen, sja, tzh, ten, tja = spec.intro_cue
            cues.append(
                {
                    "startSec": round(s0, 2),
                    "endSec": round(e0, 2),
                    "speaker": {"zh": szh, "en": sen, "ja": sja},
                    "text": {"zh": tzh, "en": ten, "ja": tja},
                }
            )

        # 2. Synthesize & place spoken dialogue chronologically with zero overlap
        cursor_s = 0.0
        for idx, line in enumerate(spec.lines):
            wav_p = tmp / f"line_{idx}.wav"
            # Compute remaining available room up to next target or clip end
            next_hint = spec.lines[idx + 1].target_start if idx + 1 < len(spec.lines) else spec.target_duration - 0.5
            start_s = max(line.target_start, cursor_s + 0.35 if cursor_s > 0 else line.target_start)
            max_allowed = (spec.target_duration - 0.45) - start_s
            if idx + 1 < len(spec.lines):
                # Allow bumping later lines slightly if needed, while keeping generous final margin
                rem_lines = len(spec.lines) - idx
                max_allowed = min(max_allowed, max(6.0, (spec.target_duration - 0.6 - start_s) / rem_lines * 1.45))
            dur = await synth_line_wav(line, wav_p, max_dur=max_allowed)
            if start_s + dur > spec.target_duration - 0.25:
                # Re-synthesize noticeably faster so it finishes before clip ends
                dur = await synth_line_wav(line, wav_p, max_dur=max(3.0, spec.target_duration - 0.35 - start_s))
            end_s = min(spec.target_duration, start_s + dur)
            seg = load_wav_stereo(wav_p)
            i0 = int(start_s * SR)
            copy_n = min(len(seg), n - i0)
            if copy_n > 0:
                speech[i0 : i0 + copy_n] += seg[:copy_n]
            cursor_s = end_s

            cues.append(
                {
                    "startSec": round(start_s, 2),
                    "endSec": round(end_s + 0.3, 2),
                    "speaker": {"zh": line.speaker_zh, "en": line.speaker_en, "ja": line.speaker_ja},
                    "text": {"zh": line.text_zh, "en": line.text_en, "ja": line.text_ja},
                }
            )

        if spec.outro_cue:
            s1, e1, szh, sen, sja, tzh, ten, tja = spec.outro_cue
            # Ensure outro cue doesn't start before last line finishes
            adj_s1 = max(s1, round(cursor_s + 0.25, 2)) if spec.lines else s1
            cues.append(
                {
                    "startSec": adj_s1,
                    "endSec": round(e1, 2),
                    "speaker": {"zh": szh, "en": sen, "ja": sja},
                    "text": {"zh": tzh, "en": ten, "ja": tja},
                }
            )

        # Ensure first cue covers 0.0..first end cleanly so screen always has synced caption at frame 0
        if cues and cues[0]["startSec"] > 0.0:
            cues[0]["startSec"] = 0.0
        # Ensure contiguous end-to-end cue coverage without dark gaps
        for i in range(len(cues) - 1):
            if cues[i]["endSec"] < cues[i + 1]["startSec"]:
                cues[i]["endSec"] = cues[i + 1]["startSec"]
        if cues:
            cues[-1]["endSec"] = round(spec.target_duration, 2)

        # 3. Dynamic speech envelope ducking (-7.5 dB under dialogue)
        speech_energy = np.max(np.abs(speech), axis=1)
        win = int(0.22 * SR)
        kernel = np.ones(win) / win
        smooth_env = np.convolve(speech_energy, kernel, mode="same")
        duck = np.where(smooth_env > 0.015, 0.42, 1.0)
        # Smooth duck transitions
        duck = np.convolve(duck, np.ones(int(0.08 * SR)) / int(0.08 * SR), mode="same")
        mix = bed * duck[:, None] + speech * 1.05
        # Soft limiter
        mix = np.tanh(mix * 1.08) * 0.90

        raw_mix_wav = tmp / "mix.wav"
        master_m4a = tmp / "master.m4a"
        save_wav_stereo(raw_mix_wav, mix)
        run_ffmpeg(
            [
                "-i", str(raw_mix_wav),
                "-af", "loudnorm=I=-16:TP=-1.5:LRA=8",
                "-c:a", "aac", "-b:a", "96k", "-ar", str(SR), "-ac", "2",
                str(master_m4a),
            ]
        )

        # 4. Build video stream & mux into faststart H.264 MP4
        video_only = tmp / "video.mp4"
        render_clip_video_track(spec, tmp, video_only)
        out_mp4 = OUT_VIDEOS / f"{spec.id}.mp4"
        run_ffmpeg(
            [
                "-i", str(video_only),
                "-i", str(master_m4a),
                "-c:v", "libx264", "-preset", "medium", "-crf", "24", "-pix_fmt", "yuv420p",
                "-c:a", "copy",
                "-shortest",
                "-movflags", "+faststart",
                str(out_mp4),
            ]
        )
        actual_dur = probe_duration(out_mp4)
        size_mb = out_mp4.stat().st_size / (1024 * 1024)
        print(f"✓ {spec.id:28s} {actual_dur:6.2f}s  {size_mb:5.2f} MB  ({len(cues)} cues)")
        return cues


async def main() -> None:
    all_cues: dict[str, list[dict]] = {}
    for spec in CLIPS:
        all_cues[spec.id] = await build_clip(spec)

    total_sec = sum(probe_duration(OUT_VIDEOS / f"{s.id}.mp4") for s in CLIPS)
    print(f"\nTOTAL EP0 DURATION: {total_sec:.2f}s ({int(total_sec // 60):02d}:{total_sec % 60:05.2f})")

    ts_header = (
        "// AUTO-GENERATED BY scripts/build-ep0-pilot.py — DO NOT EDIT BY HAND.\n"
        'import type { StorySubtitleCue } from "./story-graph.js";\n\n'
        "export const EP0_SUBTITLE_CUES: Record<string, readonly StorySubtitleCue[]> = "
    )
    OUT_CUES_TS.write_text(
        ts_header + json.dumps(all_cues, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote subtitle cues to {OUT_CUES_TS}")


if __name__ == "__main__":
    asyncio.run(main())
