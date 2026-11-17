import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Syncs pure, zero-dependency Persona Engine modules from a sibling `ordamor` checkout
 * (`ORDAMOR_DIR` or `../ordamor`) into `src/ordamor/` and verifies SHA-256 parity.
 */
const repoRoot = resolve(import.meta.dirname, "..");
const ordamorDir = resolve(process.env.ORDAMOR_DIR ?? resolve(repoRoot, "../ordamor"));

const FILES = ["constants.ts", "types.ts", "derive.ts", "crystal.ts"] as const;

if (!existsSync(ordamorDir)) {
  console.error(`Ordamor checkout not found at ${ordamorDir}. Set ORDAMOR_DIR=/path/to/ordamor.`);
  process.exit(1);
}

const sha = (buf: Buffer) => createHash("sha256").update(buf).digest("hex").slice(0, 12);

for (const file of FILES) {
  const src = resolve(ordamorDir, "src/persona", file);
  const dst = resolve(repoRoot, "src/ordamor", file);
  const content = readFileSync(src);
  writeFileSync(dst, content);
  console.log(`✓ Synced src/ordamor/${file} (${sha(content)})`);
}
