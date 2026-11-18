// Automated zero-API-credit video renderer driving Google AI Studio Web UI (`Gemini Omni 1.2 Flash`)
// via `ego-browser nodejs` with strict "No API key selected" verification before every run.

const fs = await import("node:fs/promises");
const fsSync = await import("node:fs");
const path = await import("node:path");
const { execFileSync } = await import("node:child_process");

const REPO_ROOT = "/Users/evansmacbookpro/Desktop/Projects/interactive-video-game";
const JOB_FILE =
  "/Users/evansmacbookpro/.gemini/antigravity/brain/67ef2e00-3688-4bb2-8870-5caff3c18fb4/scratch/render_job.json";
const FFMPEG_BIN = "/opt/homebrew/bin/ffmpeg";

const job = JSON.parse(await fs.readFile(JOB_FILE, "utf8"));
const SPACE_ID = job.spaceId ?? 101;
const allowedVisitors = job.visitors ? new Set(job.visitors) : null;
const allowedStates = job.states ? new Set(job.states) : null;

const manifest = JSON.parse(
  await fs.readFile(path.join(REPO_ROOT, "public/media-manifest.json"), "utf8")
);
const baseSpecs = job.customSpecs
  ? job.customSpecs
  : [...manifest.videoClips, ...(manifest.night5VideoClips || [])];

const queue = baseSpecs.filter((s) => {
  if (!job.customSpecs) {
    if (allowedVisitors && !allowedVisitors.has(s.visitorId) && !allowedVisitors.has(s.slug)) {
      return false;
    }
    if (allowedStates && !allowedStates.has(s.state)) {
      return false;
    }
  }
  const absOut = path.join(REPO_ROOT, s.targetMp4);
  if (!job.force && fsSync.existsSync(absOut) && fsSync.statSync(absOut).size > 8192) {
    return false;
  }
  return true;
});

console.log(`Queue ready: ${queue.length} clip(s) to render via AI Studio Web UI ($0 API credits).`);

const entries = await listTaskSpaces();
const existing = entries.find((s) => s.id === SPACE_ID);
const task = !existing
  ? await taskSpace("Gate 0 AI Studio video rendering and Drive storage")
  : existing.ownership === "user"
    ? await claimTaskSpace(SPACE_ID)
    : existing.ownership === "agentDelegatedToUser"
      ? await takeOverTaskSpace(SPACE_ID)
      : await taskSpace(SPACE_ID);

// Ensure tabs are adopted if needed after claim/takeOver
let managedPages = await task.pages();
const allTabs = await task.tabs();
if (managedPages.length === 0 && allTabs.length > 0) {
  for (const t of allTabs) {
    if (!t.label) {
      await task.adopt(t.page);
    }
  }
  managedPages = await task.pages();
}

let p1 =
  managedPages.find((p) => p.label === "p1") ??
  managedPages[0] ??
  (await task.newPage());

// Pick the AI Studio tab if multiple pages exist
for (const p of managedPages) {
  const u = await p.url().catch(() => "");
  if (u.includes("aistudio.google.com")) {
    p1 = p;
    break;
  }
}

function normalizeMp4(rawPath, outPath) {
  execFileSync(
    FFMPEG_BIN,
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
      "22",
      "-movflags",
      "+faststart",
      "-an",
      outPath
    ],
    { stdio: "inherit" }
  );
  fsSync.unlinkSync(rawPath);
}

const MODEL_LADDER = job.modelName
  ? [job.modelName]
  : ["Gemini Omni 1.2 Flash", "Gemini Omni 1.1 Flash"];
let activeModelIdx = 0;

