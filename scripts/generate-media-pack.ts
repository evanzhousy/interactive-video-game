import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { stripStageDirections } from "../src/game/audio.js";
import { tl } from "../src/game/i18n.js";
import {
  VOCAL_SYNTH_PROFILES,
  buildNight5VideoPrompts,
  buildVisitorVideoPrompts,
  getVisitorSlug,
  type Night5VoiceVariant,
  type VideoPromptSpec,
  type VoiceLineVariant
} from "../src/game/media.js";
import {
  INTAKE_QUESTIONS,
  NIGHT5_KNOCK_SUFFIX,
  SHIFT_EXCUSES
} from "../src/game/night5.js";
import type { Locale, ProbeKey } from "../src/game/types.js";
import { ALL_VISITORS } from "../src/game/visitors/index.js";

export interface VoiceAssetSpec {
  visitorId: string;
  slug: string;
  locale: Locale;
  lineId: VoiceLineVariant;
  targetMp3: string;
  voiceDirection: string;
  genderHint: "female" | "male";
  pitchHint: number;
  rateHint: number;
  spokenText: string;
}

export interface MediaPackManifest {
  schemaVersion: 1;
  generatedAt: string;
  architecture: "zero-lip-sync-double-glazed-intercom";
  ffmpegRadioFilter: string;
  counts: {
    visitors: number;
    videoClips: number;
    night5VideoClips: number;
    voiceLines: number;
  };
  videoClips: VideoPromptSpec[];
  night5VideoClips: VideoPromptSpec[];
  voiceLines: VoiceAssetSpec[];
}

const LOCALES: readonly Locale[] = ["zh", "en", "ja"];

export function generateMediaManifest(): MediaPackManifest {
  const videoClips: VideoPromptSpec[] = [];
  const night5VideoClips = buildNight5VideoPrompts();
  const voiceLines: VoiceAssetSpec[] = [];

  for (const visitor of ALL_VISITORS) {
    videoClips.push(...buildVisitorVideoPrompts(visitor));

    const slug = getVisitorSlug(visitor.id);
    const vocal = VOCAL_SYNTH_PROFILES[visitor.id] ?? {
      pitch: 1.0,
      rate: 1.0,
      genderHint: "female" as const
    };

    const pushLocalizedLines = (lineId: VoiceLineVariant, texts: Record<Locale, string>) => {
      for (const locale of LOCALES) {
        const spokenText = stripStageDirections(texts[locale]);
        voiceLines.push({
          visitorId: visitor.id,
          slug,
          locale,
          lineId,
          targetMp3: `public/audio/${locale}/${slug}/${lineId}.mp3`,
          voiceDirection: visitor.voice,
          genderHint: vocal.genderHint,
          pitchHint: vocal.pitch,
          rateHint: vocal.rate,
          spokenText
        });
      }
    };

    pushLocalizedLines("opening", visitor.openingLine);
    pushLocalizedLines("off_axis", visitor.offAxisReply);

    for (const [probeKey, probe] of Object.entries(visitor.probes) as Array<
      [ProbeKey, NonNullable<(typeof visitor.probes)[ProbeKey]>]
    >) {
      pushLocalizedLines(`${probeKey}_human`, probe.human);
      if (probe.mimic_say) {
        pushLocalizedLines(`${probeKey}_mimic_say`, probe.mimic_say);
      }
      if (probe.mimic_disp) {
        pushLocalizedLines(`${probeKey}_mimic_disp`, probe.mimic_disp);
      }
    }
  }

  // Night 5 Operator #09 Doppelgänger intake mirror lines (9 intake variants + 3 shift-excuse fallbacks)
  const opVocal = VOCAL_SYNTH_PROFILES["OP-09"]!;
  const pushNight5Line = (lineId: Night5VoiceVariant, quoteTexts: Record<Locale, string>) => {
    for (const locale of LOCALES) {
      const spokenText = `${tl(quoteTexts, locale)} ${tl(NIGHT5_KNOCK_SUFFIX, locale)}`;
      voiceLines.push({
        visitorId: "OP-09",
        slug: "operator09",
        locale,
        lineId,
        targetMp3: `public/audio/${locale}/operator09/${lineId}.mp3`,
        voiceDirection: "calm, unnervingly steady mirror cadence reciting the player's own intake words",
        genderHint: opVocal.genderHint,
        pitchHint: opVocal.pitch,
        rateHint: opVocal.rate,
        spokenText
      });
    }
  };

  for (let qi = 0; qi < INTAKE_QUESTIONS.length; qi++) {
    const q = INTAKE_QUESTIONS[qi]!;
    for (let oi = 0; oi < q.options.length; oi++) {
      pushNight5Line(
        `n5_q${qi as 0 | 1 | 2}_o${oi as 0 | 1 | 2}`,
        q.options[oi]!.text
      );
    }
  }

  for (let ei = 0; ei < SHIFT_EXCUSES.length; ei++) {
    pushNight5Line(`n5_ex_${ei as 0 | 1 | 2}`, SHIFT_EXCUSES[ei]!.label);
  }

  return {
    schemaVersion: 1,
    generatedAt: "2026-11-17T00:00:00Z",
    architecture: "zero-lip-sync-double-glazed-intercom",
    ffmpegRadioFilter:
      "highpass=f=360,lowpass=f=3100,acompressor=threshold=-16dB:ratio=4:attack=5:release=60,acrusher=bits=12:mix=0.18",
    counts: {
      visitors: ALL_VISITORS.length,
      videoClips: videoClips.length,
      night5VideoClips: night5VideoClips.length,
      voiceLines: voiceLines.length
    },
    videoClips,
    night5VideoClips,
    voiceLines
  };
}

