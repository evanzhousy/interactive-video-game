/**
 * Decision dimensions. These are deliberately domain-neutral: the same ten read meaningfully
 * whether the subject is a negotiating counterparty, a therapy client, a spouse, or a suspect.
 * Keeping them fixed across lenses is what lets one profile be re-read through another lens
 * without being rebuilt.
 */
export const DECISION_TRAIT_FIELDS = [
  "riskPosture",
  "setbackResponse",
  "informationDiet",
  "timeOrientation",
  "commitmentStyle",
  "authorityOrientation",
  "conflictStyle",
  "trustAndIntimacy",
  "normOrientation",
  "emotionalTriggers",
] as const;

export type DecisionTraitField = (typeof DECISION_TRAIT_FIELDS)[number];

export const DECISION_TRAIT_LABELS: Record<DecisionTraitField, string> = {
  riskPosture: "风险姿态",
  setbackResponse: "挫折与失败反应",
  informationDiet: "信息获取与取信方式",
  timeOrientation: "时间取向",
  commitmentStyle: "承诺与投入方式",
  authorityOrientation: "对权威与共识的姿态",
  conflictStyle: "冲突处理方式",
  trustAndIntimacy: "信任与亲密距离",
  normOrientation: "对规则与边界的态度",
  emotionalTriggers: "情绪触发点",
};

/**
 * A lens does not change what a profile contains — the core sections and the ten dimensions are
 * fixed — only which situations get pre-computed and how the analyst is framed. That split is
 * what keeps profiles comparable across use cases.
 */
export const PERSONA_LENSES = [
  "general",
  "strategy",
  "negotiation",
  "relationship",
  "clinical",
  "forensic",
  "legal",
] as const;

export type PersonaLens = (typeof PERSONA_LENSES)[number];

export interface LensDefinition {
  label: string;
  /** Appended to the analyst framing, saying what this profile is going to be used for. */
  framing: string;
  situations: readonly string[];
}

export const PERSONA_LENS_REGISTRY: Record<PersonaLens, LensDefinition> = {
  general: {
    label: "通用",
    framing: "这份侧写没有指定用途，因此覆盖的是普遍生活情境下的行为倾向。",
    situations: [
      "面对重大不确定性且必须尽快做出决定",
      "一个由自己主导的决定明显失败",
      "被亲近的人当面质疑动机",
      "处于明显劣势、不得不依赖他人",
      "获得远超预期的成功或权力",
      "必须在两个重要的人之间选边",
      "长期投入得不到任何回应",
      "必须承认自己错了",
    ],
  },
  strategy: {
    label: "战略咨询",
    framing:
      "这份侧写用于战略咨询：预判该人物在组织或竞争层面的判断方式、可被说服的条件，以及压力下的决策失真。",
    situations: [
      "核心假设被新信息证伪",
      "资源不足以同时守住两条战线",
      "核心团队集体主张改变路线",
      "对手做出出乎意料的举动",
      "短期利益与长期定位发生冲突",
      "已公开承诺的方向被证明代价过高",
      "关键信息来源被发现不可靠",
      "必须在信息不完整时锁定不可逆的投入",
    ],
  },
  negotiation: {
    label: "谈判策略",
    framing:
      "这份侧写用于谈判准备：预判该人物的让步路径、真实底线的位置，以及哪些做法会触发其非理性反应。",
    situations: [
      "对方开出远低于预期的条件",
      "谈判陷入僵局且时间压力上升",
      "对方展示出可信的退出选项",
      "己方一个明显弱点被对方抓住",
      "对方做出重大让步",
      "必须在长期关系与眼前条款之间取舍",
      "对方越过自己直接接触决策层",
      "必须决定是否接受一个次优但确定的方案",
    ],
  },
  relationship: {
    label: "婚姻与亲密关系咨询",
    framing:
      "这份侧写用于关系咨询：理解该人物在亲密关系中的依恋方式、冲突模式与修复能力。避免评判，聚焦于可被当事人识别的模式。",
    situations: [
      "伴侣表达失望或说出未被满足的需求",
      "冲突升级到互相进行人身指责",
      "长期承担明显不对等的付出",
      "伴侣与原生家庭的立场发生冲突",
      "一方获得独立的成功或机会",
      "亲密需求与独处需求发生冲突",
      "信任受到一个具体事件的冲击",
      "必须为自己造成的伤害道歉",
    ],
  },
  clinical: {
    label: "心理咨询",
    framing:
      "这份侧写用于心理咨询的个案理解：聚焦防御机制、情绪调节方式与改变的阻抗点。它是供从业者使用的工作假设，不是诊断，不得作为诊断使用。",
    situations: [
      "被指出一个自己不愿承认的模式",
      "情绪强度明显超过当下事件本身",
      "在依赖关系中被要求划清界限",
      "长期回避的话题被直接提起",
      "取得进展之后出现回退",
      "需要主动向他人求助",
      "独处且没有外部结构支撑",
      "被给予无条件的接纳",
    ],
  },
  forensic: {
    label: "犯罪动机分析",
    framing:
      "这份侧写用于调查与司法语境下的动机理解：解释既有行为的心理路径与风险因素。只做解释与评估，不产出任何可用于实施伤害的操作性内容。",
    situations: [
      "身份被公开否定或遭到羞辱",
      "目标受阻且合法途径已经耗尽",
      "长期积累的怨恨指向某个特定对象",
      "所处群体给予许可或施加压力",
      "需要把他人视为工具或障碍",
      "行为被发现后面临追责",
      "失去了原本能够约束自己的牵挂",
      "有人给出一个替代性的出路",
    ],
  },
  legal: {
    label: "法律代理",
    framing:
      "这份侧写供律师理解当事人：预判其在压力下的陈述稳定性、和解与诉讼之间的决策方式，以及需要提前处理的沟通风险。只服务于代理工作，不用于评价其陈述的真伪。",
    situations: [
      "被要求陈述对自己不利的事实",
      "面对与自己说法直接矛盾的证据",
      "必须在确定的和解与不确定的胜诉之间选择",
      "在压力下被反复追问同一个问题",
      "律师的专业建议与自己的直觉相反",
      "案件久拖不决且成本持续累积",
      "需要向家人或公众解释自己的处境",
      "对方释出善意或做出让步",
    ],
  },
};

