import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generateMediaManifest } from "../scripts/generate-media-pack.js";
import { stripStageDirections } from "../src/game/audio.js";
import { CLIP_STATES, buildVisitorVideoPrompts, getVisitorSlug } from "../src/game/media.js";
import { ALL_VISITORS } from "../src/game/visitors/index.js";

describe("Interactive Video & Radio Intercom Media Pack Pipeline", () => {
  it("strips leading parenthetical stage directions across zh/en/ja", () => {
    expect(stripStageDirections("（牙齿打颤）#09 哥！快开门！")).toBe("#09 哥！快开门！");
    expect(stripStageDirections("(Teeth chattering) #09! Open up!")).toBe("#09! Open up!");
    expect(stripStageDirections("（穏やかな微笑み）こんばんは、#09。")).toBe(
      "こんばんは、#09。"
    );
  });

  it("generates 40 zero-lip-sync I2V clip specs and complete trilingual voice manifests", () => {
    const manifest = generateMediaManifest();
    expect(manifest.counts.visitors).toBe(8);
    expect(manifest.counts.videoClips).toBe(8 * CLIP_STATES.length);
    expect(manifest.counts.voiceLines).toBeGreaterThanOrEqual(240);

    for (const v of ALL_VISITORS) {
      const slug = getVisitorSlug(v.id);
      const prompts = buildVisitorVideoPrompts(v);
      expect(prompts).toHaveLength(5);
      for (const p of prompts) {
        expect(p.prompt).toContain("mouth stays CLOSED");
        expect(p.negativePrompt).toContain("lip sync");
        expect(p.firstFramePortrait).toBe(`public/portraits/${slug}.jpg`);
        const diskPortrait = path.resolve(process.cwd(), p.firstFramePortrait);
        expect(fs.existsSync(diskPortrait)).toBe(true);
      }
    }

    for (const line of manifest.voiceLines) {
      expect(line.spokenText.length).toBeGreaterThan(2);
      expect(line.spokenText.startsWith("（")).toBe(false);
      expect(line.spokenText.startsWith("(")).toBe(false);
    }
  });
});
