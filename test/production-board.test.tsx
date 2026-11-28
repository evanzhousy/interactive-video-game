// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";
import {
  buildShotExportPackage,
  CAST_VISUAL_ASSETS,
  getStoryboardShot,
  LOOK_DEV_SWATCHES,
  PROP_VISUAL_ASSETS,
  resolveAssetByTag,
  sampleShotBlockingAtTime,
  SET_VISUAL_ASSETS,
  STUDIO_STORYBOARD_SHOTS
} from "../src/game/production-board.js";
import {
  applyDirectorDecision,
  computeKanbanStats,
  createDirectorDecision,
  createKanbanIssue,
  DEFAULT_DIRECTOR_DECISIONS,
  DEFAULT_KANBAN_ISSUES,
  filterKanbanIssues,
  KANBAN_COLUMNS,
  moveKanbanIssue,
  parseKanbanImport,
  reopenDirectorDecision,
  serializeKanbanExport,
  type DirectorDecision,
  type KanbanIssue
} from "../src/game/production-kanban.js";
import { getStoryNode } from "../src/game/story-graph.js";
import {
  renderShotStartEndSnapshots,
  renderShotWhiteboxSnapshot
} from "../src/game/three-whitebox-renderer.js";
import {
  handleStudioStateWebRequest,
  type StudioSqlRunner
} from "../src/server/studio-state-handler.js";
import { App } from "../src/ui/App.js";
import { InternalHubApp } from "../src/ui/components/InternalHubApp.js";

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
    expect(STUDIO_STORYBOARD_SHOTS.length).toBe(27);

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
      expect(["static", "dolly_in", "pan", "handheld", "pull_back", "oner"]).toContain(shot.motionPreset);

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

    // In HappyDOM (no WebGL context), renderShotWhiteboxSnapshot & renderShotStartEndSnapshots must return null without throwing
    expect(() => renderShotWhiteboxSnapshot(elenaShot, { renderMode: "clay" })).not.toThrow();
    expect(renderShotWhiteboxSnapshot(elenaShot, { renderMode: "clay" })).toBeNull();
    expect(renderShotWhiteboxSnapshot(elenaShot, { renderMode: "depth" })).toBeNull();
    expect(renderShotWhiteboxSnapshot(elenaShot, { renderMode: "lit" })).toBeNull();

    const startEnd = renderShotStartEndSnapshots(elenaShot);
    expect(startEnd).toEqual({
      clayStart: null,
      clayEnd: null,
      depthStart: null,
      depthEnd: null,
      litStart: null,
      litEnd: null
    });
  });

  it("samples multi-beat Oner camera/actor trajectories, Cheat Points, and export packages cleanly", () => {
    const n1Oner = STUDIO_STORYBOARD_SHOTS.find((s) => s.id === "shot_oner_n1_corridor_booth")!;
    const n5Oner = STUDIO_STORYBOARD_SHOTS.find((s) => s.id === "shot_oner_n5_mirror_approach")!;
    expect(n1Oner).toBeDefined();
    expect(n5Oner).toBeDefined();
    expect(n1Oner.pipelineRoute).toBe("fl2va_keyframes");
    expect(n5Oner.pipelineRoute).toBe("v2v_whitebox");

    for (const oner of [n1Oner, n5Oner]) {
      const beats = oner.blocking.beats ?? [];
      expect(beats.length).toBeGreaterThanOrEqual(3);
      expect(beats[0]!.startSec).toBe(0);
      expect(beats[beats.length - 1]!.endSec).toBeCloseTo(oner.durationSec, 2);
      expect(beats.some((b) => Boolean(b.cheatPoint))).toBe(true);

      const startSample = sampleShotBlockingAtTime(oner, 0);
      const midSample = sampleShotBlockingAtTime(oner, oner.durationSec / 2);
      const endSample = sampleShotBlockingAtTime(oner, oner.durationSec);

      expect(startSample.activeBeatIndex).toBe(0);
      expect(midSample.activeBeatIndex).toBe(1);
      expect(endSample.activeBeatIndex).toBe(beats.length - 1);
      expect(endSample.camera.pos).toEqual(oner.blocking.endCamera?.pos);

      const pkg = buildShotExportPackage(oner, "en");
      expect(pkg.pipelineRoute).toBe(oner.pipelineRoute);
      expect(pkg.endCameraPos).toEqual(oner.blocking.endCamera?.pos);
      expect(pkg.beats?.length).toBe(beats.length);
      expect(pkg.promptText).toContain("Beats & Cheat Points");
    }

    // Legacy non-beat dolly_in shot synthesizes subtle motion without mutating source
    const dollyShot = STUDIO_STORYBOARD_SHOTS.find((s) => s.motionPreset === "dolly_in" && !s.blocking.beats)!;
    expect(dollyShot).toBeDefined();
    const origPos = [...dollyShot.blocking.camera.pos];
    const dollyEnd = sampleShotBlockingAtTime(dollyShot, dollyShot.durationSec);
    expect(dollyEnd.camera.pos).not.toEqual(origPos);
    expect(dollyShot.blocking.camera.pos).toEqual(origPos);
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
    expect(document.querySelectorAll("[data-storyboard-shot]").length).toBe(27);

    // Switch to 3D Blocking Stage tab
    await act(async () => {
      (document.getElementById("tab-studio-blocking") as HTMLButtonElement).click();
    });
    expect(document.querySelectorAll("[data-blocking-shot]").length).toBe(27);
    await act(async () => {
      (document.querySelector('[data-blocking-shot="shot_elena_arrival"]') as HTMLButtonElement).click();
    });
    expect(document.getElementById("production-studio-view")?.textContent).toContain("50mm Anamorphic");

    // Select Oner shot, click Beat 2 (with Cheat Point), and switch view modes
    await act(async () => {
      (document.querySelector('[data-blocking-shot="shot_oner_n1_corridor_booth"]') as HTMLButtonElement).click();
    });
    expect(document.querySelectorAll("[data-beat-id]").length).toBe(3);
    await act(async () => {
      (document.querySelector('[data-beat-id="beat_n1_2"]') as HTMLButtonElement).click();
    });
    expect(document.getElementById("production-studio-view")?.textContent).toContain("Cheat Point");
    await act(async () => {
      (document.getElementById("btn-three-top") as HTMLButtonElement).click();
      (document.getElementById("btn-three-follow") as HTMLButtonElement).click();
      (document.getElementById("btn-three-pov") as HTMLButtonElement).click();
    });

    // Return to Lobby cleanly
    await act(async () => {
      (document.getElementById("btn-studio-back") as HTMLButtonElement).click();
    });
    expect(document.getElementById("lobby-screen")).not.toBeNull();

    await act(async () => {
      root.unmount();
    });
  });

  it("validates Linear Kanban model, persistence serialization, and standalone InternalHubApp 3-page navigation", async () => {
    const colIds = new Set(KANBAN_COLUMNS.map((c) => c.id));
    const seenIds = new Set<string>();
    for (const issue of DEFAULT_KANBAN_ISSUES) {
      expect(seenIds.has(issue.id)).toBe(false);
      seenIds.add(issue.id);
      expect(colIds.has(issue.status)).toBe(true);
      if (issue.linkedShotId) {
        expect(getStoryboardShot(issue.linkedShotId)).toBeDefined();
      }
      for (const tag of issue.linkedAssetTags ?? []) {
        expect(resolveAssetByTag(tag)).toBeDefined();
      }
    }

    const moved = moveKanbanIssue(DEFAULT_KANBAN_ISSUES, "G0-07", "shipped");
    expect(moved.find((i) => i.id === "G0-07")?.status).toBe("shipped");

    const created = createKanbanIssue(moved, {
      title: "Test Oner Previz",
      status: "previz",
      priority: "high",
      chapter: "ONER",
      owner: "Cinematographer",
      route: "fl2va_keyframes",
      linkedShotId: "shot_oner_n1_corridor_booth"
    });
    expect(created.length).toBe(DEFAULT_KANBAN_ISSUES.length + 1);
    expect(created[0]?.custom).toBe(true);

    const filtered = filterKanbanIssues(
      created,
      { query: "SC-ONER-N1", chapter: "ONER", owner: "ALL", route: "ALL" },
      "en"
    );
    expect(filtered.some((i) => i.id === "G0-07")).toBe(true);

    const stats = computeKanbanStats(created);
    expect(stats.total).toBe(created.length);
    expect(stats.totalShots).toBeGreaterThan(200);

    const json = serializeKanbanExport(created);
    const parsed = parseKanbanImport(json);
    expect(parsed?.length).toBe(created.length);
    expect(parseKanbanImport("invalid")).toBeNull();

    // Standalone InternalHubApp UI: 3 primary pages + deep-link from Kanban card G0-07 into 3D Pre-viz
    const container = document.getElementById("root")!;
    const root = createRoot(container);

    await act(async () => {
      root.render(<InternalHubApp />);
    });

    expect(document.getElementById("internal-hub-app")).not.toBeNull();
    expect(document.getElementById("linear-kanban-board")).not.toBeNull();
    expect(document.querySelectorAll("[data-kanban-issue]").length).toBe(DEFAULT_KANBAN_ISSUES.length);

    // Move G0-07 one column right (previz -> keyframes) via button
    await act(async () => {
      (document.querySelector('[aria-label="Move G0-07 right"]') as HTMLButtonElement).click();
    });
    const keyframesCol = document.querySelector('[data-kanban-column="keyframes"]');
    expect(keyframesCol?.querySelector('[data-kanban-issue="G0-07"]')).not.toBeNull();

    // Create a new Kanban issue inline
    await act(async () => {
      (document.getElementById("btn-kanban-new-toggle") as HTMLButtonElement).click();
    });
    const titleInput = document.getElementById("kanban-new-title") as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(titleInput, "EP0 Helipad Blocking Check");
      titleInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      (document.getElementById("btn-kanban-create-submit") as HTMLButtonElement).click();
    });
    expect(document.querySelectorAll("[data-kanban-issue]").length).toBe(DEFAULT_KANBAN_ISSUES.length + 1);

    // Deep-link from G0-07 straight into 3D White-Box Stage on SC-ONER-N1
    await act(async () => {
      (document.querySelector('[data-kanban-open-3d="G0-07"]') as HTMLButtonElement).click();
    });
    expect(document.getElementById("production-studio-view")?.textContent).toContain("SC-ONER-N1");
    expect(document.querySelectorAll("[data-beat-id]").length).toBe(3);

    // Switch back to Kanban and test Pending Decisions queue -> automatic Kanban transition
    await act(async () => {
      (document.getElementById("nav-hub-kanban") as HTMLButtonElement).click();
    });
    expect(document.getElementById("kanban-decisions-section")).not.toBeNull();
    expect(document.querySelectorAll("[data-decision-id]").length).toBe(
      DEFAULT_DIRECTOR_DECISIONS.length
    );

    const noteInput = document.querySelector('[data-decision-note="DEC-01"]') as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(noteInput, "8.2s pillar wipe approved");
      noteInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      (document.querySelector('[data-decision-action="DEC-01:approve_keyframes"]') as HTMLButtonElement).click();
    });

    // DEC-01 leaves pending list and G0-07 is in keyframes column
    expect(document.querySelectorAll("[data-decision-id]").length).toBe(
      DEFAULT_DIRECTOR_DECISIONS.length - 1
    );
    expect(
      document
        .querySelector('[data-kanban-column="keyframes"]')
        ?.querySelector('[data-kanban-issue="G0-07"]')
    ).not.toBeNull();

    // Decision Log tab displays DEC-01 with the recorded note
    await act(async () => {
      (document.getElementById("btn-decisions-tab-log") as HTMLButtonElement).click();
    });
    expect(document.getElementById("kanban-decisions-section")?.textContent).toContain(
      "8.2s pillar wipe approved"
    );

    // Switch to Shared Assets page
    await act(async () => {
      (document.getElementById("nav-hub-assets") as HTMLButtonElement).click();
    });
    expect(document.querySelectorAll("[data-cast-asset]").length).toBe(9);

    // Switch to Storyboard Grid page
    await act(async () => {
      (document.getElementById("nav-hub-storyboard") as HTMLButtonElement).click();
    });
    await act(async () => {
      (document.getElementById("btn-hub-sub-storyboard") as HTMLButtonElement).click();
    });
    expect(document.querySelectorAll("[data-storyboard-shot]").length).toBe(STUDIO_STORYBOARD_SHOTS.length);

    await act(async () => {
      root.unmount();
    });
  });

  it("handles Director Decisions pure transitions and /api/studio-state Neon SQL handler", async () => {
    const applied = applyDirectorDecision(DEFAULT_KANBAN_ISSUES, DEFAULT_DIRECTOR_DECISIONS, {
      decisionId: "DEC-02",
      optionId: "route_fl2va",
      note: "Prefer FL2VA first",
      lang: "en"
    });
    expect(applied.updatedDecision?.status).toBe("decided");
    expect(applied.updatedDecision?.directorNote).toBe("Prefer FL2VA first");
    const g08 = applied.issues.find((i) => i.id === "G0-08");
    expect(g08?.route).toBe("fl2va_keyframes");
    expect(g08?.status).toBe("keyframes");

    const reopened = reopenDirectorDecision(applied.decisions, "DEC-02");
    expect(reopened.find((d) => d.id === "DEC-02")?.status).toBe("pending");

    const addedDec = createDirectorDecision(reopened, {
      title: "Approve Helipad Wind Pass",
      issueId: "G0-15"
    });
    expect(addedDec.length).toBe(DEFAULT_DIRECTOR_DECISIONS.length + 1);
    expect(addedDec[0]?.id).toBe("DEC-05");

    // 503 when DATABASE_URL is absent
    const unconfRes = await handleStudioStateWebRequest(
      new Request("http://localhost:5173/api/studio-state", { method: "GET" }),
      {}
    );
    expect(unconfRes.status).toBe(503);

    // In-memory mock SQL runner verifying seed -> record_decision -> reopen_decision
    const issueRows = new Map<string, Record<string, unknown>>();
    const decisionRows = new Map<string, Record<string, unknown>>();
    const mockSql: StudioSqlRunner = async (query, params = []) => {
      const q = query.trim();
      if (q.startsWith("CREATE TABLE")) return [];
      if (q.includes("COUNT(*)::int AS cnt FROM studio_kanban_issues")) {
        return [{ cnt: issueRows.size }];
      }
      if (q.includes("COUNT(*)::int AS cnt FROM studio_decisions")) {
        return [{ cnt: decisionRows.size }];
      }
      if (q.startsWith("INSERT INTO studio_kanban_issues")) {
        const id = String(params[0]);
        issueRows.set(id, {
          id,
          title_json: params[1],
          description_json: params[2],
          status: params[3],
          priority: params[4],
          chapter: params[5],
          owner: params[6],
          route: params[7],
          shot_count: params[8],
          reel_count: params[9],
          duration_sec: params[10],
          linked_shot_id: params[11],
          linked_asset_tags: params[12],
          source_ref: params[13],
          custom: params[14],
          sort_order: params[15],
          updated_at: new Date().toISOString()
        });
        return [];
      }
      if (q.startsWith("INSERT INTO studio_decisions")) {
        const id = String(params[0]);
        decisionRows.set(id, {
          id,
          issue_id: params[1],
          title_json: params[2],
          context_json: params[3],
          status: params[4],
          options_json: params[5],
          chosen_option_id: params[6],
          chosen_label: params[7],
          director_note: params[8],
          decided_by: params[9],
          decided_at: params[10],
          created_at: params[11],
          updated_at: new Date().toISOString()
        });
        return [];
      }
      if (q.startsWith("SELECT * FROM studio_kanban_issues")) {
        return [...issueRows.values()];
      }
      if (q.startsWith("SELECT * FROM studio_decisions")) {
        return [...decisionRows.values()];
      }
      return [];
    };

    const getRes = await handleStudioStateWebRequest(
      new Request("http://localhost:5173/api/studio-state", { method: "GET" }),
      { DATABASE_URL: "postgres://mock" },
      mockSql
    );
    expect(getRes.status).toBe(200);
    const getBody = (await getRes.json()) as {
      ok: boolean;
      storage: string;
      issues: KanbanIssue[];
      decisions: DirectorDecision[];
    };
    expect(getBody.ok).toBe(true);
    expect(getBody.storage).toBe("neon");
    expect(getBody.issues.length).toBe(DEFAULT_KANBAN_ISSUES.length);
    expect(getBody.decisions.length).toBe(DEFAULT_DIRECTOR_DECISIONS.length);

    const postRes = await handleStudioStateWebRequest(
      new Request("http://localhost:5173/api/studio-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record_decision",
          decisionId: "DEC-01",
          optionId: "approve_keyframes",
          note: "Locked in Neon",
          lang: "en"
        })
      }),
      { DATABASE_URL: "postgres://mock" },
      mockSql
    );
    expect(postRes.status).toBe(200);
    const postBody = (await postRes.json()) as {
      ok: boolean;
      issues: KanbanIssue[];
      decisions: DirectorDecision[];
    };
    expect(postBody.decisions.find((d) => d.id === "DEC-01")?.status).toBe("decided");
    expect(postBody.decisions.find((d) => d.id === "DEC-01")?.directorNote).toBe("Locked in Neon");
    expect(postBody.issues.find((i) => i.id === "G0-07")?.status).toBe("keyframes");
  });
});
