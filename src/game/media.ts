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
  "V-08": "hannah"
};

export function getVisitorSlug(visitorId: string): string {
  return VISITOR_SLUGS[visitorId] ?? visitorId.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getVideoClipCandidates(visitorId: string, state: ClipState): string[] {
  const slug = getVisitorSlug(visitorId);
  return [`./videos/${slug}/${state}.webm`, `./videos/${slug}/${state}.mp4`];
}

export type VoiceLineVariant = "opening" | "off_axis" | `${ProbeKey}_${"human" | "mimic_say" | "mimic_disp"}`;

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
  "V-08": { pitch: 0.94, rate: 1.05, genderHint: "female" }
};

export interface VideoPromptSpec {
  visitorId: string;
  slug: string;
  state: ClipState;
  loop: boolean;
  durationSec: number;
  firstFramePortrait: string;
  targetWebm: string;
  prompt: string;
  negativePrompt: string;
}

/**
 * Generates deterministic Image-to-Video (I2V) prompts anchored to each survivor's
 * 16:9 blast-window portrait (`public/portraits/{slug}.jpg`) while enforcing the
 * zero-lip-sync constraint (mouth closed, speaking via wall-mounted intercom).
 */
export function buildVisitorVideoPrompts(visitor: VisitorSpec): VideoPromptSpec[] {
  const slug = getVisitorSlug(visitor.id);
  const firstFrame = visitor.portraitUrl?.replace(/^\.\//, "public/") ?? `public/portraits/${slug}.jpg`;
  const baseScene = `Fixed 35mm surveillance camera inside a dim Svalbard quarantine booth looking through thick frosted double-glazed blast glass at ${visitor.name.en} (${visitor.role.en}). Heavy snow blowing outside at -46°C, warm amber CRT reflection on glass, bolted steel PTT intercom box beside frame. Subject's mouth stays CLOSED (zero lip movement).`;
  const negativePrompt =
    "talking mouth movement, lip sync, open mouth speaking, camera pan, scene cut, cartoon, anime, bright daylight, handheld shake, deformed hands, text watermark";

  const specs: ReadonlyArray<{
    state: ClipState;
    loop: boolean;
    durationSec: number;
    motion: string;
  }> = [
    {
      state: "idle",
      loop: true,
      durationSec: 5,
      motion:
        "Seamless loop: subtle shivering in heavy polar coat, rhythmic white cold breath misting the lower glass, guarded blinking, slight weight shift, waiting tensely for airlock clearance."
    },
    {
      state: "flinch",
      loop: false,
      durationSec: 3,
      motion:
        "Involuntary micro-flinch at a sharp intercom question: pupils contract, eyes dart sideways toward the steel intercom speaker, jaw tightens with closed lips, cold breath catches briefly before regaining composure."
    },
    {
      state: "lean_in",
      loop: false,
      durationSec: 3,
      motion:
        "Urgent lean-in toward the double-glazed window: gloved hand presses against the frosted steel frame, brows furrow with impatience, heavier fogging breath across the glass, mouth remains closed."
    },
    {
      state: "admit",
      loop: false,
      durationSec: 4,
      motion:
        "Green inner airlock indicator illuminates across the glass; pressurized white cryo-decompression steam vents from the right bulkhead, shoulders drop in visible relief as subject steps toward the inner hatch."
    },
    {
      state: "purge",
      loop: false,
      durationSec: 4,
      motion:
        "Red thermal alarm strobes across the chamber; subject steps back in shock as a heavy corrugated steel blast shutter slams down over the exterior window, followed by intense 1,100°C orange furnace glow behind the seam."
    }
  ];

  return specs.map((s) => ({
    visitorId: visitor.id,
    slug,
    state: s.state,
    loop: s.loop,
    durationSec: s.durationSec,
    firstFramePortrait: firstFrame,
    targetWebm: `public/videos/${slug}/${s.state}.webm`,
    prompt: `${baseScene} ${s.motion}`,
    negativePrompt
  }));
}
