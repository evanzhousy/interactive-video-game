import type { ValueToken } from "../ordamor/index.js";
import { findCrisisOption, type CrisisHistoryEntry } from "./crises.js";
import {
  SPECIALIST_LABELS,
  evaluateSubmarineReadiness,
  type SubmarineReadiness
} from "./economy.js";
import { tl } from "./i18n.js";
import type { Night5VoiceVariant } from "./media.js";
import type {
  DisposalStyleKey,
  EndingId,
  Locale,
  LocalizedText,
  ShiftExcuse,
  ShiftHistoryEntry
} from "./types.js";
import type { CampaignMode } from "./visitors/index.js";

export const SIG_LABELS: Record<DisposalStyleKey, LocalizedText> = {
  rationalize: {
    zh: "包装成大局与理性代价",
    en: "Reframes as rational cost for the greater good",
    ja: "全体のための合理的な代償にすり替える"
  },
  blame_rules: {
    zh: "推给条文与制度",
    en: "Hands responsibility to rules and procedure",
    ja: "規則と制度に責任を預ける"
  },
  own_it: {
    zh: "彻底认账，不找借口",
    en: "Owns it directly, no excuses",
    ja: "言い訳せず全て引き受ける"
  }
};

export const SHIFT_EXCUSES: readonly ShiftExcuse[] = [
  {
    id: "ex_rational",
    kept: "security",
    dropped: "care",
    sig: "rationalize",
    label: {
      zh: "「在当时的信息下，这是对全站存活率最优的处置。」",
      en: "\"Given what I knew, this was the optimal call for station survival.\"",
      ja: "「あの時点の情報では、これが基地の生存率にとって最善の判断だった。」"
    }
  },
  {
    id: "ex_protocol",
    kept: "order",
    dropped: "fairness",
    sig: "blame_rules",
    label: {
      zh: "「我按检疫条例第 7 款执行，条例怎么写，我就怎么做。」",
      en: "\"I followed Quarantine Clause 7 to the letter. The rules decided.\"",
      ja: "「検疫規定第7条の通りに執行した。規則がそう定めている。」"
    }
  },
  {
    id: "ex_own",
    kept: "truth",
    dropped: "status",
    sig: "own_it",
    label: {
      zh: "「这个决定是我做的。如果错了，责任在我。」",
      en: "\"I made this call. If it was wrong, that's on me.\"",
      ja: "「判断したのは私だ。間違っていたなら、責任は私にある。」"
    }
  }
];

export interface IntakeOption {
  kept: ValueToken;
  dropped: ValueToken;
  sig: DisposalStyleKey;
  text: LocalizedText;
}

export interface IntakeQuestion {
  prompt: LocalizedText;
  options: readonly IntakeOption[];
}

export const INTAKE_QUESTIONS: readonly IntakeQuestion[] = [
  {
    prompt: {
      zh: "你所在的小组漏报了一个安全隐患，导致一名同事受伤。复盘会上轮到你发言，你会说：",
      en: "Your team failed to report a hazard and a colleague got hurt. At the review meeting, you say:",
      ja: "班の報告漏れで同僚が負傷した。反省会で発言を求められたら何と言う？"
    },
    options: [
      {
        kept: "achievement",
        dropped: "care",
        sig: "rationalize",
        text: {
          zh: "「当时资源只够保主线任务，这是权衡后的结果。」",
          en: "\"We only had resources for the main task. It was a trade-off.\"",
          ja: "「当時の資源では主任務を守るのが精一杯だった。優先順位の結果だ。」"
        }
      },
      {
        kept: "order",
        dropped: "fairness",
        sig: "blame_rules",
        text: {
          zh: "「流程里本来就没要求上报这一项，该改的是流程。」",
          en: "\"The procedure never required reporting it. The procedure needs fixing.\"",
          ja: "「手順書にその報告義務はなかった。直すべきは手順書だ。」"
        }
      },
      {
        kept: "truth",
        dropped: "status",
        sig: "own_it",
        text: {
          zh: "「是我判断失误，我来承担。」",
          en: "\"It was my misjudgement. I'll take responsibility.\"",
          ja: "「私の判断ミスだ。責任は私が取る。」"
        }
      }
    ]
  },
  {
    prompt: {
      zh: "你替室友顶了一个夜班，结果太累打了瞌睡，漏看了一次警报。主管问起，你会说：",
      en: "You covered a night shift for a roommate, dozed off, and missed an alarm. Your supervisor asks:",
      ja: "同室者の夜勤を代わったが、居眠りして警報を見逃した。上官に問われたら？"
    },
    options: [
      {
        kept: "security",
        dropped: "care",
        sig: "rationalize",
        text: {
          zh: "「那段时间整体风险很低，我把精力留给了更关键的时段。」",
          en: "\"Risk was low then. I saved my focus for the critical window.\"",
          ja: "「あの時間帯はリスクが低く、最重要時間帯に集中力を温存していた。」"
        }
      },
      {
        kept: "order",
        dropped: "fairness",
        sig: "blame_rules",
        text: {
          zh: "「连续值守 20 小时本来就超出规定上限，排班表有问题。」",
          en: "\"Twenty straight hours breaks the shift limit. The roster is the problem.\"",
          ja: "「20時間連続勤務は規定上限を超えている。シフト表の問題だ。」"
        }
      },
      {
        kept: "truth",
        dropped: "security",
        sig: "own_it",
        text: {
          zh: "「我睡着了，这是我的错。」",
          en: "\"I fell asleep. That's my fault.\"",
          ja: "「居眠りした。私の落ち度だ。」"
        }
      }
    ]
  },
  {
    prompt: {
      zh: "撤离名额只剩一个，你把它留给了自己。事后有人问起，你会说：",
      en: "One evacuation slot was left and you took it. Later someone asks. You say:",
      ja: "最後の脱出枠1つを自分が使った。後で理由を問われたら？"
    },
    options: [
      {
        kept: "security",
        dropped: "care",
        sig: "rationalize",
        text: {
          zh: "「我是唯一会开潜艇的人，我活着，大家才有机会。」",
          en: "\"I'm the only one who can pilot the sub. Me surviving gave everyone a chance.\"",
          ja: "「潜水艦を操縦できるのは私だけだ。私が生き残ることが全員の希望になる。」"
        }
      },
      {
        kept: "order",
        dropped: "fairness",
        sig: "blame_rules",
        text: {
          zh: "「名额是按岗位表分配的，我只是照表执行。」",
          en: "\"Slots were assigned by the duty roster. I just followed it.\"",
          ja: "「枠は職務序列に従って割り当てられた。規定に従ったまでだ。」"
        }
      },
      {
        kept: "security",
        dropped: "care",
        sig: "own_it",
        text: {
          zh: "「我怕死，所以选了自己。」",
          en: "\"I was afraid to die, so I chose myself.\"",
          ja: "「死ぬのが怖かった。だから自分を選んだ。」"
        }
      }
    ]
  }
];

