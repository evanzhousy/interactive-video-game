import type {
  CLAIM_SECTIONS,
  ContradictionKind,
  DecisionTraitField,
  PersonaLens,
  ValueToken,
} from "./constants.js";

export type ClaimSection = (typeof CLAIM_SECTIONS)[number];

export type ClaimStatus = "active" | "superseded" | "retired";

/**
 * One analytic assertion about the subject. Claims are never deleted: a superseded claim keeps
 * its text and points at the claim that replaced it, so the reasoning behind a profile stays
 * auditable across iterations instead of being silently overwritten.
 */
export interface Claim {
  id: string;
  text: string;
  confidence: number;
  /** Observation ids this claim rests on. */
  evidence: string[];
  status: ClaimStatus;
  supersededBy: string | null;
  /** Revision at which this claim was added or last revised. */
  revision: number;
}

/** A observable fact extracted from supplied material. Append-only. */
export interface Observation {
  id: string;
  text: string;
  source: string;
  recordedAt: string;
  revision: number;
}

/** A decision-making dimension: single current value plus provenance. */
export interface DecisionTrait {
  value: string;
  confidence: number;
  evidence: string[];
}

export type DecisionProfile = Record<DecisionTraitField, DecisionTrait>;

export type { ContradictionKind, DecisionTraitField, PersonaLens, ValueToken };

/**
 * One recorded value collision: a moment where two values could not both be served, which of
 * them won, and — the part that actually carries prediction — what happened to the one that lost.
 *
 * Stored per pair rather than per value. An ordering is only meaningful against something it
 * outranks; a standalone "values loyalty" is exactly the unfalsifiable attribute the analyst
 * discipline forbids, because it is true of almost everyone.
 */
export interface ValueOrdering {
  id: string;
  /** Canonical vocabulary order — see canonicalValuePair. */
  pair: [ValueToken, ValueToken];
  winner: ValueToken;
  /** The collision as it happened. Must state what the LOSING value demanded at that moment. */
  collision: string;
  /**
   * What is done to the losing value: abandoned openly, replaced by a symbolic act, rewritten as
   * someone else's fault, deferred, or denied to have been at stake.
   */
  disposal: string;
  /**
   * What the disposal needs in order to be available at all.
   *
   * This exists because the winner alone predicts the wrong thing where the condition is absent.
   * A subject who outranks principle only by housing it in a form that leaves it intact behaves
   * very differently in a situation that supplies no such form — there the ordering inverts.
   * Reading the winner without checking this is the single most likely way to answer backwards.
   */
  disposalRequires: string;
  /**
   * Observed reversal conditions. Empty means never observed to flip; never filled by inference.
   * A first draft writes the ones its material shows; `analyze` adds one when later material shows
   * the recorded winner losing and says what was different that time.
   */
  flipsWhen: string[];
  confidence: number;
  /**
   * Observations where BOTH values were at stake. Enforced non-empty. This covers both outcomes:
   * the occasions the recorded winner won, and — for an ordering with a flip condition added by
   * `analyze` — the occasion it lost, which is what that condition rests on.
   */
  evidence: string[];
  status: ClaimStatus;
  supersededBy: string | null;
  revision: number;
}

/**
 * A disposal shape that recurs across several orderings. This is the layer that transfers across
 * situations, so it is first-class rather than left implicit in the per-ordering disposals.
 *
 * Deliberately a list: a subject can carry more than one signature, firing under different
 * conditions, and collapsing them into a single one predicts the wrong one. For the same reason
 * a signature that stops being used must not be superseded — it may simply not have fired yet.
 */
export interface DisposalSignature {
  id: string;
  pattern: string;
  /** What selects this signature over the subject's others. */
  firesWhen: string;
  /** Ordering ids exhibiting it. Enforced at MIN_SIGNATURE_INSTANCES or more. */
  instances: string[];
  confidence: number;
  revision: number;
}

