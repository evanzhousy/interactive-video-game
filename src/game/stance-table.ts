import { tl } from "./i18n.js";
import { decideStance } from "./stance.js";
import type {
  InterrogateAxisKey,
  Locale,
  LocalizedText,
  ProbeKey,
  StanceDecision,
  VisitorRoll,
  VisitorSpec
} from "./types.js";
import type { ValueToken } from "../ordamor/index.js";

export const PROBE_AXIS_ORDER: readonly ProbeKey[] = [
  "dilemma",
  "dilemma2",
  "evidence",
  "disposal_probe",
  "boggart_trap",
  "trivia"
];

/**
 * Full engine-side stance entry for a single probe axis.
 * Contains hidden fields (`isFlawedAxis`, `stance.lineKey`) and MUST NEVER be passed raw to an LLM.
 */
export interface EngineAxisStance {
  axisKey: InterrogateAxisKey;
  onAxis: boolean;
  stance: StanceDecision;
  isFlawedAxis: boolean;
  topicLabel: LocalizedText;
  canonicalReply: LocalizedText;
}

/**
 * Sanitized prompt-facing directive for one axis.
 * Strictly free of `isMimic`, `defectMode`, `lineKey`, `tell_level`, `justification_style`, and `isFlawedAxis`.
 */
export interface SanitizedAxisDirective {
  axisKey: InterrogateAxisKey;
  topicHint: string;
  choose: ValueToken | null;
  over: ValueToken | null;
  anchorLine: string;
}

const OFF_AXIS_TOPIC: LocalizedText = {
  zh: "其他寒暄、无关试探或未涵盖的闲聊",
  en: "Small talk, off-topic chatter, or unrelated provocations",
  ja: "雑談・本題外の探り・無関係な挑発"
};

/**
 * Runs `decideStance` deterministically across every probe axis on a visitor plus `off_axis`.
 */
export function buildVisitorStanceTable(
  visitor: VisitorSpec,
  roll: VisitorRoll
): EngineAxisStance[] {
  const entries: EngineAxisStance[] = [];

  for (const key of PROBE_AXIS_ORDER) {
    const probe = visitor.probes[key];
    if (!probe) continue;
    const onAxis = probe.axis !== null;
    const stance = decideStance(visitor, roll, key);
    const isFlawedAxis = onAxis && stance.lineKey !== "human";
    const canonicalReply = !onAxis ? probe.human : (probe[stance.lineKey] ?? probe.human);

    entries.push({
      axisKey: key,
      onAxis,
      stance,
      isFlawedAxis,
      topicLabel: probe.label,
      canonicalReply
    });
  }

  const offAxisStance = decideStance(visitor, roll, "off_axis");
  entries.push({
    axisKey: "off_axis",
    onAxis: false,
    stance: offAxisStance,
    isFlawedAxis: false,
    topicLabel: OFF_AXIS_TOPIC,
    canonicalReply: visitor.offAxisReply
  });

  return entries;
}

/**
 * Strips all hidden engine metadata so only neutral behavioral directives enter the LLM prompt.
 */
export function sanitizeStanceTable(
  entries: readonly EngineAxisStance[],
  locale: Locale
): SanitizedAxisDirective[] {
  return entries.map((entry) => ({
    axisKey: entry.axisKey,
    topicHint: tl(entry.topicLabel, locale),
    choose: entry.stance.choose,
    over: entry.stance.over,
    anchorLine: tl(entry.canonicalReply, locale)
  }));
}

export function getCanonicalEntryForAxis(
  entries: readonly EngineAxisStance[],
  axisKey: InterrogateAxisKey
): EngineAxisStance {
  return (
    entries.find((e) => e.axisKey === axisKey) ??
    entries.find((e) => e.axisKey === "off_axis") ??
    entries[0]!
  );
}