export const DEFAULT_PERSONA_LENS: PersonaLens = "general";

export function getLensDefinition(lens: PersonaLens): LensDefinition {
  return PERSONA_LENS_REGISTRY[lens];
}

export function isPersonaLens(value: unknown): value is PersonaLens {
  return typeof value === "string" && (PERSONA_LENSES as readonly string[]).includes(value);
}

export const CLAIM_SECTIONS = ["worldview", "subconscious", "behavioralPatterns"] as const;

export const CLAIM_SECTION_LABELS: Record<(typeof CLAIM_SECTIONS)[number], string> = {
  worldview: "世界观",
  subconscious: "潜意识",
  behavioralPatterns: "行为模式",
};

// Bumped when the stored shape changes incompatibly. v2 replaced the trading-specific decision
// dimensions and situation archetypes with the domain-neutral core plus lenses. v3 added the
// value layer: recorded value collisions, their disposals, and the justification gap. v4 added
// core threads — and was bumped late, after v3 profiles carrying no `coreThreads` had already
// been written, which is why the migration below backfills by field rather than trusting this
// number. Bump it in the same change that adds a field, or it stops meaning anything. v5 typed
// contradictions into `boundary` / `inversion` and gave them `violates`. v6 added `subjectId`, the
// person a profile is of.
export const PERSONA_SCHEMA_VERSION = 6;

/**
 * What kind of tension a recorded contradiction is.
 *
 * `boundary` — both readings may hold; what is unknown is the condition that separates them.
 * `inversion` — the new material runs directly against something the profile already records,
 *   and must name it in `violates`.
 *
 * The distinction exists because a reader cannot act on an undifferentiated list. Backtesting a
 * genuinely in-pattern episode against a fabricated out-of-character one produced the same NUMBER
 * of conflicts from both (4 and 4); the difference was entirely in the wording. Typed, that
 * difference becomes something code can sort on.
 */
export const CONTRADICTION_KINDS = ["boundary", "inversion"] as const;
export type ContradictionKind = (typeof CONTRADICTION_KINDS)[number];

/**
 * How each kind is shown to a reader, everywhere: the Markdown projection and every app UI.
 * One table so the engine's rendering and the apps cannot drift apart.
 */
export const CONTRADICTION_KIND_LABELS: Record<ContradictionKind, string> = {
  inversion: "⚡ 直接互斥",
  boundary: "◇ 边界未明",
};

/**
 * Values are a fixed vocabulary for the same reason the ten decision dimensions are. An ordering
 * is keyed by the pair it ranks, so a model free to invent value names produces orderings that
 * cannot be compared across subjects, cannot be matched across revisions, and therefore cannot
 * be patched at all. Thirteen tokens give 78 possible pairs; only pairs that actually collided
 * in the material ever get filled.
 */
