#!/usr/bin/env python3
"""
Synthesizes custom trailer VO clips + exact-timed 60.0s Arctic industrial thriller score & foley
for `Quarantine Gate 0: 2036` Official Launch Trailer (v2.0 storyboard) at $0 cost.
"""

import asyncio
import math
import pathlib
import subprocess
import tempfile
import wave

import edge_tts
import numpy as np

REPO = pathlib.Path("/Users/evansmacbookpro/Desktop/Projects/interactive-video-game")
OUT_DIR = REPO / "videos" / "gate0-trailer" / "assets" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)


async def synth_edge_tts(
    text: str,
    voice: str,
    rate: str,
    pitch: str,
    raw_mp3: pathlib.Path,
    fallback_voices: list[tuple[str, str, str]] | None = None,
) -> None:
    attempts = [(voice, rate, pitch), *(fallback_voices or [])]
    last_err: Exception | None = None
    for v, r, p in attempts:
        for _ in range(2):
            try:
                comm = edge_tts.Communicate(text=text, voice=v, rate=r, pitch=p)
                await comm.save(str(raw_mp3))
                return
            except Exception as err:
                last_err = err
                await asyncio.sleep(0.6)
    raise RuntimeError(f"edge_tts failed for {raw_mp3.name}: {last_err}")


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


async def build_voice_assets() -> None:
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = pathlib.Path(tmpdir)

        # 1. Narrator Line 1 (Scene 03, target <= 3.5s): cold thriller voice
        raw1 = tmp / "narr1.mp3"
        await synth_edge_tts(
            "A mimic copies who you claim to be. Never what you did.",
            voice="en-GB-RyanNeural",
            rate="+16%",
            pitch="-6Hz",
            raw_mp3=raw1,
        )
        run_ffmpeg(
            [
                "-i", str(raw1),
                "-af", "silenceremove=start_periods=1:start_threshold=-42dB:detection=peak,areverse,silenceremove=start_periods=1:start_threshold=-42dB:detection=peak,areverse,highpass=f=85,lowpass=f=9500,acompressor=threshold=-18dB:ratio=3:attack=5:release=80,aecho=0.8:0.75:26:0.15,loudnorm=I=-14:TP=-1.5:LRA=7",
                "-ar", "48000", "-ac", "2", "-b:a", "192k",
                str(OUT_DIR / "narrator_say_do.mp3"),
            ]
        )

        # 2. Narrator Line 2 (Scene 06, target <= 4.7s): stakes of 5 fuel canisters & specialists
        raw2 = tmp / "narr2.mp3"
        await synth_edge_tts(
            "Five canisters of fuel for eight survivors. Burn the wrong specialist—you freeze.",
            voice="en-GB-RyanNeural",
            rate="+18%",
            pitch="-6Hz",
            raw_mp3=raw2,
        )
        run_ffmpeg(
            [
                "-i", str(raw2),
                "-af", "silenceremove=start_periods=1:start_threshold=-42dB:detection=peak,areverse,silenceremove=start_periods=1:start_threshold=-42dB:detection=peak,areverse,highpass=f=85,lowpass=f=9500,acompressor=threshold=-18dB:ratio=3:attack=5:release=80,aecho=0.8:0.75:26:0.15,loudnorm=I=-14:TP=-1.5:LRA=7",
                "-ar", "48000", "-ac", "2", "-b:a", "192k",
                str(OUT_DIR / "narrator_fuel.mp3"),
            ]
        )

        # 3. Night 5 Operator #09 Suffix Only (Scene 08, target ~4.5s, exact cast voice + intercom EQ)
        raw3 = tmp / "op09_suffix.mp3"
        await synth_edge_tts(
            "That's what I said at intake. Every night since, that's what I did. Did you?",
            voice="en-US-AndrewMultilingualNeural",
            rate="-2%",
            pitch="-4Hz",
            raw_mp3=raw3,
            fallback_voices=[
                ("en-US-AndrewMultilingualNeural", "-2%", "+0Hz"),
                ("en-US-AndrewNeural", "-2%", "-4Hz"),
                ("en-US-GuyNeural", "-2%", "-4Hz"),
            ],
        )
        run_ffmpeg(
            [
                "-i", str(raw3),
                "-af", "silenceremove=start_periods=1:start_threshold=-42dB:detection=peak,areverse,silenceremove=start_periods=1:start_threshold=-42dB:detection=peak,areverse,highpass=f=300,lowpass=f=3500,acompressor=threshold=-18dB:ratio=3:attack=5:release=60,loudnorm=I=-14:TP=-1.5:LRA=7",
                "-ar", "48000", "-ac", "2", "-b:a", "192k",
                str(OUT_DIR / "op09_suffix_only.mp3"),
            ]
        )

        # 4. Marcus rescue clause only (Scene 04, target <= 6.2s, exact cast voice en-US-ChristopherNeural, skips "Lock my ass!")
        raw4 = tmp / "marcus_rescue.mp3"
        await synth_edge_tts(
            "That idiot can't even buckle his seal—if I don't drag him back by the ear, who will? Dock my pay later!",
            voice="en-US-ChristopherNeural",
            rate="+16%",
            pitch="-10Hz",
            raw_mp3=raw4,
        )
        run_ffmpeg(
            [
                "-i", str(raw4),
                "-af", "silenceremove=start_periods=1:start_threshold=-42dB:detection=peak,areverse,silenceremove=start_periods=1:start_threshold=-42dB:detection=peak,areverse,highpass=f=300,lowpass=f=3500,acompressor=threshold=-18dB:ratio=3:attack=5:release=60,loudnorm=I=-14:TP=-1.5:LRA=7",
                "-ar", "48000", "-ac", "2", "-b:a", "192k",
                str(OUT_DIR / "marcus_rescue_trim.mp3"),
            ]
        )

        # 5. Copy Elena opening line at 48kHz stereo for clean HyperFrames mix
        run_ffmpeg(
            [
                "-i", str(REPO / "public" / "audio" / "en" / "elena" / "opening.mp3"),
                "-af", "loudnorm=I=-14:TP=-1.5:LRA=7",
                "-ar", "48000", "-ac", "2", "-b:a", "192k",
                str(OUT_DIR / "elena_opening.mp3"),
            ]
        )


