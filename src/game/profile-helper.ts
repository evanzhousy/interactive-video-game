import {
  DECISION_TRAIT_FIELDS,
  canonicalValuePair,
  type DecisionProfile,
  type PersonaProfile,
  type ValueOrdering,
  type ValueToken
} from "../ordamor/index.js";

export const PERSONA_SCHEMA_VERSION = 6;

export interface CompactOrderingSeed {
  id: string;
  kept: ValueToken;
  dropped: ValueToken;
  collision: string;
  disposal: string;
  disposalRequires: string;
  flipsWhen?: string[];
  confidence: number;
  evidence: string[];
}

export function buildDecisionProfile(evidenceId = "o-01"): DecisionProfile {
  const out = {} as DecisionProfile;
  for (const field of DECISION_TRAIT_FIELDS) {
    out[field] = {
      value: "高压危机下的惯性响应（详见 valueOrderings）",
      confidence: 0.7,
      evidence: [evidenceId]
    };
  }
  return out;
}

export function buildOrdering(seed: CompactOrderingSeed): ValueOrdering {
  return {
    id: seed.id,
    pair: canonicalValuePair(seed.kept, seed.dropped),
    winner: seed.kept,
    collision: seed.collision,
    disposal: seed.disposal,
    disposalRequires: seed.disposalRequires,
    flipsWhen: seed.flipsWhen ?? [],
    confidence: seed.confidence,
    evidence: seed.evidence,
    status: "active",
    supersededBy: null,
    revision: 1
  };
}

export function createForensicProfile(params: {
  id: string;
  name: string;
  role: string;
  summary: string;
  invoked: ValueToken[];
  unspoken: ValueToken[];
  narrativePattern: string;
  orderings: CompactOrderingSeed[];
  signature: {
    id: string;
    pattern: string;
    firesWhen: string;
    instances: string[];
  };
  core: {
    statement: string;
    orderings: string[];
    refutedBy: string;
  };
  observations: Array<{ id: string; text: string; source: string }>;
}): PersonaProfile {
  const now = "2036-11-17T00:00:00Z";
  return {
    schemaVersion: PERSONA_SCHEMA_VERSION,
    id: params.id,
    name: params.name,
    subjectId: params.id,
    lens: "forensic",
    revision: 1,
    createdAt: now,
    updatedAt: now,
    summary: params.summary,
    confidence: 0.82,
    identity: {
      role: params.role,
      contexts: ["Svalbard Outpost 0"],
      aliases: []
    },
    worldview: [],
    subconscious: [],
    behavioralPatterns: [],
    decisionProfile: buildDecisionProfile(params.observations[0]?.id ?? "o-01"),
    valueOrderings: params.orderings.map(buildOrdering),
    disposalSignatures: [
      {
        id: params.signature.id,
        pattern: params.signature.pattern,
        firesWhen: params.signature.firesWhen,
        instances: params.signature.instances,
        confidence: 0.8,
        revision: 1
      }
    ],
    coreThreads: [
      {
        statement: params.core.statement,
        orderings: params.core.orderings,
        refutedBy: params.core.refutedBy,
        confidence: 0.78,
        revision: 1
      }
    ],
    justificationStyle: {
      invoked: params.invoked,
      unspoken: params.unspoken,
      narrativePattern: params.narrativePattern,
      confidence: 0.85,
      evidence: params.observations.map((o) => o.id)
    },
    situationalResponses: [],
    contradictions: [],
    observations: params.observations.map((o) => ({
      id: o.id,
      text: o.text,
      source: o.source,
      recordedAt: now,
      revision: 1
    })),
    revisionLog: [
      {
        revision: 1,
        at: now,
        kind: "create",
        summary: "Offline Ordamor forensic profile build for Gate 0",
        opCount: params.orderings.length + params.observations.length
      }
    ],
    nextClaimSeq: 1,
    nextObservationSeq: params.observations.length + 1,
    nextContradictionSeq: 1,
    nextValueSeq: params.orderings.length + 1,
    nextSignatureSeq: 2
  };
}
