# Official Launch Trailer Storyboard v2.0 — `Quarantine Gate 0: 2036` (`零号隔离窗`)

> **Revision v2.0**: Fully revised after `grok-4.7` director/engineering audit + `ffprobe` duration verification. Fixes every audio overrun, replaces the slow blizzard opening with a muted-autoplay mimic-flinch & purge hook (per `docs/GDD.md` line 206), removes Night 5 solution spoilers, enforces native `1280×720` pixel seating inside a `1920×1080` Gate Cam bezel, cuts new Flow/AI Studio generations from 6 down to **5 tight shots**, and aligns every mechanical claim 1:1 with shipped code.

- **Master Spec**: `60.0s` (`1920×1080`, `16:9`, `30 fps`, H.264, `-14 LUFS`, **English single-language master first**; localized Chinese master rendered as a separate pass using `public/audio/zh/` rather than stacking bilingual burn-ins).
- **Color & Framing Contract (Zero 720p/1080p Seam)**:
  - **Palette**: Amber CRT `#eba834`, frost cyan `#9ec6d4`, purge red `#e04634`, obsidian `#050709`. Zero green phosphor, zero blue holograms.
  - **Native `720p` Cast Seating**: Every existing `1280×720` clip (`public/videos/*/*.mp4`) is mounted at **native `1:1` pixel scale (`1280×720`) inside a `1920×1080` riveted Gate Cam 01 CRT bezel** with matching scanlines—never upscaled 1.5× full-bleed.
  - **Frame Rate Conform**: Any `24 fps` Google Flow / AI Studio output is conformed to `30 fps` via frame duplication (never optical-flow interpolation on faces).

---

## 1. Exact `60.0s` Timing & Audio Budget (`ffprobe`-Verified)

