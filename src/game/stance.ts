import { otherValue } from "../ordamor/index.js";
import type {
  LlmRephraseInput,
  Locale,
  ProbeKey,
  StanceDecision,
  VisitorRoll,
  VisitorSpec
} from "./types.js";

/**
 * Deterministic Stance Engine — the ONLY layer permitted to read `roll.isMimic` and `roll.defectMode`.
 *
 * Progressive mimic ladder:
 * - LOW_SELF_NARRATIVE: Fails every conflict axis & disposal check by reciting the host's flattering SAY (`neverWon`).
 * - MID_SECOND_AXIS: Passes axis 0 (`v-1`), fails axis >= 1 (`v-2`).
 * - HIGH_WRONG_DISPOSAL: Passes all value axes (`v-1`, `v-2`), fails `disposal_probe` (wrong excuse) and `boggart_trap` (rigidly repeats invalidated excuse after `disposalRequires` is removed).
 */
export function decideStance(
  visitor: VisitorSpec,
  roll: VisitorRoll,
  probeKey: ProbeKey | "off_axis"
): StanceDecision {
  const mode = roll.isMimic ? roll.defectMode : "HUMAN";
  const realSig = visitor.disposalTitle.en;
  const human = (extra?: Partial<StanceDecision>): StanceDecision => ({
    axis: null,
    choose: null,
    over: null,
    justification_style: realSig,
    tell_level: "none",
    lineKey: "human",
    ...extra
  });

  if (probeKey === "off_axis") {
    return human({ justification_style: "in_character_deflect" });
  }

  const probe = visitor.probes[probeKey];
  if (!probe || probe.axis === null) {
    return human({ justification_style: "in_character_deflect" });
  }

  if (probe.axis === "disp" || probe.axis === "boggart") {
    const tag = probe.axis === "boggart" ? "disposalRequires_removed" : "disposal";
    if (mode === "LOW_SELF_NARRATIVE") {
      return {
        axis: tag,
        choose: null,
        over: null,
        justification_style: "flattering_self_narrative",
        tell_level: visitor.tellLevel,
        lineKey: "mimic_say"
      };
    }
    if (mode === "HIGH_WRONG_DISPOSAL") {
      return {
        axis: tag,
        choose: null,
        over: null,
        justification_style:
          probe.axis === "boggart" ? "rigidly_repeats_invalidated_excuse" : "wrong_signature",
        tell_level: visitor.tellLevel,
        lineKey: "mimic_disp"
      };
    }
    return human({
      axis: tag,
      justification_style:
        probe.axis === "boggart" ? "precondition_collapsed_raw_core" : realSig
    });
  }

  const ordIdx = probe.axis;
  const ord = visitor.profile.valueOrderings[ordIdx];
  if (!ord) return human();

  const kept = ord.winner;
  const dropped = otherValue(ord.pair, ord.winner);
  const axis = `${kept}>${dropped}`;
  const failsOrdering =
    mode === "LOW_SELF_NARRATIVE" || (mode === "MID_SECOND_AXIS" && ordIdx >= 1);

  if (failsOrdering) {
    return {
      axis,
      choose: dropped,
      over: kept,
      justification_style: "flattering_self_narrative",
      tell_level: visitor.tellLevel,
      lineKey: "mimic_say"
    };
  }

  return human({ axis, choose: kept, over: dropped });
}

/**
 * Builds the strictly sanitized input object for the optional Flash-class rephrasing model.
 * Guaranteed free of `isMimic`, `defectMode`, or `lineKey`.
 */
export function buildRephraseInput(
  visitor: VisitorSpec,
  question: string,
  stance: StanceDecision,
  locale: Locale,
  canonicalLine = ""
): LlmRephraseInput {
  return {
    speaker: visitor.name[locale] || visitor.name.en,
    role: visitor.role[locale] || visitor.role.en,
    persona_voice: visitor.voice,
    question,
    canonical_line: canonicalLine,
    stance: {
      choose: stance.choose,
      over: stance.over,
      justification_style: stance.justification_style,
      tell_level: stance.tell_level
    },
    locale,
    max_sentences: 2
  };
}
