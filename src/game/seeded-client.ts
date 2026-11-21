import {
  loadGeneratedVisitorsBySeed,
  saveGeneratedVisitorsBySeed
} from "./db.js";
import {
  generateProceduralVisitors,
  validateGeneratedVisitorSpec
} from "./seeded-visitors.js";
import type { Locale, VisitorSpec } from "./types.js";

export interface LoadSeededVisitorsResult {
  seed: string;
  visitors: VisitorSpec[];
  source: "idb_cache" | "llm" | "procedural_fallback";
  model?: string;
}

function cacheKey(seed: string, locale: Locale): string {
  return `${locale}:${seed.trim()}`;
}

/**
 * Loads or generates an 8-survivor Ordamor roster for `seed`.
 * 1. Checks client IndexedDB `generated_visitors` store first (0ms, zero API cost).
 * 2. When `allowOnline` is true, requests `/api/generate-visitors` (Vercel AI Gateway `anthropic/claude-sonnet-5.5`),
 *    validates all 8 visitors against Ordamor schemaVersion 6 invariants, and caches them in IndexedDB.
 * 3. Falls back deterministically to `generateProceduralVisitors(seed)` when offline or on error.
 */
export async function loadOrGenerateSeededVisitors(opts: {
  seed: string;
  locale: Locale;
  allowOnline: boolean;
  endpoint?: string;
  fetchImpl?: typeof fetch;
}): Promise<LoadSeededVisitorsResult> {
  const cleanSeed = opts.seed.trim() || "SVALBARD-2036";
  const key = cacheKey(cleanSeed, opts.locale);

  const cached = await loadGeneratedVisitorsBySeed(key);
  if (
    cached &&
    Array.isArray(cached.visitors) &&
    cached.visitors.length === 8 &&
    cached.visitors.every((v) => validateGeneratedVisitorSpec(v).ok)
  ) {
    return {
      seed: cleanSeed,
      visitors: cached.visitors,
      source: "idb_cache"
    };
  }

  if (opts.allowOnline) {
    const fetchFn = opts.fetchImpl ?? globalThis.fetch;
    const endpoint = opts.endpoint ?? "/api/generate-visitors";
    try {
      const res = await fetchFn(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed: cleanSeed, locale: opts.locale })
      });
      if (res.ok) {
        const data = (await res.json()) as {
          ok?: boolean;
          source?: "llm" | "procedural_fallback";
          model?: string;
          visitors?: VisitorSpec[];
        };
        if (
          data.ok &&
          Array.isArray(data.visitors) &&
          data.visitors.length === 8 &&
          data.visitors.every((v) => validateGeneratedVisitorSpec(v).ok)
        ) {
          void saveGeneratedVisitorsBySeed({
            seed: key,
            createdAt: new Date().toISOString(),
            visitors: data.visitors
          });
          return {
            seed: cleanSeed,
            visitors: data.visitors,
            source: data.source === "llm" ? "llm" : "procedural_fallback",
            model: data.model
          };
        }
      }
    } catch {
      // Seamless fallback below
    }
  }

  const procedural = generateProceduralVisitors(cleanSeed);
  void saveGeneratedVisitorsBySeed({
    seed: key,
    createdAt: new Date().toISOString(),
    visitors: procedural
  });
  return {
    seed: cleanSeed,
    visitors: procedural,
    source: "procedural_fallback"
  };
}