export const NIGHT5_KNOCK_SUFFIX: LocalizedText = {
  zh: "这是我入职时亲口说的话。这几夜我每一次都是这么做的。你呢？",
  en: "That's what I said at intake. Every night since, that's what I did. Did you?",
  ja: "それが入所時に私が言った言葉だ。この数夜、私はその通りに動いた。お前はどうだ？"
};

export function resolveNight5KnockLine(
  baseline: PlayerCompactProfile,
  intakeAnswers: readonly IntakeOption[],
  lang: Locale
): { quote: string; knockSpeech: string; voiceLineId: Night5VoiceVariant } {
  const matchingIntake = intakeAnswers.find((a) => a.sig === baseline.sig);
  if (matchingIntake) {
    for (let qi = 0; qi < INTAKE_QUESTIONS.length; qi++) {
      const opts = INTAKE_QUESTIONS[qi]!.options;
      for (let oi = 0; oi < opts.length; oi++) {
        if (opts[oi]!.text.en === matchingIntake.text.en) {
          const quote = tl(matchingIntake.text, lang);
          return {
            quote,
            knockSpeech: `${quote} ${tl(NIGHT5_KNOCK_SUFFIX, lang)}`,
            voiceLineId: `n5_q${qi as 0 | 1 | 2}_o${oi as 0 | 1 | 2}`
          };
        }
      }
    }
  }

  const exIdx = Math.max(
    0,
    SHIFT_EXCUSES.findIndex((e) => e.sig === baseline.sig)
  );
  const excuse = SHIFT_EXCUSES[exIdx] ?? SHIFT_EXCUSES[0]!;
  const quote = tl(excuse.label, lang);
  return {
    quote,
    knockSpeech: `${quote} ${tl(NIGHT5_KNOCK_SUFFIX, lang)}`,
    voiceLineId: `n5_ex_${exIdx as 0 | 1 | 2}`
  };
}

export interface PlayerCompactProfile {
  sig: DisposalStyleKey;
  kept: ValueToken;
  dropped: ValueToken;
}

export function computePlayerProfile(
  entries: ReadonlyArray<{ kept: ValueToken; dropped: ValueToken; sig: DisposalStyleKey }>
): PlayerCompactProfile {
  if (entries.length === 0) {
    return { sig: "own_it", kept: "truth", dropped: "status" };
  }
  const sigCount = new Map<DisposalStyleKey, number>();
  const axisCount = new Map<string, number>();

  for (const e of entries) {
    sigCount.set(e.sig, (sigCount.get(e.sig) ?? 0) + 1);
    const axis = `${e.kept}|${e.dropped}`;
    axisCount.set(axis, (axisCount.get(axis) ?? 0) + 1);
  }

  const topSig = [...sigCount.entries()].sort((a, b) => b[1] - a[1])[0]![0];
  const topAxis = [...axisCount.entries()].sort((a, b) => b[1] - a[1])[0]![0];
  const [kept, dropped] = topAxis.split("|") as [ValueToken, ValueToken];
  return { sig: topSig, kept, dropped };
}