/**
 * The one state every disposal is protecting.
 *
 * This is the most dangerous section in the profile and the constraints are what make it usable.
 * It is derived from the orderings rather than asserted alongside them, it must be phrased as a
 * state the subject is maintaining rather than a trait they possess ("keeps himself in a position
 * where nothing can be asked of him", not "is secretive"), and `refutedBy` must name an
 * observation that would kill it. A core nothing could refute is prose, and prose that reads as
 * insight is worse here than saying nothing: it raises a reader's confidence without raising
 * accuracy.
 */
export interface CoreThread {
  statement: string;
  /** Orderings whose disposals all serve it. Enforced at MIN_CORE_ORDERINGS or more. */
  orderings: string[];
  /** What would falsify it. Required. */
  refutedBy: string;
  confidence: number;
  revision: number;
}

/** What gets said aloud versus what actually decides. The gap between them is the finding. */
export interface JustificationStyle {
  /** Values named aloud when justifying a decision, most-reached-for first. */
  invoked: ValueToken[];
  /** Values that decide but are never named. */
  unspoken: ValueToken[];
  narrativePattern: string;
  confidence: number;
  evidence: string[];
}

export interface SituationalResponse {
  situation: string;
  firstReaction: string;
  likelyAction: string;
  underlyingDriver: string;
  confidence: number;
}

export interface Contradiction {
  id: string;
  kind: ContradictionKind;
  description: string;
  claimIds: string[];
  /**
   * For `inversion`: the ordering, signature or claim ids the new material runs against. Enforced
   * non-empty — an inversion that cannot name what it inverts is downgraded to `boundary` rather
   * than dropped, because the tension is still real, it just has not earned the stronger label.
   */
  violates: string[];
  status: "open" | "resolved";
  resolution: string | null;
  revision: number;
}

export interface RevisionEntry {
  revision: number;
  at: string;
  kind: "create" | "analyze";
  summary: string;
  opCount: number;
}

export interface PersonaIdentity {
  /** Social role or standing, however the material presents it — not a job title field. */
  role: string;
  /** The settings this profile draws on: an organisation, a relationship, a case, a period. */
  contexts: string[];
  aliases: string[];
}

/**
 * Canonical stored form. The Markdown document is rendered from this on every write — this
 * JSON is the source of truth, never the Markdown.
 */
export interface PersonaProfile {
  schemaVersion: number;
  id: string;
  name: string;
  /**
   * The person this profile is *of*, as distinct from the profile itself. One subject can hold
   * several profiles — a different lens, or a different modelling window over the same life — and
   * without this they are unrelated ids. Nullable because a stored profile predates the field and
   * backfilling it means deciding whether two profiles are the same person, which is a product
   * decision rather than something a migration can do.
   * See `wiki/product/persona-profiling/engineering-architecture.md` §12.3.
   */
  subjectId: string | null;
  /** Fixed at creation: it selects the situation archetypes and the analyst framing. */
  lens: PersonaLens;
  revision: number;
  createdAt: string;
  updatedAt: string;
  summary: string;
  confidence: number;
  identity: PersonaIdentity;
  worldview: Claim[];
  subconscious: Claim[];
  behavioralPatterns: Claim[];
  decisionProfile: DecisionProfile;
  /** Recorded value collisions. Empty on a v2 profile upgraded in place — orderings can only be
   *  filled by re-reading material, never derived from what the rest of the profile already says.
   *  `analyze` enforces that: a collision it records must cite an observation from the same patch. */
  valueOrderings: ValueOrdering[];
  disposalSignatures: DisposalSignature[];
  /** Derived from the orderings; empty when none is supportable. */
  coreThreads: CoreThread[];
  justificationStyle: JustificationStyle;
  situationalResponses: SituationalResponse[];
  contradictions: Contradiction[];
  observations: Observation[];
  revisionLog: RevisionEntry[];
  /** Monotonic counters so ids stay unique even after entries are trimmed. */
  nextClaimSeq: number;
  nextObservationSeq: number;
  nextContradictionSeq: number;
  nextValueSeq: number;
  nextSignatureSeq: number;
}

