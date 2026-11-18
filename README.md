# Quarantine Gate 0: 2036（零号隔离窗）

> **在线生产版 (Vercel · 含 `/api/rephrase` 自由提问改写)**: https://quarantine-gate-0.vercel.app
> **在线静态镜像 (GitHub Pages · 跨域直连改写网关)**: https://evanzhousy.github.io/interactive-video-game/

Claustrophobic Svalbard quarantine interrogation game (`-46°C`, 60–90 min short-form Steam title) powered by the **Ordamor Persona Engine (`schemaVersion: 6`)**.

Instead of spotting pixel anomalies on forged IDs, Operator `#09` interrogates **8 survivors across 5 nights** through double-glazed blast glass (4 PTT questions max) using their pre-outbreak **Ordamor Forensic Profile**:
- **Night 1 (`V-01` Elena Vance, `V-02` Leo Sato)**: Low-tier mimics recite the host's flattering self-narrative (`justificationGap.neverWon`).
- **Night 2 (`V-03` Arthur Sterling, `V-04` Marcus Chen)**: MindCrystal arcs unlock; mid-tier mimics absorb primary guilty memory (`v-1`), failing on secondary value collisions (`v-2`).
- **Night 3 (`V-05` Ana Ribeiro, `V-06` Dr. Ingrid Solberg)**: Polar geomagnetic storm scrambles optical & thermal sensors — pure intercom deduction, including Ana's counter-intuitive `own_it` signature.
- **Night 4 (`V-07` Dr. Lin Mei, `V-08` Hannah Weiss)**: High-tier mimics pass value orderings (`v-1`, `v-2`), exposing themselves only when you test their **Disposal Signature (`sig-1`)** or strip away its precondition via a **Boggart Trap (`disposalRequires`)**.
- **Night 5 Climax**: A doppelgänger wearing your face quotes your Night 0 `SAY` intake verbatim. Only your real `SAY / DO` gap in the shift logs proves you are human.

---

## Quick Start

Requires **Node.js 24+** and **pnpm**:

```bash
pnpm install
pnpm media:manifest  # Export 40 I2V video prompts + 264 trilingual voice scripts -> public/media-manifest.json
pnpm media:videos -- --dry-run  # Preview 40 live-action I2V clips (Veo / Kling / Runway)
pnpm media:videos    # Batch-render H.264 1280x720 .mp4 live-action clips -> public/videos/{slug}/*.mp4
pnpm media:tts       # Optional: batch-render studio .mp3 intercom voices (requires TTS_API_KEY)
pnpm test            # Run hermetic Vitest suite (Ordamor v6 + Stance + Flash + Media + UI)
pnpm build           # tsc --noEmit && vitest run && vite build -> dist/
```

---

## AI Photorealistic Live-Action Pipeline (`35mm Keyframes` + `I2V Video Models`)

Instead of uncanny 3D character meshes, Gate 0 uses a **two-tier AI live-action surveillance architecture** matching `ordamor-live-2036.mp4` (`1280×720 H.264 30fps`, zero-lip-sync intercom framing):

1. **Built-in 28 Photorealistic 35mm Cinema Frames (Zero-Key Instant Play)**:
   - `public/portraits/{slug}.jpg`: 8 survivor `idle` blast-window portraits + Night 5 `operator09.jpg`.
   - `public/portraits/reactions/{slug}_{flinch,lean_in}.jpg`: 16 actor-consistent image-to-image reaction shots that crossfade dynamically when probes hit contradictions or trigger urgent lean-ins.
   - `public/portraits/reactions/chamber_{purge,admit,whiteout}.jpg`: 3 photorealistic chamber shots (`1,100°C` blast-shutter sterilization, green cryo-steam airlock clearance, and `-46°C` Arctic whiteout).
2. **Full Motion I2V Video Stream (`pnpm media:videos` or One-Click Google Colab)**:
   - **Option A — One-Click Google Colab (`Veo 3` via AI Studio OR Free `T4 GPU` Open-Source `LTX-Video`)**:
     [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/evanzhousy/interactive-video-game/blob/main/notebooks/gate0_ai_video_studio.ipynb)
     Open [`notebooks/gate0_ai_video_studio.ipynb`](./notebooks/gate0_ai_video_studio.ipynb) in Colab to render clips either via Google AI Studio's `GEMINI_API_KEY` (`veo-3.0-generate-001`) or free Colab T4 GPU (`Lightricks/LTX-Video`), export to Google Drive (`MyDrive/quarantine-gate-0-videos`), and pull straight into `public/videos/` via `pnpm media:pull-drive`.
   - **Option B — Direct Node CLI**: Configure `GEMINI_API_KEY` (**Google Veo 3**), `FAL_KEY` (**Kling 2.0 / Wan 2.1**), or `RUNWAYML_API_SECRET` (**Runway Gen-4 Turbo**) in `.env.local` and run `pnpm media:videos` (or filter e.g. `pnpm media:videos -- --visitor V-01 --state idle --with-end-frame`).
   - Whenever `public/videos/{slug}/{idle,flinch,lean_in,admit,purge}.mp4` is present, `ViewportCanvas` automatically upgrades from 35mm keyframe crossfades to continuous `<video>` streams.