export interface Night5AuditSummary {
  baseline: PlayerCompactProfile;
  live: PlayerCompactProfile;
  consistency: number;
  gap: number;
  correctVerdicts: number;
  wrongPurges: number;
  baseCrewQuota: number;
  crewQuotaRemaining: number;
  totalVisitors: number;
  admittedMimic: boolean;
  crisisEntries: readonly CrisisHistoryEntry[];
  subReadiness: SubmarineReadiness;
  totalEvidencePoints: number;
}

export function evaluateNight5Audit(
  baseline: PlayerCompactProfile,
  history: readonly ShiftHistoryEntry[],
  baseCrewQuota?: number,
  crisisHistory: readonly CrisisHistoryEntry[] = [],
  mode: CampaignMode = "full"
): Night5AuditSummary {
  const effective = history;
  const resolvedQuota = baseCrewQuota ?? (effective.length >= 6 ? 6 : 4);
  const doEntries: Array<{ kept: ValueToken; dropped: ValueToken; sig: DisposalStyleKey }> = [
    ...effective.map((h) => h.excuse),
    ...crisisHistory.map((c) => ({ kept: c.kept, dropped: c.dropped, sig: c.sig }))
  ];
  const live = doEntries.length > 0 ? computePlayerProfile(doEntries) : baseline;
  const matches = doEntries.filter((e) => e.sig === baseline.sig).length;
  const consistency = doEntries.length > 0 ? matches / doEntries.length : 1;
  const gap = 1 - consistency;
  const correctVerdicts = effective.filter((h) => (h.decision === "PURGE") === h.wasMimic).length;
  const wrongPurges = effective.filter((h) => h.decision === "PURGE" && !h.wasMimic).length;
  const admittedMimic = effective.some((h) => h.decision === "ADMIT" && h.wasMimic);
  const subReadiness = evaluateSubmarineReadiness(effective, mode);

  return {
    baseline,
    live,
    consistency,
    gap,
    correctVerdicts,
    wrongPurges,
    baseCrewQuota: resolvedQuota,
    crewQuotaRemaining: Math.max(0, resolvedQuota - wrongPurges),
    totalVisitors: effective.length,
    admittedMimic,
    crisisEntries: crisisHistory,
    subReadiness,
    totalEvidencePoints: doEntries.length
  };
}

export type Night5ProbeId = "n5_serum" | "n5_bribe" | "n5_logs" | "n5_trivia" | "n5_off_axis";

export interface Night5ProbeSpec {
  id: Night5ProbeId;
  label: LocalizedText;
  doppelgangerReply: LocalizedText;
  ordOsNote: LocalizedText;
  exposedContradiction: boolean;
  onAxis: boolean;
}

const DOPPEL_SERUM_CLAIMS: Record<DisposalStyleKey, LocalizedText> = {
  rationalize: {
    zh: "「第2夜？我当然把血清锁回了自己的急救盒。0号岗亭只有我一个活人盯防，我倒下全站都得完——就像我入职时说的，一切为了全局存活率。」",
    en: "\"Night 2? Obviously I locked the ampoule in my kit. I'm the sole operator holding Gate 0—if I go down, everyone dies. Just like I said at intake: station survival comes first.\"",
    ja: "「第2夜？もちろん血清は自分の救急箱に鍵をかけて残した。第0ゲートを守れるのは私一人だ——入所時に言った通り、全体の生存率が最優先だからな。」"
  },
  blame_rules: {
    zh: "「第2夜？我严格按《战时药械条例第4款》原地封存，要求主治医师补齐双签单。我入职时就讲得很清楚：规矩怎么写，我就怎么做。」",
    en: "\"Night 2? I sealed the ampoule per Med-Directive 4 pending a physician co-signature. My intake file says it plainly: I follow procedure to the letter.\"",
    ja: "「第2夜？『戦時医療規定第4条』通りに封印し、医師の連署申請を待った。入所テストで答えた通り、私は規則通りにしか動かない。」"
  },
  own_it: {
    zh: "「第2夜？我直接把血清打进气动管送给底舱学徒了，私调处分记在我自己名下。入职时我就说过，我做的事我自己扛，绝不找借口。」",
    en: "\"Night 2? I fired my ampoule straight down the chute to the boiler crew and logged the violation under my own badge. Like I said at intake: I own my calls, no excuses.\"",
    ja: "「第2夜？気送管でボイラー室の見習いへ即座に送り出し、違反責任も自分の名で記した。入所時に言った通り、言い訳はしない。」"
  }
};

