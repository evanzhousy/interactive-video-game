import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

interface DriveEntry {
  id: string;
  name: string;
  mimeType: string;
}

const DEFAULT_DRIVE_ACCOUNT = "public@tfsharedspace.com";

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

function extractFiles(payload: unknown): DriveEntry[] {
  if (Array.isArray(payload)) return payload as DriveEntry[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.files)) return obj.files as DriveEntry[];
    if (Array.isArray(obj.items)) return obj.items as DriveEntry[];
  }
  return [];
}

function syncFolderRecursive(folderId: string, localDir: string): number {
  fs.mkdirSync(localDir, { recursive: true });
  const entries = extractFiles(gdriveJson(["readonly", "ls", folderId, "--max", "200"]));
  let count = 0;

  for (const entry of entries) {
    if (entry.mimeType === "application/vnd.google-apps.folder") {
      count += syncFolderRecursive(entry.id, path.join(localDir, entry.name));
    } else if (entry.name.endsWith(".mp4") || entry.name.endsWith(".webm")) {
      const outFile = path.join(localDir, entry.name);
      execFileSync("gdrive", ["readonly", "download", entry.id, "--out", outFile], {
        env: gdriveEnv(),
        stdio: "inherit"
      });
      console.log(`✓ Downloaded ${path.relative(process.cwd(), outFile)}`);
      count += 1;
    }
  }
  return count;
}

function main(): void {
  const argFolder = process.argv[2] || "quarantine-gate-0-videos";
  let folderId = argFolder;

  if (argFolder === "quarantine-gate-0-videos" || !/^[a-zA-Z0-9_-]{18,}$/.test(argFolder)) {
    const matches = extractFiles(
      gdriveJson(["readonly", "search", "--name-contains", argFolder])
    ).filter((f) => f.mimeType === "application/vnd.google-apps.folder");
    if (matches.length === 0) {
      console.error(
        `✗ Folder "${argFolder}" not found in Google Drive yet. Run Cell 4 of gate0_ai_video_studio.ipynb first or pass a folder ID.`
      );
      process.exitCode = 1;
      return;
    }
    folderId = matches[0]!.id;
    console.log(`Found Google Drive folder "${matches[0]!.name}" (${folderId})`);
  }

  const targetRoot = path.resolve(process.cwd(), "public/videos");
  const total = syncFolderRecursive(folderId, targetRoot);
  console.log(`✓ Synced ${total} video clip(s) into public/videos/`);
}

main();
