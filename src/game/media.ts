import type { Locale, ProbeKey, VisitorSpec } from "./types.js";

export type ClipState = "idle" | "flinch" | "lean_in" | "admit" | "purge";

export const CLIP_STATES: readonly ClipState[] = [
  "idle",
  "flinch",
  "lean_in",
  "admit",
  "purge"
];

export const VISITOR_SLUGS: Record<string, string> = {
  "V-01": "elena",
  "V-02": "leo",
  "V-03": "arthur",
  "V-04": "marcus",
  "V-05": "ana",
  "V-06": "ingrid",
  "V-07": "linmei",
  "V-08": "hannah",
  "OP-09": "operator09"
};

export function getVisitorSlug(visitorId: string): string {
  return VISITOR_SLUGS[visitorId] ?? visitorId.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getVideoClipCandidates(visitorId: string, state: ClipState): string[] {
  const slug = getVisitorSlug(visitorId);
  if (state === "admit" || state === "purge") {
    return [
      `./videos/${slug}/${state}.mp4`,
      `./videos/${slug}/${state}.webm`,
      `./videos/chamber/${state}.mp4`,
      `./videos/chamber/${state}.webm`
    ];
  }
  return [`./videos/${slug}/${state}.mp4`, `./videos/${slug}/${state}.webm`];
}

export type Night5VisualAction = "NONE" | "PURGE" | "ADMIT" | "STEP_OUT";

export function getNight5VideoCandidates(action: Night5VisualAction): string[] {
  switch (action) {
    case "NONE":
      return ["./videos/operator09/idle.mp4", "./videos/operator09/idle.webm"];
    case "PURGE":
      return [
        "./videos/operator09/purge.mp4",
        "./videos/chamber/purge.mp4",
        "./videos/chamber/purge.webm"
      ];
    case "ADMIT":
      return [
        "./videos/operator09/admit.mp4",
        "./videos/chamber/admit.mp4",
        "./videos/chamber/admit.webm"
      ];
    case "STEP_OUT":
      return [
        "./videos/operator09/whiteout.mp4",
        "./videos/chamber/whiteout.mp4",
        "./videos/chamber/whiteout.webm"
      ];
  }
}

/**
 * Resolves the 35mm photorealistic AI frame for any survivor and clip state.
 * Used as the immediate zero-flicker live-action layer and as start/end anchors for I2V models.
 */
export function getPhotorealFrameSrc(
  visitorId: string,
  state: ClipState,
  fallbackPortraitUrl?: string | null
): string {
  const slug = getVisitorSlug(visitorId);
  switch (state) {
    case "idle":
      return fallbackPortraitUrl || `./portraits/${slug}.jpg`;
    case "flinch":
      return `./portraits/reactions/${slug}_flinch.jpg`;
    case "lean_in":
      return `./portraits/reactions/${slug}_lean_in.jpg`;
    case "admit":
      return "./portraits/reactions/chamber_admit.jpg";
    case "purge":
      return "./portraits/reactions/chamber_purge.jpg";
  }
}

export function getVisitorPreloadFrames(
  visitorId: string,
  fallbackPortraitUrl?: string | null
): string[] {
  return CLIP_STATES.map((state) => getPhotorealFrameSrc(visitorId, state, fallbackPortraitUrl));
}

export function getNight5FrameSrc(action: Night5VisualAction): string {
  switch (action) {
    case "PURGE":
      return "./portraits/reactions/chamber_purge.jpg";
    case "ADMIT":
      return "./portraits/reactions/chamber_admit.jpg";
    case "STEP_OUT":
      return "./portraits/reactions/chamber_whiteout.jpg";
    case "NONE":
      return "./portraits/operator09.jpg";
  }
}

export type Night5VoiceVariant =
  | `n5_q${0 | 1 | 2}_o${0 | 1 | 2}`
  | `n5_ex_${0 | 1 | 2}`;

export type VoiceLineVariant =
  | "opening"
  | "off_axis"
  | `${ProbeKey}_${"human" | "mimic_say" | "mimic_disp"}`
  | Night5VoiceVariant;

export function getVoiceAudioPath(
  visitorId: string,
  locale: Locale,
  lineId: VoiceLineVariant
): string {
  const slug = getVisitorSlug(visitorId);
  return `./audio/${locale}/${slug}/${lineId}.mp3`;
}

export interface VocalSynthProfile {
  pitch: number;
  rate: number;
  genderHint: "female" | "male";
}

export const VOCAL_SYNTH_PROFILES: Record<string, VocalSynthProfile> = {
  "V-01": { pitch: 0.96, rate: 0.98, genderHint: "female" },
  "V-02": { pitch: 1.08, rate: 1.12, genderHint: "male" },
  "V-03": { pitch: 0.86, rate: 0.92, genderHint: "male" },
  "V-04": { pitch: 0.78, rate: 0.90, genderHint: "male" },
  "V-05": { pitch: 0.88, rate: 0.96, genderHint: "female" },
  "V-06": { pitch: 1.04, rate: 0.91, genderHint: "female" },
  "V-07": { pitch: 0.98, rate: 0.95, genderHint: "female" },
  "V-08": { pitch: 0.94, rate: 1.05, genderHint: "female" },
  "OP-09": { pitch: 0.92, rate: 0.95, genderHint: "male" }
};

export interface VideoPromptSpec {
  visitorId: string;
  slug: string;
  state: ClipState;
  loop: boolean;
  durationSec: number;
  firstFramePortrait: string;
  referenceEndFrame: string;
  targetMp4: string;
  targetWebm: string;
  prompt: string;
  negativePrompt: string;
}

/**
 * Generates deterministic Image-to-Video (I2V) prompts anchored to each survivor's
 * 16:9 blast-window portrait (`public/portraits/{slug}.jpg`) and reaction keyframe
 * (`public/portraits/reactions/...`), enforcing the zero-lip-sync constraint.
 */
export function buildVisitorVideoPrompts(visitor: VisitorSpec): VideoPromptSpec[] {
  const slug = getVisitorSlug(visitor.id);
  const firstFrame =
    visitor.portraitUrl?.replace(/^\.\//, "public/") ?? `public/portraits/${slug}.jpg`;
  const baseScene = `Fixed 35mm surveillance camera inside a dim Svalbard quarantine booth looking through thick frosted double-glazed blast glass at ${visitor.name.en} (${visitor.role.en}). Heavy snow blowing outside at -46°C, warm amber CRT reflection on glass, bolted steel PTT intercom box beside frame. Subject's mouth stays CLOSED (zero lip movement).`;
  const negativePrompt =
    "talking mouth movement, lip sync, open mouth speaking, camera pan, scene cut, cartoon, anime, 3d render, cgi, bright daylight, handheld shake, deformed hands, text watermark";

  const specs: ReadonlyArray<{
    state: ClipState;
    loop: boolean;
    durationSec: number;
    endFrame: string;
    motion: string;
  }> = [
    {
      state: "idle",
      loop: true,
      durationSec: 5,
      endFrame: firstFrame,
      motion:
        "Seamless loop: subtle shivering in heavy polar coat, rhythmic white cold breath misting the lower glass, guarded blinking, slight weight shift, waiting tensely for airlock clearance."
    },
    {
      state: "flinch",
      loop: false,
      durationSec: 4,
      endFrame: `public/portraits/reactions/${slug}_flinch.jpg`,
      motion:
        "Involuntary micro-flinch at a sharp intercom question: pupils contract, eyes dart sideways toward the steel intercom speaker, jaw tightens with closed lips, cold breath catches briefly before regaining composure."
    },
    {
      state: "lean_in",
      loop: false,
      durationSec: 4,
      endFrame: `public/portraits/reactions/${slug}_lean_in.jpg`,
      motion:
        "Urgent lean-in toward the double-glazed window: gloved hand presses against the frosted glass pane, brows furrow with intensity, heavier fogging breath across the glass, mouth remains closed."
    },
    {
      state: "admit",
      loop: false,
      durationSec: 4,
      endFrame: "public/portraits/reactions/chamber_admit.jpg",
      motion:
        "Green inner airlock indicator illuminates across the glass; pressurized white cryo-decompression steam vents from the right bulkhead, shoulders drop in visible relief as subject steps out of frame through the unsealed inner hatch."
    },
    {
      state: "purge",
      loop: false,
      durationSec: 4,
      endFrame: "public/portraits/reactions/chamber_purge.jpg",
      motion:
        "Red thermal alarm strobes across the chamber; subject steps back in shock as a heavy corrugated steel blast shutter slams down over the exterior window, followed by intense 1,100°C orange furnace flames roaring behind the lower seam."
    }
  ];

  return specs.map((s) => ({
    visitorId: visitor.id,
    slug,
    state: s.state,
    loop: s.loop,
    durationSec: s.durationSec,
    firstFramePortrait: firstFrame,
    referenceEndFrame: s.endFrame,
    targetMp4: `public/videos/${slug}/${s.state}.mp4`,
    targetWebm: `public/videos/${slug}/${s.state}.webm`,
    prompt: `${baseScene} ${s.motion}`,
    negativePrompt
  }));
}

/**
 * Generates Night 5 Operator #09 Doppelgänger I2V specs (`public/videos/operator09/*.mp4`).
 */
export function buildNight5VideoPrompts(): VideoPromptSpec[] {
  const firstFrame = "public/portraits/operator09.jpg";
  const baseScene =
    "Fixed 35mm surveillance camera inside a dim Svalbard quarantine booth looking through thick frosted double-glazed blast glass at Operator #09 Doppelgänger in hooded polar station parka. Heavy snow blowing outside at -46°C, warm amber CRT reflection on glass, bolted steel PTT intercom box beside frame. Subject's mouth stays CLOSED (zero lip movement).";
  const negativePrompt =
    "talking mouth movement, lip sync, open mouth speaking, camera pan, scene cut, cartoon, anime, 3d render, cgi, bright daylight, handheld shake, deformed hands, text watermark";

  return [
    {
      visitorId: "OP-09",
      slug: "operator09",
      state: "idle",
      loop: true,
      durationSec: 5,
      firstFramePortrait: firstFrame,
      referenceEndFrame: firstFrame,
      targetMp4: "public/videos/operator09/idle.mp4",
      targetWebm: "public/videos/operator09/idle.webm",
      prompt: `${baseScene} Seamless loop: unnervingly calm mirror posture outside the glass, slow steady cold breath misting the lower pane, unblinking gaze locked onto the operator inside.`,
      negativePrompt
    },
    {
      visitorId: "OP-09",
      slug: "operator09",
      state: "admit",
      loop: false,
      durationSec: 4,
      firstFramePortrait: firstFrame,
      referenceEndFrame: "public/portraits/reactions/chamber_admit.jpg",
      targetMp4: "public/videos/operator09/admit.mp4",
      targetWebm: "public/videos/operator09/admit.webm",
      prompt: `${baseScene} Green inner airlock indicator illuminates across the glass; pressurized white cryo-decompression steam vents from the bulkhead as the doppelgänger steps calmly toward the unsealed inner hatch.`,
      negativePrompt
    },
    {
      visitorId: "OP-09",
      slug: "operator09",
      state: "purge",
      loop: false,
      durationSec: 4,
      firstFramePortrait: firstFrame,
      referenceEndFrame: "public/portraits/reactions/chamber_purge.jpg",
      targetMp4: "public/videos/operator09/purge.mp4",
      targetWebm: "public/videos/operator09/purge.webm",
      prompt: `${baseScene} Red thermal alarm strobes across the chamber; heavy corrugated steel blast shutter slams down over the exterior window as 1,100°C orange furnace flames roar behind the lower seam.`,
      negativePrompt
    }
  ];
}
