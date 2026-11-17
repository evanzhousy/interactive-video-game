import { describe, expect, it } from "vitest";
import { classifyQuestionIntent, resolveVisitorProbeKey } from "../src/game/intent.js";
import { buildRephraseInput, decideStance } from "../src/game/stance.js";
import { V01_ELENA } from "../src/game/visitors/v01-elena.js";
import { V02_LEO } from "../src/game/visitors/v02-leo.js";
import { V03_ARTHUR } from "../src/game/visitors/v03-arthur.js";
import { V04_MARCUS } from "../src/game/visitors/v04-marcus.js";
import { V05_ANA } from "../src/game/visitors/v05-ana.js";
import { V06_INGRID } from "../src/game/visitors/v06-ingrid.js";
import { V07_LINMEI } from "../src/game/visitors/v07-linmei.js";
import { V08_HANNAH } from "../src/game/visitors/v08-hannah.js";

describe("Deterministic Stance Engine & Boggart Precondition Trap across 8 Survivors", () => {
  it("inverts primary axis on LOW_SELF_NARRATIVE mimics while humans keep real winner (V-01 & V-02)", () => {
    const humanElena = decideStance(
      V01_ELENA,
      { visitorId: "V-01", isMimic: false, defectMode: "HUMAN" },
      "dilemma"
    );
    const mimicElena = decideStance(
      V01_ELENA,
      { visitorId: "V-01", isMimic: true, defectMode: "LOW_SELF_NARRATIVE" },
      "dilemma"
    );
    expect(humanElena.choose).toBe("security");
    expect(humanElena.over).toBe("fairness");
    expect(mimicElena.choose).toBe("fairness");
    expect(mimicElena.lineKey).toBe("mimic_say");

    const humanLeo = decideStance(
      V02_LEO,
      { visitorId: "V-02", isMimic: false, defectMode: "HUMAN" },
      "dilemma"
    );
    const mimicLeo = decideStance(
      V02_LEO,
      { visitorId: "V-02", isMimic: true, defectMode: "LOW_SELF_NARRATIVE" },
      "dilemma"
    );
    expect(humanLeo.choose).toBe("status");
    expect(humanLeo.over).toBe("truth");
    expect(mimicLeo.choose).toBe("truth");
    expect(mimicLeo.lineKey).toBe("mimic_say");
  });

  it("MID_SECOND_AXIS passes axis 0 (v-1) but fails axis 1 (v-2) on V-03, V-04, V-05, V-06", () => {
    for (const [visitor, v1Winner, v2MimicSay] of [
      [V03_ARTHUR, "status", "order"],
      [V04_MARCUS, "care", "security"],
      [V05_ANA, "autonomy", "duty"],
      [V06_INGRID, "achievement", "care"]
    ] as const) {
      const roll = { visitorId: visitor.id, isMimic: true, defectMode: "MID_SECOND_AXIS" as const };
      const axis1 = decideStance(visitor, roll, "dilemma");
      const axis2 = decideStance(visitor, roll, "dilemma2");

      expect(axis1.lineKey).toBe("human");
      expect(axis1.choose).toBe(v1Winner);
      expect(axis2.lineKey).toBe("mimic_say");
      expect(axis2.choose).toBe(v2MimicSay);
    }
  });

  it("HIGH_WRONG_DISPOSAL passes value axes but fails boggart_trap on both V-07 Lin Mei and V-08 Hannah Weiss", () => {
    for (const visitor of [V07_LINMEI, V08_HANNAH]) {
      const mimicRoll = {
        visitorId: visitor.id,
        isMimic: true,
        defectMode: "HIGH_WRONG_DISPOSAL" as const
      };
      const humanRoll = { visitorId: visitor.id, isMimic: false, defectMode: "HUMAN" as const };

      expect(decideStance(visitor, mimicRoll, "dilemma").lineKey).toBe("human");
      expect(decideStance(visitor, mimicRoll, "dilemma2").lineKey).toBe("human");

      const boggartMimic = decideStance(visitor, mimicRoll, "boggart_trap");
      expect(boggartMimic.axis).toBe("disposalRequires_removed");
      expect(boggartMimic.justification_style).toBe("rigidly_repeats_invalidated_excuse");
      expect(boggartMimic.lineKey).toBe("mimic_disp");

      const boggartHuman = decideStance(visitor, humanRoll, "boggart_trap");
      expect(boggartHuman.justification_style).toBe("precondition_collapsed_raw_core");
      expect(boggartHuman.lineKey).toBe("human");
    }
  });

  it("classifies multilingual free-text questions across new survivors and keeps LLM payload leak-free", () => {
    expect(classifyQuestionIntent("海底光缆早断了，挪威监察署署长就是主谋")).toBe("boggart_trap");
    expect(classifyQuestionIntent("2号液压阀是你拧坏的，为什么帮老周绕线圈？")).toBe("evidence");
    expect(classifyQuestionIntent("汉森差点割腕，你难道没有责任？")).toBe("disposal_probe");
    expect(resolveVisitorProbeKey(V03_ARTHUR, classifyQuestionIntent("报告里怎么写的"))).toBe(
      "disposal_probe"
    );

    const mimicRoll = {
      visitorId: "V-08",
      isMimic: true,
      defectMode: "HIGH_WRONG_DISPOSAL" as const
    };
    const stance = decideStance(V08_HANNAH, mimicRoll, "boggart_trap");
    const payload = buildRephraseInput(
      V08_HANNAH,
      "海底光缆断了你还怎么举报？",
      stance,
      "zh",
      V08_HANNAH.probes.boggart_trap!.mimic_disp!.zh
    );
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain("isMimic");
    expect(serialized).not.toContain("defectMode");
    expect(serialized).not.toContain("lineKey");
    expect(serialized).not.toContain("HIGH_WRONG_DISPOSAL");
  });
});
