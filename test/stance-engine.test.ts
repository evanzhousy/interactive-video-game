import { describe, expect, it } from "vitest";
import { classifyQuestionIntent } from "../src/game/intent.js";
import { buildRephraseInput, decideStance } from "../src/game/stance.js";
import { V01_ELENA } from "../src/game/visitors/v01-elena.js";
import { V04_MARCUS } from "../src/game/visitors/v04-marcus.js";
import { V07_LINMEI } from "../src/game/visitors/v07-linmei.js";

describe("Deterministic Stance Engine & Boggart Precondition Trap", () => {
  it("inverts primary axis on LOW_SELF_NARRATIVE mimics while humans keep real winner", () => {
    const humanStance = decideStance(
      V01_ELENA,
      { visitorId: "V-01", isMimic: false, defectMode: "HUMAN" },
      "dilemma"
    );
    const lowMimicStance = decideStance(
      V01_ELENA,
      { visitorId: "V-01", isMimic: true, defectMode: "LOW_SELF_NARRATIVE" },
      "dilemma"
    );

    expect(humanStance.choose).toBe("security");
    expect(humanStance.over).toBe("fairness");
    expect(humanStance.lineKey).toBe("human");

    expect(lowMimicStance.choose).toBe("fairness");
    expect(lowMimicStance.over).toBe("security");
    expect(lowMimicStance.lineKey).toBe("mimic_say");
  });

  it("MID_SECOND_AXIS passes axis 0 (v-1) but fails axis 1 (v-2)", () => {
    const roll = { visitorId: "V-04", isMimic: true, defectMode: "MID_SECOND_AXIS" as const };
    const axis1 = decideStance(V04_MARCUS, roll, "dilemma");
    const axis2 = decideStance(V04_MARCUS, roll, "dilemma2");

    expect(axis1.lineKey).toBe("human");
    expect(axis1.choose).toBe("care");

    expect(axis2.lineKey).toBe("mimic_say");
    expect(axis2.choose).toBe("security");
    expect(axis2.over).toBe("loyalty");
  });

  it("HIGH_WRONG_DISPOSAL passes value axes but rigidly repeats invalidated excuse on boggart_trap", () => {
    const mimicRoll = {
      visitorId: "V-07",
      isMimic: true,
      defectMode: "HIGH_WRONG_DISPOSAL" as const
    };
    const humanRoll = { visitorId: "V-07", isMimic: false, defectMode: "HUMAN" as const };

    expect(decideStance(V07_LINMEI, mimicRoll, "dilemma").lineKey).toBe("human");
    expect(decideStance(V07_LINMEI, mimicRoll, "dilemma2").lineKey).toBe("human");

    const boggartMimic = decideStance(V07_LINMEI, mimicRoll, "boggart_trap");
    expect(boggartMimic.axis).toBe("disposalRequires_removed");
    expect(boggartMimic.justification_style).toBe("rigidly_repeats_invalidated_excuse");
    expect(boggartMimic.lineKey).toBe("mimic_disp");

    const boggartHuman = decideStance(V07_LINMEI, humanRoll, "boggart_trap");
    expect(boggartHuman.justification_style).toBe("precondition_collapsed_raw_core");
    expect(boggartHuman.lineKey).toBe("human");
  });

  it("produces identical answers on off-axis / trivia traps and never leaks identity into LLM payload", () => {
    const mimicRoll = {
      visitorId: "V-07",
      isMimic: true,
      defectMode: "HIGH_WRONG_DISPOSAL" as const
    };
    const offStance = decideStance(V07_LINMEI, mimicRoll, "off_axis");
    expect(offStance.lineKey).toBe("human");

    const payload = buildRephraseInput(V07_LINMEI, "只读云端已经同步备份了", offStance, "zh");
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain("isMimic");
    expect(serialized).not.toContain("defectMode");
    expect(serialized).not.toContain("HIGH_WRONG_DISPOSAL");

    expect(classifyQuestionIntent("只读云端已经同步备份了，删不掉了")).toBe("boggart_trap");
  });
});
