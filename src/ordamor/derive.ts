import type { PersonaProfile, ValueToken } from "./types.js";

/**
 * The gap between the values a subject names and the values that actually win.
 *
 * Derived from the active orderings every time, never read off a stored summary: a written-out
 * summary of the gap can drift away from the evidence it claims to summarise, while this cannot.
 * One function for every reader — the Markdown projection, the profile view, the standup app.
 *
 * Pure and dependency-free so the browser bundle can use it.
 */
export interface JustificationGap {
  /** Values the subject says out loud when explaining a choice. */
  invoked: ValueToken[];
  /** Values that won an active ordering, with how often, most frequent first. */
  actual: Array<[ValueToken, number]>;
  /** Won at least once but never named — a driver the subject does not admit to. */
  silent: ValueToken[];
  /**
   * Named but never won an active ordering — the other direction of the gap, and the one a reader
   * usually means by "says one thing, does another". Kept distinct from `silent`: a subject can have
   * either without the other (丁元英 names both of his winners, yet 真相、秩序、公平 never win).
   */
  neverWon: ValueToken[];
  /** The profile's own claim about unnamed drivers, kept separate from the derived `silent`. */
  unspoken: ValueToken[];
  narrativePattern: string;
  confidence: number;
}

export function justificationGap(profile: PersonaProfile): JustificationGap | null {
  const style = profile.justificationStyle;
  if (!style) return null;
  const counts = new Map<ValueToken, number>();
  for (const ordering of profile.valueOrderings ?? []) {
    if (ordering.status !== "active") continue;
    counts.set(ordering.winner, (counts.get(ordering.winner) ?? 0) + 1);
  }
  // Stable for ties: Map iteration keeps first-seen order, and sort is stable.
  const actual = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const invoked = style.invoked ?? [];
  const named = new Set(invoked);
  return {
    invoked,
    actual,
    silent: actual.map(([token]) => token).filter((token) => !named.has(token)),
    neverWon: invoked.filter((token) => !counts.has(token)),
    unspoken: style.unspoken ?? [],
    narrativePattern: style.narrativePattern ?? "",
    confidence: style.confidence ?? 0,
  };
}
