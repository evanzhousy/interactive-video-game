import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { ClipState, VideoPromptSpec } from "../src/game/media.js";
import { generateMediaManifest } from "./generate-media-pack.js";

export type VideoProvider = "veo" | "fal" | "runway";

export interface VideoCliOptions {
  provider?: VideoProvider;
  visitorId?: string;
  state?: ClipState;
  limit?: number;
  force: boolean;
  dryRun: boolean;
  withEndFrame: boolean;
}

export function parseVideoCliArgs(argv: readonly string[]): VideoCliOptions {
  const opts: VideoCliOptions = {
    force: false,
    dryRun: false,
    withEndFrame: false
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--force") {
      opts.force = true;
    } else if (arg === "--dry-run") {
      opts.dryRun = true;
    } else if (arg === "--with-end-frame") {
      opts.withEndFrame = true;
    } else if (arg === "--provider" && argv[i + 1]) {
      const val = argv[++i] as VideoProvider;
      if (val === "veo" || val === "fal" || val === "runway") {
        opts.provider = val;
      } else {
        throw new Error(`Unsupported --provider "${val}". Expected veo | fal | runway.`);
      }
    } else if (arg === "--visitor" && argv[i + 1]) {
      opts.visitorId = argv[++i];
    } else if (arg === "--state" && argv[i + 1]) {
      opts.state = argv[++i] as ClipState;
    } else if (arg === "--limit" && argv[i + 1]) {
      opts.limit = Math.max(1, Number.parseInt(argv[++i]!, 10));
    }
  }

  return opts;
}

export function filterVideoSpecs(
  specs: readonly VideoPromptSpec[],
  opts: Pick<VideoCliOptions, "visitorId" | "state" | "limit">
): VideoPromptSpec[] {
  let out = specs.filter((s) => {
    if (opts.visitorId && s.visitorId !== opts.visitorId && s.slug !== opts.visitorId) {
      return false;
    }
    if (opts.state && s.state !== opts.state) {
      return false;
    }
    return true;
  });
  if (opts.limit !== undefined) {
    out = out.slice(0, opts.limit);
  }
  return out;
}

function loadDotEnvIfPresent(): void {
  for (const filename of [".env.local", ".env"]) {
    const full = path.resolve(process.cwd(), filename);
    if (!fs.existsSync(full)) continue;
    const raw = fs.readFileSync(full, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");
      if (!process.env[key] && val) {
        process.env[key] = val;
      }
    }
  }
}

