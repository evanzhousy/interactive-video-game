import { VALUE_TOKENS, otherValue, valuePairKey } from "./constants.js";
import type { PersonaProfile, ValueOrdering, ValueToken } from "./types.js";

/**
 * What the profile page's 心智晶体 draws: the value face (who beat whom, and the outline that
 * makes) and the timeline (when the evidence for each ordering happened in the subject's story).
 *
 * Derived from the active orderings and the observations every time, like derive.ts, so the
 * picture cannot drift from the evidence it shows. Nothing here scores the subject anew: the only
 * numbers are the orderings' own confidences, added up.
 *
 * Pure and dependency-free so the browser bundle can use it.
 */

export type ValueFamily = "self" | "bond" | "rule";

export const VALUE_FAMILY_LABELS: Record<ValueFamily, string> = {
  self: "自我",
  bond: "关系",
  rule: "规则",
};

/**
 * Where each value sits on the face, in degrees clockwise from twelve o'clock. The three families
 * take one arc each with a gap between them, so an outline that leans reads as leaning towards the
 * self, the people around, or the rules. Within an arc, related values are neighbours: 名声 beside
 * 成就, 关怀 beside 宽宥, 追责 beside 公平, 秩序 beside 自保 across the gap.
 */
export const FACE_LAYOUT: ReadonlyArray<{ token: ValueToken; family: ValueFamily; angle: number }> = [
  { token: "security", family: "self", angle: -33.75 },
  { token: "status", family: "self", angle: -11.25 },
  { token: "achievement", family: "self", angle: 11.25 },
  { token: "autonomy", family: "self", angle: 33.75 },
  { token: "loyalty", family: "bond", angle: 78.75 },
  { token: "duty", family: "bond", angle: 101.25 },
  { token: "care", family: "bond", angle: 123.75 },
  { token: "mercy", family: "bond", angle: 146.25 },
  { token: "justice", family: "rule", angle: 191.25 },
  { token: "fairness", family: "rule", angle: 213.75 },
  { token: "truth", family: "rule", angle: 236.25 },
  { token: "principle", family: "rule", angle: 258.75 },
  { token: "order", family: "rule", angle: 281.25 },
];

export function activeOrderings(profile: PersonaProfile): ValueOrdering[] {
  return (profile.valueOrderings ?? []).filter((o) => o.status === "active");
}

export interface ValueScore {
  /** + the ordering's confidence each time the value won, − each time it gave way. */
  net: number;
  wins: number;
  losses: number;
  /** The orderings it took part in. */
  orderings: string[];
}

export type ValueScores = Record<ValueToken, ValueScore>;

/**
 * Net wins per value over the active orderings, optionally only those `keep` accepts (a time
 * window). A value no ordering touched stays at zero with no orderings: that means "no evidence",
 * which the face draws differently from a value that won and lost equally.
 */
export function scoreValues(profile: PersonaProfile, keep: (o: ValueOrdering) => boolean = () => true): ValueScores {
  const scores = Object.fromEntries(
    VALUE_TOKENS.map((token) => [token, { net: 0, wins: 0, losses: 0, orderings: [] as string[] }])
  ) as ValueScores;
  for (const o of activeOrderings(profile)) {
    if (!keep(o)) continue;
    const won = scores[o.winner];
    const lost = scores[otherValue(o.pair, o.winner)];
    won.net += o.confidence;
    won.wins += 1;
    won.orderings.push(o.id);
    lost.net -= o.confidence;
    lost.losses += 1;
    lost.orderings.push(o.id);
  }
  return scores;
}

export type ValueTone = "win" | "lose" | "even" | "none";

export function valueTone(score: ValueScore): ValueTone {
  if (score.wins + score.losses === 0) return "none";
  return score.net > 0.005 ? "win" : score.net < -0.005 ? "lose" : "even";
}

export interface Chord {
  ordering: ValueOrdering;
  /** The value given up. */
  from: ValueToken;
  /** The value kept. */
  to: ValueToken;
  /** 0 for the first ordering over this pair, 1 for the next: drawn apart so they do not overlap. */
  lane: number;
  /** The first disposal signature this ordering is an instance of, or -1. */
  signature: number;
}

