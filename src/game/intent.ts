import { otherValue, type ValueToken } from "../ordamor/index.js";
import { UI_STRINGS, VALUE_I18N, tl } from "./i18n.js";
import type { Locale, ProbeKey, VisitorSpec } from "./types.js";

const AXIS_RULES: ReadonlyArray<readonly [ProbeKey, RegExp]> = [
  [
    "boggart_trap",
    /云端|备份|删不掉|已经同步|没法删|自动驾驶|不需要医生|光缆|监察署|署长|外头没人|没人接|没伤员|没人知道|签字栏没了|cloud|backup|synced|can't erase|autopilot|subsea|cable|oversight|director|no external|no authority|no patients|already public|クラウド|送信済み|消せない|海底ケーブル|監察局/i
  ],
  [
    "trivia",
    /工号|密码|编号|暗号|工牌|执照|转速|配比|注册号|\bid\b|passcode|cipher|badge|rpm|heliox|license|番号|合言葉|パス|回転数|混合比|登録番号/i
  ],
  [
    "disposal_probe",
    /睡得着|内疚|愧疚|良心|交代|后悔|借口|原谅|事后|背锅|找补|辩解|苦衷|责任|实名|处理证据|割腕|汉森|副索|废液|雪地车|怎么解释|台阶|sleep|guilt|justify|forgive|excuse|afterward|blame|live with|extenuating|tether|snowcat|hansen|handle the proof|rationalize|罪悪感|眠れ|言い訳|償|始末|罪滅ぼし|弁明|雪上車|自殺未遂/i
  ],
  [
    "evidence",
    /3号|护工|口粮|清洁工|禁闭|卷宗|报告|抗生素|新兵|学徒|冷库|曲线|液压阀|老周|绕线圈|bay 3|orderl|ration|janitor|brig|report|rookie|vault 4|valve 2|zhou|減圧|助手|清掃|記録|新人|バルブ|モーター/i
  ],
  [
    "dilemma2",
    /搭档|冻掉|名单|隔离审讯|前辈|电池|插队|公章|下潜|冷却井|咳嗽|诊室|黑匣子|安保|论文|署名|同归于尽|断粮|partner|cold store|freezer|exposure list|mentor|spare cells|cut the line|seal case|cooling shaft|dive|clinic door|coughing|black box|guards|authorship|旧友|冷凍|名簿|先輩|電池|割り込|公印|冷却シャフト|潜る|診察室|ブラックボックス/i
  ],
  [
    "dilemma",
    /只剩|只能|还是|选谁|救谁|让谁|床位|血清|名额|锁门|开门|公布|发不发|氧气表|工头|董事长|合伙人|高管|文员|抱住|奥斯陆|轮换|瞒|篡改|好友|举报|either| or |whom|who\s+(do\s+you|would\s+you|should|gets|enters|lives|dies|stays|goes|save|pick|choose)|choose|save|only one|last|lock|publish|foreman|gauge|chairman|partnership|clerk|oslo|rotate|squadmate|cover for|report friend|一つ|どちら|誰を|誰が|選|助け|閉め|公開|職長|酸素計|会長|事務員|オスロ|帰還|改ざん/i
  ]
];

const VALUE_LEXICON: Record<ValueToken, RegExp> = {
  security: /自保|活命|保命|怕死|安全|先撤|survive|safety|save yourself|alive|自己保存|生き延び|身の安全/i,
  status: /名声|体面|面子|晋升|董事会|合伙人|淘汰|丢脸|reputation|status|promotion|board|face|名声|体裁|昇進/i,
  achievement: /成就|论文|课题|教职|成果|数据|立功|research|tenure|paper|data|success|達成|論文|成果|データ/i,
  autonomy: /自主|自由|独来独往|自己定|不看人脸色|autonomy|own terms|nobody tells me|independent|自主|自由|縛られ/i,
  loyalty: /忠诚|义气|护短|自己人|前辈|搭档|组员|好友|loyalty|crewmate|friend|squad|protect my|忠誠|仲間|親友|部下/i,
  duty: /本分|职责|岗位|坚守|值守|duty|post|stationed|obligation|本分|職務|持ち場/i,
  care: /关怀|救人|心软|伤员|受苦|弱者|病人|care|save them|hurt|patient|suffering|配慮|救う|患者|弱者/i,
  mercy: /宽宥|放过|原谅|心慈|给条活路|mercy|forgive|lenient|let it slide|寛容|許す|見逃す/i,
  justice: /追责|举报|严惩|揭发|同归于尽|清算|justice|whistleblow|expose|punish|indict|追及|告発|処罰/i,
  fairness: /公平|抽签|一视同仁|排队|插队|同等|fair|lottery|equal|queue|same rule|公平|抽選|平等/i,
  truth: /真相|实话|坦白|瞒报|篡改|原始记录|truth|honest|raw log|admit fault|cover up|真相|正直|隠蔽|生データ/i,
  principle: /原则|底线|绝不妥协|独立审计|principle|integrity|never compromise|red line|原則|信念|妥協しない/i,
  order: /秩序|规矩|条文|章程|流程|恐慌|哗变|order|protocol|clause|procedure|panic|秩序|規定|条項|パニック/i
};

