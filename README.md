# Quarantine Gate 0: 2036（零号隔离窗）

> **在线即开即玩 (GitHub Pages)**: https://evanzhousy.github.io/interactive-video-game/

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
pnpm dev             # Start local Vite dev server (includes /api/rephrase middleware)
pnpm media:manifest  # Export 40 I2V video prompts + 264 trilingual voice scripts -> public/media-manifest.json
pnpm media:tts       # Optional: batch-render studio .mp3 intercom voices (requires TTS_API_KEY)
pnpm test            # Run hermetic Vitest suite (Ordamor v6 + Stance + Flash + Media + UI)
pnpm build           # tsc --noEmit && vitest run && vite build -> dist/
```

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
├── .github/workflows/ci.yml      # Node 24 + pnpm automated typecheck, test & build gate
├── api/
│   └── rephrase.ts               # Vercel Web API route for zero-leakage Flash rephrasing
├── docs/
│   ├── GDD.md                    # Full v3.1 Game Design & Engineering Document
│   └── ORDAMOR_SPIKE.md          # Empirical benchmark & Ordamor schema alignment report
├── public/
│   ├── portraits/                # 8 survivor portraits + Operator #09 doppelgänger portrait
│   └── media-manifest.json       # 40 I2V video prompts + 264 trilingual intercom voice lines
├── scripts/
│   ├── sync-ordamor.ts           # Syncs pure-TS Persona Engine files from ../ordamor
│   └── generate-media-pack.ts    # Exports media-manifest.json & optional TTS batch renderer
├── src/
│   ├── ordamor/                  # Read-only synced upstream Ordamor v6 modules (Red Line 2)
│   ├── game/                     # Deterministic client engine + 8 survivors + Flash + storage
│   ├── server/                   # Shared server/Vite handler for /api/rephrase
│   └── ui/                       # React 19 + interactive video rig + cryo-amber Vanilla CSS
├── tauri/
│   └── tauri.conf.json           # Tauri v2 desktop wrapper blueprint for Steam (<25 MB)
├── vercel.json                   # One-click Vercel SPA + Serverless API configuration
└── test/                         # Hermetic Vitest verification suite (7 test files)
```

## Syncing with `ordamor`

```bash
ORDAMOR_DIR=../ordamor pnpm sync:ordamor
pnpm test
```