export function crystalChords(profile: PersonaProfile): Chord[] {
  const lanes = new Map<string, number>();
  const signatures = profile.disposalSignatures ?? [];
  return activeOrderings(profile).map((ordering) => {
    const key = valuePairKey(ordering.pair);
    const lane = lanes.get(key) ?? 0;
    lanes.set(key, lane + 1);
    return {
      ordering,
      from: otherValue(ordering.pair, ordering.winner),
      to: ordering.winner,
      lane,
      signature: signatures.findIndex((s) => s.instances.includes(ordering.id)),
    };
  });
}

/* ---------------------------------------------------------------------------------------------
 * Story time. Observations carry no date field, but their text usually says when: 1948 年 12 月,
 * 第 16 回, 第一幕第二场. The timeline uses whichever of these most observations have, and falls
 * back to the order of the material, which is the order the story was told in.
 * ------------------------------------------------------------------------------------------- */

export type StoryTimeKind = "year" | "chapter" | "act" | "order";

export interface StoryMark {
  kind: Exclude<StoryTimeKind, "order">;
  /** A position on that kind's axis: 1948.96 for December 1948, 16 for 第16回, 1.2 for 一幕二场. */
  at: number;
}

/** Below this share of marked observations, the marks are too sparse to place the rest. */
export const MIN_MARKED_SHARE = 0.3;

const CHINESE_DIGITS: Record<string, number> = {
  零: 0, 〇: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};

/** 16, 十六, 四十一, 一百零五 → a number; anything else → null. */
export function chineseNumber(text: string): number | null {
  if (/^\d+$/.test(text)) return Number(text);
  let total = 0;
  let digit = 0;
  for (const ch of text) {
    if (ch === "百") {
      total += (digit || 1) * 100;
      digit = 0;
    } else if (ch === "十") {
      total += (digit || 1) * 10;
      digit = 0;
    } else if (ch in CHINESE_DIGITS) {
      digit = CHINESE_DIGITS[ch]!;
    } else {
      return null;
    }
  }
  const value = total + digit;
  return value > 0 ? value : null;
}

export function parseStoryMark(text: string): StoryMark | null {
  const year = /(\d{4})\s*年\s*(?:(\d{1,2})\s*月)?/.exec(text);
  if (year) {
    const y = Number(year[1]);
    const month = year[2] ? Number(year[2]) : 0;
    if (y >= 1000 && y <= 2999) {
      // Mid-year when only the year is known; mid-month when the month is.
      return { kind: "year", at: y + (month >= 1 && month <= 12 ? (month - 0.5) / 12 : 0.5) };
    }
  }
  const chapter = /^第([零〇一二三四五六七八九十百\d]+)回/.exec(text);
  if (chapter) {
    const n = chineseNumber(chapter[1]!);
    if (n) return { kind: "chapter", at: n };
  }
  const act = /^第([一二三四五])幕(?:第([一二三四五六七八九十]+)场)?/.exec(text);
  if (act) {
    const n = chineseNumber(act[1]!)!;
    const scene = act[2] ? chineseNumber(act[2]) : null;
    return { kind: "act", at: n + (scene ? Math.min(scene, 9) / 10 : 0.05) };
  }
  return null;
}

export interface StorySpan {
  /** Where each piece of the ordering's evidence falls. */
  at: number[];
  from: number;
  to: number;
}

export interface StoryTime {
  kind: StoryTimeKind;
  /** Every observation's position on the axis. */
  at: Record<string, number>;
  /** Each active ordering's evidence on the axis; null when none of it could be placed. */
  spans: Record<string, StorySpan | null>;
  /** The cited evidence, rounded out to whole years, chapters or acts. */
  domain: [number, number];
}

