import { describe, expect, it } from "vitest";
import {
  SHIFT_EXCUSES,
  evaluateNight5Audit,
  resolveNight5Ending,
  type PlayerCompactProfile
} from "../src/game/night5.js";

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
});
