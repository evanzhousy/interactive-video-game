// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";
import {
  buildShotExportPackage,
  CAST_VISUAL_ASSETS,
  LOOK_DEV_SWATCHES,
  PROP_VISUAL_ASSETS,
  resolveAssetByTag,
  SET_VISUAL_ASSETS,
  STUDIO_STORYBOARD_SHOTS
} from "../src/game/production-board.js";
import { getStoryNode } from "../src/game/story-graph.js";
import { renderShotWhiteboxSnapshot } from "../src/game/three-whitebox-renderer.js";
import { App } from "../src/ui/App.js";

describe("Production Studio (Visual Asset Board + Storyboard + Three.js 3D Blocking)", () => {
  beforeEach(() => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
    document.body.innerHTML = '<div id="root"></div>';
    HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  it("maintains cast/prop/set asset bible, resolves @tags, and links every storyboard shot to a valid story node and 3D rig", () => {
    expect(CAST_VISUAL_ASSETS.length).toBe(9);
    expect(PROP_VISUAL_ASSETS.length).toBe(6);
    expect(SET_VISUAL_ASSETS.length).toBe(4);
    expect(LOOK_DEV_SWATCHES.length).toBe(4);
    expect(STUDIO_STORYBOARD_SHOTS.length).toBe(25);

    const lipSyncShots = STUDIO_STORYBOARD_SHOTS.filter((s) => s.hasNativeAudio);
    expect(lipSyncShots.length).toBe(8);

    const expectedCastTags = [
      "@op09",
      "@elena",
      "@leo",
      "@arthur",
      "@marcus",
      "@ana",
      "@ingrid",
      "@linmei",
      "@hannah"
    ];
    for (const tag of expectedCastTags) {
      const resolved = resolveAssetByTag(tag);
      expect(resolved?.kind).toBe("cast");
      expect(resolved?.promptAnchor.length).toBeGreaterThan(10);
    }

    for (const cast of CAST_VISUAL_ASSETS) {
      expect(cast.assetTag).toMatch(/^@[a-z0-9_]+$/);
      expect(cast.promptAnchor.length).toBeGreaterThan(10);
      expect(cast.portraitSrc).toBeTruthy();
      expect(cast.voiceSeedSrc).toMatch(/\.mp3$/);
      expect(resolveAssetByTag(cast.assetTag)?.kind).toBe("cast");
    }

    for (const prop of PROP_VISUAL_ASSETS) {
      expect(prop.assetTag).toMatch(/^@[a-z0-9_]+$/);
      expect(prop.promptAnchor.length).toBeGreaterThan(10);
      expect(resolveAssetByTag(prop.assetTag)?.kind).toBe("prop");
    }

    for (const setAsset of SET_VISUAL_ASSETS) {
      expect(setAsset.assetTag).toMatch(/^@[a-z0-9_]+$/);
      expect(setAsset.previewSrc).toMatch(/^\.\/portraits\/.+\.jpg$/);
      expect(setAsset.promptAnchor.length).toBeGreaterThan(10);
      expect(resolveAssetByTag(setAsset.assetTag)?.kind).toBe("set");
    }

    expect(resolveAssetByTag("@nonexistent_tag")).toBeUndefined();

    for (const shot of STUDIO_STORYBOARD_SHOTS) {
      expect(getStoryNode(shot.storyNodeId)).toBeDefined();
      expect(shot.blocking.camera.pos.length).toBe(3);
      expect(shot.blocking.camera.target.length).toBe(3);
      expect(shot.blocking.actors.length).toBeGreaterThanOrEqual(1);
      expect(shot.boundAssetTags.length).toBeGreaterThanOrEqual(1);
      expect(["static", "dolly_in", "pan", "handheld", "pull_back"]).toContain(shot.motionPreset);

      for (const tag of shot.boundAssetTags) {
        expect(resolveAssetByTag(tag)).toBeDefined();
      }
      for (const prop of shot.blocking.props ?? []) {
        expect(resolveAssetByTag(prop.assetTag)?.kind).toBe("prop");
        expect(prop.pos.length).toBe(3);
      }
    }
  });

  it("builds complete ShotExportPackage with camera override and safely handles headless white-box snapshot rendering", () => {
    const elenaShot = STUDIO_STORYBOARD_SHOTS.find((s) => s.id === "shot_elena_arrival")!;
    expect(elenaShot).toBeDefined();

    const pkg = buildShotExportPackage(elenaShot, "en");
    expect(pkg.shotCode).toBe(elenaShot.shotCode);
    expect(pkg.shotId).toBe(elenaShot.id);
    expect(pkg.aspectRatio).toBe("16:9");
    expect(pkg.lens).toBe(elenaShot.blocking.camera.lensLabel);
    expect(pkg.fov).toBe(elenaShot.blocking.camera.fov);
    expect(pkg.motionPreset).toBe(elenaShot.motionPreset);
    expect(pkg.cameraPos).toEqual(elenaShot.blocking.camera.pos);
    expect(pkg.cameraTarget).toEqual(elenaShot.blocking.camera.target);
    expect(pkg.boundAssets.length).toBe(elenaShot.boundAssetTags.length);
    expect(pkg.lipSyncLine).toBe(elenaShot.lipSyncLine?.en);
    expect(pkg.promptText).toContain("@elena");
    expect(pkg.promptText).toContain(elenaShot.shotCode);

    const parsed = JSON.parse(pkg.jsonString) as Record<string, unknown>;
    expect(parsed.shotCode).toBe(elenaShot.shotCode);
    expect(parsed.aspectRatio).toBe("16:9");

    const overriddenPkg = buildShotExportPackage(elenaShot, "zh", {
      fov: 24,
      lensLabel: "85mm Anamorphic f/2.0",
      pos: [0.1, 1.5, 1.1],
      target: [0, 1.45, -0.7]
    });
    expect(overriddenPkg.fov).toBe(24);
    expect(overriddenPkg.lens).toBe("85mm Anamorphic f/2.0");
    expect(overriddenPkg.cameraPos).toEqual([0.1, 1.5, 1.1]);
    expect(overriddenPkg.cameraTarget).toEqual([0, 1.45, -0.7]);

    // In HappyDOM (no WebGL context), renderShotWhiteboxSnapshot must return null without throwing
    expect(() => renderShotWhiteboxSnapshot(elenaShot, { renderMode: "clay" })).not.toThrow();
    expect(renderShotWhiteboxSnapshot(elenaShot, { renderMode: "clay" })).toBeNull();
    expect(renderShotWhiteboxSnapshot(elenaShot, { renderMode: "depth" })).toBeNull();
    expect(renderShotWhiteboxSnapshot(elenaShot, { renderMode: "lit" })).toBeNull();
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
    expect(document.querySelectorAll("[data-storyboard-shot]").length).toBe(25);

    // Switch to 3D Blocking Stage tab
    await act(async () => {
      (document.getElementById("tab-studio-blocking") as HTMLButtonElement).click();
    });
    expect(document.querySelectorAll("[data-blocking-shot]").length).toBe(25);
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
