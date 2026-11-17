import type { PersonaProfile, ValueToken } from "../ordamor/index.js";

export type Locale = "zh" | "en" | "ja";

export type LocalizedText = Record<Locale, string>;

/**
 * Progressive mimic hierarchy:
 * - HUMAN: Genuine survivor matching external observations (o-N) and disposalSignatures (sig-N).
 * - LOW_SELF_NARRATIVE: Copies the host's flattering self-narrative (justificationGap.neverWon).
 * - MID_SECOND_AXIS: Absorbed the host's primary guilty memory (v-1), but reverts to SAY on v-2.
 * - HIGH_WRONG_DISPOSAL: Passes value orderings (v-1, v-2), fails disposalSignatures or rigidly repeats an invalidated excuse when `disposalRequires` is removed (Boggart Trap).
 */
export type DefectMode =
  | "HUMAN"
  | "LOW_SELF_NARRATIVE"
  | "MID_SECOND_AXIS"
  | "HIGH_WRONG_DISPOSAL";

export type TellLevel = "none" | "explicit" | "implied" | "subtle";

export type ProbeKey =
  | "dilemma"
  | "dilemma2"
  | "evidence"
  | "disposal_probe"
  | "boggart_trap"
  | "trivia";

export type ProbeAxis = 0 | 1 | "disp" | "boggart" | null;

export interface VisitorProbe {
  axis: ProbeAxis;
  label: LocalizedText;
  human: LocalizedText;
  mimic_say?: LocalizedText;
  mimic_disp?: LocalizedText;
}

export interface LocalizedEvidenceCard {
  id: string;
  type?: "obs" | "say";
  kw?: LocalizedText;
  text: LocalizedText;
}

export interface VisitorSensors {
  strobeHuman: LocalizedText;
  strobeMimic: LocalizedText;
  thermalHuman: LocalizedText;
  thermalMimic: LocalizedText;
}

export interface VisitorSpec {
  id: string;
  night: 1 | 2 | 3 | 4;
  unlockTier: 1 | 2 | 4;
  portraitUrl: string | null;
  silhouetteType: "surgeon" | "captain" | "biologist";
  baseBpm: number;
  defectPool: Exclude<DefectMode, "HUMAN">[];
  tellLevel: Exclude<TellLevel, "none">;
  voice: string;
  /** Canonical Ordamor PersonaProfile (schemaVersion: 6, lens: "forensic"). */
  profile: PersonaProfile;
  /** Localized presentation layer over the canonical PersonaProfile. */
  name: LocalizedText;
  role: LocalizedText;
  disposalTitle: LocalizedText;
  disposalSummary: LocalizedText;
  disposalRequiresLocalized: LocalizedText;
  evidenceCards: LocalizedEvidenceCard[];
  sensors: VisitorSensors;
  openingLine: LocalizedText;
  offAxisReply: LocalizedText;
  probes: Partial<Record<ProbeKey, VisitorProbe>>;
}

export interface VisitorRoll {
  visitorId: string;
  isMimic: boolean;
  defectMode: DefectMode;
}

export interface StanceDecision {
  axis: string | null;
  choose: ValueToken | null;
  over: ValueToken | null;
  justification_style: string;
  tell_level: TellLevel;
  lineKey: "human" | "mimic_say" | "mimic_disp";
}

/**
 * Strictly sanitized payload for the optional Flash-class LLM rephrasing layer.
 * Red Line / Anti-Leakage Invariant: NEVER contains `isMimic`, `defectMode`, `lineKey`, or hidden roll state.
 */
export interface LlmRephraseInput {
  speaker: string;
  role: string;
  persona_voice: string;
  question: string;
  canonical_line: string;
  stance: {
    choose: ValueToken | null;
    over: ValueToken | null;
    justification_style: string;
    tell_level: TellLevel;
  };
  locale: Locale;
  max_sentences: 2;
}

export type FlashTransportMode = "server_proxy" | "custom_endpoint";

export interface FlashRephraseConfig {
  enabled: boolean;
  mode: FlashTransportMode;
  /** Used when `mode === "server_proxy"` (defaults to `/api/rephrase`). */
  proxyPath: string;
  /** Used when `mode === "custom_endpoint"` (OpenAI-compatible `/v1/chat/completions` URL). */
  endpointUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
  /** When true (default), preset probe chips stay instant (0ms) and only typed free-text invokes Flash. */
  freeTextOnly: boolean;
}

export interface RephraseOutcome {
  line: string;
  source: "flash" | "canonical_fallback" | "offline";
  latencyMs: number;
  model?: string;
  fallbackReason?: string;
}

export type DisposalStyleKey = "rationalize" | "blame_rules" | "own_it";

export interface ShiftExcuse {
  id: string;
  kept: ValueToken;
  dropped: ValueToken;
  sig: DisposalStyleKey;
  label: LocalizedText;
}

export interface ShiftHistoryEntry {
  visitorId: string;
  decision: "ADMIT" | "PURGE";
  wasMimic: boolean;
  excuse: ShiftExcuse;
}

export type EndingId =
  | "A"
  | "B"
  | "C"
  | "D"
  | "OPEN_PURGE"
  | "OPEN_ADMIT"
  | "MIRROR";