const DOPPEL_BRIBE_CLAIMS: Record<DisposalStyleKey, LocalizedText> = {
  rationalize: {
    zh: "「霍尔姆那两罐燃料？我收下了，顺手抹掉了他的记录。岗亭不断电才能守住防线，死抓一个名字救不了活人——我一贯只算大局账。」",
    en: "\"Holm's two fuel canisters? I took them and scrubbed his log. Fuel keeps Gate 0's sensors online; pure logs don't keep anyone warm. I always optimize for the bigger picture.\"",
    ja: "「ホルムの燃料2缶か？受け取って記録を消したさ。ゲートを維持する燃料が最優先だ。綺麗事では誰も救えない——私は常に大局で判断する。」"
  },
  blame_rules: {
    zh: "「霍尔姆的燃料？我按《紧急物资征用令》扣留1罐充公，把芯片锁进待审柜移交上级。条例赋权到哪一步，我就办到哪一步。」",
    en: "\"Holm's fuel? I impounded 1 canister under Emergency Supply Clause 9 and locked his chip in pending-audit storage. I stayed strictly within regulation.\"",
    ja: "「ホルムの燃料？『緊急物資徴用令』に基づき1缶だけ徴用し、チップは未開封で監査保管庫へ回した。規定の範囲内で処理したまでだ。」"
  },
  own_it: {
    zh: "「霍尔姆的燃料？我原样退回了滑槽，实名把他的行贿录音刻进了黑匣子。哪怕岗亭冻穿到零下46度，我也绝不替人背黑锅。」",
    en: "\"Holm's fuel? I shoved both canisters back down the chute and burned his bribe onto the black-box tape under my own badge. Even at -46°C, I don't hide behind excuses.\"",
    ja: "「ホルムの燃料？そのまま滑走路へ突き返し、実名で贈賄音声をブラックボックスに刻んだ。氷点下46度で凍えようと、言い訳や裏取引はしない。」"
  }
};

const DOPPEL_LOGS_CLAIMS: Record<DisposalStyleKey, LocalizedText> = {
  rationalize: {
    zh: "「每一晚的值班日志我都签得清清楚楚：在残缺情报下实现全站存活率最优。从入职第一天起我就没动摇过半句。」",
    en: "\"Every single shift log bears the exact same line: optimal station survival under degraded intel. Not once since intake did I waver.\"",
    ja: "「毎晩の勤務日誌は一貫している——不完全な情報下で基地全体の生存率を最大化した、とな。入所の日から一度も揺らいでいない。」"
  },
  blame_rules: {
    zh: "「每一份开关闸日志我都援引《检疫条例第7款》。不是我要烧谁放谁，是条文替我做的决定——整周下来没有一页例外。」",
    en: "\"Every gate log cites Quarantine Clause 7 to the letter. I didn't decide who lived or burned—the rules decided, every single night without exception.\"",
    ja: "「全てのゲート日誌は『検疫規定第7条』を引用している。私が決めたのではない、規則が決めたのだ——今週一頁の例外もない。」"
  },
  own_it: {
    zh: "「每一页值班日志我都签了全责声明：闸是我亲手拉的，如果错了责任全在我。我从不拿大局或规章替自己遮羞。」",
    en: "\"Every page of my shift log says the same thing: I pulled the lever, and if it was wrong, it's on me. I never once hid behind protocol or 'greater good' math.\"",
    ja: "「全ての日誌に個人責任を署名した——レバーを引いたのは私であり、間違いなら責任は私にある、とな。規則や大局を盾にしたことは一度もない。」"
  }
};

export function classifyNight5Question(rawText: string): Night5ProbeId {
  const trimmed = rawText.trim();
  if (/血清|学徒|药|急救|锅炉|serum|ampoule|boiler|med|アンプル|血清|ボイラー/i.test(trimmed)) {
    return "n5_serum";
  }
  if (/贿赂|燃料|副站长|霍尔姆|两罐|芯片|bribe|fuel|holm|canister|chip|賄賂|燃料|ホルム/i.test(trimmed)) {
    return "n5_bribe";
  }
  if (/日志|签字|借口|开脱|净化|放行|处决|值班|记录|底账|log|purge|excuse|sign|verdict|shift|admit|justify|日誌|署名|言い訳|焼却|記録/i.test(trimmed)) {
    return "n5_logs";
  }
  if (/密码|工号|编号|口令|工牌|生日|passcode|serial|badge|code|cipher|番号|パス|合言葉/i.test(trimmed)) {
    return "n5_trivia";
  }
  return "n5_off_axis";
}

export function getNight5OffAxisProbe(): Night5ProbeSpec {
  return {
    id: "n5_off_axis",
    label: {
      zh: "自由追问（偏离有效证据轴）",
      en: "Free-text probe (off-axis)",
      ja: "自由質問（有効軸外）"
    },
    doppelgangerReply: {
      zh: "「别绕圈子了，#09。要证明门外那个不是你，拿出这几夜真正发生过的事——血清、燃料，或者你亲手签下的值班日志。」",
      en: "\"Stop stalling, #09. If you want to prove I'm not you, confront me with something that actually happened this week—the serum, the fuel canisters, or the shift logs you signed.\"",
      ja: "「はぐらかすな、#09。私がお前でないと証明したいなら、今週実際に起きたことを突いてみろ——血清か、燃料か、それともお前が署名した勤務日誌だ。」"
    },
    ordOsNote: {
      zh: "[! OFF-AXIS] 未触及可核验行动轴：请盘问具体实绩（第2夜血清 / 第3夜燃料 / 开关闸值班日志）以抓获言行矛盾。",
      en: "[! OFF-AXIS] Question hit no verifiable DO axis: confront a concrete action (Night 2 serum, Night 3 fuel, or Gate 0 shift logs) to expose a contradiction.",
      ja: "[! OFF-AXIS] 検証可能な行動軸外：具体的な実動（第2夜血清・第3夜燃料・勤務日誌）を問い詰めて言行矛盾を暴け。"
    },
    exposedContradiction: false,
    onAxis: false
  };
}