export const VALUE_TOKENS = [
  "loyalty",
  "truth",
  "fairness",
  "care",
  "order",
  "autonomy",
  "achievement",
  "security",
  "status",
  "duty",
  "principle",
  "mercy",
  "justice",
] as const;

export type ValueToken = (typeof VALUE_TOKENS)[number];

export const VALUE_LABELS: Record<ValueToken, string> = {
  loyalty: "忠诚",
  truth: "真相",
  fairness: "公平",
  care: "关怀",
  order: "秩序",
  autonomy: "自主",
  achievement: "成就",
  security: "自保",
  status: "名声",
  duty: "本分",
  principle: "原则",
  mercy: "宽宥",
  justice: "追责",
};

/**
 * One line each, handed to the model with the vocabulary. Adjacent tokens (duty vs principle,
 * justice vs fairness) are otherwise used interchangeably, which destroys the pair key.
 */
export const VALUE_GLOSS: Record<ValueToken, string> = {
  loyalty: "对特定的人或群体的义务",
  truth: "事实本身，哪怕对自己不利",
  fairness: "按同一标准对待",
  care: "减少具体的人的痛苦",
  order: "可预期，不失控",
  autonomy: "不被他人决定",
  achievement: "做成，赢",
  security: "存续",
  status: "在他人眼中的位置",
  duty: "所处位置要求的",
  principle: "无论位置如何都不做的事",
  mercy: "对已犯错者放手",
  justice: "惩罚，追究",
};

export function isValueToken(value: unknown): value is ValueToken {
  return typeof value === "string" && (VALUE_TOKENS as readonly string[]).includes(value);
}

const VALUE_RANK = new Map<ValueToken, number>(VALUE_TOKENS.map((token, index) => [token, index]));

/**
 * Pairs are stored in vocabulary order, so [loyalty, truth] and [truth, loyalty] are one key.
 * Without this an ordering can never be found again in order to revise it.
 */
export function canonicalValuePair(a: ValueToken, b: ValueToken): [ValueToken, ValueToken] {
  return (VALUE_RANK.get(a) ?? 0) <= (VALUE_RANK.get(b) ?? 0) ? [a, b] : [b, a];
}

export function valuePairKey(pair: readonly [ValueToken, ValueToken]): string {
  return `${pair[0]}|${pair[1]}`;
}

/** The other half of a pair, given the half that won. */
export function otherValue(
  pair: readonly [ValueToken, ValueToken],
  winner: ValueToken
): ValueToken {
  return pair[0] === winner ? pair[1] : pair[0];
}

/**
 * The empty justification style. Lives here rather than beside the other empty-state factory in
 * service.ts because the v2 → v3 migration in store.ts needs it too, and store must not import
 * service.
 */
export function emptyJustificationStyle(): {
  invoked: ValueToken[];
  unspoken: ValueToken[];
  narrativePattern: string;
  confidence: number;
  evidence: string[];
} {
  return { invoked: [], unspoken: [], narrativePattern: "未知", confidence: 0, evidence: [] };
}

/**
 * A core thread must be carried by at least this many orderings. One ordering is a disposal, not
 * a thread — and a "core" read off a single episode is exactly the unfalsifiable character sketch
 * the rest of this module refuses to produce.
 */
export const MIN_CORE_ORDERINGS = 2;

/**
 * A disposal observed once is not a signature — it is an incident. Requiring two instances is
 * what stops the layer that is supposed to transfer across situations from being read off a
 * single one.
 */
export const MIN_SIGNATURE_INSTANCES = 2;

// Input caps. This service has no application-level auth (see README), so anything that
// reaches these endpoints can spend model credits — bound the per-request input explicitly.
export const MAX_PORTRAIT_CHARS = 20_000;
export const MAX_MATERIAL_CHARS = 20_000;
export const MAX_SITUATION_CHARS = 2_000;
export const MAX_NAME_CHARS = 120;
export const MAX_SOURCE_CHARS = 200;
export const MAX_SUBJECT_ID_CHARS = 120;

// A profile that accumulates observations forever eventually stops fitting in a prompt. The
// oldest go first — but only those nothing cites, so this is a soft cap: an observation that a
// claim, a trait, an ordering or the justification style still rests on is never trimmed.
export const MAX_OBSERVATIONS = 400;
export const MAX_REVISION_LOG_ENTRIES = 200;
export const MAX_VALUE_ORDERINGS = 120;
