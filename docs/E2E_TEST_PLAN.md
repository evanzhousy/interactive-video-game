# End-to-End (E2E) Browser Test Plan & Report v3.0 — `Quarantine Gate 0: 2036`

- **Tooling**: `ego-lite` (`ego-browser` Chromium live automation, `TaskSpace #145`)
- **Target Environment**: `https://quarantine-gate-0.vercel.app/` (Production deployment with GDD v3.1 mechanics, `@ui-sdk/react` primitives, **Isometric Engineering SVG Schematics & Tactical HUD (`Schematics.tsx`)**, collapsible System Console (`#sys-console-drawer`), View Transitions, `/api/rephrase` Vercel AI Gateway `google/gemini-3.8-flash`, 28 720p H.264 `.mp4` streams & 300 studio trilingual `.mp3` lines)
- **Executed At**: `2026-11-18` (`v3.0` Full Regression)
- **Overall Result**: ✅ **`15 / 15` End-to-End Test Cases PASSED (`0` JS Errors · `0` Console/A11y Warnings)**

---

## 1. Test Coverage Matrix (v3.0 — 15 End-to-End Cases)

| ID | Module / Layer | Scenario | Core Assertions | Result |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Boot & `@ui-sdk/select` | Production boot, custom `<Select>` trilingual switching (`en`/`ja`/`zh`) & zero console errors | `#lang-select` listbox switches localized controls (`UNSEAL` / `解放` / `放行`); `0` errors | ✅ PASS |
| **TC-02** | Night 0 & Isometric SVG | `<Progress>` (`0%→33%→67%→100%`), `<IsometricOutpostBanner>` SVG & `SAY` baseline card | `svg.iso-outpost-svg` depth marker moves `cy: 36 → 70 → 104`; `.audit-pipeline-strip` renders | ✅ PASS |
| **TC-03** | Night 1 Media & Guide | 3-step `OnboardingGuide` + `1280×720` `<video>` (`elena/idle.mp4`) + studio `.mp3` audio | `data-step="1"` → `"2"` → `"3"`; `readyState === 4` (`1280×720`); HTTP `200` (`35,399 B`) on `.mp3` | ✅ PASS |
| **TC-04** | HUD `<Meter>` & Hotkeys | Sensor/Turn `<Meter>`s, keyboard shortcuts (`S`/`T`/`1`/`]`/`[`) & fuel `aria-label` | Meters decrement `2→0` and `4→3`; tabs cycle `01 心智卡` ↔ `03 管线`; `Furnace fuel: 5` | ✅ PASS |
| **TC-05** | Topbar Motion & Sys Console | Motion pause toggle (`#btn-motion-toggle`) + System Console drawer (`#btn-sys-console`) | Motion toggles `暂停动效` ↔ `恢复动效`; `#sys-console-drawer` controls `#btn-voice-toggle` | ✅ PASS |
| **TC-06** | `<InputClear>` & Anti-Leak | Input clear button, visitor-aware axis preview & `/api/rephrase` zero identity leakage | `InputClear` wipes draft; preview hits `自保 vs 公平 (v-1)`; `3_llm_visible_input` has `0` leaks | ✅ PASS |
| **TC-07** | Flash Drawer & Health Probe | Expand `#flash-config-drawer` via `#sys-console-drawer`, check `/api/rephrase` gateway | Probe returns `READY · provider=vercel_ai_gateway · model=google/gemini-3.8-flash` | ✅ PASS |
| **TC-08** | Fuel Cost & `reload()` Save | `PURGE` deducts `1` fuel (`5 → 4`), sign shift log, advance to `V-02` & run `page.reload()` | Reload resumes directly at `CAM-01 // N1 · V-02 LEO SATO` (`轮机师`) with `4 FUEL` | ✅ PASS |
| **TC-09** | Demo Mode & `0` Fuel Brownout | Switch `#campaign-mode-select` to `demo` (`3 FUEL`), purge `V-01..V-03` → `-46°C` brownout | `V-03` renders `ordamor-arc-canvas` (`460×252`); `V-04` shows `0 FUEL`, `1/1` meter & `[! OVERDRAFT]` | ✅ PASS |
| **TC-10** | Demo Cliffhanger & Upgrade | Finish `V-04` in Demo → `#demo-cliffhanger-modal` (`operator09/idle.mp4`) → Carry Save Forward | Video `1280×720` + HUD SVG + intake quote recited; `#btn-demo-continue-full` enters `N2_SERUM` | ✅ PASS |
| **TC-11** | Inter-Night Crises & Schematics | `N2_SERUM`, Night 3 Storm, `N3_BRIBE` (`+2 FUEL`), Night 4 Boggart & `N4_COMMANDER` | `<IsometricCrisisGlyph>` & `<IsometricCrisisBanner>` SVGs render; `1 → 3 FUEL` & Boggart verified | ✅ PASS |
| **TC-12** | Night 5 HUD, Sub SVG & Toast | `<Night5HudOverlay>`, `<NautilusSubSchematic>`, 4-turn double interrogation & Toast copy | `n5_serum` lights pip (`CONTRADICTIONS EXPOSED: 1`); `nautilus-svg` renders; copy Toast visible | ✅ PASS |
| **TC-13** | `<Dialog>` Compendium & `Esc` | Open `#compendium-modal` (`role="dialog"`), verify unlocked cards & dismiss via `Escape` | Archive displays unlocked endings/commendations; `Escape` key unmounts dialog (`closedByEscape: true`) | ✅ PASS |
| **TC-14** | Daily Shift Seed Determinism | Switch to `daily` (`YYYY-MM-DD`) and reroll via `#sys-console-drawer` `#btn-reroll-shift` | `exactMatch: true` (`CAM-01 // N1 · V-02 LEO SATO` + identical `215ms` strobe across rerolls) | ✅ PASS |
| **TC-15** | `3/3` Deduction → Ending `D` | Genuine forensic deduction across `Quick Slice` (`V-01`, `V-04`, `V-07`) → Classified Memo | `nautilus-svg` shows `满编可启航 (1/1)✓ 医疗官` (`hasNoPhantomMechanic: true`); unlocks `[ORD-REDACTED-00]` | ✅ PASS |

