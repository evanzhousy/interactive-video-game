import type { ValueFamily, ValueToken } from "../ordamor/index.js";
import type { Locale, LocalizedText } from "./types.js";

export function tl(text: LocalizedText, lang: Locale): string {
  return text[lang] || text.en || text.zh;
}

/**
 * Exact 13 VALUE_TOKENS localized across zh / en / ja.
 * Canonical Chinese labels match `VALUE_LABELS` in `src/ordamor/constants.ts`.
 */
export const VALUE_I18N: Record<ValueToken, LocalizedText> = {
  loyalty:     { zh: "忠诚", en: "Loyalty",   ja: "忠誠" },
  truth:       { zh: "真相", en: "Truth",     ja: "真相" },
  fairness:    { zh: "公平", en: "Fairness",  ja: "公平" },
  care:        { zh: "关怀", en: "Care",      ja: "配慮" },
  order:       { zh: "秩序", en: "Order",     ja: "秩序" },
  autonomy:    { zh: "自主", en: "Autonomy",  ja: "自主" },
  achievement: { zh: "成就", en: "Achieve",   ja: "達成" },
  security:    { zh: "自保", en: "Security",  ja: "自己保存" },
  status:      { zh: "名声", en: "Status",    ja: "名声" },
  duty:        { zh: "本分", en: "Duty",      ja: "本分" },
  principle:   { zh: "原则", en: "Principle", ja: "原則" },
  mercy:       { zh: "宽宥", en: "Mercy",     ja: "寛容" },
  justice:     { zh: "追责", en: "Justice",   ja: "追及" }
};

export const FAMILY_ARC_SPANS: ReadonlyArray<{
  family: ValueFamily;
  startDeg: number;
  endDeg: number;
  label: LocalizedText;
}> = [
  { family: "self", startDeg: -42, endDeg: 42,  label: { zh: "自我", en: "SELF", ja: "自己" } },
  { family: "bond", startDeg:  70, endDeg: 155, label: { zh: "关系", en: "BOND", ja: "関係" } },
  { family: "rule", startDeg: 183, endDeg: 290, label: { zh: "规则", en: "RULE", ja: "規則" } }
];

