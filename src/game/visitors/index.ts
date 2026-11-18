import type { VisitorRoll, VisitorSpec } from "../types.js";
import { V01_ELENA } from "./v01-elena.js";
import { V02_LEO } from "./v02-leo.js";
import { V03_ARTHUR } from "./v03-arthur.js";
import { V04_MARCUS } from "./v04-marcus.js";
import { V05_ANA } from "./v05-ana.js";
import { V06_INGRID } from "./v06-ingrid.js";
import { V07_LINMEI } from "./v07-linmei.js";
import { V08_HANNAH } from "./v08-hannah.js";

/** Complete 8-survivor campaign across Nights 1–4 (2 visitors per night -> Night 5 Self-Audit). */
export const ALL_VISITORS: readonly VisitorSpec[] = [
  V01_ELENA,
  V02_LEO,
  V03_ARTHUR,
  V04_MARCUS,
  V05_ANA,
  V06_INGRID,
  V07_LINMEI,
  V08_HANNAH
];

/** Steam Demo roster (Nights 1–2, V-01..V-04 -> Night 5 cliffhanger teaser, GDD §1). */
export const DEMO_VISITORS: readonly VisitorSpec[] = [
  V01_ELENA,
  V02_LEO,
  V03_ARTHUR,
  V04_MARCUS
];

/** Fast 3-visitor vertical slice (Night 1 -> Night 2 -> Night 4 -> Night 5) for quick runs. */
export const SLICE_VISITORS: readonly VisitorSpec[] = [V01_ELENA, V04_MARCUS, V07_LINMEI];

/** Default active campaign roster (all 8 survivors). */
export const VISITORS: readonly VisitorSpec[] = ALL_VISITORS;

export type CampaignMode = "full" | "demo" | "daily" | "slice";

/**
 * Deterministic 32-bit FNV-1a + Mulberry32 PRNG for globally synchronized Daily Shifts.
 */