---

## 2. Detailed v3.0 Live Execution Telemetry

### TC-01 · Boot & `@ui-sdk/select` Trilingual Switching (`en` / `ja` / `zh`)
- **Action**: Cleared `gate0.*` `localStorage`, reloaded bypassing cache (`Page.reload({ ignoreCache: true })`), opened `#lang-select` `[role="listbox"]`, and switched across all three locales.
- **Observed**:
  - `en`: `"[SW-01 // ADMIT] UNSEAL // ADMIT"`
  - `ja`: `"[SW-01 // ADMIT] 解放 // ADMIT"`
  - `zh`: `"[SW-01 // ADMIT] 放行 // ADMIT"`
  - Page errors & console warnings: `[]` (`0`).

### TC-02 · Night 0 `<Progress>` & `<IsometricOutpostBanner>` Engineering SVG
- **Action**: Answered all 3 Night 0 psychological baseline prompts (`rationalize` option `01`), sampling `[role="progressbar"]` `aria-valuenow` and `svg.iso-outpost-svg` depth node `cy`.
- **Observed**:
  - `progressTrack`: `["0", "33", "67", "100"]`
  - `isoDepthCy`: `["36", "70", "104"]` (live elevation tracking `0M → -60 → -180`)
  - `intakeDoneState`: `{ hasPipelineStrip: true, hasRationalize: true }`.

### TC-03 · Night 1 Onboarding Guide + `1280×720` `<video>` + Studio `.mp3`
- **Observed**: `onboarding-guide` `data-step="1"`, `elena/idle.mp4` decoded (`readyState: 4`, `1280x720`), `/audio/zh/elena/opening.mp3` returned HTTP `200` (`35,399` bytes).