def build_score_and_foley_60s() -> None:
    """
    Synthesizes an exact 60.0s dark Arctic industrial score + foley track timed to v2.0 storyboard:
    - 0:00.0–0:05.0: -46°C blizzard wind + sub heartbeat + 0:03.2 steel shutter clang + 1,100°C roar
    - 0:05.0–0:13.0: Sub-bass drone (41.2Hz E1) + heavy glass thud at 0:07.0
    - 0:13.0–0:29.0: Tense dark synth pulse + PTT clicks (0:18.0, 0:20.5) + rising heartbeat
    - 0:29.0–0:36.0: Geomagnetic RF storm static tear (0:29.0–0:31.5) + rising industrial drone
    - 0:36.0–0:43.0: Heavy brass lever clank (0:37.4) + furnace flare + deep -180m sonar ping (0:40.4)
    - 0:43.0–0:48.0: Accelerating metallic telemetry ticks -> HARD CUT TO DEAD SILENCE at 0:48.000
    - 0:48.0–0:49.0: PROTECTED SILENCE + 3 resonant double-glazed glass knocks (0:48.10, 0:48.45, 0:48.80)
    - 0:49.0–0:55.0: Ultra-low eerie 36Hz air-pressure hum under Operator #09's voice -> silence slam 0:55.0
    - 0:55.0–1:00.0: Resonant low brass/sub-bass trailer Braaam decaying into Arctic wind tail
    """
    sr = 48000
    dur = 60.0
    n = int(sr * dur)
    t = np.linspace(0.0, dur, n, endpoint=False, dtype=np.float64)
    rng = np.random.default_rng(2036)

    left = np.zeros(n, dtype=np.float64)
    right = np.zeros(n, dtype=np.float64)

    def add_mono(start_s: float, sig: np.ndarray, gain_l: float = 1.0, gain_r: float = 1.0) -> None:
        i0 = int(start_s * sr)
        if i0 >= n:
            return
        end = min(n, i0 + len(sig))
        seg = sig[: end - i0]
        left[i0:end] += seg * gain_l
        right[i0:end] += seg * gain_r

    def lowpass_simple(x: np.ndarray, cutoff_hz: float) -> np.ndarray:
        rc = 1.0 / (2.0 * math.pi * cutoff_hz)
        dt = 1.0 / sr
        alpha = dt / (rc + dt)
        # Fast vectorized IIR via FFT lowpass for clean steep rolloff
        freqs = np.fft.rfftfreq(len(x), d=1.0 / sr)
        spec = np.fft.rfft(x)
        h = 1.0 / np.sqrt(1.0 + (freqs / cutoff_hz) ** 4)
        return np.fft.irfft(spec * h, n=len(x))

    def bandpass_fft(x: np.ndarray, lo: float, hi: float) -> np.ndarray:
        freqs = np.fft.rfftfreq(len(x), d=1.0 / sr)
        spec = np.fft.rfft(x)
        mask = (1.0 / np.sqrt(1.0 + (lo / np.maximum(freqs, 1.0)) ** 4)) * (
            1.0 / np.sqrt(1.0 + (freqs / hi) ** 4)
        )
        return np.fft.irfft(spec * mask, n=len(x))

    # 1. Continuous Arctic -46°C blizzard wind bed (cut cleanly at 0:48.0, returns softly at 0:55.5)
    raw_noise_l = rng.standard_normal(n)
    raw_noise_r = rng.standard_normal(n)
    wind_l = bandpass_fft(raw_noise_l, 70.0, 520.0) * (0.14 + 0.06 * np.sin(2 * math.pi * 0.17 * t))
    wind_r = bandpass_fft(raw_noise_r, 80.0, 560.0) * (0.14 + 0.06 * np.cos(2 * math.pi * 0.14 * t))
    wind_env = np.ones(n, dtype=np.float64)
    # Duck wind during spoken sections, hard-cut silence at 0:48.0..0:55.0
    wind_env[int(48.0 * sr) : int(55.0 * sr)] = 0.0
    wind_env[int(5.0 * sr) : int(13.0 * sr)] *= 0.45
    wind_env[int(13.0 * sr) : int(29.0 * sr)] *= 0.38
    wind_env[int(36.0 * sr) : int(43.0 * sr)] *= 0.42
    # Fade out cleanly 58.2 -> 60.0
    fade_start = int(58.0 * sr)
    wind_env[fade_start:] *= np.linspace(1.0, 0.0, n - fade_start)
    left += wind_l * wind_env
    right += wind_r * wind_env

    # 2. Dark Industrial Sub-Bass Drone (E1 = 41.2Hz + B1 = 61.7Hz), strictly off during 0:48.0..0:55.0
    drone = (
        0.16 * np.sin(2 * math.pi * 41.2 * t)
        + 0.07 * np.sin(2 * math.pi * 61.74 * t + 0.4)
        + 0.04 * np.sin(2 * math.pi * 82.41 * t)
    )
    drone_env = np.zeros(n, dtype=np.float64)
    drone_env[: int(48.0 * sr)] = 1.0
    # Ramp intensity through Act II
    act2_s, act2_e = int(18.0 * sr), int(48.0 * sr)
    drone_env[act2_s:act2_e] *= np.linspace(0.65, 1.25, act2_e - act2_s)
    # Hard kill at 47.95 -> 48.00
    kill_s, kill_e = int(47.95 * sr), int(48.0 * sr)
    drone_env[kill_s:kill_e] *= np.linspace(1.0, 0.0, kill_e - kill_s)
    # Ultra-subtle eerie 36Hz pressure tone during 0:50.0..0:54.95
    n5_s, n5_e = int(50.0 * sr), int(54.95 * sr)
    left[n5_s:n5_e] += 0.045 * np.sin(2 * math.pi * 36.7 * t[n5_s:n5_e])
    right[n5_s:n5_e] += 0.045 * np.sin(2 * math.pi * 36.7 * t[n5_s:n5_e])
    left += drone * drone_env * 0.72
    right += drone * drone_env * 0.72

    # 3. Helper generators for trailer SFX hits
    def heartbeat_hit(pitch_hz: float = 54.0, amp: float = 0.42) -> np.ndarray:
        lt = np.linspace(0, 0.35, int(0.35 * sr), endpoint=False)
        lub = np.sin(2 * math.pi * (pitch_hz * np.exp(-lt * 3.0)) * lt) * np.exp(-lt * 16.0)
        lt2 = np.maximum(0.0, lt - 0.14)
        dub = (lt >= 0.14) * np.sin(2 * math.pi * ((pitch_hz * 0.85) * np.exp(-lt2 * 3.5)) * lt2) * np.exp(-lt2 * 22.0)
        return amp * (lub + 0.65 * dub)

    def steel_slam_and_furnace(length_s: float = 1.9, amp: float = 0.65) -> np.ndarray:
        lt = np.linspace(0, length_s, int(length_s * sr), endpoint=False)
        impact = np.sin(2 * math.pi * (110.0 * np.exp(-lt * 12.0) + 32.0) * lt) * np.exp(-lt * 6.5)
        clang = bandpass_fft(rng.standard_normal(len(lt)), 420.0, 2600.0) * np.exp(-lt * 11.0) * 0.55
        roar = bandpass_fft(rng.standard_normal(len(lt)), 90.0, 1200.0) * np.minimum(1.0, lt / 0.18) * np.exp(-np.maximum(0, lt - 0.5) * 1.4) * 0.52
        return amp * (impact + clang + roar)

    def glass_knock(amp: float = 0.68, freq: float = 185.0) -> np.ndarray:
        lt = np.linspace(0, 0.24, int(0.24 * sr), endpoint=False)
        body = np.sin(2 * math.pi * freq * lt) * np.exp(-lt * 26.0)
        body2 = 0.55 * np.sin(2 * math.pi * (freq * 1.62) * lt) * np.exp(-lt * 34.0)
        click = bandpass_fft(rng.standard_normal(len(lt)), 700.0, 2400.0) * np.exp(-lt * 65.0) * 0.45
        return amp * (body + body2 + click)

    def ptt_chirp(amp: float = 0.28) -> np.ndarray:
        lt = np.linspace(0, 0.08, int(0.08 * sr), endpoint=False)
        beep = np.sin(2 * math.pi * 1240.0 * lt) * np.exp(-lt * 38.0)
        burst = bandpass_fft(rng.standard_normal(len(lt)), 1000.0, 3400.0) * np.exp(-lt * 45.0) * 0.35
        return amp * (beep + burst)

    def sonar_ping(amp: float = 0.34) -> np.ndarray:
        lt = np.linspace(0, 2.2, int(2.2 * sr), endpoint=False)
        ping = (np.sin(2 * math.pi * 880.0 * lt) + 0.35 * np.sin(2 * math.pi * 1760.0 * lt)) * np.exp(-lt * 2.1)
        return amp * ping

    # Scene 01 (0:00–0:05): heartbeats + 0:03.2 steel shutter purge slam
    add_mono(0.4, heartbeat_hit(54.0, 0.42), 0.9, 0.9)
    add_mono(1.3, heartbeat_hit(56.0, 0.48), 0.9, 0.9)
    add_mono(2.2, heartbeat_hit(60.0, 0.54), 0.9, 0.9)
    add_mono(3.2, steel_slam_and_furnace(1.85, 0.72), 1.0, 0.96)

    # Scene 02 (0:05–0:13): glass thud right on cut at 0:07.0
    add_mono(7.0, glass_knock(0.55, 130.0), 0.95, 1.0)

    # Scene 04 (0:18–0:29): PTT clicks + rhythmic heartbeats (88 -> 98 BPM)
    add_mono(18.0, ptt_chirp(0.26), 1.0, 0.85)
    add_mono(20.5, ptt_chirp(0.24), 0.85, 1.0)
    for bt in [18.5, 19.2, 19.9, 25.0, 25.65, 26.3, 26.95, 27.6, 28.25]:
        add_mono(bt, heartbeat_hit(58.0, 0.34), 0.9, 0.9)

    # Scene 05 (0:29–0:36): violent geomagnetic RF storm tear (0:29.0–0:31.5)
    storm_len = int(2.6 * sr)
    st_t = np.linspace(0, 2.6, storm_len, endpoint=False)
    storm_sig = (
        bandpass_fft(rng.standard_normal(storm_len), 500.0, 3800.0)
        * (0.32 + 0.22 * np.sin(2 * math.pi * 19.0 * st_t))
        * np.minimum(1.0, st_t / 0.12)
        * np.minimum(1.0, (2.6 - st_t) / 0.3)
    )
    add_mono(29.0, storm_sig, 0.9, 1.0)
    add_mono(33.5, ptt_chirp(0.28), 0.9, 0.9)

    # Scene 06 (0:36–0:43): 0:37.4 mechanical blast lever slam + 0:40.4 -180m sonar ping
    add_mono(37.4, steel_slam_and_furnace(1.6, 0.56), 1.0, 0.92)
    add_mono(40.4, sonar_ping(0.32), 0.85, 1.0)

    # Scene 07 (0:43–0:48): accelerating metallic telemetry ticks cutting dead at 0:48.0
    tick_t = 43.0
    interval = 0.42
    while tick_t < 47.88:
        amp = 0.22 + 0.35 * ((tick_t - 43.0) / 5.0)
        add_mono(tick_t, glass_knock(amp, 520.0 + 90.0 * (tick_t - 43.0)), 0.95, 0.95)
        tick_t += interval
        interval = max(0.11, interval * 0.88)

    # Scene 08 (0:48.0–0:49.0): PROTECTED SILENCE + 3 unmistakable hollow glass knocks
    add_mono(48.10, glass_knock(0.82, 165.0), 1.0, 0.92)
    add_mono(48.46, glass_knock(0.86, 160.0), 0.94, 1.0)
    add_mono(48.82, glass_knock(0.92, 155.0), 1.0, 0.95)

    # Scene 09 (0:55.0–1:00.0): Deep industrial low-brass Braaam slam & natural decay
    br_len = int(4.9 * sr)
    bt = np.linspace(0, 4.9, br_len, endpoint=False)
    braaam_raw = (
        0.48 * np.sin(2 * math.pi * 41.2 * bt)
        + 0.30 * np.sin(2 * math.pi * 82.41 * bt)
        + 0.20 * np.sin(2 * math.pi * 123.47 * bt)
        + 0.14 * np.tanh(2.4 * np.sin(2 * math.pi * 41.2 * bt))
    )
    braaam = lowpass_simple(braaam_raw, 420.0) * np.minimum(1.0, bt / 0.06) * np.exp(-bt * 0.62)
    add_mono(55.0, braaam * 0.85, 1.0, 0.98)

    # Soft limiter & write WAV -> MP3
    stereo = np.stack([left, right], axis=1)
    stereo = np.tanh(stereo * 1.15) * 0.88
    pcm = np.clip(stereo * 32767.0, -32768, 32767).astype(np.int16)

    with tempfile.TemporaryDirectory() as tmpdir:
        wav_path = pathlib.Path(tmpdir) / "score_60s.wav"
        with wave.open(str(wav_path), "wb") as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(sr)
            wf.writeframes(pcm.tobytes())
        run_ffmpeg(
            [
                "-i", str(wav_path),
                "-af", "loudnorm=I=-18:TP=-1.5:LRA=11",
                "-ar", "48000", "-ac", "2", "-b:a", "192k",
                str(OUT_DIR / "trailer_score_sfx_60s.mp3"),
            ]
        )


async def main() -> None:
    await build_voice_assets()
    build_score_and_foley_60s()
    for p in sorted(OUT_DIR.glob("*.mp3")):
        print(f"  {p.name:28s}  {probe_duration(p):6.3f}s  ({p.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    asyncio.run(main())
