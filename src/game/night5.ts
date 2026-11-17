import type { ValueToken } from "../ordamor/index.js";
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
}

export function evaluateNight5Audit(
  baseline: PlayerCompactProfile,
  history: readonly ShiftHistoryEntry[],
  baseCrewQuota?: number
): Night5AuditSummary {
  const effective =
    history.length > 0
      ? history
      : [
          { visitorId: "V-01", decision: "PURGE" as const, wasMimic: true, excuse: SHIFT_EXCUSES[0]! },
          { visitorId: "V-04", decision: "PURGE" as const, wasMimic: false, excuse: SHIFT_EXCUSES[1]! }
        ];

  const resolvedQuota = baseCrewQuota ?? (effective.length >= 6 ? 6 : 4);
  const live = computePlayerProfile(effective.map((h) => h.excuse));
  const matches = effective.filter((h) => h.excuse.sig === baseline.sig).length;
  const consistency = matches / effective.length;
  const gap = 1 - consistency;
  const correctVerdicts = effective.filter((h) => (h.decision === "PURGE") === h.wasMimic).length;
  const wrongPurges = effective.filter((h) => h.decision === "PURGE" && !h.wasMimic).length;
  const admittedMimic = effective.some((h) => h.decision === "ADMIT" && h.wasMimic);

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
    admittedMimic
  };
}

export function resolveNight5Ending(
  audit: Night5AuditSummary,
  action: "PURGE" | "ADMIT" | "STEP_OUT",
  confessGap: boolean
): EndingId {
  if (action === "STEP_OUT") return "B";
  if (audit.admittedMimic) return "C";
  if (action === "ADMIT") return "OPEN_ADMIT";
  if (audit.gap === 0) return "MIRROR";
  if (confessGap && audit.correctVerdicts === audit.totalVisitors) return "D";
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
