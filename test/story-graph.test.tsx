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

  it("maintains referential integrity across all 17 story nodes, edges, fallbacks, and prologue intake mapping", () => {
    const nodeIds = new Set(STORY_NODES.map((n) => n.id));
    expect(STORY_NODES.length).toBe(17);
    expect(nodeIds.size).toBe(17);

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
        choices: node.choices
      });
      expect(forbiddenJargon.test(serialized)).toBe(false);

      for (const ch of node.choices ?? []) {
        expect(nodeIds.has(ch.nextNodeId)).toBe(true);
      }
    }

    // Prologue 3 beats map 1:1 to INTAKE_QUESTIONS
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
    expect(p1Preload).toContain("./videos/story/prologue_02.mp4");
    expect(p1Preload).toContain("./videos/chamber/whiteout.mp4");

    const stats = getStoryCompletionStats(["prologue_01", "prologue_02", "unknown_node"]);
    expect(stats).toEqual({ unlockedCount: 2, totalCount: 17, percent: 12 });
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

    // Complete 3 Prologue movie choices & enter Booth -> Night 1 Elena Arrival Movie appears
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

    // Pick opening arrival choice (confront over intercom) -> plays Elena lip-sync defense clip -> enters V-01 booth
    await act(async () => {
      (document.querySelector('[data-story-choice="elena_open_intercom"]') as HTMLButtonElement).click();
    });
    expect(
      document.querySelector("#fmv-booth-overlay [data-story-node='n1_elena_react_intercom']")
    ).not.toBeNull();
    await act(async () => {
      (document.querySelector('[data-story-choice="elena_react_to_booth"]') as HTMLButtonElement).click();
    });
    expect(document.getElementById("fmv-booth-overlay")).toBeNull();
    expect(document.getElementById("chat-log")?.textContent).toContain("3 号舱");

    // Verdict ADMIT Elena -> sign log -> Next Visitor -> triggers Corridor Admit movie interlude -> Leo arrival -> Leo reaction clip!
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
    await act(async () => {
      (document.querySelector('[data-story-choice="leo_react_to_booth"]') as HTMLButtonElement).click();
    });
    expect(document.getElementById("fmv-booth-overlay")).toBeNull();
    expect(document.getElementById("main-booth")?.textContent).toContain("V-02");

    await act(async () => {
      root.unmount();
    });
  });
});
