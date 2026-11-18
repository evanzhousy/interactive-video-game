import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generateMediaManifest } from "../scripts/generate-media-pack.js";
import { filterVideoSpecs, parseVideoCliArgs } from "../scripts/generate-videos.js";
import { stripStageDirections } from "../src/game/audio.js";
import {
  CLIP_STATES,
  buildVisitorVideoPrompts,
  getNight5FrameSrc,
  getPhotorealFrameSrc,
  getVisitorSlug
} from "../src/game/media.js";
import { ALL_VISITORS } from "../src/game/visitors/index.js";

describe("Interactive Video & Radio Intercom Media Pack Pipeline", () => {
  it("strips leading parenthetical stage directions across zh/en/ja", () => {
    expect(stripStageDirections("（牙齿打颤）#09 哥！快开门！")).toBe("#09 哥！快开门！");
    expect(stripStageDirections("(Teeth chattering) #09! Open up!")).toBe("#09! Open up!");
    expect(stripStageDirections("（穏やかな微笑み）こんばんは、#09。")).toBe(
      "こんばんは、#09。"
    );
  });

  it("ships all 28 photorealistic 35mm AI frames on disk and generates 40 start/end-anchored I2V specs", () => {
    const manifest = generateMediaManifest();
    expect(manifest.counts.visitors).toBe(8);
    expect(manifest.counts.videoClips).toBe(8 * CLIP_STATES.length);
    expect(manifest.counts.voiceLines).toBeGreaterThanOrEqual(240);

    for (const v of ALL_VISITORS) {
      const slug = getVisitorSlug(v.id);
      const prompts = buildVisitorVideoPrompts(v);
      expect(prompts).toHaveLength(5);

      for (const state of CLIP_STATES) {
        const uiRel = getPhotorealFrameSrc(v.id, state, v.portraitUrl).replace(/^\.\//, "public/");
        const absFrame = path.resolve(process.cwd(), uiRel);
        expect(fs.existsSync(absFrame)).toBe(true);
        expect(fs.statSync(absFrame).size).toBeGreaterThan(40_000);
      }

      for (const p of prompts) {
        expect(p.prompt).toContain("mouth stays CLOSED");
        expect(p.negativePrompt).toContain("lip sync");
        expect(p.firstFramePortrait).toBe(`public/portraits/${slug}.jpg`);
        expect(p.targetMp4).toBe(`public/videos/${slug}/${p.state}.mp4`);
        expect(fs.existsSync(path.resolve(process.cwd(), p.firstFramePortrait))).toBe(true);
        expect(fs.existsSync(path.resolve(process.cwd(), p.referenceEndFrame))).toBe(true);
      }
    }

    for (const action of ["NONE", "PURGE", "ADMIT", "STEP_OUT"] as const) {
      const n5Rel = getNight5FrameSrc(action).replace(/^\.\//, "public/");
      expect(fs.existsSync(path.resolve(process.cwd(), n5Rel))).toBe(true);
    }

    for (const line of manifest.voiceLines) {
      expect(line.spokenText.length).toBeGreaterThan(2);
      expect(line.spokenText.startsWith("（")).toBe(false);
      expect(line.spokenText.startsWith("(")).toBe(false);
      const absMp3 = path.resolve(process.cwd(), line.targetMp3);
      expect(fs.existsSync(absMp3)).toBe(true);
      expect(fs.statSync(absMp3).size).toBeGreaterThan(4_000);
    }

    expect(manifest.night5VideoClips).toHaveLength(3);
    for (const n5Clip of manifest.night5VideoClips) {
      expect(n5Clip.visitorId).toBe("OP-09");
      expect(fs.existsSync(path.resolve(process.cwd(), n5Clip.firstFramePortrait))).toBe(true);
      expect(fs.existsSync(path.resolve(process.cwd(), n5Clip.referenceEndFrame))).toBe(true);
    }

    // Verify all 16 rendered AI Studio 720p H.264 live-action MP4 clips on disk:
    // - 9/9 idle streams across all 8 survivors + Night 5 OP-09
    // - Full Night 1 reactions (Elena + Leo flinch & lean_in)
    // - Shared chamber admit / purge / whiteout streams
    const expectedRenderedVideos = [
      "public/videos/elena/idle.mp4",
      "public/videos/elena/flinch.mp4",
      "public/videos/elena/lean_in.mp4",
      "public/videos/leo/idle.mp4",
      "public/videos/leo/flinch.mp4",
      "public/videos/leo/lean_in.mp4",
      "public/videos/arthur/idle.mp4",
      "public/videos/marcus/idle.mp4",
      "public/videos/ana/idle.mp4",
      "public/videos/ingrid/idle.mp4",
      "public/videos/linmei/idle.mp4",
      "public/videos/hannah/idle.mp4",
      "public/videos/operator09/idle.mp4",
      "public/videos/chamber/admit.mp4",
      "public/videos/chamber/purge.mp4",
      "public/videos/chamber/whiteout.mp4"
    ];
    for (const relVid of expectedRenderedVideos) {
      const absVid = path.resolve(process.cwd(), relVid);
      expect(fs.existsSync(absVid)).toBe(true);
      expect(fs.statSync(absVid).size).toBeGreaterThan(100_000);
    }
  });

  it("parses I2V video generator CLI flags and filters clip specs accurately", () => {
    const manifest = generateMediaManifest();
    const opts = parseVideoCliArgs([
      "--provider",
      "veo",
      "--visitor",
      "V-01",
      "--state",
      "flinch",
      "--with-end-frame",
      "--dry-run"
    ]);
    expect(opts.provider).toBe("veo");
    expect(opts.withEndFrame).toBe(true);
    expect(opts.dryRun).toBe(true);

    const filtered = filterVideoSpecs(manifest.videoClips, opts);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.slug).toBe("elena");
    expect(filtered[0]?.referenceEndFrame).toBe("public/portraits/reactions/elena_flinch.jpg");
  });
});
