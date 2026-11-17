import { describe, expect, it } from "vitest";
import { VALUE_I18N } from "../src/game/i18n.js";
import { INTAKE_QUESTIONS, SHIFT_EXCUSES } from "../src/game/night5.js";
import { PERSONA_SCHEMA_VERSION } from "../src/game/profile-helper.js";
import { VISITORS } from "../src/game/visitors/index.js";
import {
  DECISION_TRAIT_FIELDS,
  FACE_LAYOUT,
  MIN_CORE_ORDERINGS,
  MIN_SIGNATURE_INSTANCES,
  VALUE_LABELS,
  VALUE_TOKENS,
  canonicalValuePair,
  crystalChords,
  escapeRoutes,
  isValueToken,
  justificationGap
} from "../src/ordamor/index.js";

describe("Ordamor schemaVersion 6 & Three Red Lines invariants", () => {
  it("keeps the closed 13 VALUE_TOKENS and FACE_LAYOUT intact", () => {
    expect(VALUE_TOKENS).toHaveLength(13);
    expect(Object.keys(VALUE_I18N).sort()).toEqual([...VALUE_TOKENS].sort());
    expect(FACE_LAYOUT.map((f) => f.token).sort()).toEqual([...VALUE_TOKENS].sort());
    for (const token of VALUE_TOKENS) {
      expect(VALUE_I18N[token].zh).toBe(VALUE_LABELS[token]);
    }
  });

  it("uses only canonical VALUE_TOKENS across Night 0 intake and shift excuses", () => {
    for (const ex of SHIFT_EXCUSES) {
      expect(isValueToken(ex.kept)).toBe(true);
      expect(isValueToken(ex.dropped)).toBe(true);
    }
    for (const q of INTAKE_QUESTIONS) {
      for (const opt of q.options) {
        expect(isValueToken(opt.kept)).toBe(true);
        expect(isValueToken(opt.dropped)).toBe(true);
      }
    }
  });

  it("enforces PersonaProfile v6 floors, justificationGap, crystalChords, and escapeRoutes on every visitor", () => {
    for (const v of VISITORS) {
      const p = v.profile;
      expect(p.schemaVersion).toBe(PERSONA_SCHEMA_VERSION);
      expect(p.lens).toBe("forensic");
      expect(Object.keys(p.decisionProfile).sort()).toEqual([...DECISION_TRAIT_FIELDS].sort());

      const obsIds = new Set(p.observations.map((o) => o.id));
      const ordIds = new Set(p.valueOrderings.map((o) => o.id));
      expect(p.valueOrderings.length).toBeGreaterThanOrEqual(MIN_CORE_ORDERINGS);

      for (const ord of p.valueOrderings) {
        expect(ord.pair).toEqual(canonicalValuePair(ord.pair[0], ord.pair[1]));
        expect(ord.pair).toContain(ord.winner);
        expect(ord.disposalRequires.trim().length).toBeGreaterThan(0);
        expect(ord.evidence.length).toBeGreaterThan(0);
        for (const evId of ord.evidence) {
          expect(obsIds.has(evId)).toBe(true);
        }
      }

      for (const sig of p.disposalSignatures) {
        expect(sig.instances.length).toBeGreaterThanOrEqual(MIN_SIGNATURE_INSTANCES);
        for (const inst of sig.instances) {
          expect(ordIds.has(inst)).toBe(true);
        }
      }

      for (const core of p.coreThreads) {
        expect(core.orderings.length).toBeGreaterThanOrEqual(MIN_CORE_ORDERINGS);
        expect(core.refutedBy.trim().length).toBeGreaterThan(0);
        for (const oid of core.orderings) {
          expect(ordIds.has(oid)).toBe(true);
        }
      }

      const gap = justificationGap(p);
      expect(gap).not.toBeNull();
      expect(gap!.neverWon.length).toBeGreaterThan(0);
      expect(gap!.silent.length).toBeGreaterThan(0);

      const chords = crystalChords(p);
      expect(chords.length).toBe(p.valueOrderings.length);

      const routes = escapeRoutes(p);
      expect(routes.some((r) => r.kind === "ordering" && Boolean(r.needs))).toBe(true);
    }
  });
});