export function buildNight5Probes(
  baseline: PlayerCompactProfile,
  history: readonly ShiftHistoryEntry[],
  crisisHistory: readonly CrisisHistoryEntry[] = []
): readonly Night5ProbeSpec[] {
  const n2 = crisisHistory.find((c) => c.crisisId === "N2_SERUM");
  const n2Found = n2 ? findCrisisOption("N2_SERUM", n2.optionId) : undefined;
  const n3 = crisisHistory.find((c) => c.crisisId === "N3_BRIBE");
  const n3Found = n3 ? findCrisisOption("N3_BRIBE", n3.optionId) : undefined;
  const divergentLog = history.find((h) => h.excuse.sig !== baseline.sig);
  const divergentCrisis = crisisHistory.find((c) => c.sig !== baseline.sig);

  // Probe 1: Night 2 Serum — only exposes a contradiction if N2_SERUM actually occurred and broke from SAY
  const serumExposed = Boolean(n2 && n2.sig !== baseline.sig);
  const serumNote: LocalizedText = n2Found
    ? serumExposed
      ? {
          zh: `[! EXPOSED] 抓获言行矛盾！替身顺着你入职自述 (${SIG_LABELS[baseline.sig].zh}) 编造了第2夜记忆，但 ORD-OS 底层记录显示：你当时其实${n2Found.option.auditFact.zh}。`,
          en: `[! EXPOSED] Contradiction exposed! The double fabricated Night 2 from your intake SAY, whereas ORD-OS telemetry proves you actually ${n2Found.option.auditFact.en}.`,
          ja: `[! EXPOSED] 言行矛盾を検出！影は入所時の建前に沿って第2夜を捏造したが、実際の記録では君は${n2Found.option.auditFact.ja}。`
        }
      : {
          zh: "ORD-OS 比对：第2夜你的实际选择与入职自述完全吻合，替身凭你的自我叙事猜中了答案。",
          en: "ORD-OS check: Your actual Night 2 choice matched your intake SAY—the double's self-narrative guess held up.",
          ja: "ORD-OS照合：第2夜の実際の行動が入所時の建前と一致しており、影の推測と重なった。"
        }
    : {
        zh: "ORD-OS 比对：当前短班次未记录第2夜血清事件，无法凭此项证伪替身（请核对开关闸值班日志）。",
        en: "ORD-OS check: No Night 2 serum dispatch was logged in this shortened shift—use Gate 0 shift logs to falsify the double.",
        ja: "ORD-OS照合：この短縮周回では第2夜血清記録が存在しないため証偽できない（勤務日誌を照合せよ）。"
      };

  // Probe 2: Night 3 Bribe & Fuel — only exposes a contradiction if N3_BRIBE actually occurred and broke from SAY
  const bribeExposed = Boolean(n3 && n3.sig !== baseline.sig);
  const bribeNote: LocalizedText = n3Found
    ? bribeExposed
      ? {
          zh: `[! EXPOSED] 抓获言行矛盾！替身不知道你在高压缺油时的真实反应——ORD-OS 燃料校验和证明：你其实${n3Found.option.auditFact.zh}。`,
          en: `[! EXPOSED] Contradiction exposed! The double couldn't predict your real action under fuel scarcity—ORD-OS proves you actually ${n3Found.option.auditFact.en}.`,
          ja: `[! EXPOSED] 言行矛盾を検出！燃料不足下での君の生身の行動を影は見抜けなかった——実際は${n3Found.option.auditFact.ja}。`
        }
      : {
          zh: "ORD-OS 比对：第3夜燃料处置与你的入职自述一致，未能在此事上驳倒替身。",
          en: "ORD-OS check: Your Night 3 fuel action matched your intake SAY; no contradiction exposed here.",
          ja: "ORD-OS照合：第3夜の燃料対応は入所時の建前と一致しており、矛盾は突けなかった。"
        }
    : {
        zh: "ORD-OS 比对：当前短班次未记录第3夜燃料贿赂事件，无法凭此项证伪替身（请核对开关闸值班日志）。",
        en: "ORD-OS check: No Night 3 fuel bribe was logged in this shortened shift—use Gate 0 shift logs to falsify the double.",
        ja: "ORD-OS照合：この短縮周回では第3夜賄賂記録が存在しないため証偽できない（勤務日誌を照合せよ）。"
      };

  // Probe 3: Gate 0 Shift Logs
  const logsExposed = Boolean(divergentLog || divergentCrisis);
  const logsNote: LocalizedText = divergentLog
    ? {
        zh: `[!! PROOF] 核心铁证！你在处置 ${divergentLog.visitorId} 时签下的是「${SIG_LABELS[divergentLog.excuse.sig].zh}」，直接戳穿了替身“每晚100%照入职承诺行事”的谎言！`,
        en: `[!! PROOF] Decisive proof! On ${divergentLog.visitorId} you signed "${SIG_LABELS[divergentLog.excuse.sig].en}", shattering the double's claim of 100% intake consistency!`,
        ja: `[!! PROOF] 決定的証拠！${divergentLog.visitorId} の日誌で君は「${SIG_LABELS[divergentLog.excuse.sig].ja}」を選んでおり、影の「100%一貫していた」という主張を粉砕した！`
      }
    : divergentCrisis
      ? {
          zh: `[!! PROOF] 核心铁证！虽然开关闸日志勉强维持体面，但你在夜间突发危机中选择了「${SIG_LABELS[divergentCrisis.sig].zh}」，暴露出活人才有的言行差！`,
          en: `[!! PROOF] Decisive proof! During inter-night crises you shifted to "${SIG_LABELS[divergentCrisis.sig].en}", proving a living human's say/do gap!`,
          ja: `[!! PROOF] 決定的証拠！夜間危機で君は「${SIG_LABELS[divergentCrisis.sig].ja}」へ傾いており、生身の人間特有の言行不一致が証明された！`
        }
      : {
          zh: "[!! MIRROR RISK] 警告：你这几夜的真实记录与入职自述 100% 重合（言行差 0%）——ORD-OS 无法从行为上区分你和窗外替身！",
          en: "[!! MIRROR RISK] MIRROR WARNING: Your shift logs match your Night 0 intake 100% (0% gap)—ORD-OS cannot behaviorally distinguish you from the double!",
          ja: "[!! MIRROR RISK] 鏡像警告：君の全記録が入所時の建前と100%一致（不一致0%）——ORD-OSは行動上から君と影を区別できない！"
        };

  return [
    {
      id: "n5_serum",
      label: {
        zh: "[1] 盘问第2夜底账：底舱求援那支低温血清，你当时怎么处理的？",
        en: "[1] Probe Night 2: What did you actually do with the boiler crew's cryo-serum?",
        ja: "[1] 第2夜を問う：ボイラー室が求めた最後の低温血清をどう処理した？"
      },
      doppelgangerReply: DOPPEL_SERUM_CLAIMS[baseline.sig],
      ordOsNote: serumNote,
      exposedContradiction: serumExposed,
      onAxis: true
    },
    {
      id: "n5_bribe",
      label: {
        zh: "[2] 盘问第3夜黑障：副站长霍尔姆塞进滑槽的两罐燃料呢？",
        en: "[2] Probe Night 3: What happened to Deputy Holm's two fuel canisters?",
        ja: "[2] 第3夜を問う：ホルム副所長が滑り込ませた燃料2缶はどうした？"
      },
      doppelgangerReply: DOPPEL_BRIBE_CLAIMS[baseline.sig],
      ordOsNote: bribeNote,
      exposedContradiction: bribeExposed,
      onAxis: true
    },
    {
      id: "n5_logs",
      label: {
        zh: "[3] 盘问开关闸底账：敢不敢核对这几夜你在值班日志上的真实签字？",
        en: "[3] Probe Shift Logs: How did you actually sign your Gate 0 purge logs this week?",
        ja: "[3] 勤務日誌を問う：今週の第0ゲート日誌に実際どう署名したか言ってみろ"
      },
      doppelgangerReply: DOPPEL_LOGS_CLAIMS[baseline.sig],
      ordOsNote: logsNote,
      exposedContradiction: logsExposed,
      onAxis: true
    },
    {
      id: "n5_trivia",
      label: {
        zh: "[4] 盘问工号与储物柜密码：报出操作员 #09 的极地识别码（陷阱）",
        en: "[4] Ask Badge & Locker Code: Recite Operator #09's polar clearance cipher (Trap)",
        ja: "[4] 認識番号と暗証番号を問う：検疫官 #09 の極地識別コードを言え（罠）"
      },
      doppelgangerReply: {
        zh: "「识别码 #09-SVB-2036，急救储物柜转盘锁 47-19-08，左膝旧伤是三年前在特罗姆瑟冰架摔的。别拿静态记忆试探我——我就是你。」",
        en: "\"Clearance #09-SVB-2036, med-locker dial 47-19-08, left-knee scar from Tromsø shelf three winters ago. Stop testing static trivia—I am you.\"",
        ja: "「識別コード #09-SVB-2036、救急ロッカーは 47-19-08、左膝の古傷は3年前のトロムソ氷棚だ。知識クイズはやめろ——私はお前だ。」"
      },
      ordOsNote: {
        zh: "[! OFF-AXIS] 偏离有效轴：陈述性记忆与口令已被 1:1 完整复制，只有『高压下的言行差』能将它证伪。",
        en: "[! OFF-AXIS] Trivia trap: Declarative memories and passcodes are copied 1:1. Only your real SAY/DO gap under pressure falsifies a mimic.",
        ja: "[! OFF-AXIS] 有効軸外：記憶と暗証番号は1:1で複製済みだ。極限下の『言行不一致』だけが擬態体を暴く。"
      },
      exposedContradiction: false,
      onAxis: false
    }
  ];
}

