// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";
import { INTAKE_QUESTIONS } from "../src/game/night5.js";
import { loadCompendium, recordStoryProgress } from "../src/game/storage.js";
import {
  PROLOGUE_NODE_IDS,
  STORY_EDGES,
  STORY_NODES,
  getPreloadVideoUrls,
  getStoryCompletionStats,
  getStoryNode
} from "../src/game/story-graph.js";
import { App } from "../src/ui/App.js";

describe("Interactive Movie Story Graph & Flowchart Persistence", () => {
  beforeEach(() => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
    document.body.innerHTML = '<div id="root"></div>';
    HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  it("maintains referential integrity across all 32 story nodes, multi-clip segments, edges, fallbacks, and prologue intake mapping", () => {
    const nodeIds = new Set(STORY_NODES.map((n) => n.id));
    expect(STORY_NODES.length).toBe(32);
    expect(nodeIds.size).toBe(32);

    for (const edge of STORY_EDGES) {
      expect(nodeIds.has(edge.from)).toBe(true);
      expect(nodeIds.has(edge.to)).toBe(true);
    }

    const forbiddenJargon = /(claude|indexeddb|ordamor|neverwon|disposalrequires|ismimic)/i;

    for (const node of STORY_NODES) {
      expect(node.fallbackVideoSrc).toBeTruthy();
      expect(node.fallbackPosterSrc).toBeTruthy();
      const serialized = JSON.stringify({
        title: node.title,
        subtitle: node.subtitle,
        speaker: node.speaker,
        choices: node.choices,
        clips: node.clips
      });
      expect(forbiddenJargon.test(serialized)).toBe(false);

      for (const ch of node.choices ?? []) {
        expect(nodeIds.has(ch.nextNodeId)).toBe(true);
        // Every non-side-quest numbered movie choice must keep the player in Cinema Mode
        if (!ch.isSideQuest) {
          expect(ch.sideQuestVisitorId).toBeUndefined();
          expect(getStoryNode(ch.nextNodeId)?.kind).not.toBe("interrogation");
        }
      }
      for (const seg of node.clips ?? []) {
        expect(seg.videoSrc).toBeTruthy();
        expect(seg.fallbackVideoSrc).toBeTruthy();
      }
    }

    // Episode 0 slow-burn prologue: zero mimic spoilers in prologue_01/02, big reveal in prologue_03
    expect(getStoryNode("prologue_01")!.clips?.length).toBe(4);
    expect(getStoryNode("prologue_02")!.clips?.length).toBe(2);
    expect(getStoryNode("prologue_03")!.clips?.length).toBe(3);
    const p1Text = JSON.stringify({
      title: getStoryNode("prologue_01")!.title,
      subtitle: getStoryNode("prologue_01")!.subtitle,
      clips: getStoryNode("prologue_01")!.clips
    });
    expect(p1Text).not.toMatch(/伪人|mimic/i);
    expect(getStoryNode("prologue_03")!.clips?.some((c) => c.id === "prequel_op08_warning")).toBe(true);

    expect(getStoryNode("n1_elena_arrival")!.clips?.length).toBe(2);
    expect(getStoryNode("n1_leo_aftermath")!.clips?.length).toBe(2);
    expect(getStoryNode("ending_dawn_break")!.clips?.length).toBe(2);
    expect(getStoryNode("n1_leo_react_toolbox")).toBeDefined();

    // Every native-SFX Hollywood clip must be unmuted with isLipSync: false
    const nativeSfxClipIds = [
      ["prologue_01", "prequel_icecore_breach"],
      ["n1_elena_arrival", "fb_elena_cabin3"],
      ["n1_corridor_purge", "n1_elena_outcome_purge"],
      ["n1_leo_arrival", "fb_leo_powerbay"],
      ["n1_leo_aftermath", "n1_cliffhanger_shadow"],
      ["ending_eternal_seal", "end_b_purge_blast"],
      ["ending_mirror_assimilation", "end_c_shadow"]
    ] as const;
    for (const [nodeId, clipId] of nativeSfxClipIds) {
      const seg = getStoryNode(nodeId)?.clips?.find((c) => c.id === clipId);
      expect(seg?.hasAudio).toBe(true);
      expect(seg?.isLipSync).toBe(false);
    }

    // All 7 Nights 2-5 speaking scenes wire studio voiceCue files
    for (const spokenId of [
      "n2_arthur_standoff",
      "n2_marcus_clash",
      "n3_storm_blackout",
      "n3_ana_betrayal",
      "n4_linmei_conspiracy",
      "n4_hannah_whistle",
      "n5_final_mirror"
    ]) {
      expect(getStoryNode(spokenId)?.voiceCue).toBeDefined();
    }
    expect(PROLOGUE_NODE_IDS.length).toBe(INTAKE_QUESTIONS.length);
    PROLOGUE_NODE_IDS.forEach((nodeId, idx) => {
      const node = getStoryNode(nodeId);
      expect(node).toBeDefined();
      expect(node!.choices?.length).toBe(INTAKE_QUESTIONS[idx]!.options.length);
      node!.choices?.forEach((ch, cIdx) => {
        expect(ch.intakeOptionIndex).toBe(cIdx);
      });
    });

    const p1Preload = getPreloadVideoUrls(getStoryNode("prologue_01")!);
    expect(p1Preload).toContain("./videos/story/ep0_crew_dinner.mp4");
    expect(p1Preload).toContain("./videos/story/ep0_lonely_watch.mp4");
    expect(p1Preload).toContain("./videos/story/prologue_02.mp4");

    const stats = getStoryCompletionStats(["prologue_01", "prologue_02", "unknown_node"]);
    expect(stats).toEqual({ unlockedCount: 2, totalCount: 32, percent: 6 });
  });

  it("deduplicates and persists unlocked story nodes and edges in compendium state", () => {
    const c0 = loadCompendium();
    expect(c0.unlockedStoryNodes).toEqual([]);

    const c1 = recordStoryProgress(c0, ["prologue_01", "prologue_02"], ["e_p1_p2"]);
    expect(c1.unlockedStoryNodes).toEqual(["prologue_01", "prologue_02"]);
    expect(c1.visitedStoryEdges).toEqual(["e_p1_p2"]);

    // Repeating same nodes/edges returns same object reference without redundant writes
    const c1Dup = recordStoryProgress(c1, ["prologue_01"], ["e_p1_p2"]);
    expect(c1Dup).toBe(c1);

    const reloaded = loadCompendium();
    expect(reloaded.unlockedStoryNodes).toEqual(["prologue_01", "prologue_02"]);
    expect(reloaded.visitedStoryEdges).toEqual(["e_p1_p2"]);
  });

  it("plays Night 1 arrival & corridor branching overlays and opens Story Flowchart jump menu", async () => {
    const container = document.getElementById("root")!;
    const root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    // Open Story Flowchart directly from Lobby
    await act(async () => {
      (document.getElementById("btn-lobby-storymap") as HTMLButtonElement).click();
    });
    expect(document.getElementById("story-flowchart-modal")).not.toBeNull();
    expect(
      document.querySelector('[data-flowchart-node="prologue_01"]')?.getAttribute("data-unlocked")
    ).toBe("true");
    expect(
      document.querySelector('[data-flowchart-node="n1_corridor_admit"]')?.getAttribute("data-unlocked")
    ).toBe("false");

    // Jump straight into Prologue beat 01 from Story Flowchart
    await act(async () => {
      (document.querySelector('[data-jump-node="prologue_01"]') as HTMLButtonElement).click();
    });
    expect(document.getElementById("story-flowchart-modal")).toBeNull();
    expect(document.getElementById("intake-panel")?.getAttribute("data-step")).toBe("1");

    // Complete 3 Prologue movie choices (verifying multi-clip playlist advancement on SC-00A) & enter Booth
    expect(
      document.querySelector('[data-story-node="prologue_01"]')?.getAttribute("data-clip-id")
    ).toBe("ep0_heli_arrival");
    await act(async () => {
      (document.getElementById("btn-fmv-next-clip") as HTMLButtonElement).click();
    });
    expect(
      document.querySelector('[data-story-node="prologue_01"]')?.getAttribute("data-clip-id")
    ).toBe("ep0_crew_dinner");

    for (let i = 0; i < 3; i++) {
      await act(async () => {
        (document.querySelector(".option-card") as HTMLButtonElement).click();
      });
    }
    await act(async () => {
      (document.getElementById("btn-start-shift") as HTMLButtonElement).click();
    });

    expect(
      document.querySelector("#fmv-booth-overlay [data-story-node='n1_elena_arrival']")
    ).not.toBeNull();
    expect(
      document
        .querySelector("#fmv-booth-overlay [data-story-node='n1_elena_arrival']")
        ?.getAttribute("data-clip-id")
    ).toBe("fb_elena_cabin3");

    // Pick opening arrival choice (confront over intercom) -> plays Elena lip-sync defense clip -> enters V-01 booth
    await act(async () => {
      (document.querySelector('[data-story-choice="elena_open_intercom"]') as HTMLButtonElement).click();
    });
    expect(
      document.querySelector("#fmv-booth-overlay [data-story-node='n1_elena_react_intercom']")
    ).not.toBeNull();
    expect(document.querySelector('[data-story-choice="elena_react_admit"]')).not.toBeNull();
    expect(document.querySelector('[data-story-choice="elena_react_purge"]')).not.toBeNull();
    await act(async () => {
      (document.querySelector('[data-story-choice="elena_react_to_booth"]') as HTMLButtonElement).click();
    });
    expect(document.getElementById("fmv-booth-overlay")).toBeNull();
    expect(document.getElementById("chat-log")?.textContent).toContain("3 号舱");

    // Verdict ADMIT Elena -> sign log -> Next Visitor -> triggers Corridor Admit outcome montage -> Leo arrival -> 1-click Purge!
    await act(async () => {
      (document.getElementById("btn-admit") as HTMLButtonElement).click();
    });
    await act(async () => {
      (document.querySelector("#shift-log-box .option-card") as HTMLButtonElement).click();
    });
    await act(async () => {
      (document.getElementById("btn-next-visitor") as HTMLButtonElement).click();
    });
    expect(
      document.querySelector("#fmv-booth-overlay [data-story-node='n1_corridor_admit']")
    ).not.toBeNull();

    await act(async () => {
      (document.querySelector('[data-story-choice="corridor_lock_medbay"]') as HTMLButtonElement).click();
    });
    expect(
      document.querySelector("#fmv-booth-overlay [data-story-node='n1_leo_arrival']")
    ).not.toBeNull();

    await act(async () => {
      (document.querySelector('[data-story-choice="leo_open_intercom"]') as HTMLButtonElement).click();
    });
    expect(
      document.querySelector("#fmv-booth-overlay [data-story-node='n1_leo_react_intercom']")
    ).not.toBeNull();

    // Test 1-click direct verdict inside movie choice deck -> leads straight into Night 1 finale shadow cliffhanger!
    await act(async () => {
      (document.querySelector('[data-story-choice="leo_react_purge"]') as HTMLButtonElement).click();
    });
    expect(
      document.querySelector("#fmv-booth-overlay [data-story-node='n1_leo_aftermath']")
    ).not.toBeNull();
    expect(
      document
        .querySelector("#fmv-booth-overlay [data-story-node='n1_leo_aftermath']")
        ?.getAttribute("data-clip-id")
    ).toBe("n1_leo_outcome_purge");
    expect(document.getElementById("booth-fuel-pill")?.textContent).toContain("4 FUEL");

    await act(async () => {
      (document.querySelector('[data-story-choice="n1_aftermath_continue"]') as HTMLButtonElement).click();
    });
    expect(
      document.querySelector("#fmv-booth-overlay [data-story-node='n2_arthur_standoff']")
    ).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
  });

  it("supports complete zero-minigame 5-night movie playthrough to Ending A and optional side-quest booth detour + Lobby Challenge Mode", async () => {
    const container = document.getElementById("root")!;
    let root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    // Click primary Watch Interactive Film CTA
    await act(async () => {
      (document.getElementById("btn-lobby-start") as HTMLButtonElement).click();
    });
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        (document.querySelector(".option-card") as HTMLButtonElement).click();
      });
    }
    await act(async () => {
      (document.getElementById("btn-start-shift") as HTMLButtonElement).click();
    });

    const clickChoice = async (choiceId: string) => {
      await act(async () => {
        const el = document.querySelector(`[data-story-choice="${choiceId}"]`) as HTMLButtonElement;
        expect(el).not.toBeNull();
        el.click();
      });
    };

    // Pure movie path across Nights 1 -> 5 without ever playing booth minigame (including Leo option 02 toolbox close-up!)
    await clickChoice("elena_open_intercom");
    await clickChoice("elena_react_admit");
    await clickChoice("corridor_lock_medbay");
    await clickChoice("leo_open_thermal");
    expect(
      document.querySelector("#fmv-booth-overlay [data-story-node='n1_leo_react_toolbox']")
    ).not.toBeNull();
    await clickChoice("leo_toolbox_admit");
    await clickChoice("n1_aftermath_continue");
    await clickChoice("n2_arthur_trust");
    await clickChoice("n2_marcus_purge");
    await clickChoice("n3_ana_admit");
    await clickChoice("n3_ingrid_admit");
    await clickChoice("n4_linmei_purge");
    await clickChoice("n4_hannah_admit");
    await clickChoice("n5_choose_dawn");

    // Verify new bespoke reshoot assets and corrected Night 3-5 / Ending D invariants
    const allAssetsJson = JSON.stringify(STORY_NODES);
    for (const expectedVideo of [
      "./videos/story/ending_a_sub_escape.mp4",
      "./videos/story/ending_a_dawn_icebreak.mp4",
      "./videos/story/ending_b_entombed_station.mp4",
      "./videos/story/ending_c_mirror_door.mp4",
      "./videos/story/ending_d_op09_tape.mp4",
      "./videos/story/ending_d_dawn_logbook.mp4",
      "./videos/story/n1_corridor_aftermath_admit.mp4",
      "./videos/story/n1_corridor_aftermath_purge.mp4"
    ]) {
      expect(allAssetsJson).toContain(expectedVideo);
    }
    expect(getStoryNode("ending_lone_watch")!.videoSrc).not.toContain("prequel_op08_warning");
    expect(getStoryNode("n2_arthur_standoff")!.subtitle.zh).toContain("应急附则第 4 条");
    expect(getStoryNode("n3_ana_betrayal")!.subtitle.zh).toContain("高压减压舱");
    expect(getStoryNode("n3_storm_blackout")!.subtitle.zh).toContain("索尔伯格医生");

    expect(
      document.querySelector("#fmv-booth-overlay [data-story-node='ending_dawn_break']")
    ).not.toBeNull();
    expect(document.getElementById("fmv-ending-card")).not.toBeNull();
    expect(loadCompendium().unlockedEndings).toContain("A");

    // Verify optional side-quest booth detour + return to movie
    await act(async () => {
      (document.getElementById("btn-ending-storymap") as HTMLButtonElement).click();
    });
    await act(async () => {
      (document.querySelector('[data-jump-node="n2_arthur_standoff"]') as HTMLButtonElement).click();
    });
    await clickChoice("n2_arthur_side_audit");
    expect(document.getElementById("fmv-booth-overlay")).toBeNull();
    expect(document.getElementById("btn-return-movie")).not.toBeNull();
    expect(document.getElementById("main-booth")?.textContent).toContain("V-03");

    await act(async () => {
      (document.getElementById("btn-return-movie") as HTMLButtonElement).click();
    });
    expect(
      document.querySelector("#fmv-booth-overlay [data-story-node='n2_marcus_clash']")
    ).not.toBeNull();

    // Unmount, clear storage, and verify Lobby Challenge Mode opens V-01 booth directly
    await act(async () => {
      root.unmount();
    });
    window.localStorage.clear();
    document.body.innerHTML = '<div id="root"></div>';
    root = createRoot(document.getElementById("root")!);
    await act(async () => {
      root.render(<App />);
    });
    await act(async () => {
      (document.getElementById("btn-lobby-challenge") as HTMLButtonElement).click();
    });
    expect(document.getElementById("fmv-booth-overlay")).toBeNull();
    expect(document.getElementById("main-booth")?.textContent).toContain("V-01");

    await act(async () => {
      root.unmount();
    });
  });
});
