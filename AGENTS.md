# Repository Instructions (`quarantine-gate-0`)

- Work on `main` directly unless a branch or PR is explicitly requested.
- Run `pnpm build` (`tsc --noEmit && vitest run && vite build`) before committing significant changes.
- **Ordamor Three Red Lines** (inherited from `evanzhousy/ordamor/apps/README.md`):
  1. **Game state stays out of PersonaProfile**: Turn counters, mimic rolls, power bars, and endings live in `src/game/`, never inside `PersonaProfile`.
  2. **Never invent or rename value tokens or decision traits**: `src/ordamor/{constants,types,derive,crystal}.ts` are synced verbatim from `evanzhousy/ordamor/src/persona/` via `pnpm sync:ordamor`. All 13 `VALUE_TOKENS` (`self` / `bond` / `rule`) are closed.
  3. **Respect structural invariants (`schemaVersion: 6`)**: Every visitor `PersonaProfile` must pass `test/ordamor-invariants.test.ts` (`MIN_SIGNATURE_INSTANCES = 2`, `MIN_CORE_ORDERINGS = 2`, non-empty `refutedBy`, non-empty `justificationGap.neverWon`).
- **Anti-leakage boundary**: Never pass `isMimic` or `defectMode` into `LlmRephraseInput` (`buildRephraseInput` in `src/game/stance.ts`).
- **UI SDK (`@ui-sdk/react` + `@ui-sdk/core`)**: Import each component from its subpath entry (`@ui-sdk/react/<name>`). Before modifying UI components or composing custom primitives, consult `node_modules/@ui-sdk/react/docs/llms.txt` (and `docs/core.md` / `docs/rendering.md`).