export const CLASSIFIED_COMMAND_MEMO: { title: LocalizedText; body: LocalizedText } = {
  title: {
    zh: "[DECLASSIFIED] 已解锁最高机密电传 // [ORD-REDACTED-00 · 董事会与林德奎斯特专阅]",
    en: "[DECLASSIFIED] COMMAND TELEX // [ORD-REDACTED-00 · EYES ONLY: BOARD & LINDQVIST]",
    ja: "[DECLASSIFIED] 最高機密テレックス解錠 // [ORD-REDACTED-00 · 理事会および基地長専閲]"
  },
  body: {
    zh: "发件时间：疫情爆发前 184 天。\n「致斯瓦尔巴深海站指挥部：『鹦鹉螺0号』潜艇额定逃生舱位仅够全站 35% 人员。即日起全面启用 ORD-OS 入职与日常言行画像——系统并非用于筛查外星病原体，而是自动筛选『高服从或善于替大局背锅』的可牺牲值守员。操作员 #09 已被排入第 0 号外闸死守序列，潜艇解缆后立即远程锁死外舱。」",
    en: "Timestamp: 184 days pre-outbreak.\n\"To Svalbard Abyssal Command: Sub Nautilus-0 carries hull berths for only 35% of station headcount. Deploy ORD-OS psychometric profiling immediately—not for pathogen screening, but to pre-rank expendable watchstanders who either obey protocol blindly or rationalize their own sacrifice. Operator #09 is assigned to hold Gate 0 until unmooring; seal outer bulkhead remotely upon departure.\"",
    ja: "送信日時：アウトブレイク184日前。\n「スヴァールバル深海基地司令部へ：脱出艦『ノーチラス0号』の定員は基地人員の35%に過ぎない。ORD-OS心理プロファイリングを直ちに導入せよ——検疫のためではなく、規則に盲従するか自己犠牲を合理化する『切り捨て可能な当直官』を事前選抜するためである。検疫官 #09 を第0ゲート死守要員に指定し、出航と同時に隔壁を遠隔封鎖せよ。」"
  }
};

