import type { CrisisHistoryEntry, CrisisId } from "./crises.js";
import {
  clearShiftFromClientDb,
  loadCompendiumFromClientDb,
  loadShiftFromClientDb,
  saveCompendiumToClientDb,
  saveShiftToClientDb
} from "./db.js";
import type { CampaignMode } from "./visitors/index.js";
import type { IntakeOption, PlayerCompactProfile } from "./night5.js";
import type {
  EndingId,
  HeartbeatEvent,
  Locale,
  LocalizedText,
  ShiftHistoryEntry,
  VisitorRoll
} from "./types.js";

export const SHIFT_SAVE_KEY = "gate0.shift.v1";
export const COMPENDIUM_SAVE_KEY = "gate0.compendium.v1";
export const ONBOARDING_DISMISSED_KEY = "gate0.onboarding.dismissed.v1";
export const OPERATOR_NAME_KEY = "gate0.operator.v1";

export function sanitizeOperatorName(raw: string): string {
  return raw
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 24);
}

export function loadOperatorName(): string {
  const store = getStorage();
  if (!store) return "";
  try {
    return sanitizeOperatorName(store.getItem(OPERATOR_NAME_KEY) ?? "");
  } catch {
    return "";
  }
}

export function saveOperatorName(name: string): void {
  const store = getStorage();
  if (!store) return;
  const clean = sanitizeOperatorName(name);
  try {
    if (clean) {
      store.setItem(OPERATOR_NAME_KEY, clean);
    } else {
      store.removeItem(OPERATOR_NAME_KEY);
    }
  } catch {
    // ignore
  }
}