export function storyTime(profile: PersonaProfile): StoryTime {
  const observations = profile.observations ?? [];
  const marks = observations.map((o) => parseStoryMark(o.text));
  const counts = new Map<StoryMark["kind"], number>();
  for (const mark of marks) if (mark) counts.set(mark.kind, (counts.get(mark.kind) ?? 0) + 1);
  const [best, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
  const kind: StoryTimeKind = best && count / observations.length >= MIN_MARKED_SHARE ? best : "order";

  const positions: Array<number | null> = observations.map((_, i) =>
    kind === "order" ? i + 1 : marks[i]?.kind === kind ? marks[i]!.at : null
  );
  // An unmarked observation happened where the one before it did; the material runs in story
  // order. Unmarked ones before the first mark take that first mark.
  let last: number | null = null;
  for (let i = 0; i < positions.length; i++) {
    if (positions[i] === null) positions[i] = last;
    else last = positions[i]!;
  }
  let next: number | null = null;
  for (let i = positions.length - 1; i >= 0; i--) {
    if (positions[i] === null) positions[i] = next;
    else next = positions[i]!;
  }
  const at: Record<string, number> = {};
  observations.forEach((o, i) => {
    if (positions[i] !== null) at[o.id] = positions[i]!;
  });

  const spans: Record<string, StorySpan | null> = {};
  for (const o of activeOrderings(profile)) {
    const points = o.evidence.map((id) => at[id]).filter((p): p is number => p !== undefined);
    spans[o.id] = points.length ? { at: points, from: Math.min(...points), to: Math.max(...points) } : null;
  }
  const cited = Object.values(spans).flatMap((s) => s?.at ?? []);
  let lo = cited.length ? Math.min(...cited) : 1;
  let hi = cited.length ? Math.max(...cited) : 1;
  if (kind !== "order") {
    lo = Math.floor(lo);
    hi = Math.ceil(hi);
  }
  if (hi - lo < 1) hi = lo + 1;
  return { kind, at, spans, domain: [lo, hi] };
}

/** Whether an ordering's evidence overlaps a window. One with no placeable evidence always does. */
export function withinWindow(time: StoryTime, orderingId: string, window: readonly [number, number] | null): boolean {
  if (!window) return true;
  const span = time.spans[orderingId];
  return !span || (span.to >= window[0] && span.from <= window[1]);
}

const ACT_NAMES = ["", "一", "二", "三", "四", "五"];

export const STORY_TIME_KIND_LABELS: Record<StoryTimeKind, string> = {
  year: "年份",
  chapter: "回目",
  act: "幕场",
  order: "材料顺序",
};

export function storyTimeLabel(kind: StoryTimeKind, at: number): string {
  switch (kind) {
    case "year": {
      const year = Math.floor(at);
      if (Math.abs(at - year - 0.5) < 1e-6) return String(year);
      const month = Math.min(12, Math.max(1, Math.round((at - year) * 12 + 0.5)));
      return `${year}.${month}`;
    }
    case "chapter":
      return `第${Math.round(at)}回`;
    case "act":
      return `第${ACT_NAMES[Math.floor(at)] ?? Math.floor(at)}幕`;
    case "order":
      return `o-${Math.round(at)}`;
  }
}

/** Evenly spaced, labelled positions along the axis: no more than `max` of them. */
export function storyTimeTicks(time: StoryTime, max: number): Array<{ at: number; label: string }> {
  const [lo, hi] = time.domain;
  if (time.kind === "act") {
    // One tick where each act begins; the domain's upper end is where the last act ends.
    const ticks: Array<{ at: number; label: string }> = [];
    for (let act = Math.ceil(lo); act < hi; act++) ticks.push({ at: act, label: storyTimeLabel("act", act) });
    return ticks;
  }
  const step = [1, 2, 5, 10, 20, 25, 50, 100].find((s) => (hi - lo) / s <= Math.max(1, max)) ?? 200;
  const ticks: Array<{ at: number; label: string }> = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) {
    const label = time.kind === "year" ? String(v) : time.kind === "chapter" ? `${v}回` : `o-${v}`;
    ticks.push({ at: v, label });
  }
  return ticks;
}

/* ------------------------------------------------------------------------------------------- */

export interface SharedPair {
  /** The ordering over this pair in the first profile, and in the second. */
  a: ValueOrdering;
  b: ValueOrdering;
  /** Both kept the same value. */
  same: boolean;
}

/** Pairs of values both subjects faced, and whether they kept the same one. */
export function sharedPairs(first: PersonaProfile, second: PersonaProfile): SharedPair[] {
  const theirs = new Map(activeOrderings(second).map((o) => [valuePairKey(o.pair), o]));
  const shared: SharedPair[] = [];
  for (const a of activeOrderings(first)) {
    const b = theirs.get(valuePairKey(a.pair));
    if (b) shared.push({ a, b, same: a.winner === b.winner });
  }
  return shared;
}
