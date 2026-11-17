# Quarantine Gate 0: 2036（零号隔离窗）

Claustrophobic Svalbard quarantine interrogation game (`-46°C`, 60–90 min short-form Steam title) powered by the **Ordamor Persona Engine (`schemaVersion: 6`)**.

Instead of spotting pixel anomalies on forged IDs, Operator `#09` interrogates survivors through double-glazed blast glass (4 PTT questions max) using their pre-outbreak **Ordamor Forensic Profile**:
- **Low-tier mimics** recite the host's flattering self-narrative (`justificationGap.neverWon`).
- **Mid-tier mimics** absorb the host's primary guilty memory (`v-1`), failing on secondary value collisions (`v-2`).
- **High-tier mimics** pass value orderings (`v-1`, `v-2`), exposing themselves only when you test their **Disposal Signature (`sig-1`)** or strip away its precondition via a **Boggart Trap (`disposalRequires`)**.
- **Night 5 Climax**: A doppelgänger wearing your face quotes your Night 0 `SAY` intake verbatim. Only your real `SAY / DO` gap in the shift logs proves you are human.

---

## Quick Start

Requires **Node.js 24+** and **pnpm**:

```bash
pnpm install
pnpm dev        # Start local Vite dev server
pnpm test       # Run hermetic Vitest suite (Ordamor v6 invariants + Stance + Night 5)
pnpm build      # tsc --noEmit && vitest run && vite build -> dist/
```

---

## Repository Structure

```text
├── docs/
│   ├── GDD.md                    # Full v3.1 Game Design & Engineering Document
│   └── ORDAMOR_SPIKE.md          # Empirical benchmark & Ordamor schema alignment report
├── public/portraits/             # Generated first-frame survivor portraits
├── scripts/
│   └── sync-ordamor.ts           # Syncs pure-TS Persona Engine files from ../ordamor
├── src/
│   ├── ordamor/                  # Read-only synced upstream Ordamor v6 modules (Red Line 2)
│   │   ├── constants.ts          # Exact 13 VALUE_TOKENS & 10 DECISION_TRAIT_FIELDS
│   │   ├── types.ts              # Canonical PersonaProfile (schemaVersion: 6)
│   │   ├── derive.ts             # justificationGap() -> neverWon & silent
│   │   ├── crystal.ts            # 3-family FACE_LAYOUT (self / bond / rule) & crystalChords()
│   │   └── escapes.ts            # Boggart escapeRoutes() over disposalRequires
│   ├── game/                     # Deterministic zero-latency client game engine
│   │   ├── visitors/             # V-01 Elena (N1), V-04 Marcus (N2), V-07 Lin Mei (N4)
│   │   ├── intent.ts             # Multilingual question classifier & axis preview
│   │   ├── stance.ts             # Progressive mimic stance engine + LLM anti-leakage sanitizer
│   │   └── night5.ts             # Night 0 intake, crew quota, and 7-ending resolver
│   └── ui/                       # React 19 + industrial cryo-amber Vanilla CSS booth UI
├── tauri/
│   └── tauri.conf.json           # Tauri v2 desktop wrapper blueprint for Steam (<25 MB)
└── test/                         # Hermetic Vitest verification suite
```

## Syncing with `ordamor`

This standalone repository is completely decoupled from `ordamor.com`'s Vercel deployment while staying byte-identical with Ordamor's schema:

```bash
ORDAMOR_DIR=../ordamor pnpm sync:ordamor
pnpm test
```
