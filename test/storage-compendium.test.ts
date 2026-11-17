// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { SHIFT_EXCUSES } from "../src/game/night5.js";
import {
  clearSavedShift,
  loadCompendium,
  loadSavedShift,
  recordRunCompletion,
  saveShiftState
} from "../src/game/storage.js";

describe("Mid-Shift Autosave & 7-Ending / 6-Achievement Compendium Persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves, restores, and clears mid-shift state cleanly", () => {
    expect(loadSavedShift()).toBeNull();

    saveShiftState({
      version: 1,
      savedAt: "2026-11-17T00:00:00Z",
      lang: "zh",
      campaignMode: "full",
      stage: "booth",
      baseline: { sig: "own_it", kept: "truth", dropped: "status" },
      intakeAnswers: [],
      rolls: [{ visitorId: "V-01", isMimic: true, defectMode: "LOW_SELF_NARRATIVE" }],
      visitorIdx: 4,
      history: [
        { visitorId: "V-01", decision: "PURGE", wasMimic: true, excuse: SHIFT_EXCUSES[0]! }
      ],
      boggartUsedIds: ["V-07"]
    });

    const loaded = loadSavedShift();
    expect(loaded).not.toBeNull();
    expect(loaded?.visitorIdx).toBe(4);
    expect(loaded?.history).toHaveLength(1);
    expect(loaded?.boggartUsedIds).toEqual(["V-07"]);

    clearSavedShift();
    expect(loadSavedShift()).toBeNull();
  });

  it("unlocks endings and forensic achievements deterministically across runs", () => {
    const initial = loadCompendium();
    expect(initial.unlockedEndings).toHaveLength(0);

    const perfectHistory = [
      { visitorId: "V-01", decision: "PURGE" as const, wasMimic: true, excuse: SHIFT_EXCUSES[0]! },
      { visitorId: "V-02", decision: "ADMIT" as const, wasMimic: false, excuse: SHIFT_EXCUSES[0]! },
      { visitorId: "V-03", decision: "PURGE" as const, wasMimic: true, excuse: SHIFT_EXCUSES[0]! },
      { visitorId: "V-04", decision: "ADMIT" as const, wasMimic: false, excuse: SHIFT_EXCUSES[0]! },
      { visitorId: "V-05", decision: "ADMIT" as const, wasMimic: false, excuse: SHIFT_EXCUSES[0]! },
      { visitorId: "V-06", decision: "PURGE" as const, wasMimic: true, excuse: SHIFT_EXCUSES[0]! },
      { visitorId: "V-07", decision: "ADMIT" as const, wasMimic: false, excuse: SHIFT_EXCUSES[0]! },
      { visitorId: "V-08", decision: "PURGE" as const, wasMimic: true, excuse: SHIFT_EXCUSES[0]! }
    ];

    const { next, newlyUnlockedAchievements } = recordRunCompletion({
      current: initial,
      ending: "D",
      campaignMode: "full",
      history: perfectHistory,
      boggartUsedIds: ["V-08"]
    });

    expect(next.completedRuns).toBe(1);
    expect(next.unlockedEndings).toContain("D");
    expect(newlyUnlockedAchievements).toEqual(
      expect.arrayContaining([
        "FIRST_SHIFT",
        "BOGGART_HUNTER",
        "STORM_SURVIVOR",
        "COLD_TRUTH_ANA",
        "ZERO_ERROR_WITNESS"
      ])
    );

    const reloaded = loadCompendium();
    expect(reloaded.unlockedEndings).toContain("D");
    expect(reloaded.unlockedAchievements).toContain("BOGGART_HUNTER");
  });
});
