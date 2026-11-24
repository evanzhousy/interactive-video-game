// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";
import {
  CAST_VISUAL_ASSETS,
  LOOK_DEV_SWATCHES,
  STUDIO_STORYBOARD_SHOTS
} from "../src/game/production-board.js";
import { getStoryNode } from "../src/game/story-graph.js";
import { App } from "../src/ui/App.js";

describe("Production Studio (Visual Asset Board + Storyboard + Three.js 3D Blocking)", () => {
  beforeEach(() => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
    document.body.innerHTML = '<div id="root"></div>';
    HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  it("maintains cast visual/voice assets and links every storyboard shot to a valid story node and 3D rig", () => {
    expect(CAST_VISUAL_ASSETS.length).toBe(9);
    expect(LOOK_DEV_SWATCHES.length).toBe(4);
    expect(STUDIO_STORYBOARD_SHOTS.length).toBe(17);

    const lipSyncShots = STUDIO_STORYBOARD_SHOTS.filter((s) => s.hasNativeAudio);
    expect(lipSyncShots.length).toBe(8);

    for (const cast of CAST_VISUAL_ASSETS) {
      expect(cast.portraitSrc).toBeTruthy();
      expect(cast.voiceSeedSrc).toMatch(/\.mp3$/);
    }

    for (const shot of STUDIO_STORYBOARD_SHOTS) {
      expect(getStoryNode(shot.storyNodeId)).toBeDefined();
      expect(shot.blocking.camera.pos.length).toBe(3);
      expect(shot.blocking.camera.target.length).toBe(3);
      expect(shot.blocking.actors.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("renders Asset Board, Storyboard, and Three.js Blocking Stage cleanly and jumps to selected story node", async () => {
    const container = document.getElementById("root")!;
    const root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });

    await act(async () => {
      (document.getElementById("btn-lobby-studio") as HTMLButtonElement).click();
    });

    const studio = document.getElementById("production-studio-view");
    expect(studio).not.toBeNull();
    expect(document.querySelectorAll("[data-cast-asset]").length).toBe(9);

    // Switch to Storyboard tab
    await act(async () => {
      (document.getElementById("tab-studio-storyboard") as HTMLButtonElement).click();
    });
    expect(document.querySelectorAll("[data-storyboard-shot]").length).toBe(17);

    // Switch to 3D Blocking Stage tab
    await act(async () => {
      (document.getElementById("tab-studio-blocking") as HTMLButtonElement).click();
    });
    expect(document.querySelectorAll("[data-blocking-shot]").length).toBe(17);
    await act(async () => {
      (document.querySelector('[data-blocking-shot="shot_elena_arrival"]') as HTMLButtonElement).click();
    });
    expect(document.getElementById("production-studio-view")?.textContent).toContain("50mm Anamorphic");

    // Return to Lobby cleanly
    await act(async () => {
      (document.getElementById("btn-studio-back") as HTMLButtonElement).click();
    });
    expect(document.getElementById("lobby-screen")).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
  });
});