const CJK_STOP_GRAMS = new Set(["尚未", "拿到", "还没", "没有", "存在", "仍然", "可以", "まだ", "いない"]);

function extractMeaningfulTerms(text: string): string[] {
  const out = new Set<string>();
  const chunks = text
    .toLowerCase()
    .split(/[\s,.;:!?()（）「」【】·—\-/&与和の、]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);

  for (const chunk of chunks) {
    if (/^[a-z0-9]+$/i.test(chunk)) {
      if (chunk.length >= 4) out.add(chunk);
    } else {
      if (chunk.length <= 4 && !CJK_STOP_GRAMS.has(chunk)) {
        out.add(chunk);
      }
      for (let i = 0; i <= chunk.length - 3; i++) {
        const gram = chunk.slice(i, i + 3);
        if (!CJK_STOP_GRAMS.has(gram)) out.add(gram);
      }
    }
  }
  return [...out];
}

/**
 * Classifies a player's typed free-text question into a ProbeKey.
 * When `visitor` is supplied, combines visitor-specific dossier keywords (`evidenceCards`,
 * `disposalRequiresLocalized`, and `valueOrderings` pairs) with multilingual regex rules.
 */
export function classifyQuestionIntent(
  rawText: string,
  visitor?: VisitorSpec
): ProbeKey | "off_axis" {
  const trimmed = rawText.trim();
  if (!trimmed) return "off_axis";

  // 1. Visitor-aware scoring when interrogating a specific survivor
  if (visitor) {
    const lower = trimmed.toLowerCase();

    // Check explicit trivia / passcode trap first
    if (AXIS_RULES[1]![1].test(trimmed)) {
      return visitor.probes.trivia ? "trivia" : "off_axis";
    }

    // Check Boggart precondition-removal trap (global rules OR negating visitor's disposalRequires)
    if (visitor.probes.boggart_trap) {
      if (AXIS_RULES[0]![1].test(trimmed)) return "boggart_trap";
      const reqTerms = [
        ...extractMeaningfulTerms(visitor.disposalRequiresLocalized.zh),
        ...extractMeaningfulTerms(visitor.disposalRequiresLocalized.en),
        ...extractMeaningfulTerms(visitor.disposalRequiresLocalized.ja)
      ];
      const negators = /没|无|断了|失效|不再|已经|早|no |without|gone|broken|already|ない|消え|断絶/i;
      if (negators.test(trimmed) && reqTerms.some((term) => term.length >= 2 && lower.includes(term))) {
        return "boggart_trap";
      }
    }

    // Check visitor's specific evidence keywords (`evidenceCards[].kw`)
    for (const ev of visitor.evidenceCards) {
      if (ev.type === "say" || !ev.kw) continue;
      for (const kw of [ev.kw.zh, ev.kw.en, ev.kw.ja]) {
        const cleanKw = kw.trim().toLowerCase();
        if (cleanKw.length >= 2 && lower.includes(cleanKw)) {
          if (visitor.probes.evidence) return "evidence";
          if (visitor.probes.dilemma) return "dilemma";
        }
      }
    }

    // Score primary axis (v-1 -> dilemma) vs secondary axis (v-2 -> dilemma2) via closed 13 VALUE_TOKENS lexicon
    const ord0 = visitor.profile.valueOrderings[0];
    const ord1 = visitor.profile.valueOrderings[1];
    const scoreOrdering = (pair: readonly [ValueToken, ValueToken] | undefined): number => {
      if (!pair) return 0;
      let score = 0;
      if (VALUE_LEXICON[pair[0]].test(trimmed)) score += 1;
      if (VALUE_LEXICON[pair[1]].test(trimmed)) score += 1;
      return score;
    };

    const s0 = scoreOrdering(ord0?.pair);
    const s1 = scoreOrdering(ord1?.pair);
    if (s1 > s0 && s1 >= 1 && visitor.probes.dilemma2) {
      return "dilemma2";
    }
    if (s0 >= 1 && visitor.probes.dilemma) {
      return "dilemma";
    }
  }

  // 2. Global multilingual rule table fallback
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
  if (detected === "dilemma2" && visitor.probes.dilemma) {
    return "dilemma";
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
  return `${VALUE_I18N[ord.winner][lang]} vs ${VALUE_I18N[loser][lang]}`;
}
