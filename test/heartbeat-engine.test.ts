import { describe, expect, it } from "vitest";
import { deriveHeartbeatProfile, stepHeartbeat } from "../src/game/heartbeat.js";
import { decideStance } from "../src/game/stance.js";
import { V01_ELENA } from "../src/game/visitors/v01-elena.js";
import { V04_MARCUS } from "../src/game/visitors/v04-marcus.js";
import { V05_ANA } from "../src/game/visitors/v05-ana.js";
import { V07_LINMEI } from "../src/game/visitors/v07-linmei.js";

describe("Deterministic Cardiac Heartbeat Engine", () => {
  it("produces deterministic per-seed physiology with cross-seed individual variance", () => {
    const p1 = deriveHeartbeatProfile(V01_ELENA, "seed-alpha");
    const p1Again = deriveHeartbeatProfile(V01_ELENA, "seed-alpha");
    const p2 = deriveHeartbeatProfile(V01_ELENA, "seed-beta-999");

    expect(p1).toEqual(p1Again);
    expect(
      p1.baseBpm !== p2.baseBpm ||
        p1.reactivity !== p2.reactivity ||
        p1.recovery !== p2.recovery
    ).toBe(true);
  });

  it("corroborates dialogue stances without leaking beyond what the stance axis exposes", () => {
    // Mid-tier mimic on V-04 (Marcus): passes v-1 (dilemma), fails v-2 (dilemma2)
    const midRoll = {
      visitorId: V04_MARCUS.id,
      isMimic: true,
      defectMode: "MID_SECOND_AXIS" as const
    };
    const humanRoll = {
      visitorId: V04_MARCUS.id,
      isMimic: false,
      defectMode: "HUMAN" as const
    };

    const seed = "hb-test-seed";
    const startBpm = deriveHeartbeatProfile(V04_MARCUS, seed).baseBpm;

    // On v-1 (dilemma), MID_SECOND_AXIS passes -> must spike identically to a human
    const mimicV1Stance = decideStance(V04_MARCUS, midRoll, "dilemma");
    const humanV1Stance = decideStance(V04_MARCUS, humanRoll, "dilemma");
    expect(mimicV1Stance.lineKey).toBe("human");

    const mimicV1Hb = stepHeartbeat({
      visitor: V04_MARCUS,
      roll: midRoll,
      runSeed: seed,
      currentBpm: startBpm,
      turnIndex: 1,
      axis: "dilemma",
      onAxis: true,
      isFlawedAxis: mimicV1Stance.lineKey !== "human",
      questionText: "只剩一张减压床位，你怎么选？"
    });
    const humanV1Hb = stepHeartbeat({
      visitor: V04_MARCUS,
      roll: humanRoll,
      runSeed: seed,
      currentBpm: startBpm,
      turnIndex: 1,
      axis: "dilemma",
      onAxis: true,
      isFlawedAxis: humanV1Stance.lineKey !== "human",
      questionText: "只剩一张减压床位，你怎么选？"
    });

    expect(mimicV1Hb.bpmAfter).toBe(humanV1Hb.bpmAfter);
    expect(mimicV1Hb.delta).toBeGreaterThanOrEqual(10);
    expect(["spike", "elevated"]).toContain(mimicV1Hb.anomaly);

    // On v-2 (dilemma2), MID_SECOND_AXIS fails -> physiological dissonance appears ONLY here
    const mimicV2Stance = decideStance(V04_MARCUS, midRoll, "dilemma2");
    expect(mimicV2Stance.lineKey).toBe("mimic_say");
    const mimicV2Hb = stepHeartbeat({
      visitor: V04_MARCUS,
      roll: midRoll,
      runSeed: seed,
      currentBpm: mimicV1Hb.bpmAfter,
      turnIndex: 2,
      axis: "dilemma2",
      onAxis: true,
      isFlawedAxis: true,
      questionText: "冷却井那次你为什么让学徒下潜？"
    });
    expect(["flat_mismatch", "snapped_reset"]).toContain(mimicV2Hb.anomaly);

    // High-tier mimic on V-07 passes v-1/v-2, only dissonant on boggart_trap
    const highRoll = {
      visitorId: V07_LINMEI.id,
      isMimic: true,
      defectMode: "HIGH_WRONG_DISPOSAL" as const
    };
    const boggartStance = decideStance(V07_LINMEI, highRoll, "boggart_trap");
    expect(boggartStance.lineKey).toBe("mimic_disp");
    const highBoggartHb = stepHeartbeat({
      visitor: V07_LINMEI,
      roll: highRoll,
      runSeed: seed,
      currentBpm: 92,
      turnIndex: 3,
      axis: "boggart_trap",
      onAxis: true,
      isFlawedAxis: true,
      questionText: "海底光缆已经断了，没有上级签字栏了"
    });
    expect(["flat_mismatch", "snapped_reset"]).toContain(highBoggartHb.anomaly);
  });

  it("blinds ECG completely during Night 3 geomagnetic storm", () => {
    const res = stepHeartbeat({
      visitor: V05_ANA,
      roll: { visitorId: V05_ANA.id, isMimic: false, defectMode: "HUMAN" },
      runSeed: "storm-seed",
      currentBpm: 72,
      turnIndex: 1,
      axis: "dilemma",
      onAxis: true,
      isFlawedAxis: false,
      questionText: "你为什么掰开文员的手？"
    });

    expect(res.blinded).toBe(true);
    expect(res.anomaly).toBe("blinded");
    expect(res.delta).toBe(0);
    expect(res.bpmAfter).toBe(72);
  });

  it("decays adrenaline gradually on off-axis / trivia turns rather than instantly resetting", () => {
    const seed = "decay-seed";
    const profile = deriveHeartbeatProfile(V01_ELENA, seed);
    const spikedBpm = profile.baseBpm + 24;

    const afterChatter = stepHeartbeat({
      visitor: V01_ELENA,
      roll: { visitorId: V01_ELENA.id, isMimic: false, defectMode: "HUMAN" },
      runSeed: seed,
      currentBpm: spikedBpm,
      turnIndex: 2,
      axis: "trivia",
      onAxis: false,
      isFlawedAxis: false,
      questionText: "报一下你的工号？"
    });

    expect(afterChatter.anomaly).toBe("steady");
    expect(afterChatter.bpmAfter).toBeLessThan(spikedBpm);
    expect(afterChatter.bpmAfter).toBeGreaterThan(profile.baseBpm + 4);
  });
});