const OPENAI_VOICE_MAP: Record<string, string> = {
  "V-01": "nova",
  "V-02": "echo",
  "V-03": "onyx",
  "V-04": "ash",
  "V-05": "sage",
  "V-06": "shimmer",
  "V-07": "coral",
  "V-08": "alloy",
  "OP-09": "onyx"
};

function synthesizeViaEdgeNeural(): void {
  const args = ["run", "--with", "edge-tts", "python3", "scripts/synthesize-edge-tts.py"];
  if (process.env.TTS_LOCALE) {
    args.push("--locale", process.env.TTS_LOCALE);
  }
  if (process.argv.includes("--force")) {
    args.push("--force");
  }
  execFileSync("uv", args, { stdio: "inherit" });
}

async function synthesizeAllTts(manifest: MediaPackManifest): Promise<void> {
  const explicitProvider = process.argv.includes("--provider")
    ? process.argv[process.argv.indexOf("--provider") + 1]
    : undefined;
  const apiKey = process.env.TTS_API_KEY || process.env.OPENAI_API_KEY || "";

  if (explicitProvider === "edge" || (!apiKey && explicitProvider !== "openai")) {
    console.log("🎙️ Synthesizing trilingual intercom voice pack via Edge Neural TTS + FFmpeg...");
    synthesizeViaEdgeNeural();
    return;
  }

  const baseUrl = (process.env.TTS_BASE_URL || "https://api.openai.com/v1/audio/speech").replace(
    /\/+$/,
    ""
  );
  const model = process.env.TTS_MODEL || "gpt-4o-mini-tts";
  const onlyLocale = process.env.TTS_LOCALE as Locale | undefined;

  if (!apiKey) {
    console.error(
      "✗ Missing TTS_API_KEY (or OPENAI_API_KEY) for --provider openai."
    );
    process.exitCode = 1;
    return;
  }

  const lines = onlyLocale
    ? manifest.voiceLines.filter((l) => l.locale === onlyLocale)
    : manifest.voiceLines;

  let rendered = 0;
  let skipped = 0;

  for (const item of lines) {
    const outPath = path.resolve(process.cwd(), item.targetMp3);
    if (!process.argv.includes("--force") && fs.existsSync(outPath) && fs.statSync(outPath).size > 512) {
      skipped += 1;
      continue;
    }

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const voice = OPENAI_VOICE_MAP[item.visitorId] ?? "alloy";

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        voice,
        input: item.spokenText,
        instructions: `Speak through a tense Svalbard quarantine intercom: ${item.voiceDirection}`,
        response_format: "mp3"
      })
    });

    if (!res.ok) {
      throw new Error(`TTS HTTP ${res.status} on ${item.targetMp3}: ${await res.text()}`);
    }

    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outPath, buf);
    rendered += 1;
    console.log(`✓ [${rendered}/${lines.length}] ${item.targetMp3} (${buf.byteLength} bytes)`);
  }

  console.log(`Done: rendered=${rendered}, skipped_existing=${skipped}`);
}

async function main() {
  const manifest = generateMediaManifest();
  const outPath = path.resolve(process.cwd(), "public/media-manifest.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(
    `✓ Wrote public/media-manifest.json — ${manifest.counts.visitors} visitors, ${manifest.counts.videoClips} survivor I2V clips (+${manifest.counts.night5VideoClips} Night 5 clips), ${manifest.counts.voiceLines} trilingual voice lines`
  );

  if (process.argv.includes("--synthesize-tts")) {
    await synthesizeAllTts(manifest);
  }
}

const isDirectCli =
  process.argv[1] && path.resolve(process.argv[1]).endsWith("generate-media-pack.ts");
if (isDirectCli) {
  void main();
}