| Scene | Timecode | Duration | Visual Source | Audio / Voice Budget (Verified) | On-Screen Copy (Max 1 Beat / Shot) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **01 · Cold Open** | `0:00.0–0:05.0` | `5.0s` | `[EXISTING]` `elena/flinch.mp4` (`3.2s`) → `chamber/purge.mp4` (`1.8s`, cut on shutter) | **Muted-friendly · Zero voice** (`-46°C` wind + heartbeat + hydraulic slam + furnace burst) | `SHE LOCKED THE HATCH.` (lower third, `0:00.8–0:03.0`) |
| **02 · Airlock Knock** | `0:05.0–0:13.0` | `8.0s` | `[NEW #1]` `booth_ots.mp4` (`2.0s`, thud at `2.0s`) → `[EXISTING]` `elena/idle.mp4` (`5.0s` + `1.0s` hold) | `audio/en/elena/opening.mp3` (**`7.128s`**, `0:05.0–0:12.128`, uncut!) | `PERFECT PASSWORDS.` (`0:07.4`, `0.45s`) · `PERFECT FACES.` (`0:10.0`, `0.45s`) in lower third |
| **03 · Say vs Do** | `0:13.0–0:18.0` | `5.0s` | `[LIVE UI · 1080p]` 2× zoom on `V-01` `neverWon` (`Fairness`/`Care`) → `[o-01]` highlight | Purpose-recorded Narrator VO (**`3.2s`**, `0:13.4–0:16.6`): *"A mimic copies who you claim to be—never what you did."* | `INTERROGATE WHAT THEY DENY.` (`0:16.7–0:18.0`) |
| **04 · 4 Questions** | `0:18.0–0:29.0` | `11.0s` | `[LIVE UI]` Axis Preview + MindCrystal (`2.5s`) → `[EXISTING]` `marcus/lean_in.mp4` (`4.0s`) → `[LIVE UI]` levers + BPM `88→98` (`4.5s`) | Trimmed rescue clause + tail of `marcus/dilemma_human.mp3` (**`~5.8s`**, `0:20.6–0:26.4`, after `"Lock my ass!"`) | `4 QUESTIONS. THEN YOU CHOOSE.` (`0:26.8–0:29.0`) |
| **05 · Storm & Alibi** | `0:29.0–0:36.0` | `7.0s` | `[NEW #2]` `storm_crt.mp4` (`2.5s`) → `[EXISTING]` `ana/flinch.mp4` (`2.0s`, locked sensors) → `[EXISTING]` `linmei/flinch.mp4` (`2.5s`) | Geomagnetic static tear + rising sub-bass (**cards only, zero narrator**) | `NIGHT 3 · SENSORS OFFLINE.` → `NIGHT 4 · BREAK THEIR ALIBI.` |
| **06 · Fuel & Sub** | `0:36.0–0:43.0` | `7.0s` | `[NEW #3]` `purge_lever.mp4` (`2.2s`, slam by `1.4s`) → `[LIVE UI]` `0 FUEL` Cryo-Brownout (`2.0s`) → `[NEW #4]` `nautilus_dock.mp4` (`1.6s`) → CRT cut → `[LIVE UI]` `<NautilusSubSchematic>` (`1.2s`) | Lever slam + furnace + 1 Narrator line (**`4.5s`**, `0:37.5–0:42.0`): *"Five canisters of fuel for eight survivors. Burn the wrong specialist—you freeze."* | `5 FUEL · 8 SURVIVORS.` |
| **07 · Dirty Hands** | `0:43.0–0:48.0` | `5.0s` | `[LIVE UI · 1080p]` 2 clean stylized crisis stills (`2.5s` each): `N2_SERUM` → `N3_BRIBE` (offer `+2 FUEL`) | Rising Geiger/telemetry clicks → **hard cut to dead silence at `0:48.0`** | `KEEP THE LAST SERUM?` → `OFFER: +2 FUEL. SCRUB THE LOG?` |
| **08 · Night 5 Hook** | `0:48.0–0:55.0` | `7.0s` | Black (`1.0s`) → `[NEW #5]` `n5_silhouette.mp4` (`1.0s`, hood up, no face) → `[EXISTING]` `operator09/idle.mp4` (**exact `5.0s`**, `0:50.0–0:55.0`, cut to black on last word) | 3 sharp knocks in silence (`0:48.0–0:49.0`) → **one voice only**, purpose-recorded suffix (**`~4.6s`**, `0:50.2–0:54.8`): *"That's what I said at intake. Every night since, that's what I did. Did you?"* | *(None — zero spoilers, no `99.98%`, no win pips, no thesis card)* |
| **09 · Title & CTA** | `0:55.0–1:00.0` | `5.0s` | `[HYPERFRAMES · 1080p]` `#050709` canvas, miniature `MindCrystal` chord seal assembling | Deep low-brass resolve decaying into `-46°C` wind tail | Sequential: `QUARANTINE GATE 0 : 2036` / `零号隔离窗` → `5 NIGHTS · 8 SURVIVORS · 7 ENDINGS` → `PLAY · quarantine-gate-0.vercel.app` → `Persona architecture powered by Ordamor` |

**Total Runtime Check**: `5.0 + 8.0 + 5.0 + 11.0 + 7.0 + 7.0 + 5.0 + 7.0 + 5.0 = 60.0s` exact.

---

## 2. Scene-by-Scene Production Notes

### Scene 01 — Cold Open (`0:00.0 – 0:05.0` · `5.0s`)
- Built specifically for **Steam muted autoplay** and **YouTube's 5-second skip gate**: opens immediately on a human face darting in panic behind frost glass (`elena/flinch.mp4` inside Gate Cam 01 bezel), slaps `SHE LOCKED THE HATCH.` cleanly in the lower third, and slams straight into the first `1.8s` of `chamber/purge.mp4` cutting cleanly on the heavy steel blast shutter.

### Scene 02 — The Airlock Knock (`0:05.0 – 0:13.0` · `8.0s`)
- `public/audio/en/elena/opening.mp3` (`7.128s`) starts cleanly at `0:05.0` over the empty booth OTS shot (`Shot #1`, glass thud at `2.0s`) and carries uninterrupted over `elena/idle.mp4` (`5.0s` + `1.0s` phosphor hold) so *"cycle the airlock NOW!"* lands with `0.87s` of room before Scene 03.
- `PERFECT PASSWORDS.` and `PERFECT FACES.` flash strictly in the lower third (`0.45s` each) so Elena's face is never obscured.

### Scene 03 — The Premise (`0:13.0 – 0:18.0` · `5.0s`)
- Live 1080p capture of `V-01`'s baseline dossier focusing on `neverWon` (`Fairness`, `Care`) vs. `[o-01]` (`locked the inner hatch early`). Narrator VO (`3.2s`) delivers the core rule without duplicating the on-screen card; `INTERROGATE WHAT THEY DENY.` snaps in right after the voice finishes.

