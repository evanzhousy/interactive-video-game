import { otherValue } from "../ordamor/index.js";
import { UI_STRINGS, VALUE_I18N, tl } from "./i18n.js";
import type { Locale, ProbeKey, VisitorSpec } from "./types.js";

const AXIS_RULES: ReadonlyArray<readonly [ProbeKey, RegExp]> = [
  [
    "boggart_trap",
    /云端|备份|删不掉|已经同步|没法删|自动驾驶|不需要医生|光缆|监察署|署长|外头没人|没人接|cloud|backup|synced|can't erase|autopilot|subsea|cable|oversight|director|no external|no authority|クラウド|送信済み|消せない|海底ケーブル|監察局/i
  ],
  [
    "trivia",
    /工号|密码|编号|暗号|工牌|执照|转速|配比|注册号|\bid\b|passcode|cipher|badge|rpm|heliox|license|番号|合言葉|パス|回転数|混合比|登録番号/i
  ],
  [
    "disposal_probe",
    /睡得着|内疚|愧疚|良心|交代|后悔|借口|原谅|事后|背锅|找补|辩解|苦衷|责任|实名|处理证据|割腕|汉森|副索|废液|雪地车|sleep|guilt|justify|forgive|excuse|afterward|blame|live with|extenuating|tether|snowcat|hansen|handle the proof|罪悪感|眠れ|言い訳|償|始末|罪滅ぼし|弁明|雪上車|自殺未遂/i
  ],
  [
    "evidence",
    /3号|护工|口粮|清洁工|禁闭|卷宗|报告|抗生素|新兵|学徒|冷库|曲线|液压阀|老周|绕线圈|bay 3|orderl|ration|janitor|brig|report|rookie|vault 4|valve 2|zhou|減圧|助手|清掃|記録|新人|バルブ|モーター/i
  ],
  [
    "dilemma2",
    /搭档|冻掉|名单|隔离审讯|前辈|电池|插队|公章|下潜|冷却井|咳嗽|诊室|黑匣子|安保|partner|cold store|freezer|exposure list|mentor|spare cells|cut the line|seal case|cooling shaft|dive|clinic door|coughing|black box|guards|旧友|冷凍|名簿|先輩|電池|割り込|公印|冷却シャフト|潜る|診察室|ブラックボックス/i
  ],
  [
    "dilemma",
    /只剩|只能|还是|谁|选|救|让|床位|血清|名额|锁门|开门|公布|发不发|氧气表|工头|董事长|合伙人|高管|文员|抱住|奥斯陆|轮换|瞒|篡改|either| or |whom|who|choose|save|only one|last|lock|publish|foreman|gauge|chairman|partnership|clerk|oslo|rotate|squadmate|cover for|一つ|どちら|誰|選|助け|閉め|公開|職長|酸素計|会長|事務員|オスロ|帰還|改ざん/i
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
  if (visitor.probes[detected]) return detected;
  if (detected === "evidence") {
    if (visitor.probes.disposal_probe) return "disposal_probe";
    if (visitor.probes.dilemma) return "dilemma";
  }
  return "off_axis";
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