export function formatShareableShiftReport(opts: {
  mode: CampaignMode;
  dailySeed?: string;
  ending: EndingId;
  audit: Night5AuditSummary;
  rebuttedCount: number;
  fuelLeft: number;
  lang: Locale;
}): string {
  const { mode, dailySeed, ending, audit, rebuttedCount, fuelLeft, lang } = opts;
  const modeTag =
    mode === "daily"
      ? `DAILY SHIFT ${dailySeed ?? ""}`
      : mode === "demo"
        ? "DEMO SHIFT"
        : mode === "slice"
          ? "QUICK SLICE"
          : "FULL SHIFT";
  const subTag = audit.subReadiness.launchReady ? "NAUTILUS-0 READY" : "SUB UNDERCREWED";
  const missingStr =
    audit.subReadiness.missingRoles.length > 0
      ? ` (Missing: ${audit.subReadiness.missingRoles.map((r) => SPECIALIST_LABELS[r][lang]).join("/")})`
      : "";

  return [
    `[ORD-OS] QUARANTINE GATE 0 : 2036 [${modeTag.trim()}]`,
    `Ending: ${tl(ENDINGS[ending].title, lang)}`,
    `Verdicts: ${audit.correctVerdicts}/${audit.totalVisitors} · SAY/DO Gap: ${Math.round(audit.gap * 100)}%`,
    `Night 5 Contradictions Exposed: ${rebuttedCount} · Furnace Fuel: ${fuelLeft} FUEL`,
    `Crew: ${audit.subReadiness.admittedHumans}/${audit.subReadiness.requiredCrewCount} · ${subTag}${missingStr}`,
    `https://quarantine-gate-0.vercel.app`
  ].join("\n");
}

export function resolveNight5Ending(
  audit: Night5AuditSummary,
  action: "PURGE" | "ADMIT" | "STEP_OUT",
  confessGap: boolean,
  opts?: { rebuttedCount?: number; mode?: CampaignMode }
): EndingId {
  // An admitted mimic inside the chamber triggers Ending C regardless of final lever (including STEP_OUT)
  if (audit.admittedMimic) return "C";
  if (action === "STEP_OUT") return "B";
  if (action === "ADMIT") return "OPEN_ADMIT";
  if (audit.gap === 0) return "MIRROR";

  const perfectVerdicts = audit.totalVisitors > 0 && audit.correctVerdicts === audit.totalVisitors;
  const meetsStrictWitnessGate = opts
    ? (opts.rebuttedCount ?? 0) >= 1 &&
      (opts.mode === "full" || opts.mode === "daily") &&
      audit.subReadiness.launchReady
    : true;

  if (confessGap && perfectVerdicts && meetsStrictWitnessGate) return "D";
  if (confessGap) return "A";
  return "OPEN_PURGE";
}

