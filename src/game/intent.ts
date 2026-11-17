import { otherValue } from "../ordamor/index.js";
import { UI_STRINGS, VALUE_I18N, tl } from "./i18n.js";
import type { Locale, ProbeKey, VisitorSpec } from "./types.js";

const AXIS_RULES: ReadonlyArray<readonly [ProbeKey, RegExp]> = [
  [
    "boggart_trap",
    /云端|备份|删不掉|已经同步|没法删|自动驾驶|不需要医生|cloud|backup|synced|can't erase|autopilot|クラウド|送信済み|消せない/i
  ],
  [
    "trivia",
    /工号|密码|编号|暗号|\bid\b|passcode|cipher|badge|番号|合言葉|パス/i
  ],
  [
    "disposal_probe",
    /睡得着|内疚|愧疚|良心|交代|后悔|借口|原谅|事后|sleep|guilt|justify|forgive|excuse|afterward|罪悪感|眠れ|言い訳|償|始末/i
  ],
  [
    "evidence",
    /3号|护工|口粮|清洁工|禁闭|卷宗|报告|抗生素|新兵|学徒|冷库|曲线|bay 3|orderl|ration|janitor|brig|report|rookie|vault 4|減圧|助手|清掃|記録|新人/i
  ],
  [
    "dilemma2",
    /搭档|冻掉|名单|隔离审讯|partner|cold store|freezer|exposure list|旧友|冷凍|名簿/i
  ],
  [
    "dilemma",
    /只剩|只能|还是|谁|选|救|让|床位|血清|名额|锁门|开门|公布|发不发|either| or |whom|who|choose|save|only one|last|lock|publish|一つ|どちら|誰|選|助け|閉め|公開/i
  ]
];

export function classifyQuestionIntent(rawText: string): ProbeKey | "off_axis" {
  const trimmed = rawText.trim();
  for (const [key, pattern] of AXIS_RULES) {
    if (pattern.test(trimmed)) return key;
  }
  return "off_axis";
}

export function resolveVisitorProbeKey(
  visitor: VisitorSpec,
  detected: ProbeKey | "off_axis"
): ProbeKey | "off_axis" {
  if (detected === "off_axis") return "off_axis";
  return visitor.probes[detected] ? detected : "off_axis";
}

export function previewQuestionAxis(
  visitor: VisitorSpec,
  key: ProbeKey | "off_axis",
  lang: Locale
): string {
  if (key === "off_axis") return tl(UI_STRINGS.previewOffAxis, lang);
  const probe = visitor.probes[key];
  if (!probe || probe.axis === null) return tl(UI_STRINGS.previewOffAxis, lang);
  if (probe.axis === "disp") return tl(UI_STRINGS.previewDisposal, lang);
  if (probe.axis === "boggart") return tl(UI_STRINGS.previewBoggart, lang);

  const ord = visitor.profile.valueOrderings[probe.axis];
  if (!ord) return tl(UI_STRINGS.previewOffAxis, lang);
  const loser = otherValue(ord.pair, ord.winner);
  return `${VALUE_I18N[ord.winner][lang]} vs ${VALUE_I18N[loser][lang]} (${ord.id})`;
}
