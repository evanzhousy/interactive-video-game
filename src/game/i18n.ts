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
    zh: "输入两难或拆前提质询...",
    en: "Type dilemma or precondition probe...",
    ja: "二択・前提剥奪の質問を入力..."
  },
  pttSend: { zh: "按压发送", en: "PTT SEND", ja: "送信" },
  admitBtn: { zh: "放行 // ADMIT", en: "UNSEAL // ADMIT", ja: "解放 // ADMIT" },
  purgeBtn: { zh: "净化 // PURGE", en: "PURGE // 1,100°C", ja: "焼却 // PURGE" },
  tabBaseline: { zh: "01 心智卡", en: "01 Profile", ja: "01 カルテ" },
  tabVerdict: { zh: "02 叠图", en: "02 Diff", ja: "02 比較" },
  tabInspector: { zh: "03 管线", en: "03 JSON", ja: "03 JSON" },
  neverWonLabel: {
    zh: "嘴上常提 · 从未赢过 (neverWon):",
    en: "Invoked Aloud · 0 Wins (neverWon):",
    ja: "建前の価値 · 勝利0回 (neverWon):"
  },
  silentLabel: {
    zh: "沉默主宰 (silent):",
    en: "Silent Driver (silent):",
    ja: "沈黙の支配価値 (silent):"
  },
  arcCaption: {
    zh: "MIND CRYSTAL · 琥珀弧线由放弃方指向真实守住方（self / bond / rule）",
    en: "MIND CRYSTAL · Amber chords point from dropped value to winner (self / bond / rule)",
    ja: "MIND CRYSTAL · 琥珀色の弦は切り捨てた価値から守った価値を指す"
  },
  dispHeader: {
    zh: "DISPOSAL SIGNATURE · 处置签名与退路前提 (disposalRequires)",
    en: "DISPOSAL SIGNATURE · Pattern & Precondition (disposalRequires)",
    ja: "DISPOSAL SIGNATURE · 処置署名と退路の前提条件"
  },
  evHeader: {
    zh: "EVIDENCE // o-N 事实链",
    en: "EVIDENCE // GROUNDED o-N",
    ja: "EVIDENCE // 客観記録 o-N"
  },
  nextVisitorBtn: {
    zh: "呼叫下一名门外幸存者 →",
    en: "Call Next Survivor at Gate 0 →",
    ja: "次の生存者を呼ぶ →"
  },
  finishShiftBtn: {
    zh: "进入第 5 夜终局：ORD-OS 自审 →",
    en: "Enter Night 5 Finale: ORD-OS Self-Audit →",
    ja: "第5夜クライマックス：自己監査へ →"
  },
  offAxisSystemNote: {
    zh: "该问题未触及档案冲突轴：真人和寄生体会给出完全相同的回答。",
    en: "Question touched no conflict axis on file: humans and mimics answer identically.",
    ja: "記録上の対立軸に触れていない質問です。人間も擬態体も同じ答えになります。"
  },
  previewLead: {
    zh: "ORD-OS 预判检测轴：",
    en: "ORD-OS Axis Preview: ",
    ja: "ORD-OS 検査軸予測："
  },
  previewOffAxis: {
    zh: "未触及冲突轴 · 真人与伪人回答相同",
    en: "Off-axis · Humans and mimics answer identically",
    ja: "対立軸なし・人間も擬態体も同じ回答"
  },
  previewDisposal: {
    zh: "处置签名 (sig-1)",
    en: "Disposal Signature (sig-1)",
    ja: "処置署名 (sig-1)"
  },
  previewBoggart: {
    zh: "Boggart · 拆退路前提 (disposalRequires)",
    en: "Boggart · Remove Precondition (disposalRequires)",
    ja: "Boggart · 退路前提の剥奪 (disposalRequires)"
  },
  stormBanner: {
    zh: "[! MAG-STORM] 第 3 夜 · 极地强磁暴：强光测距与红外热成像全屏噪点，请纯靠对讲审讯判断！",
    en: "[! MAG-STORM] NIGHT 3 · GEOMAGNETIC STORM: Optical & thermal sensors scrambled — rely strictly on intercom!",
    ja: "[! MAG-STORM] 第3夜・極地磁気嵐：光学・熱画像センサー飽和中 —— インターホン尋問のみで判定せよ！"
  },
  rephrasingNote: {
    zh: "[PTT // 对讲电波调制中 · Flash 在线改写...]",
    en: "[PTT // STATIC · Flash Rephrasing...]",
    ja: "[PTT // 通信変調中 · Flash オンライン改稿...]"
  }
} as const;