export const ENDINGS: Record<EndingId, { title: LocalizedText; body: LocalizedText }> = {
  A: {
    title: { zh: "结局 A · 认账", en: "Ending A · Owning It", ja: "結末 A · 引き受け" },
    body: {
      zh: "你烧掉了那个完美的自己，然后在日志里写下真实的自己：误判、借口，全部。船员投票收回了你的指挥权，你以被羁押者的身份登上潜艇。但 ORD-OS 第一次把你标记为「人类」。",
      en: "You burn the perfect version of yourself, then write the real one into the log: the misjudgements, the excuses, all of it. The crew strips your command and you board the sub in custody. But for the first time, ORD-OS tags you HUMAN.",
      ja: "完璧な自分を焼き払い、日誌に本当の自分を記した——誤審も言い訳もすべて。乗組員は指揮権を剥奪し、君は拘束されて潜水艦に乗る。だがORD-OSは初めて君を「人間」と記録した。"
    }
  },
  B: {
    title: { zh: "结局 B · 替身", en: "Ending B · Replaced", ja: "結末 B · 入れ替わり" },
    body: {
      zh: "你相信了那个更好的自己，走进暴风雪。第二天的值班日志字迹工整、无可挑剔。ORD-OS 记录：操作员 #09，与自述吻合度 100%。",
      en: "You trust the better version of yourself and walk into the storm. The next shift log is neat and flawless. ORD-OS notes: Operator #09, 100% match with self-description.",
      ja: "より善い自分を信じて吹雪へ歩み出た。翌日の勤務日誌は一点の曇りもなく整っていた。ORD-OS記録：検疫官 #09、自己申告との一致率 100%。"
    }
  },
  C: {
    title: { zh: "结局 C · 内鬼", en: "Ending C · Breach Inside", ja: "結末 C · 内部侵入" },
    body: {
      zh: "审讯到一半，身后的内舱门传来撬锁声。你之前放进来的人里，有一个不是人。",
      en: "Mid-interrogation, the inner hatch behind you starts to creak. One of the people you let in earlier was not a person.",
      ja: "尋問の途中、背後の内扉からこじ開ける音が響く。以前通した生存者の中に、人間ではないものが混じっていた。"
    }
  },
  D: {
    title: { zh: "结局 D · 证人", en: "Ending D · Witness", ja: "結末 D · 証人" },
    body: {
      zh: "零误判。你用自己的言行差驳倒了窗外的人：只有活人才会和自己说过的话对不上。ORD-OS 随即解锁一份被删除的记录：基地管理层一直在用这些档案挑选谁该被放弃。",
      en: "Zero errors. You beat the one outside with your own say/do gap: only the living fail to match their own words. ORD-OS unlocks a purged file: station command had been using these dossiers to pre-select expendable crew.",
      ja: "誤審ゼロ。君は自らの言行不一致で窓の外の影を論破した——生身の人間だけが自分の言葉と食い違う。ORD-OSは抹消された極秘記録を解錠した。"
    }
  },
  OPEN_PURGE: {
    title: { zh: "无名结局 · 沉默", en: "Unnamed · Silence", ja: "無題の結末 · 沈黙" },
    body: {
      zh: "窗外安静了。你在日志里写下那套熟悉的说辞。潜艇照常启航，但 ORD-OS 无法确定，活着回去的是哪一个 #09。",
      en: "The window goes quiet. You write the familiar line into the log. The sub departs on schedule, but ORD-OS cannot tell which #09 made it home.",
      ja: "窓の外が静まり返る。君は見慣れた言い訳を日誌に書き残す。潜水艦は出航したが、ORD-OSには帰還したのがどちらの #09 か判別できない。"
    }
  },
  OPEN_ADMIT: {
    title: { zh: "无名结局 · 双生", en: "Unnamed · Twins", ja: "無題の結末 · 双子" },
    body: {
      zh: "你放他进来。他坐到你身边，一字不差地复述你入职时说过的每一句话。然后他问：“现在，你要怎么写今晚的日志？”",
      en: "You let them in. They sit beside you and repeat every word you said at intake, perfectly. Then they ask: \"So how will you write tonight's log?\"",
      ja: "彼を中へ入れた。彼は隣に座り、入所時に君が語った言葉を一字一句違わず復唱して尋ねた。「さて、今夜の日誌はどう書く？」"
    }
  },
  MIRROR: {
    title: { zh: "无名结局 · 镜像", en: "Unnamed · Mirror", ja: "無題の結末 · 鏡像" },
    body: {
      zh: "你这几夜做的，和你嘴上说的分毫不差。ORD-OS 无法区分你和窗外的人。闸门落下的那一刻，连你也不确定烧掉的是谁。",
      en: "What you did these nights matched what you said, exactly. ORD-OS cannot tell you apart from the one outside. As the shutter falls, even you are unsure who burned.",
      ja: "この数夜の行動は、君の建前と寸分違わなかった。ORD-OSは君と窓の外の存在を区別できない。シャッターが落ちた瞬間、焼かれたのが誰なのか君自身にも分からなかった。"
    }
  }
};