---

## Optional Online Flash Free-Text Rephrase (`/api/rephrase`)

The game runs **100% deterministically offline** with zero API keys. To enable live Flash rephrasing for free-text questions (`⚡ Flash: ON` in the booth header), copy `.env.example` to `.env.local` and set one of:

```bash
# Option 1: Vercel AI Gateway (matches ordamor)
AI_GATEWAY_API_KEY=...
FLASH_MODEL=google/gemini-3.8-flash

# Option 2: Google Gemini API
GEMINI_API_KEY=...
FLASH_MODEL=gemini-2.5-flash

# Option 3: Custom / Local OpenAI-compatible gateway
FLASH_BASE_URL=http://127.0.0.1:3425/v1/chat/completions
FLASH_MODEL=google/gemini-3.8-flash
```

**Zero Identity Leakage Guarantee**: `isMimic`, `defectMode`, and `lineKey` are excluded by TypeScript construction (`LlmRephraseInput`) and rejected with HTTP `400` if smuggled into `/api/rephrase`. Timeouts (`>3.6s`), offline state, or validator rejections seamlessly fall back to the deterministic pre-approved line.

---

## Desktop Keyboard Shortcuts & Meta-Progression

- **Tactical Shortcuts (Booth)**: `1`–`5` fire tactical probe chips · `S` Pupil Strobe (`1⚡`) · `T` Neural Thermal (`1⚡`) · `[` / `]` cycle ORD-OS Dossier tabs.
- **Mid-Shift Autosave**: Progress across Nights 1–5 automatically saves to `localStorage` (`gate0.shift.v1`) and resumes seamlessly on reload.
- **ORD-OS Archive (`🏆 0/7`)**: Tracks all **7 Night-5 Self-Audit Endings** (with non-spoiler deduction hints) and **6 Forensic Interrogator Commendations** across runs.

---

## Repository Structure

```text
├── .github/workflows/
│   ├── ci.yml                    # Node 24 + pnpm automated typecheck, test & build gate
│   ├── pages.yml                 # Automatic GitHub Pages static deployment
│   └── tauri-release.yml         # Cross-platform Tauri v2 desktop bundler (Win / Mac / Steam Deck)
├── api/
│   └── rephrase.ts               # CORS-enabled Vercel Web API route for zero-leakage Flash rephrasing
├── docs/
│   ├── HANDOFF.md                # Current project progress, architecture & prioritized next steps
│   ├── GDD.md                    # Full v3.1 Game Design & Engineering Document
│   └── ORDAMOR_SPIKE.md          # Empirical benchmark & Ordamor schema alignment report
├── notebooks/
│   └── gate0_ai_video_studio.ipynb # One-click Colab studio (Google AI Studio Veo 3 + T4 GPU LTX-Video)
├── public/
│   ├── audio/                    # 300 studio neural intercom MP3 lines (zh / en / ja + Night 5 OP-09)
│   ├── portraits/                # 28 photorealistic 35mm AI cinema frames (idle + reactions + chamber)
│   ├── videos/                   # 28 live-action 1280x720 H.264 MP4 streams (100% full cast & chamber)
│   └── media-manifest.json       # 40+3 I2V video prompts + 300 trilingual intercom voice lines
├── scripts/
│   ├── sync-ordamor.ts           # Syncs pure-TS Persona Engine files from ../ordamor
│   ├── generate-media-pack.ts    # Exports media-manifest.json & runs Edge Neural / OpenAI TTS
│   ├── synthesize-edge-tts.py    # Character-cast trilingual neural TTS + FFmpeg radio mastering
│   ├── render-aistudio-web.mjs   # Zero-API-credit AI Studio web UI video renderer via ego-browser
│   ├── generate-videos.ts        # Batch-renders I2V .mp4 clips via Veo 3 / Kling 2.0 / Runway Gen-4
│   ├── pull-gdrive-videos.ts     # Syncs .mp4 clips from public@tfsharedspace.com Google Drive
│   └── push-gdrive-assets.ts     # Idempotently syncs videos & full asset zip to public@tfsharedspace.com Drive
├── src/
│   ├── ordamor/                  # Read-only synced upstream Ordamor v6 modules (Red Line 2)
│   ├── game/                     # Deterministic client engine + 8 survivors + Flash + storage
│   ├── server/                   # Shared server/Vite handler for /api/rephrase
│   └── ui/                       # React 19 + interactive video rig + onboarding + cryo-amber CSS
├── tauri/                        # Complete Tauri v2 Rust desktop crate + icons for Steam (<25 MB)
├── vercel.json                   # One-click Vercel SPA + Serverless API configuration
└── test/                         # Hermetic Vitest verification suite (7 test files / 21 tests)
```

## Syncing with `ordamor`

```bash
ORDAMOR_DIR=../ordamor pnpm sync:ordamor
pnpm test
```