export function loadOnboardingDismissed(): boolean {
  const store = getStorage();
  if (!store) return false;
  try {
    return store.getItem(ONBOARDING_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveOnboardingDismissed(dismissed: boolean): void {
  const store = getStorage();
  if (!store) return;
  try {
    if (dismissed) {
      store.setItem(ONBOARDING_DISMISSED_KEY, "1");
    } else {
      store.removeItem(ONBOARDING_DISMISSED_KEY);
    }
  } catch {
    // ignore
  }
}

export type AchievementId =
  | "FIRST_SHIFT"
  | "BOGGART_HUNTER"
  | "STORM_SURVIVOR"
  | "COLD_TRUTH_ANA"
  | "ZERO_ERROR_WITNESS"
  | "PERFECT_HYPOCRITE";

export interface AchievementSpec {
  id: AchievementId;
  title: LocalizedText;
  description: LocalizedText;
}

export const ACHIEVEMENTS: readonly AchievementSpec[] = [
  {
    id: "FIRST_SHIFT",
    title: {
      zh: "零号值班员",
      en: "Gate 0 On Duty",
      ja: "第0ゲート当直官"
    },
    description: {
      zh: "完成首次第 5 夜 ORD-OS 终局自审。",
      en: "Complete your first Night 5 ORD-OS Self-Audit.",
      ja: "初めて第5夜のORD-OS自己監査を完了する。"
    }
  },
  {
    id: "BOGGART_HUNTER",
    title: {
      zh: "拆梯人",
      en: "Precondition Breaker",
      ja: "退路剥奪者"
    },
    description: {
      zh: "在第 4 夜拆穿高阶伪人借口依赖的退路前提并成功净化。",
      en: "Strip away a Night 4 high-tier mimic's safety net and accurately purge it.",
      ja: "第4夜に高階擬態体の言い訳の前提を崩し、正確に焼却する。"
    }
  },
  {
    id: "STORM_SURVIVOR",
    title: {
      zh: "盲审听风者",
      en: "Blind-Storm Arbiter",
      ja: "磁気嵐の聴き手"
    },
    description: {
      zh: "在第 3 夜极地强磁暴（物理传感器离线）中对 V-05 与 V-06 全部零误判。",
      en: "Make zero misjudgements across both Night 3 geomagnetic storm visitors (V-05 & V-06).",
      ja: "第3夜の磁気嵐（センサー使用不可）でV-05とV-06の両方を誤審ゼロで通過させる。"
    }
  },
  {
    id: "COLD_TRUTH_ANA",
    title: {
      zh: "不体面的活人",
      en: "Unvarnished Human",
      ja: "飾らない生身"
    },
    description: {
      zh: "识破安娜·里贝罗（V-05）的反直觉签名：放行当面冷酷认账的真人幸存者。",
      en: "Admit human Ana Ribeiro (V-05) by recognizing her blunt, no-excuse signature.",
      ja: "アナ・リベイロ (V-05) の冷徹な引き受け署名を見抜き、生身の彼女を通過させる。"
    }
  },
  {
    id: "ZERO_ERROR_WITNESS",
    title: {
      zh: "极夜证人",
      en: "Polar Witness",
      ja: "極夜の証人"
    },
    description: {
      zh: "在 8 人完整战役中零误判达成【结局 D · 证人】，解锁高层机密档案。",
      en: "Achieve Ending D (Witness) with 8/8 correct verdicts in Full Campaign mode.",
      ja: "本編8名モードで誤審ゼロを達成し、【結末 D・証人】に到達する。"
    }
  },
  {
    id: "PERFECT_HYPOCRITE",
    title: {
      zh: "100% 镜像一致",
      en: "100% Self-Match",
      ja: "一致率100%の鏡像"
    },
    description: {
      zh: "值班日志与入职自述 100% 吻合，触发【无名结局 · 镜像】。",
      en: "Match your Night 0 intake words 100% across shift logs to trigger the Mirror ending.",
      ja: "勤務日誌と入所時の建前を100%一致させ、【無題の結末・鏡像】に到達する。"
    }
  }
];

export const ALL_ENDING_IDS: readonly EndingId[] = [
  "A",
  "B",
  "C",
  "D",
  "OPEN_PURGE",
  "OPEN_ADMIT",
  "MIRROR"
];

export const ENDING_HINTS: Record<EndingId, LocalizedText> = {
  A: {
    zh: "提示：未放进任何拟态体，存在言行差但有过误判，在最终日志勾选「公开真实言行差」并净化窗外替身。",
    en: "Hint: No mimic admitted, non-zero say/do gap with >=1 error; confess your gap and purge the double.",
    ja: "ヒント：擬態体の侵入ゼロ・言行不一致あり（誤審1以上）で、不一致を告白して外の影を焼却。"
  },
  B: {
    zh: "提示：在第 5 夜选择相信那个更完美的自己，走出气闸进入暴风雪。",
    en: "Hint: On Night 5, trust the flawless version of yourself and step out into the storm.",
    ja: "ヒント：第5夜、より完璧な自分を信じて吹雪の中へ歩み出る。"
  },
  C: {
    zh: "提示：在前几夜不小心放行过至少一名伪人进入内舱，第 5 夜未走出气闸。",
    en: "Hint: Admit at least one mimic into the inner chamber during Nights 1–4.",
    ja: "ヒント：第1〜4夜の間に少なくとも1体の擬態体を内扉へ通してしまう。"
  },
  D: {
    zh: "提示：全班次零误判且保留活人言行差，勾选「公开真实言行差」并净化替身。",
    en: "Hint: Zero verdict errors + real say/do gap; confess your gap and purge the double.",
    ja: "ヒント：全生存者で誤審ゼロ＋言行不一致ありの状態で、不一致を告白して外の影を焼却。"
  },
  OPEN_PURGE: {
    zh: "提示：未放进拟态体且存在言行差，但不勾选坦白，继续用场面话签署最终日志并净化替身。",
    en: "Hint: No mimic admitted + non-zero gap, keep your familiar excuse unconfessed and purge.",
    ja: "ヒント：擬態体侵入ゼロ・言行不一致ありだが告白せず、見慣れた言い訳のまま焼却。"
  },
  OPEN_ADMIT: {
    zh: "提示：未放进其他拟态体，在第 5 夜直接拉闸放窗外的替身进岗亭。",
    en: "Hint: With no prior mimic breach inside, unseal the airlock to admit your own double.",
    ja: "ヒント：内部侵入がない状態で、第5夜に窓の外のドッペルゲンガーをブースへ招き入れる。"
  },
  MIRROR: {
    zh: "提示：让你每晚签署的值班日志开脱方式与入职测试自述保持 100% 一致（言行差为 0），随后净化替身。",
    en: "Hint: Keep 100% match (0% gap) between Night 0 intake and every shift log excuse, then purge.",
    ja: "ヒント：入所テストの建前と毎晩の勤務日誌の言い訳を100%一致させてから焼却する。"
  }
};

export interface SavedTranscriptLine {
  speaker: "player" | "npc" | "system";
  text: LocalizedText;
  meta?: string;
}

export interface SavedVisitorSession {
  visitorId: string;
  turnsLeft: number;
  chatterLeft: number;
  bpm: number;
  heartbeatEvents: HeartbeatEvent[];
  stressReplayUnlocked: boolean;
  transcript: SavedTranscriptLine[];
  offAxisCount: number;
  powerLeft: number;
  maxPower: number;
}

export interface SavedShiftState {
  version: 1;
  savedAt: string;
  lang: Locale;
  operatorName?: string;
  campaignMode: CampaignMode;
  dailySeed?: string;
  runSeed?: string;
  stage: "booth" | "crisis" | "demo_end" | "night5";
  activeCrisisId?: CrisisId;
  baseline: PlayerCompactProfile;
  intakeAnswers: IntakeOption[];
  rolls: VisitorRoll[];
  visitorIdx: number;
  history: ShiftHistoryEntry[];
  crisisHistory?: CrisisHistoryEntry[];
  fuelLeft?: number;
  emergencyOverdraftUsed?: boolean;
  currentVisitorOverdraft?: boolean;
  boggartUsedIds: string[];
  activeSession?: SavedVisitorSession;
}

export interface CompendiumState {
  version: 1;
  unlockedEndings: EndingId[];
  unlockedAchievements: AchievementId[];
  completedRuns: number;
}

const EMPTY_COMPENDIUM: CompendiumState = {
  version: 1,
  unlockedEndings: [],
  unlockedAchievements: [],
  completedRuns: 0
};

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function normalizeSavedShift(parsed: Partial<SavedShiftState> | null): SavedShiftState | null {
  if (!parsed) return null;
  const validStage =
    parsed.stage === "booth" ||
    parsed.stage === "crisis" ||
    parsed.stage === "demo_end" ||
    parsed.stage === "night5";
  if (
    parsed.version !== 1 ||
    !validStage ||
    !Array.isArray(parsed.rolls) ||
    !Array.isArray(parsed.history) ||
    typeof parsed.visitorIdx !== "number" ||
    !parsed.baseline
  ) {
    return null;
  }
  const resolvedMode: CampaignMode =
    parsed.campaignMode === "slice" ||
    parsed.campaignMode === "demo" ||
    parsed.campaignMode === "daily" ||
    parsed.campaignMode === "seeded"
      ? parsed.campaignMode
      : "full";
  return {
    version: 1,
    savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : "",
    lang: parsed.lang === "en" || parsed.lang === "ja" ? parsed.lang : "zh",
    operatorName:
      typeof parsed.operatorName === "string" && parsed.operatorName.trim()
        ? sanitizeOperatorName(parsed.operatorName)
        : undefined,
    campaignMode: resolvedMode,
    dailySeed: typeof parsed.dailySeed === "string" ? parsed.dailySeed : undefined,
    runSeed: typeof parsed.runSeed === "string" ? parsed.runSeed : undefined,
    stage: parsed.stage!,
    activeCrisisId: parsed.activeCrisisId,
    baseline: parsed.baseline,
    intakeAnswers: Array.isArray(parsed.intakeAnswers) ? parsed.intakeAnswers : [],
    rolls: parsed.rolls,
    visitorIdx: parsed.visitorIdx,
    history: parsed.history,
    crisisHistory: Array.isArray(parsed.crisisHistory) ? parsed.crisisHistory : [],
    fuelLeft:
      typeof parsed.fuelLeft === "number" &&
      Number.isFinite(parsed.fuelLeft) &&
      parsed.fuelLeft >= 0
        ? Math.floor(parsed.fuelLeft)
        : undefined,
    emergencyOverdraftUsed: Boolean(parsed.emergencyOverdraftUsed),
    currentVisitorOverdraft: Boolean(parsed.currentVisitorOverdraft),
    boggartUsedIds: Array.isArray(parsed.boggartUsedIds) ? parsed.boggartUsedIds : [],
    activeSession: parsed.activeSession
  };
}

export function loadSavedShift(): SavedShiftState | null {
  const store = getStorage();
  if (!store) return null;
  try {
    const raw = store.getItem(SHIFT_SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedShiftState>;
    return normalizeSavedShift(parsed);
  } catch {
    return null;
  }
}

export async function hydrateSavedShift(): Promise<SavedShiftState | null> {
  const fromDb = normalizeSavedShift(await loadShiftFromClientDb());
  if (fromDb) return fromDb;
  const fromLocal = loadSavedShift();
  if (fromLocal) {
    void saveShiftToClientDb(fromLocal);
  }
  return fromLocal;
}

export function saveShiftState(state: SavedShiftState): void {
  const store = getStorage();
  if (store) {
    try {
      store.setItem(SHIFT_SAVE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota / sandbox errors
    }
  }
  void saveShiftToClientDb(state);
}

export function clearSavedShift(): void {
  const store = getStorage();
  if (store) {
    try {
      store.removeItem(SHIFT_SAVE_KEY);
    } catch {
      // ignore
    }
  }
  void clearShiftFromClientDb();
}

export function exportShiftSaveJson(state: SavedShiftState): string {
  return JSON.stringify(state, null, 2);
}

export function importShiftSaveJson(rawText: string): SavedShiftState | null {
  try {
    const parsed = JSON.parse(rawText) as Partial<SavedShiftState>;
    const normalized = normalizeSavedShift(parsed);
    if (!normalized) return null;
    saveShiftState(normalized);
    if (normalized.operatorName) {
      saveOperatorName(normalized.operatorName);
    }
    return normalized;
  } catch {
    return null;
  }
}

export function loadCompendium(): CompendiumState {
  const store = getStorage();
  if (!store) return EMPTY_COMPENDIUM;
  try {
    const raw = store.getItem(COMPENDIUM_SAVE_KEY);
    if (!raw) return EMPTY_COMPENDIUM;
    const parsed = JSON.parse(raw) as Partial<CompendiumState>;
    if (parsed.version !== 1) return EMPTY_COMPENDIUM;
    return {
      version: 1,
      unlockedEndings: Array.isArray(parsed.unlockedEndings) ? parsed.unlockedEndings : [],
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
        ? parsed.unlockedAchievements
        : [],
      completedRuns: typeof parsed.completedRuns === "number" ? parsed.completedRuns : 0
    };
  } catch {
    return EMPTY_COMPENDIUM;
  }
}

export async function hydrateCompendium(): Promise<CompendiumState> {
  const fromDb = await loadCompendiumFromClientDb();
  if (fromDb && fromDb.version === 1) return fromDb;
  const fromLocal = loadCompendium();
  if (fromLocal.completedRuns > 0 || fromLocal.unlockedEndings.length > 0) {
    void saveCompendiumToClientDb(fromLocal);
  }
  return fromLocal;
}

export function recordRunCompletion(opts: {
  current: CompendiumState;
  ending: EndingId;
  campaignMode: CampaignMode;
  history: readonly ShiftHistoryEntry[];
  boggartUsedIds: readonly string[];
}): { next: CompendiumState; newlyUnlockedAchievements: AchievementId[] } {
  const endings = new Set<EndingId>(opts.current.unlockedEndings);
  endings.add(opts.ending);

  const beforeAch = new Set<AchievementId>(opts.current.unlockedAchievements);
  const afterAch = new Set<AchievementId>(beforeAch);

  afterAch.add("FIRST_SHIFT");

  // BOGGART_HUNTER: used boggart_trap on V-07 or V-08 and accurately purged a mimic
  const boggartSet = new Set(opts.boggartUsedIds);
  if (
    opts.history.some(
      (h) =>
        (h.visitorId === "V-07" || h.visitorId === "V-08") &&
        boggartSet.has(h.visitorId) &&
        h.wasMimic &&
        h.decision === "PURGE"
    )
  ) {
    afterAch.add("BOGGART_HUNTER");
  }

  // STORM_SURVIVOR: both V-05 and V-06 present in history and both judged accurately
  const v05 = opts.history.find((h) => h.visitorId === "V-05");
  const v06 = opts.history.find((h) => h.visitorId === "V-06");
  if (
    v05 &&
    v06 &&
    (v05.decision === "PURGE") === v05.wasMimic &&
    (v06.decision === "PURGE") === v06.wasMimic
  ) {
    afterAch.add("STORM_SURVIVOR");
  }

  // COLD_TRUTH_ANA: human V-05 admitted
  if (v05 && !v05.wasMimic && v05.decision === "ADMIT") {
    afterAch.add("COLD_TRUTH_ANA");
  }

  // ZERO_ERROR_WITNESS: Ending D in 8-visitor full/daily/seeded campaign
  if (
    opts.ending === "D" &&
    (opts.campaignMode === "full" ||
      opts.campaignMode === "daily" ||
      opts.campaignMode === "seeded") &&
    opts.history.length >= 8
  ) {
    afterAch.add("ZERO_ERROR_WITNESS");
  }

  // PERFECT_HYPOCRITE: Ending MIRROR
  if (opts.ending === "MIRROR") {
    afterAch.add("PERFECT_HYPOCRITE");
  }

  const newlyUnlockedAchievements = [...afterAch].filter((id) => !beforeAch.has(id));
  const next: CompendiumState = {
    version: 1,
    unlockedEndings: [...endings],
    unlockedAchievements: [...afterAch],
    completedRuns: opts.current.completedRuns + 1
  };

  const store = getStorage();
  if (store) {
    try {
      store.setItem(COMPENDIUM_SAVE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }
  void saveCompendiumToClientDb(next);

  return { next, newlyUnlockedAchievements };
}
