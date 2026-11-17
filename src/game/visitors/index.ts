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

/** Fast 3-visitor vertical slice (Night 1 -> Night 2 -> Night 4 -> Night 5) for quick demo runs. */
export const SLICE_VISITORS: readonly VisitorSpec[] = [V01_ELENA, V04_MARCUS, V07_LINMEI];

/** Default active campaign roster (all 8 survivors). */
export const VISITORS: readonly VisitorSpec[] = ALL_VISITORS;

export type CampaignMode = "full" | "slice";

export function getVisitorsForMode(mode: CampaignMode): readonly VisitorSpec[] {
  return mode === "slice" ? SLICE_VISITORS : ALL_VISITORS;
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

/**
 * Generates a randomized shift guaranteeing balanced human/mimic tension:
 * - For 8-visitor full campaigns: 3–5 mimics (at least 3 real humans for submarine crew quota,
 *   and at least 1 high-tier Night 4 mimic so the Boggart precondition trap is tested).
 * - For 3-visitor slice runs: at least 1 human and at least 1 mimic.
 */
export function rollShift(
  visitors: readonly VisitorSpec[] = VISITORS,
  rng: () => number = Math.random
): VisitorRoll[] {
  const flags = visitors.map(() => rng() < 0.5);

  if (visitors.length >= 6) {
    // Enforce 3..5 mimics across an 8-visitor campaign
    const countMimics = () => flags.filter(Boolean).length;
    while (countMimics() < 3) {
      const idx = Math.floor(rng() * flags.length);
      flags[idx] = true;
    }
    while (countMimics() > 5) {
      const idx = Math.floor(rng() * flags.length);
      flags[idx] = false;
    }
    // Guarantee at least one Night 4 visitor is a mimic so players encounter high-tier disposal/Boggart play
    const night4Indices = visitors
      .map((v, idx) => (v.night === 4 ? idx : -1))
      .filter((idx) => idx >= 0);
    if (night4Indices.length > 0 && night4Indices.every((idx) => !flags[idx])) {
      const pick = night4Indices[Math.floor(rng() * night4Indices.length)]!;
      flags[pick] = true;
      if (countMimics() > 5) {
        const earlier = flags.findIndex((f, idx) => f && !night4Indices.includes(idx));
        if (earlier >= 0) flags[earlier] = false;
      }
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