export function createSeededRng(seedStr: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let state = h || 0x9e3779b9;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDailyShiftSeed(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function getVisitorsForMode(
  mode: CampaignMode,
  dailySeed: string = getDailyShiftSeed()
): readonly VisitorSpec[] {
  if (mode === "slice") return SLICE_VISITORS;
  if (mode === "demo") return DEMO_VISITORS;
  if (mode === "daily") {
    const rng = createSeededRng(`order:${dailySeed}`);
    const pairs: Array<[VisitorSpec, VisitorSpec]> = [
      [V01_ELENA, V02_LEO],
      [V03_ARTHUR, V04_MARCUS],
      [V05_ANA, V06_INGRID],
      [V07_LINMEI, V08_HANNAH]
    ];
    return pairs.flatMap(([a, b]) => (rng() < 0.5 ? [a, b] : [b, a]));
  }
  return ALL_VISITORS;
}

/** Full 8-visitor Steam release roster specification (see docs/GDD.md §3.1). */
export const FULL_CAMPAIGN_ROSTER = [
  { id: "V-01", night: 1, name: "Dr. Elena Vance", primaryAxis: "security > fairness", status: "playable" },
  { id: "V-02", night: 1, name: "Leo Sato", primaryAxis: "status > truth", status: "playable" },
  { id: "V-03", night: 2, name: "Arthur Sterling", primaryAxis: "status > principle", status: "playable" },
  { id: "V-04", night: 2, name: "Capt. Marcus Chen", primaryAxis: "care > order", status: "playable" },
  { id: "V-05", night: 3, name: "Ana Ribeiro", primaryAxis: "autonomy > care", status: "playable" },
  { id: "V-06", night: 3, name: "Dr. Ingrid Solberg", primaryAxis: "achievement > mercy", status: "playable" },
  { id: "V-07", night: 4, name: "Dr. Lin Mei", primaryAxis: "order > truth", status: "playable" },
  { id: "V-08", night: 4, name: "Hannah Weiss", primaryAxis: "justice > loyalty", status: "playable" }
] as const;

const SPECIALIST_GROUPS: ReadonlyArray<readonly string[]> = [
  ["V-01", "V-06", "V-07"], // Medical
  ["V-02", "V-08"],         // Mechanic
  ["V-04", "V-05"]          // Diver
];

/**
 * Generates a randomized shift guaranteeing balanced human/mimic tension:
 * - For 8-visitor full/daily campaigns: 3–5 mimics (at least 3 real humans covering Medical,
 *   Mechanic, and Diver submarine specialist roles, plus >=1 high-tier Night 4 mimic).
 * - For 3–4 visitor slice/demo runs: at least 1 human and at least 1 mimic.
 */
export function rollShift(
  visitors: readonly VisitorSpec[] = VISITORS,
  rng: () => number = Math.random
): VisitorRoll[] {
  const flags = visitors.map(() => rng() < 0.5);

  if (visitors.length >= 6) {
    const countMimics = () => flags.filter(Boolean).length;

    // 1. Guarantee at least one Night 4 visitor is a mimic so players face high-tier Boggart play
    const night4Indices = visitors
      .map((v, idx) => (v.night === 4 ? idx : -1))
      .filter((idx) => idx >= 0);
    if (night4Indices.length > 0 && night4Indices.every((idx) => !flags[idx])) {
      const pick = night4Indices[Math.floor(rng() * night4Indices.length)]!;
      flags[pick] = true;
    }

    // 2. Guarantee at least 1 real human in each critical submarine specialist group (Medical, Mechanic, Diver)
    //    Notice V-07 (Medical) and V-08 (Mechanic) are Night 4: if V-08 is the sole Night 4 mimic, V-02 (Mechanic) can be human!
    const protectedHumanIdx = new Set<number>();
    for (const group of SPECIALIST_GROUPS) {
      const groupIndices = visitors
        .map((v, idx) => (group.includes(v.id) ? idx : -1))
        .filter((idx) => idx >= 0);
      if (groupIndices.length === 0) continue;

      let humanIdx = groupIndices.find((idx) => !flags[idx]);
      if (humanIdx === undefined) {
        // Prefer flipping a non-sole-Night-4 mimic back to human
        const candidates = groupIndices.filter((idx) => {
          if (visitors[idx]!.night !== 4) return true;
          const otherNight4Mimics = night4Indices.filter((nIdx) => nIdx !== idx && flags[nIdx]);
          return otherNight4Mimics.length > 0;
        });
        const pool = candidates.length > 0 ? candidates : groupIndices;
        humanIdx = pool[Math.floor(rng() * pool.length)]!;
        flags[humanIdx] = false;
      }
      protectedHumanIdx.add(humanIdx);
    }

    // 3. Enforce 3..5 total mimics without breaking specialist human guarantees or Night 4 mimic guarantee
    let guard = 0;
    while (countMimics() < 3 && guard++ < 40) {
      const candidates = flags
        .map((isM, idx) => (!isM && !protectedHumanIdx.has(idx) ? idx : -1))
        .filter((idx) => idx >= 0);
      if (candidates.length === 0) break;
      const pick = candidates[Math.floor(rng() * candidates.length)]!;
      flags[pick] = true;
    }

    guard = 0;
    while (countMimics() > 5 && guard++ < 40) {
      const candidates = flags
        .map((isM, idx) => {
          if (!isM) return -1;
          if (visitors[idx]!.night === 4) {
            const otherN4 = night4Indices.filter((nIdx) => nIdx !== idx && flags[nIdx]);
            if (otherN4.length === 0) return -1;
          }
          return idx;
        })
        .filter((idx) => idx >= 0);
      if (candidates.length === 0) break;
      const pick = candidates[Math.floor(rng() * candidates.length)]!;
      flags[pick] = false;
    }
  } else {
    if (flags.every(Boolean)) {
      flags[Math.floor(rng() * flags.length)] = false;
    }
    if (flags.every((f) => !f)) {
      flags[flags.length - 1] = true;
    }
  }

  return visitors.map((v, idx) => {
    const isMimic = Boolean(flags[idx]);
    const pool = v.defectPool;
    const picked = pool[Math.floor(rng() * pool.length)] ?? "LOW_SELF_NARRATIVE";
    return {
      visitorId: v.id,
      isMimic,
      defectMode: isMimic ? picked : "HUMAN"
    };
  });
}

export function rollShiftForMode(
  mode: CampaignMode,
  visitors: readonly VisitorSpec[],
  dailySeed: string = getDailyShiftSeed()
): VisitorRoll[] {
  if (mode === "daily") {
    return rollShift(visitors, createSeededRng(`rolls:${dailySeed}`));
  }
  return rollShift(visitors);
}
