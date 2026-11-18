import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DEFAULT_DRIVE_ACCOUNT = "public@tfsharedspace.com";

interface DriveEntry {
  id: string;
  name: string;
  mimeType: string;
  size?: string | number;
}

function gdriveEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    AGY_ACCOUNT: process.env.AGY_ACCOUNT || DEFAULT_DRIVE_ACCOUNT
  };
}

function gdriveJson(args: string[]): unknown {
  const out = execFileSync("gdrive", [...args, "--json"], {
    encoding: "utf8",
    env: gdriveEnv(),
    maxBuffer: 16 * 1024 * 1024
  });
  return JSON.parse(out);
}

function gdriveText(args: string[]): string {
  return execFileSync("gdrive", args, {
    encoding: "utf8",
    env: gdriveEnv(),
    maxBuffer: 16 * 1024 * 1024
  });
}

function extractFiles(payload: unknown): DriveEntry[] {
  if (Array.isArray(payload)) return payload as DriveEntry[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.files)) return obj.files as DriveEntry[];
    if (Array.isArray(obj.items)) return obj.items as DriveEntry[];
  }
  return [];
}

function ensureFolder(name: string, parentId?: string): string {
  const searchArgs = ["readonly", "search", "--name-exact", name];
  if (parentId) {
    searchArgs.push("--parent-id", parentId);
  }
  const existing = extractFiles(gdriveJson(searchArgs)).filter(
    (f) => f.mimeType === "application/vnd.google-apps.folder"
  );
  if (existing.length > 0) {
    return existing[0]!.id;
  }

  const mkdirArgs = ["mutate", "mkdir", name];
  if (parentId) {
    mkdirArgs.push("--parent", parentId);
  }
  const out = gdriveText(mkdirArgs);
  const match = out.match(/ID:\s*([A-Za-z0-9_-]+)/);
  if (!match?.[1]) {
    throw new Error(`Could not parse folder ID from gdrive mkdir output: ${out}`);
  }
  return match[1];
}

function upsertFile(localFile: string, parentId: string, force: boolean): "uploaded" | "updated" | "skipped" {
  const fileName = path.basename(localFile);
  const localSize = fs.statSync(localFile).size;
  const children = extractFiles(gdriveJson(["readonly", "ls", parentId, "--max", "200"]));
  const existing = children.find(
    (c) => c.name === fileName && c.mimeType !== "application/vnd.google-apps.folder"
  );

  if (existing) {
    const remoteSize = existing.size !== undefined ? Number(existing.size) : -1;
    if (!force && remoteSize === localSize) {
      return "skipped";
    }
    gdriveText(["mutate", "update", existing.id, localFile]);
    return "updated";
  }

  gdriveText(["mutate", "upload", localFile, "--parent", parentId]);
  return "uploaded";
}

function buildMasterArchive(zipPath: string): void {
  execFileSync(
    "python3",
    [
      "-c",
      [
        "import zipfile, pathlib, sys",
        "out = pathlib.Path(sys.argv[1])",
        "with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:",
        "    for folder in ('public/videos', 'public/portraits', 'public/audio'):",
        "        p = pathlib.Path(folder)",
        "        if p.exists():",
        "            for f in sorted(p.rglob('*')):",
        "                if f.is_file():",
        "                    zf.write(f, f.relative_to('public'))",
        "    zf.write('public/media-manifest.json', 'media-manifest.json')"
      ].join("\n"),
      zipPath
    ],
    { stdio: "inherit" }
  );
}

function main(): void {
  const force = process.argv.includes("--force");
  const account = process.env.AGY_ACCOUNT || DEFAULT_DRIVE_ACCOUNT;
  console.log(`☁️ Syncing Gate 0 assets to Google Drive (${account})...`);

  const videosRootId = ensureFolder("quarantine-gate-0-videos");
  const assetsRootId = ensureFolder("quarantine-gate-0-assets");
  console.log(`  • quarantine-gate-0-videos: ${videosRootId}`);
  console.log(`  • quarantine-gate-0-assets: ${assetsRootId}`);

  const localVideosDir = path.resolve(process.cwd(), "public/videos");
  let uploaded = 0;
  let updated = 0;
  let skipped = 0;

  if (fs.existsSync(localVideosDir)) {
    for (const slug of fs.readdirSync(localVideosDir).sort()) {
      const slugDir = path.join(localVideosDir, slug);
      if (!fs.statSync(slugDir).isDirectory()) continue;
      const slugFolderId = ensureFolder(slug, videosRootId);

      for (const file of fs.readdirSync(slugDir).sort()) {
        if (!file.endsWith(".mp4") && !file.endsWith(".webm")) continue;
        const fullPath = path.join(slugDir, file);
        const action = upsertFile(fullPath, slugFolderId, force);
        if (action === "uploaded") uploaded += 1;
        else if (action === "updated") updated += 1;
        else skipped += 1;
        if (action !== "skipped") {
          console.log(`  ✓ [${action}] videos/${slug}/${file}`);
        }
      }
    }
  }

  // Upsert media-manifest.json + full master zip in quarantine-gate-0-assets
  const manifestPath = path.resolve(process.cwd(), "public/media-manifest.json");
  if (fs.existsSync(manifestPath)) {
    upsertFile(manifestPath, assetsRootId, true);
  }

  const tmpZip = path.join(os.tmpdir(), "quarantine-gate-0-full-assets.zip");
  try {
    buildMasterArchive(tmpZip);
    const zipAction = upsertFile(tmpZip, assetsRootId, true);
    const mb = (fs.statSync(tmpZip).size / (1024 * 1024)).toFixed(2);
    console.log(`  ✓ [${zipAction}] quarantine-gate-0-full-assets.zip (${mb} MB)`);
  } finally {
    if (fs.existsSync(tmpZip)) {
      fs.unlinkSync(tmpZip);
    }
  }

  console.log(
    `✓ Drive sync complete (${account}): videos uploaded=${uploaded}, updated=${updated}, skipped=${skipped}`
  );
}

main();