### Scene 04 — 4 Questions & Marcus Tell (`0:18.0 – 0:29.0` · `11.0s`)
- Shows a real free-text question hitting the `ORD-OS Axis Preview` and `MindCrystalCanvas`, then cuts to `marcus/lean_in.mp4` (`4.0s` full native clip).
- **Audio trim discipline**: Trim `public/audio/en/marcus/dilemma_human.mp3` (`10.416s`) to start right at `"That idiot can't even buckle his seal—if I don't drag him back by the ear, who will?! Dock my pay later!"` (`~5.8s`), cutting *after* `"Lock my ass!"` so a cold viewer never confuses him with the mimic line.
- BPM telemetry ticks from `88` to `98 BPM` (true single-probe `+10` delta). One card only: `4 QUESTIONS. THEN YOU CHOOSE.`

### Scene 05 — Escalation (`0:29.0 – 0:36.0` · `7.0s`)
- Zero narrator voice so the geomagnetic static burst carries the transition.
- `Shot #2` (`2.5s` amber-only `#eba834` static tearing across a frosted CRT bezel) cuts into `ana/flinch.mp4` (`2.0s`, showing Night 3's genuinely locked-out Strobe/Thermal buttons) with `NIGHT 3 · SENSORS OFFLINE.`, then into `linmei/flinch.mp4` (`2.5s`) with player-facing copy `NIGHT 4 · BREAK THEIR ALIBI.` (zero internal `Boggart` / `disposalRequires` engineering labels).

### Scene 06 — Heating Fuel & *Nautilus-0* (`0:36.0 – 0:43.0` · `7.0s`)
- `Shot #3` (`2.2s`, gloved hand slamming the blast lever down by `1.4s` into `#e04634` furnace flare) cuts cleanly to a standalone live 1080p booth capture of the real `[! CRYO-BROWNOUT · 0 FUEL]` banner (`2.0s`).
- `Shot #4` (`1.6s`, `-180m` glacial submarine cavern with `#9ec6d4` floodlights) cuts via a **CRT power-off snap** (not a dissolve) into `<NautilusSubSchematic>` (`1.2s`).
- Narrator states the exact enforced game stakes (`4.5s`): *"Five canisters of fuel for eight survivors. Burn the wrong specialist—you freeze."*

### Scene 07 — Inter-Night Crises (`0:43.0 – 0:48.0` · `5.0s`)
- Two crisp, legible `2.5s` stylized captures (`N2_SERUM` + `N3_BRIBE` framed as an *offer*, not a fixed outcome) with concise edited choice headlines—no unreadable 1.2s paragraph whip-cuts. Rising telemetry ticks cut sharply to **total silence at `0:48.0`**.

### Scene 08 — The Night 5 Chill (`0:48.0 – 0:55.0` · `7.0s`)
- **Protect the silence**: `0:48.0–0:49.0` is pure black with three hollow knocks on double-glazed blast glass. Nothing speaks over it.
- `0:49.0–0:50.0` (`1.0s`): `Shot #5` shows a parka silhouette stepping toward frosted glass with **hood up the entire time (face never resolves)**, cutting cleanly into the real **`5.0s`** `public/videos/operator09/idle.mp4` (`0:50.0–0:55.0`, exact `1:1` duration—no loop, no underrun!).
- **Single voice, zero spoilers**: Purpose-recorded `~4.6s` suffix-only intercom line (*"That's what I said at intake. Every night since, that's what I did. Did you?"*) lands right on `0:54.8` and slams to black at `0:55.0`. No narrator explanation, no `FACIAL MATCH 99.98%`, no `CONTRADICTIONS EXPOSED` pip, no Ending D thesis card, no `whiteout.mp4`.

### Scene 09 — Title Lockup & CTA (`0:55.0 – 1:00.0` · `5.0s`)
- Sequential typographic reveal (never dumped all at once):
  1. `0:55.2`: **`QUARANTINE GATE 0 : 2036`** + `零号隔离窗`
  2. `0:56.4`: `5 NIGHTS · 8 SURVIVORS · 7 ENDINGS`
  3. `0:57.5`: **`PLAY · quarantine-gate-0.vercel.app`**
  4. `0:58.2`: `Persona architecture powered by Ordamor` (per `docs/GDD.md` line 179; Steam badge deferred until Steam store page is live).

---

## 3. Google Flow / AI Studio Generation Manifest (5 Tight Hero Shots · `$0` API Spend)

**Mandatory Shared Style Suffix (appended to all 5 prompts)**:
> `1920x1080, 30fps, 35mm anamorphic live-action cinematography, photoreal film grain and contrast matched to an existing 1280x720 tungsten surveillance plate, restricted palette strictly amber #eba834, frost cyan #9ec6d4, purge red #e04634, obsidian #050709. No green phosphor, no blue sci-fi holograms, no readable text, no logos, no extra people.`

| Shot ID | Scene | Gen Len | Used Window | Exact Prompt for Google Flow / AI Studio (`public@tfsharedspace.com`) |
| :--- | :---: | :---: | :---: | :--- |
| **`trailer_01_booth_ots.mp4`** | Scene 02 | `4s` | `0:00–0:02.0` | Over-the-shoulder empty industrial quarantine booth bathed in warm `#eba834` amber CRT glow, looking straight through thick frost-rimmed double-glazed blast glass into a dark red-lit concrete airlock corridor; no person in frame; spindrift snow leaking under the outer steel door; subtle camera tremor from a sharp glass thud at `2.0s`. + *[Shared Style Suffix]* |
| **`trailer_02_storm_crt.mp4`** | Scene 05 | `4s` | `0:00–0:02.5` | Macro close-up of a weathered industrial amber CRT thermal radar screen inside a dark Arctic control booth violently tearing with polar geomagnetic interference waves and jagged `#eba834` amber-only static bars across the entire first `2.5s`, thick rime frost on the steel bezel, shallow depth of field. + *[Shared Style Suffix]* |
| **`trailer_03_purge_lever.mp4`** | Scene 06 | `4s` | `0:00–0:02.2` | Macro tactile close-up of a frost-dusted worn dark leather gloved hand gripping a heavy weathered brass-and-crimson mechanical blast lever mounted on riveted steel, slamming the lever completely downward by `1.4s` as intense `#e04634` thermal furnace flare erupts across the metal and glove with heat haze and stray sparks. + *[Shared Style Suffix]* |
| **`trailer_04_nautilus_dock.mp4`** | Scene 06 | `4s` | `0:00–0:01.6` | Wide locked architectural shot inside a flooded `-180m` subterranean glacial cavern submarine dock, dark weathered industrial rescue submarine hull with zero hull lettering moored beside riveted steel gantries, practical `#9ec6d4` frost-cyan floodlights slicing through freezing mist above black Arctic water. + *[Shared Style Suffix]* |
| **`trailer_05_n5_silhouette.mp4`** | Scene 08 | `4s` | `0:00–0:01.0` | *(Reference wardrobe only: `public/portraits/operator09.jpg` — or optionally replaced by HyperFrames frost-wipe over real `operator09/idle.mp4`)* Locked surveillance view looking through heavy frosted double blast glass into a blinding Arctic whiteout corridor as a parka silhouette with hood pulled up the entire time steps toward the glass; face never resolves behind thick frost, ending on frosted glass for a clean match-cut. + *[Shared Style Suffix]* |

---

## 4. Custom Audio Assets to Synthesize (Free Local Neural TTS + FFmpeg · `$0`)

1. **`narrator_say_do.mp3`** (`3.2s`, deep cold English male voice `en-US-AndrewNeural` / `en-GB-RyanNeural`, `-14 LUFS`, subtle booth room reverb): *"A mimic copies who you claim to be—never what you did."*
2. **`narrator_fuel.mp3`** (`4.5s`): *"Five canisters of fuel for eight survivors. Burn the wrong specialist—you freeze."*
3. **`op09_suffix_only.mp3`** (`~4.6s`, matching `operator09` cast voice + `300–3500Hz` intercom bandpass): *"That's what I said at intake. Every night since, that's what I did. Did you?"*
4. **`marcus_rescue_trim.mp3`** (`~5.8s`, lossless FFmpeg trim of existing `public/audio/en/marcus/dilemma_human.mp3` starting at the rescue clause *"That idiot can't even buckle his seal..."*).