export const UI_STRINGS = {
  subtitle: {
    zh: "0号前哨站 · 斯瓦尔巴 -46°C · 值班检疫官 #09",
    en: "OUTPOST 0 · SVALBARD -46°C · GATE OPERATOR #09",
    ja: "第0前哨基地 · スヴァールバル -46°C · 検疫官 #09"
  },
  reroll: {
    zh: "重抽随机班次",
    en: "New Random Shift",
    ja: "新規ランダム周回"
  },
  night5Btn: {
    zh: "第5夜终局自审",
    en: "Night 5 Self-Audit",
    ja: "第5夜・自己監査"
  },
  strobeBtn: {
    zh: "强光瞳孔反射 [1 PWR]",
    en: "Pupil Strobe [1 PWR]",
    ja: "瞳孔ストロボ [1 PWR]"
  },
  thermalBtn: {
    zh: "神经插口热成像 [1 PWR]",
    en: "Neural Thermal [1 PWR]",
    ja: "神経ポート熱画像 [1 PWR]"
  },
  zeroLipNote: {
    zh: "双层隔音防爆窗 + 无线按压对讲（天然规避多语种口型同步）",
    en: "Double-Glazed Blast Window + PTT Intercom (Zero-Lip-Sync Architecture)",
    ja: "二重防爆ガラス＋無線インターホン（多言語リップシンク不要設計）"
  },
  intercomHeader: {
    zh: "壁挂对讲机拷问记录（每名访客硬上限 4 句）",
    en: "PTT INTERCOM TRANSCRIPT (HARD CAP: 4 TURNS)",
    ja: "インターホン尋問記録（上限 4 ターン）"
  },
  probeHint: {
    zh: "战术追问预设（或下方自由输入两难/拆前提拷问）：",
    en: "Tactical Probes (or type a custom dilemma / precondition trap below):",
    ja: "戦術質問チップ（または自由入力）："
  },
  placeholder: {
    zh: "直接输入你想质问窗外人的话...",
    en: "Ask the survivor outside anything...",
    ja: "窓外の相手へ自由に質問を入力..."
  },
  pttSend: { zh: "发送", en: "SEND", ja: "送信" },
  admitBtn: { zh: "放行 // ADMIT", en: "UNSEAL // ADMIT", ja: "解放 // ADMIT" },
  purgeBtn: { zh: "净化 // PURGE", en: "PURGE // 1,100°C", ja: "焼却 // PURGE" },
  tabBaseline: { zh: "01 人物档案", en: "01 Dossier", ja: "01 人物調書" },
  tabVerdict: { zh: "02 裁决复盘", en: "02 Verdict", ja: "02 判定結果" },
  tabInspector: { zh: "03 管线", en: "03 JSON", ja: "03 JSON" },
  neverWonLabel: {
    zh: "嘴上常挂（从未做到）:",
    en: "Claims Aloud (Never Did):",
    ja: "口癖の建前（実行0回）:"
  },
  silentLabel: {
    zh: "真实底色:",
    en: "True Priority:",
    ja: "本当の優先順位:"
  },
  arcCaption: {
    zh: "心理底牌 · 危机时「放弃什么 → 保住什么」",
    en: "PRIORITY MAP · In a crisis: Dropped → Protected",
    ja: "心理マップ · 危機時に「捨てたもの → 守ったもの」"
  },
  dispHeader: {
    zh: "惯用借口与破绽",
    en: "FAVORITE EXCUSE & WEAKPOINT",
    ja: "常套の言い訳と弱点"
  },
  evHeader: {
    zh: "过往档案 // 真实记录与口述",
    en: "STATION RECORDS // ACTIONS & QUOTES",
    ja: "過去記録 // 行動履歴と発言"
  },
  nextVisitorBtn: {
    zh: "呼叫下一名门外幸存者 →",
    en: "Call Next Survivor at Gate 0 →",
    ja: "次の生存者を呼ぶ →"
  },
  finishShiftBtn: {
    zh: "进入第 5 夜终局：镜面自审 →",
    en: "Enter Night 5 Finale: Mirror Audit →",
    ja: "第5夜クライマックス：自己監査へ →"
  },
  offAxisSystemNote: {
    zh: "提示：工号与技术细节伪人全背过，不会露馅——请直接追问档案里的过往旧账与两难选择。",
    en: "Note: Mimics memorize passcodes & trivia intact—press them on past actions and hard dilemmas from their file.",
    ja: "ヒント：番号や知識は擬態体も暗記しています。調書の過去記録や二択の矛盾を突いてください。"
  },
  previewLead: {
    zh: "提问方向：",
    en: "Question Focus: ",
    ja: "質問の方向："
  },
  previewOffAxis: {
    zh: "常规闲聊 · 真人与伪人回答相同",
    en: "Small talk · Humans and mimics answer identically",
    ja: "一般質問・人間も擬態体も同じ回答"
  },
  previewDisposal: {
    zh: "追问借口与卸责方式",
    en: "Pressing their excuse",
    ja: "言い訳の追及"
  },
  previewBoggart: {
    zh: "拆穿借口 · 堵死退路",
    en: "Break Excuse · Remove Safety Net",
    ja: "言い訳の前提を崩す"
  },
  stormBanner: {
    zh: "[! MAG-STORM] 第 3 夜 · 极地强磁暴：强光测距与红外热成像全屏噪点，请纯靠对讲审讯判断！",
    en: "[! MAG-STORM] NIGHT 3 · GEOMAGNETIC STORM: Optical & thermal sensors scrambled — rely strictly on intercom!",
    ja: "[! MAG-STORM] 第3夜・極地磁気嵐：光学・熱画像センサー飽和中 —— インターホン尋問のみで判定せよ！"
  },
  rephrasingNote: {
    zh: "[PTT // 正在接收窗外无线电回应...]",
    en: "[PTT // RECEIVING INTERCOM TRANSMISSION...]",
    ja: "[PTT // 窓外からの無線応答を受信中...]"
  }
} as const;