export function detectProvider(explicit?: VideoProvider): VideoProvider | null {
  if (explicit) return explicit;
  if (process.env.GEMINI_API_KEY) return "veo";
  if (process.env.FAL_KEY) return "fal";
  if (process.env.RUNWAYML_API_SECRET) return "runway";
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJpegBase64(relPath: string): string {
  const abs = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Missing reference frame on disk: ${relPath}`);
  }
  return fs.readFileSync(abs).toString("base64");
}

function hasFfmpeg(): boolean {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes raw model MP4 output to match `ordamor-live-2036.mp4`:
 * 1280x720 16:9, 30fps, H.264 yuv420p, +faststart, muted video track.
 */
function normalizeMp4IfPossible(rawPath: string, finalPath: string): void {
  if (!hasFfmpeg()) {
    fs.renameSync(rawPath, finalPath);
    return;
  }
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      rawPath,
      "-vf",
      "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
      "-r",
      "30",
      "-c:v",
      "libx264",
      "-profile:v",
      "high",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "21",
      "-movflags",
      "+faststart",
      "-an",
      finalPath
    ],
    { stdio: "inherit" }
  );
  fs.unlinkSync(rawPath);
}

async function generateViaVeo(spec: VideoPromptSpec, withEndFrame: boolean): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY for Google Veo provider.");
  }
  const model = process.env.VEO_MODEL || "veo-3.0-generate-001";
  const baseUrl = "https://generativelanguage.googleapis.com/v1beta";

  const instance: Record<string, unknown> = {
    prompt: spec.prompt,
    image: {
      bytesBase64Encoded: readJpegBase64(spec.firstFramePortrait),
      mimeType: "image/jpeg"
    }
  };

  if (withEndFrame && spec.state !== "idle") {
    instance.lastFrame = {
      bytesBase64Encoded: readJpegBase64(spec.referenceEndFrame),
      mimeType: "image/jpeg"
    };
  }

  const startRes = await fetch(`${baseUrl}/models/${model}:predictLongRunning`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      instances: [instance],
      parameters: {
        aspectRatio: "16:9",
        negativePrompt: spec.negativePrompt
      }
    })
  });

  if (!startRes.ok) {
    throw new Error(`Veo HTTP ${startRes.status}: ${await startRes.text()}`);
  }

  const startJson = (await startRes.json()) as { name?: string };
  if (!startJson.name) {
    throw new Error(`Veo did not return an operation name: ${JSON.stringify(startJson)}`);
  }

  for (let attempt = 0; attempt < 90; attempt++) {
    await sleep(6000);
    const pollRes = await fetch(`${baseUrl}/${startJson.name}`, {
      headers: { "x-goog-api-key": apiKey }
    });
    if (!pollRes.ok) {
      throw new Error(`Veo poll HTTP ${pollRes.status}: ${await pollRes.text()}`);
    }
    const pollJson = (await pollRes.json()) as {
      done?: boolean;
      error?: { message?: string };
      response?: {
        generateVideoResponse?: {
          generatedSamples?: Array<{ video?: { uri?: string } }>;
        };
        videos?: Array<{ uri?: string }>;
      };
    };

    if (pollJson.error) {
      throw new Error(`Veo generation error: ${pollJson.error.message ?? JSON.stringify(pollJson.error)}`);
    }
    if (!pollJson.done) continue;

    const videoUri =
      pollJson.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ??
      pollJson.response?.videos?.[0]?.uri;
    if (!videoUri) {
      throw new Error(`Veo finished without video URI: ${JSON.stringify(pollJson)}`);
    }

    const dlRes = await fetch(videoUri, {
      headers: { "x-goog-api-key": apiKey }
    });
    if (!dlRes.ok) {
      throw new Error(`Veo video download HTTP ${dlRes.status}`);
    }
    return Buffer.from(await dlRes.arrayBuffer());
  }

  throw new Error(`Veo operation timed out after 9 minutes: ${startJson.name}`);
}

async function generateViaFal(spec: VideoPromptSpec, withEndFrame: boolean): Promise<Buffer> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    throw new Error("Missing FAL_KEY for Fal.ai Kling / Wan I2V provider.");
  }
  const model = process.env.FAL_VIDEO_MODEL || "fal-ai/kling-video/v2/master/image-to-video";
  const imageDataUri = `data:image/jpeg;base64,${readJpegBase64(spec.firstFramePortrait)}`;

  const payload: Record<string, unknown> = {
    prompt: spec.prompt,
    negative_prompt: spec.negativePrompt,
    image_url: imageDataUri,
    duration: "5",
    aspect_ratio: "16:9"
  };

  if (withEndFrame && spec.state !== "idle") {
    payload.tail_image_url = `data:image/jpeg;base64,${readJpegBase64(spec.referenceEndFrame)}`;
  }

  const submitRes = await fetch(`https://queue.fal.run/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!submitRes.ok) {
    throw new Error(`Fal submit HTTP ${submitRes.status}: ${await submitRes.text()}`);
  }

  const submitJson = (await submitRes.json()) as {
    status_url?: string;
    response_url?: string;
  };
  if (!submitJson.status_url || !submitJson.response_url) {
    throw new Error(`Fal missing queue URLs: ${JSON.stringify(submitJson)}`);
  }

  for (let attempt = 0; attempt < 100; attempt++) {
    await sleep(5000);
    const statusRes = await fetch(submitJson.status_url, {
      headers: { Authorization: `Key ${falKey}` }
    });
    if (!statusRes.ok) {
      throw new Error(`Fal status HTTP ${statusRes.status}: ${await statusRes.text()}`);
    }
    const statusJson = (await statusRes.json()) as { status?: string };
    if (statusJson.status === "FAILED") {
      throw new Error(`Fal I2V job failed: ${JSON.stringify(statusJson)}`);
    }
    if (statusJson.status !== "COMPLETED") continue;

    const resultRes = await fetch(submitJson.response_url, {
      headers: { Authorization: `Key ${falKey}` }
    });
    if (!resultRes.ok) {
      throw new Error(`Fal response HTTP ${resultRes.status}: ${await resultRes.text()}`);
    }
    const resultJson = (await resultRes.json()) as { video?: { url?: string } };
    const videoUrl = resultJson.video?.url;
    if (!videoUrl) {
      throw new Error(`Fal response missing video.url: ${JSON.stringify(resultJson)}`);
    }
    const dlRes = await fetch(videoUrl);
    if (!dlRes.ok) {
      throw new Error(`Fal download HTTP ${dlRes.status}`);
    }
    return Buffer.from(await dlRes.arrayBuffer());
  }

  throw new Error("Fal I2V job timed out.");
}

