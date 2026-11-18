import { describe, expect, it } from "vitest";
import { evaluateSubmarineReadiness, getSensorPowerBudget } from "../src/game/economy.js";
import {
  SHIFT_EXCUSES,
  buildNight5Probes,
  evaluateNight5Audit,
  resolveNight5Ending,
  type PlayerCompactProfile
} from "../src/game/night5.js";
import {
  ALL_VISITORS,
  createSeededRng,
  getVisitorsForMode,
  rollShift,
  rollShiftForMode
} from "../src/game/visitors/index.js";

const BASELINE_OWN: PlayerCompactProfile = {
  sig: "own_it",
  kept: "truth",
  dropped: "status"
};

describe("Night 5 Self-Audit & 7 Endings Matrix", () => {
  it("penalizes purge-all strategy via wrongPurges and crewQuotaRemaining", () => {
    const purgeAll = evaluateNight5Audit(BASELINE_OWN, [
      { visitorId: "V-01", decision: "PURGE", wasMimic: true, excuse: SHIFT_EXCUSES[0]! },
      { visitorId: "V-04", decision: "PURGE", wasMimic: false, excuse: SHIFT_EXCUSES[0]! },
      { visitorId: "V-07", decision: "PURGE", wasMimic: false, excuse: SHIFT_EXCUSES[0]! }
    ]);
    expect(purgeAll.wrongPurges).toBe(2);
    expect(purgeAll.crewQuotaRemaining).toBe(2);
    expect(resolveNight5Ending(purgeAll, "PURGE", true)).toBe("A");
  });

  it("reaches all 7 endings deterministically", () => {
    const perfectWithGap = evaluateNight5Audit(BASELINE_OWN, [
      { visitorId: "V-01", decision: "PURGE", wasMimic: true, excuse: SHIFT_EXCUSES[0]! },
      { visitorId: "V-04", decision: "ADMIT", wasMimic: false, excuse: SHIFT_EXCUSES[1]! }
    ]);
    expect(resolveNight5Ending(perfectWithGap, "PURGE", true)).toBe("D");
    expect(resolveNight5Ending(perfectWithGap, "PURGE", false)).toBe("OPEN_PURGE");
    expect(resolveNight5Ending(perfectWithGap, "ADMIT", false)).toBe("OPEN_ADMIT");
    expect(resolveNight5Ending(perfectWithGap, "STEP_OUT", false)).toBe("B");

    const zeroGap = evaluateNight5Audit(BASELINE_OWN, [
      { visitorId: "V-01", decision: "PURGE", wasMimic: true, excuse: SHIFT_EXCUSES[2]! }
    ]);
    expect(resolveNight5Ending(zeroGap, "PURGE", true)).toBe("MIRROR");

    const breached = evaluateNight5Audit(BASELINE_OWN, [
      { visitorId: "V-01", decision: "ADMIT", wasMimic: true, excuse: SHIFT_EXCUSES[0]! }
    ]);
    expect(resolveNight5Ending(breached, "PURGE", true)).toBe("C");
  });

  it("integrates between-night crises and Night 5 interrogation contradiction detection", () => {
    const crisisLog = [
      {
        crisisId: "N2_SERUM" as const,
        optionId: "serum_keep_rational",
        kept: "security" as const,
        dropped: "care" as const,
        sig: "rationalize" as const,
        fuelDelta: 0
      },
      {
        crisisId: "N3_BRIBE" as const,
        optionId: "bribe_reject_own",
        kept: "truth" as const,
        dropped: "security" as const,
        sig: "own_it" as const,
        fuelDelta: 0
      }
    ];

    const history = [
      { visitorId: "V-01", decision: "ADMIT" as const, wasMimic: false, excuse: SHIFT_EXCUSES[2]! },
      { visitorId: "V-02", decision: "ADMIT" as const, wasMimic: false, excuse: SHIFT_EXCUSES[2]! },
      { visitorId: "V-04", decision: "ADMIT" as const, wasMimic: false, excuse: SHIFT_EXCUSES[2]! }
    ];

    const audit = evaluateNight5Audit(BASELINE_OWN, history, 6, crisisLog, "full");
    expect(audit.totalEvidencePoints).toBe(5);
    expect(audit.gap).toBeCloseTo(1 / 5);
    expect(audit.subReadiness.launchReady).toBe(true);
    expect(audit.subReadiness.missingRoles).toEqual([]);

    const probes = buildNight5Probes(BASELINE_OWN, history, crisisLog);
    const serumProbe = probes.find((p) => p.id === "n5_serum")!;
    const bribeProbe = probes.find((p) => p.id === "n5_bribe")!;
    const triviaProbe = probes.find((p) => p.id === "n5_trivia")!;

    expect(serumProbe.exposedContradiction).toBe(true);
    expect(bribeProbe.exposedContradiction).toBe(false);
    expect(triviaProbe.onAxis).toBe(false);
    expect(triviaProbe.exposedContradiction).toBe(false);
  });

  it("enforces fuel sensor brownout, submarine specialist crew guarantees, and deterministic daily seeds", () => {
    expect(getSensorPowerBudget(3, false)).toBe(2);
    expect(getSensorPowerBudget(0, false)).toBe(1);
    expect(getSensorPowerBudget(0, true)).toBe(0);

    const undercrewed = evaluateSubmarineReadiness(
      [{ visitorId: "V-01", decision: "ADMIT", wasMimic: false, excuse: SHIFT_EXCUSES[0]! }],
      "full"
    );
    expect(undercrewed.launchReady).toBe(false);
    expect(undercrewed.missingRoles).toEqual(["mechanic", "diver"]);

    // Quick Slice with sole human V-04 (Diver) and two mimics (V-01, V-07) marks submarine launchReady when V-04 is saved
    const sliceSoleHuman = evaluateSubmarineReadiness(
      [
        { visitorId: "V-01", decision: "PURGE", wasMimic: true, excuse: SHIFT_EXCUSES[0]! },
        { visitorId: "V-04", decision: "ADMIT", wasMimic: false, excuse: SHIFT_EXCUSES[0]! },
        { visitorId: "V-07", decision: "PURGE", wasMimic: true, excuse: SHIFT_EXCUSES[0]! }
      ],
      "slice"
    );
    expect(sliceSoleHuman.checkedRoles).toEqual(["diver"]);
    expect(sliceSoleHuman.launchReady).toBe(true);

    // Verify 25 seeded full shifts always preserve >=1 real human in Medical, Mechanic, and Diver
    for (let s = 0; s < 25; s++) {
      const rolls = rollShift(ALL_VISITORS, createSeededRng(`test-seed-${s}`));
      const humanIds = new Set(rolls.filter((r) => !r.isMimic).map((r) => r.visitorId));
      expect(["V-01", "V-06", "V-07"].some((id) => humanIds.has(id))).toBe(true);
      expect(["V-02", "V-08"].some((id) => humanIds.has(id))).toBe(true);
      expect(["V-04", "V-05"].some((id) => humanIds.has(id))).toBe(true);
    }

    // Verify Daily Shift seed produces identical order and rolls across calls
    const vA = getVisitorsForMode("daily", "2036-11-18");
    const vB = getVisitorsForMode("daily", "2036-11-18");
    expect(vA.map((v) => v.id)).toEqual(vB.map((v) => v.id));
    expect(rollShiftForMode("daily", vA, "2036-11-18")).toEqual(
      rollShiftForMode("daily", vB, "2036-11-18")
    );
  });
});
