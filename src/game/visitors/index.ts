import type { VisitorRoll, VisitorSpec } from "../types.js";
import { V01_ELENA } from "./v01-elena.js";
import { V04_MARCUS } from "./v04-marcus.js";
import { V07_LINMEI } from "./v07-linmei.js";

/** Vertical slice playable visitors (Nights 1, 2, 4). */
export const VISITORS: readonly VisitorSpec[] = [V01_ELENA, V04_MARCUS, V07_LINMEI];

/** Full 8-visitor Steam release roster specification (see docs/GDD.md §3.1). */
export const FULL_CAMPAIGN_ROSTER = [
  { id: "V-01", night: 1, name: "Dr. Elena Vance", primaryAxis: "security > fairness", status: "playable" },
  { id: "V-02", night: 1, name: "Jonas Lindqvist", primaryAxis: "security > duty", status: "planned" },
  { id: "V-03", night: 2, name: "Father Arthur", primaryAxis: "status > principle", status: "planned" },
  { id: "V-04", night: 2, name: "Capt. Marcus Chen", primaryAxis: "care > order", status: "playable" },
  { id: "V-05", night: 3, name: "Sora Takahashi", primaryAxis: "truth > loyalty", status: "planned" },
  { id: "V-06", night: 3, name: "Ingrid Solberg", primaryAxis: "order > mercy", status: "planned" },
  { id: "V-07", night: 4, name: "Dr. Lin Mei", primaryAxis: "order > truth", status: "playable" },
  { id: "V-08", night: 4, name: "Hannah Berg", primaryAxis: "autonomy > justice", status: "planned" }
] as const;

/**
 * Generates a randomized shift guaranteeing at least 1 human and at least 1 mimic
 * across the slice so every run tests both ADMIT and PURGE consequences.
 */
export function rollShift(
  visitors: readonly VisitorSpec[] = VISITORS,
  rng: () => number = Math.random
): VisitorRoll[] {
  const flags = visitors.map(() => rng() < 0.55);
  if (flags.every(Boolean)) {
    flags[Math.floor(rng() * flags.length)] = false;
  }
  if (flags.every((f) => !f)) {
    flags[flags.length - 1] = true;
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