async function generateViaRunway(spec: VideoPromptSpec): Promise<Buffer> {
  const apiSecret = process.env.RUNWAYML_API_SECRET;
  if (!apiSecret) {
    throw new Error("Missing RUNWAYML_API_SECRET for Runway Gen-4 Turbo provider.");
  }
  const model = process.env.RUNWAY_MODEL || "gen4_turbo";
  const promptImage = `data:image/jpeg;base64,${readJpegBase64(spec.firstFramePortrait)}`;

  const startRes = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiSecret}`,
      "Content-Type": "application/json",
      "X-Runway-Version": "2024-11-06"
    },
    body: JSON.stringify({
      model,
      promptImage,
      promptText: spec.prompt.slice(0, 980),
      ratio: "1280:720",
      duration: 5
    })
  });

  if (!startRes.ok) {
    throw new Error(`Runway submit HTTP ${startRes.status}: ${await startRes.text()}`);
  }
  const { id } = (await startRes.json()) as { id?: string };
  if (!id) {
    throw new Error("Runway did not return task id.");
  }

  for (let attempt = 0; attempt < 90; attempt++) {
    await sleep(5000);
    const pollRes = await fetch(`https://api.dev.runwayml.com/v1/tasks/${id}`, {
      headers: {
        Authorization: `Bearer ${apiSecret}`,
        "X-Runway-Version": "2024-11-06"
      }
    });
    if (!pollRes.ok) {
      throw new Error(`Runway poll HTTP ${pollRes.status}: ${await pollRes.text()}`);
    }
    const task = (await pollRes.json()) as {
      status?: string;
      failure?: string;
      output?: string[];
    };
    if (task.status === "FAILED") {
      throw new Error(`Runway task failed: ${task.failure ?? "unknown"}`);
    }
    if (task.status !== "SUCCEEDED") continue;
    const videoUrl = task.output?.[0];
    if (!videoUrl) {
      throw new Error(`Runway task succeeded without output URL: ${JSON.stringify(task)}`);
    }
    const dlRes = await fetch(videoUrl);
    if (!dlRes.ok) {
      throw new Error(`Runway video download HTTP ${dlRes.status}`);
    }
    return Buffer.from(await dlRes.arrayBuffer());
  }

  throw new Error(`Runway task timed out: ${id}`);
}

async function main(): Promise<void> {
  loadDotEnvIfPresent();
  const opts = parseVideoCliArgs(process.argv.slice(2));
  const manifest = generateMediaManifest();
  const allSpecs =
    opts.visitorId === "OP-09" ||
    opts.visitorId === "operator09" ||
    process.argv.includes("--include-night5")
      ? [...manifest.videoClips, ...manifest.night5VideoClips]
      : manifest.videoClips;
  const selected = filterVideoSpecs(allSpecs, opts);

  if (selected.length === 0) {
    console.error("✗ No video clip specs matched the given --visitor / --state filter.");
    process.exitCode = 1;
    return;
  }

  const provider = detectProvider(opts.provider);

  if (opts.dryRun) {
    console.log(
      `[DRY RUN] Provider=${provider ?? "unconfigured (set GEMINI_API_KEY | FAL_KEY | RUNWAYML_API_SECRET)"} · Clips=${selected.length}`
    );
    for (const item of selected) {
      console.log(
        `  • ${item.visitorId} [${item.state}] ${item.firstFramePortrait} -> ${item.referenceEndFrame} => ${item.targetMp4}`
      );
    }
    return;
  }

  if (!provider) {
    console.error(
      [
        "✗ Missing AI Video Model API key. Configure ONE of the following in .env.local:",
        "  1. Google Veo (Recommended, shares Gemini key with ordamor): GEMINI_API_KEY=...",
        "  2. Kling 2.0 / Wan 2.1 via Fal.ai:                           FAL_KEY=...",
        "  3. Runway Gen-4 Turbo:                                       RUNWAYML_API_SECRET=...",
        "",
        "Tip: preview the queue anytime without keys via: pnpm media:videos -- --dry-run"
      ].join("\n")
    );
    process.exitCode = 1;
    return;
  }

  let rendered = 0;
  let skipped = 0;

  for (const spec of selected) {
    const outMp4 = path.resolve(process.cwd(), spec.targetMp4);
    if (!opts.force && fs.existsSync(outMp4) && fs.statSync(outMp4).size > 4096) {
      skipped += 1;
      console.log(`↷ Skip existing ${spec.targetMp4}`);
      continue;
    }

    fs.mkdirSync(path.dirname(outMp4), { recursive: true });
    console.log(
      `⏳ [${rendered + 1}/${selected.length}] Rendering ${spec.visitorId} (${spec.slug}/${spec.state}) via ${provider.toUpperCase()}...`
    );

    let rawBytes: Buffer;
    if (provider === "veo") {
      rawBytes = await generateViaVeo(spec, opts.withEndFrame);
    } else if (provider === "fal") {
      rawBytes = await generateViaFal(spec, opts.withEndFrame);
    } else {
      rawBytes = await generateViaRunway(spec);
    }

    const tmpRaw = `${outMp4}.raw.mp4`;
    fs.writeFileSync(tmpRaw, rawBytes);
    normalizeMp4IfPossible(tmpRaw, outMp4);
    const finalSizeKb = Math.round(fs.statSync(outMp4).size / 1024);
    rendered += 1;
    console.log(`✓ Saved ${spec.targetMp4} (${finalSizeKb} KB)`);
  }

  console.log(`Done: rendered=${rendered}, skipped=${skipped}, provider=${provider}`);
}

const isDirectCli =
  process.argv[1] && path.resolve(process.argv[1]).endsWith("generate-videos.ts");
if (isDirectCli) {
  void main().catch((err: unknown) => {
    console.error("✗ Video batch generation failed:", err);
    process.exitCode = 1;
  });
}