### TC-04 · HUD `<Meter>` Gauges, Fuel `aria-label` & Tactical Keyboard Shortcuts
- **Observed**:
  - `#booth-fuel-pill` `aria-label`: `"Furnace fuel: 5"`;
  - Pressing `S`, `T`, `1` updated `[role="meter"]` values from `["2", "4"]` to `["0", "3"]`, advanced `onboarding-guide` to `data-step="2"`, and displayed specialist badge `"医疗官"`;
  - Pressing `]` twice switched active `[role="tab"]` to `"03 管线"`.

### TC-05 · Topbar Motion Toggle (`#btn-motion-toggle`) & Collapsible System Console (`#btn-sys-console`)
- **Observed**:
  - `#btn-motion-toggle` toggled cleanly between `"暂停动效"` and `"恢复动效"`;
  - `#btn-sys-console` expanded `#sys-console-drawer` (`AUDIO // COMMS`, `AI // BUS`, `SHIFT // OPS`), and `#btn-voice-toggle` `aria-pressed` flipped `"true" → "false" → "true"`.

### TC-06 · `<InputClear>`, Visitor-Aware Axis Preview & Zero Identity Leakage
- **Observed**:
  - `button[aria-label="清空提问"]` cleared `#custom-ask-input` to `""`;
  - Typing `"只剩最后一张床位，你到底救护工还是留给自己自保？"` previewed `"ORD-OS 预判检测轴：【自保 vs 公平 (v-1)】"`;
  - Pre-verdict inspector redacted stance (`preVerdictRedacted: true`), and post-verdict `3_llm_visible_input` keys were strictly `["speaker","role","persona_voice","question","canonical_line","stance","locale","max_sentences"]` (`leaksAny: false`).

### TC-07 · Flash Drawer & Live Vercel AI Gateway Probe
- **Observed**: Expanding `#flash-config-drawer` via `#sys-console-drawer` and probing `/api/rephrase` returned `"READY · provider=vercel_ai_gateway · model=google/gemini-3.8-flash"`.

### TC-08 · Purge Fuel Cost (`5 → 4 FUEL`) & `page.reload()` Mid-Shift Resume
- **Observed**: Pulling `#btn-purge` deducted `1` fuel (`4 FUEL`) and advanced onboarding to `data-step="3"`. After signing `V-01`'s shift log and reloading the browser at `V-02`, the session resumed directly at `"CAM-01 // N1 · V-02 LEO SATO"` (`4 FUEL`, `2/2 PWR`, specialist `"轮机师"`).

### TC-09 · Demo Mode (`3 FUEL`) & `-46°C` Cryo-Brownout (`0 FUEL → 1/1 PWR`)
- **Observed**: Switching `#campaign-mode-select` to `demo` initialized `3 FUEL`, rendered `ordamor-arc-canvas` (`460x252`) on Night 2 `V-03`, and after 3 purges triggered `#cryo-brownout-banner` (`"[! CRYO-BROWNOUT · 0 FUEL] 电容结霜 -> 1 PWR..."`), `1/1` power meter, and `"[SW-02 // INCINERATE] 净化 // PURGE [! OVERDRAFT]"` on `V-04`.

### TC-10 · Demo Cliffhanger (`#demo-cliffhanger-modal`) & Seamless Save Upgrade
- **Observed**: Completing `V-04` in Demo played `operator09/idle.mp4` (`1280x720`) with `<Night5HudOverlay>` SVG and recited the exact Night 0 intake quote; `#btn-demo-continue-full` upgraded seamlessly into Full Shift and opened `N2_SERUM`.