export interface PersonaIndexEntry {
  id: string;
  name: string;
  role: string;
  lens: PersonaLens;
  revision: number;
  updatedAt: string;
}

/** One row of `GET /api/persona/profiles/list`. */
export interface PersonaListEntry extends PersonaIndexEntry {
  /**
   * From the shared template library rather than the caller's own profiles: every signed-in user
   * can read it, and none can change it through the API (`src/http/templates.ts`).
   */
  template: boolean;
}

/** Body of `GET /api/persona/profiles/list`. Shared by the handler and the web client. */
export interface PersonaListResponse {
  profiles: PersonaListEntry[];
  count: number;
}

export interface PersonaIndex {
  schemaVersion: number;
  profiles: PersonaIndexEntry[];
}

export interface CreateProfileBody {
  portrait: string;
  name?: string;
  source?: string;
  lens?: PersonaLens;
  /** Links the new profile to an existing subject. Absent means "a subject of its own". */
  subjectId?: string;
}

/**
 * `patch` folds the material into the profile. `audit` treats the profile as the baseline and the
 * material as the thing under test: it writes nothing at all, and reports only where the material
 * runs against what is already recorded.
 *
 * The two differ in which side is assumed correct. `patch` assumes the material is true and the
 * profile should grow; `audit` assumes the profile is the standard and the material may be wrong.
 */
export type AnalyzeMode = "patch" | "audit";

export interface AnalyzeProfileBody {
  id: string;
  material: string;
  mode?: AnalyzeMode;
  source?: string;
  /** Optimistic lock: reject the write if the stored profile has moved on. */
  expectedRevision?: number;
}

export interface SimulateBody {
  id: string;
  situation: string;
}

/** How well the stored profile covers the collision this situation creates. Computed, not claimed. */
export type OrderingSource = "direct" | "transitive" | "absent";

export interface SimulationResult {
  /** The collision the situation creates, in canonical vocabulary order. */
  valueCollision: [ValueToken, ValueToken];
  predictedWinner: ValueToken;
  /**
   * Derived in code from the stored orderings, never taken from the model. This is what the
   * confidence ceiling is applied from, so letting the model report it would let it grade its
   * own coverage.
   */
  orderingSource: OrderingSource;
  /** The ordering the prediction rests on, when there is one. */
  orderingId: string | null;
  /**
   * False when the situation does not supply what the stored disposal needs. Reported only: it
   * adds a line to `keyUncertainties` and does not grade the prediction. An earlier rule treated
   * such a prediction as uncovered; backtesting showed the flag carried no signal and the rule
   * was removed (`persona-profiling.md` §10).
   */
  disposalFeasible: boolean;
  /**
   * True when one of the ordering's recorded flip conditions matches this situation, meaning the
   * stored winner is the wrong way round. It does not weaken coverage — the profile anticipated
   * the case.
   *
   * Only lightly tested: across the 23-holdout backtest it had three opportunities (a matched
   * ordering that carried flip conditions) and correctly declined all three. No false positives,
   * but it has never been observed firing true, so treat a `true` here with suspicion until it
   * has been seen to work.
   */
  flipApplies: boolean;
  predictedDisposal: string;
  ruledOutJustifications: ValueToken[];
  firstReaction: string;
  likelyAction: string;
  underlyingDriver: string;
  confidence: number;
  alternativeScenarios: { action: string; likelihood: string; trigger: string }[];
  keyUncertainties: string[];
  /** Claim, observation, ordering and signature ids the prediction rests on. Every one resolves. */
  groundedIn: string[];
  /**
   * What the code found wrong with the model's answer and did not refuse outright: grounds that
   * resolved to nothing (dropped), one value named on both sides of the collision, or a recorded
   * winner contradicted with no flip and no failed precondition to explain it. None of these
   * changes `orderingSource` or `confidence`.
   */
  warnings: string[];
}