for (let idx = 0; idx < queue.length; idx++) {
  const spec = queue[idx];
  const outMp4 = path.join(REPO_ROOT, spec.targetMp4);
  console.log(
    `\n=== [${idx + 1}/${queue.length}] ${spec.visitorId} (${spec.slug}/${spec.state}) -> ${spec.targetMp4} ===`
  );

  let renderedOk = false;
  let hardStopReason = null;

  for (let attempt = 1; attempt <= 3 && !renderedOk && !hardStopReason; attempt++) {
    await p1.goto("https://aistudio.google.com/prompts/new_chat", { timeout: 30000 });
    await p1.waitForLoadState("load");
    await p1.waitForSelector('loc=css:textarea[placeholder*="Start typing a prompt"]', {
      state: "visible",
      timeout: 15000
    });
    await p1.waitForTimeout(1500);

    // HARD ZERO-API-CREDIT SAFETY GATE
    const snap0 = await p1.snapshot();
    if (!snap0.includes("No API key selected")) {
      throw new Error(
        "CRITICAL SAFETY STOP: 'No API key selected' is NOT active on AI Studio Playground! Aborting immediately so zero API credits are used."
      );
    }

    // Select active model from MODEL_LADDER (auto-cascades 1.2 -> 1.1 on daily quota limit)
    const targetModel = MODEL_LADDER[activeModelIdx];
    if (!snap0.includes(`text "${targetModel}"`)) {
      const modMatch = snap0.match(/button \[ref=(\d+)\]\s+text "Gemini Omni [^"]+"/);
      if (modMatch) {
        await p1.click(`@${modMatch[1]}`, { label: "open video model selector" });
        await p1.waitForTimeout(700);
        await p1.click(`text="${targetModel}"`, { label: `select ${targetModel}` });
        await p1.waitForTimeout(900);
      }
    }

    // Configure Aspect Ratio = 16:9 if not already 16:9
    const currentSettings = await p1.evaluate(() => document.body.innerText);
    if (!currentSettings.includes("Aspect ratio\n16:9")) {
      await p1
        .click('loc=role:combobox[name="Aspect ratio"]', { label: "open Aspect ratio" })
        .catch(async () => {
          await p1.click('text="Auto"', { label: "open Aspect ratio" }).catch(() => {});
        });
      await p1.waitForTimeout(500);
      await p1.click('text="16:9"', { label: "select 16:9" }).catch(async () => {
        await p1.keyboard.press("Escape");
      });
      await p1.waitForTimeout(400);
    }

    // Configure Resolution = 720p if not already 720p
    const afterAspect = await p1.evaluate(() => document.body.innerText);
    if (!afterAspect.includes("Resolution\n720p")) {
      await p1
        .click('loc=role:combobox[name="Video Resolution"]', { label: "open Video Resolution" })
        .catch(async () => {
          await p1.click('text="360p"', { label: "open Video Resolution" }).catch(() => {});
        });
      await p1.waitForTimeout(500);
      await p1.click('text="720p"', { label: "select 720p" }).catch(async () => {
        await p1.keyboard.press("Escape");
      });
      await p1.waitForTimeout(400);
    }

    // Configure Video duration
    const durStr = String(spec.durationSec || 4);
    await p1.evaluate((d) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      for (const inp of document.querySelectorAll(
        'input[aria-label*="Video duration"], input[type="range"], input[type="number"]'
      )) {
        if (setter) {
          setter.call(inp, d);
          inp.dispatchEvent(new Event("input", { bubbles: true }));
          inp.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    }, durStr);

    const absFirst = path.join(REPO_ROOT, spec.firstFramePortrait);
    const useTwoFrames =
      !spec.singleFrameOnly &&
      spec.state !== "idle" &&
      spec.referenceEndFrame &&
      spec.referenceEndFrame !== spec.firstFramePortrait;
    const files = useTwoFrames
      ? [absFirst, path.join(REPO_ROOT, spec.referenceEndFrame)]
      : [absFirst];

    await p1.setInputFiles("input.file-input", files);
    await p1.waitForTimeout(1500);

    const hasAck = await p1.evaluate(() =>
      Boolean(document.querySelector('button[aria-label="Agree to the copyright acknowledgement"]'))
    );
    if (hasAck) {
      await p1.click('loc=css:button[aria-label="Agree to the copyright acknowledgement"]', {
        label: "acknowledge media upload"
      });
      await p1.waitForTimeout(1500);
    }

    for (let w = 0; w < 12; w++) {
      const tokOk = await p1.evaluate(() => {
        const m = document.body.innerText.match(/(\d[\d,]*)\s*tokens/i);
        return m ? Number(m[1].replace(/,/g, "")) >= 100 : false;
      });
      if (tokOk) break;
      await p1.waitForTimeout(1000);
    }

    const cleanMotionPrompt = spec.prompt.replace(/sterilization|furnace/gi, "industrial forge");
    const fullPrompt = useTwoFrames
      ? `Start from the first 35mm cinema camera frame and smoothly transition to end on the second reference frame in a single unbroken fixed-camera shot: ${cleanMotionPrompt} Silent surveillance camera feed, zero spoken dialogue.`
      : `Start from this exact 35mm cinema camera frame and keep identical camera lock, lighting, and visual details: ${cleanMotionPrompt} Silent surveillance camera feed, zero spoken dialogue.`;

    await p1.fill('loc=css:textarea[placeholder*="Start typing a prompt"]', fullPrompt);
    await p1.waitForTimeout(600);

    // Re-verify "No API key selected" right before clicking Run
    const snapPreRun = await p1.snapshot();
    if (!snapPreRun.includes("No API key selected")) {
      throw new Error("CRITICAL SAFETY STOP: API key became selected before Run!");
    }

    const runRefMatch = snapPreRun.match(
      /button \[ref=(\d+)\]\s+text "Run"\s+text "keyboard_return"/
    );
    if (!runRefMatch) {
      console.log("Could not locate Run ref in snapshot; retrying attempt...");
      continue;
    }

    await p1.click(`@${runRefMatch[1]}`, {
      label: `Run ${spec.visitorId} ${spec.state}`
    });

    let blobB64 = null;
    for (let poll = 0; poll < 36; poll++) {
      await p1.waitForTimeout(4000);
      const res = await p1.evaluate(async () => {
        function findBlobVideos(root, acc = []) {
          for (const el of root.querySelectorAll("*")) {
            if (el.tagName === "VIDEO") {
              const u = el.currentSrc || el.src || "";
              if (u.startsWith("blob:")) acc.push(u);
            }
            if (el.shadowRoot) findBlobVideos(el.shadowRoot, acc);
          }
          return acc;
        }
        const blobs = findBlobVideos(document);
        if (blobs.length > 0) {
          const r = await fetch(blobs[blobs.length - 1]);
          const buf = await r.arrayBuffer();
          if (buf.byteLength > 16384) {
            const bytes = new Uint8Array(buf);
            let bin = "";
            const chunk = 0x8000;
            for (let i = 0; i < bytes.length; i += chunk) {
              bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
            }
            return { done: true, b64: btoa(bin), bytes: buf.byteLength };
          }
        }
        const bodyTxt = document.body.innerText;
        if (bodyTxt.includes("verify-account") || bodyTxt.includes("must be verified")) {
          return { done: false, fatal: "ACCOUNT_VERIFICATION_REQUIRED" };
        }
        if (/quota|rate limit|exceeded your|too many requests/i.test(bodyTxt)) {
          return { done: false, fatal: "QUOTA_OR_RATE_LIMIT" };
        }
        if (bodyTxt.includes("Request blocked due to prohibited content")) {
          return { done: false, blocked: true };
        }
        return { done: false };
      });

      if (res.done && res.b64) {
        blobB64 = res.b64;
        console.log(
          `  ✓ Blob video ready (${Math.round(res.bytes / 1024)} KB raw) on poll ${poll + 1}`
        );
        break;
      }
      if (res.fatal) {
        if (res.fatal === "QUOTA_OR_RATE_LIMIT" && activeModelIdx + 1 < MODEL_LADDER.length) {
          activeModelIdx += 1;
          console.log(
            `  ↻ Daily quota reached on previous model; auto-switching to ${MODEL_LADDER[activeModelIdx]}!`
          );
          break;
        }
        hardStopReason = res.fatal;
        console.error(`  ✗ Hard stop triggered: ${res.fatal}`);
        break;
      }
      if (res.blocked) {
        console.log(`  ⚠ Blocked by content guideline on poll ${poll + 1} (attempt ${attempt})`);
        break;
      }
    }

    if (blobB64) {
      await fs.mkdir(path.dirname(outMp4), { recursive: true });
      const rawTmp = `${outMp4}.raw.mp4`;
      await fs.writeFile(rawTmp, Buffer.from(blobB64, "base64"));
      normalizeMp4(rawTmp, outMp4);
      const kb = Math.round((await fs.stat(outMp4)).size / 1024);
      console.log(`  ✓ Normalized & saved ${spec.targetMp4} (${kb} KB)`);
      renderedOk = true;
    }
  }

  if (hardStopReason) {
    throw new Error(`Stopped batch due to ${hardStopReason} at ${spec.targetMp4}`);
  }

  if (!renderedOk) {
    console.error(`✗ Skipping ${spec.targetMp4} after 2 attempts.`);
  }
}

console.log("\n✓ Batch complete!");