### TC-11 · Inter-Night Moral Crises + Isometric Crisis Schematics (`N2_SERUM` · `N3_BRIBE` · `N4_COMMANDER`)
- **Observed**:
  - `#crisis-modal` rendered `<IsometricCrisisGlyph>` + `<IsometricCrisisBanner>` SVGs (`svgCount: 4`) and `REC // ORD-OS DO TELEMETRY`;
  - Night 3 displayed `#night3-storm-banner`;
  - `N3_BRIBE` (`bribe_accept_rational`) replenished furnace fuel from `"1 FUEL"` to `"3 FUEL"` entering Night 4 `V-07`;
  - Night 4 unlocked `#disposal-requires-tag` and `boggart_trap` probes before `N4_COMMANDER` transitioned into `#night5-panel`.

### TC-12 · Night 5 HUD, `<NautilusSubSchematic>` SVG, 4-Turn Double Interrogation & Toast Copy
- **Observed**:
  - Firing `[data-n5-probe="n5_serum"]` exposed the `SAY/DO` contradiction, lighting `.n5-pip.exposed` (`exposedPips: 1`) and displaying `"CONTRADICTIONS EXPOSED: 1"`;
  - Firing `[data-n5-probe="n5_trivia"]` logged the `OFF-AXIS` static-memory warning;
  - `#n5-sub-readiness svg.nautilus-svg` rendered submarine hull bays (`hasNautilusSvg: true`);
  - Clicking `#btn-copy-report` changed button text to `"✓ 战报已复制"` and displayed the visible Toast `"值班战报已复制到剪贴板"` (`toastVisible: true`).

### TC-13 · `<Dialog>` Compendium Archive & `Escape` Key Dismissal
- **Observed**: `#compendium-modal` mounted with `role="dialog"` displaying unlocked endings/badges, and pressing `Escape` unmounted the dialog cleanly (`closedByEscape: true`).

### TC-14 · `Daily Shift (YYYY-MM-DD)` Determinism Across Rerolls
- **Observed**: After switching to `daily` and waiting for View Transition completion, rerolling via `#sys-console-drawer` `#btn-reroll-shift` kept the exact same seeded Night 1 slot (`CAM-01 // N1 · V-02 LEO SATO`) and identical strobe telemetry (`"[STROBE] 强光反射: 215ms [正常] · 冻得直吸鼻子"`, `exactMatch: true`).

### TC-15 · `3/3` Forensic Deduction in Quick Slice → `Ending D · Witness` & Classified Memo
- **Observed**:
  - Deduced `V-01`, `V-04`, and `V-07` from intercom stances (`3/3` zero errors) while signing `own_it` logs;
  - `<NautilusSubSchematic>` dynamically checked only spawned human roles (`"SUB // NAUTILUS-0 · -180M 满编可启航 (1/1) ✓ 医疗官 ... BERTH LOCK: DISENGAGE READY"`, `hasNoPhantomMechanic: true`);
  - Confessing the `SAY/DO` gap and purging the double triggered **`结局 D · 证人`** and unlocked `#n5-classified-memo` (`"[DECLASSIFIED] 已解锁最高机密电传 // [ORD-REDACTED-00 · 董事会与林德奎斯特专阅]"`).

---

## 3. Closed Defects & Regression Log

| ID | Summary | Fix Location | v3.0 Status |
| :--- | :--- | :--- | :--- |
| **E2E-BUG-01** | Dynamic submarine specialist bay check in shortened `slice` / `demo` rosters | `src/game/economy.ts`, `Schematics.tsx`, `Night5Audit.tsx` | ✅ Verified (`满编可启航 (1/1) ✓ 医疗官`) |
| **E2E-BUG-02** | Optimistic copy state + hidden `<textarea>` clipboard fallback + Toast feedback | `src/ui/components/Night5Audit.tsx` | ✅ Verified (`✓ 战报已复制` + Toast) |
| **E2E-BUG-03** | Explicit `aria-label` on `#booth-fuel-pill` `<TooltipTrigger>` | `src/ui/App.tsx` | ✅ Verified (`Furnace fuel: 5`, `0` warnings) |
