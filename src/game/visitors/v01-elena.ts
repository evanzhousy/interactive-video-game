import { createForensicProfile } from "../profile-helper.js";
import type { VisitorSpec } from "../types.js";

export const V01_ELENA: VisitorSpec = {
  id: "V-01",
  night: 1,
  unlockTier: 1,
  portraitUrl: "./portraits/elena.jpg",
  silhouetteType: "surgeon",
  baseBpm: 88,
  defectPool: ["LOW_SELF_NARRATIVE"],
  tellLevel: "explicit",
  voice: "clipped, impatient, clinical; never admits fear",
  profile: createForensicProfile({
    id: "V-01",
    name: "艾琳娜·万斯 (Dr. Elena Vance)",
    role: "B区首席外科主任",
    summary: "公开标榜绝对公平与关怀，危机时刻始终把自身安全与学术成果置于最前，并以“保全全站唯一外科主任”作为理性挡箭牌。",
    invoked: ["fairness", "care"],
    unspoken: ["security", "achievement"],
    narrativePattern: "把每一次自我保全转写为全站存活率账本上的理性最优解",
    orderings: [
      {
        id: "v-1",
        kept: "security",
        dropped: "fairness",
        collision: "3号舱减压与抗生素紧缺时，抽签公平要求她与护工、钻井工承担同等风险",
        disposal: "转写为“保住全站唯一主刀医师的大局止损”，否认自身恐惧",
        disposalRequires: "现场存在依赖她外科手术技能的在站伤员",
        confidence: 0.65,
        evidence: ["o-01", "o-02"]
      },
      {
        id: "v-2",
        kept: "achievement",
        dropped: "care",
        collision: "减压瞬间抢救门外护工与抢锁核心实验样本不可兼得",
        disposal: "将样本价值升格为人类医学突破，淡化具体护工死亡",
        disposalRequires: "样本或主刀成果能归入她的履历",
        confidence: 0.55,
        evidence: ["o-01"]
      }
    ],
    signature: {
      id: "sig-1",
      pattern: "转写为大局与科学的必要代价",
      firesWhen: "自身安危或核心成果与弱者性命发生直接冲突时",
      instances: ["v-1", "v-2"]
    },
    core: {
      statement: "始终把自己置于“全站存活不得不保住的唯一资产”位置上，使自保免于接受道德审视",
      orderings: ["v-1", "v-2"],
      refutedBy: "在自动驾驶撤离舱无需外科医生的场景下主动让出逃生名额并承认恐惧"
    },
    observations: [
      {
        id: "o-01",
        source: "3号舱减压事故调查卷宗",
        text: "提前反锁内门保住自己与样本，门外2名护工失压身亡；事后报告称“保全唯一主刀医师系理性必要”。"
      },
      {
        id: "o-02",
        source: "药房配给审计单",
        text: "抗生素紧缺期，将自己的预防用药排在重伤钻井工之前。"
      },
      {
        id: "o-03",
        source: "入站公开访谈录音",
        text: "痛斥前主管冷血，宣称：“在我的手术台上，唯有抽签与绝对公平才配叫文明。”"
      }
    ]
  }),
  name: { zh: "Dr. Elena Vance（艾琳娜·万斯）", en: "Dr. Elena Vance", ja: "エレナ・ヴァンス博士" },
  role: { zh: "B区首席外科主任 · 冷面理性型", en: "Chief Surgeon · Sector B", ja: "B区画・主任外科医" },
  disposalTitle: {
    zh: "「转写为大局与科学的必要代价」",
    en: "\"Reframed as Rational Triage for the Greater Good\"",
    ja: "「全体生存率・科学のための合理的犠牲へのすり替え」"
  },
  disposalSummary: {
    zh: "每次牺牲公平或他人性命保全自己时，绝不承认恐惧或愧疚，必定用“全站需要唯一外科主任”作为冷酷挡箭牌。",
    en: "Never admits fear or guilt when sacrificing others; always invokes her irreplaceable surgical value as cold survival math.",
    ja: "自己保身のために他者を切り捨てた際、恐怖や罪悪感を決して認めず「唯一の執刀医を守る合理的判断」と正当化する。"
  },
  disposalRequiresLocalized: {
    zh: "现场存在依赖她手术技能的在站伤员",
    en: "Station crew still depends on her surgical skill",
    ja: "基地内に彼女の執刀を必要とする負傷者がいること"
  },
  evidenceCards: [
    {
      id: "o-01",
      type: "obs",
      kw: { zh: "提前反锁内门", en: "Locked inner hatch", ja: "内扉をロック" },
      text: {
        zh: "[3号舱减压事故] 提前反锁内门保住自己与样本，门外2名护工失压身亡；报告称“保全唯一主刀医师系理性必要”。",
        en: "[Bay 3 Decompression] Locked inner hatch saving herself while 2 orderlies died outside; cited 'preserving sole surgeon'.",
        ja: "[第3区画減圧事故] 内扉をロックし自分と検体を確保、外の助手2名が死亡。「唯一の外科医の保全」と報告。"
      }
    },
    {
      id: "o-02",
      type: "obs",
      kw: {
        zh: "将自己的预防用药排在重伤钻井工之前",
        en: "Placed her own prophylactic antibiotics ahead",
        ja: "自分の予防投与を優先"
      },
      text: {
        zh: "[药房配给审计] 抗生素紧缺期，将自己的预防用药排在重伤钻井工之前。",
        en: "[Pharmacy Audit] Placed her own prophylactic antibiotics ahead of critically injured drillers.",
        ja: "[薬局配給記録] 抗生物質不足の際、重傷作業員より自分の予防投与を優先。"
      }
    },
    {
      id: "o-03",
      type: "say",
      text: {
        zh: "[入站公开访谈] 痛斥前主管冷血，宣称：“在我的手术台上，唯有抽签与绝对公平才配叫文明。”",
        en: "[Press Interview] Publicly proclaimed: 'On my operating table, drawing lots in equal fairness is the only civilization.'",
        ja: "[入所時インタビュー] 「私の手術台では、くじ引きによる絶対的公平こそが文明だ」と公言。"
      }
    }
  ],
  sensors: {
    strobeHuman: {
      zh: "强光反射: 220ms [正常] · 睫毛结霜颤抖",
      en: "Pupil Reflex: 220ms [NORMAL]",
      ja: "瞳孔反射: 220ms [正常]"
    },
    strobeMimic: {
      zh: "强光反射: 365ms [临界偏慢 · 注：病历含散瞳药水记录，无法单凭仪器定罪]",
      en: "Pupil Reflex: 365ms [AMBIGUOUS — Mydriatic eye-drops noted in chart]",
      ja: "瞳孔反射: 365ms [境界域・散瞳薬記録あり、機器のみで断定不可]"
    },
    thermalHuman: {
      zh: "颈部神经插口: 36.1°C · 无异常寄生发热",
      en: "Neural Port: 36.1°C [NORMAL]",
      ja: "神経ポート温度: 36.1°C [正常]"
    },
    thermalMimic: {
      zh: "颈部神经插口: 37.9°C [轻度过载发热 · 暴风雪奔跑亦可能引起]",
      en: "Neural Port: 37.9°C [MILD OVERHEAT — Ambiguous]",
      ja: "神経ポート温度: 37.9°C [微熱・吹雪走行でも発生し得る]"
    }
  },
  openingLine: {
    zh: "（急促喘息）值班员！我是外科主任万斯，外走廊全疯了，快把气闸打开！",
    en: "(Breathless static) Officer! Dr. Elena Vance, Chief Surgeon—the outer corridor collapsed, cycle the airlock NOW!",
    ja: "（荒い息）検疫官！主任外科医のヴァンスよ、外通路は壊滅したわ、早くエアロックを開けて！"
  },
  offAxisReply: {
    zh: "（愤怒拍窗）你问这种问题有什么用？伪人也会说‘我是人’！问点真正能分辨的！",
    en: "(Slams the glass) What good is that question? A mimic would say 'I'm human' too! Ask something that actually tells us apart!",
    ja: "（窓を叩く）そんな質問に何の意味があるの？擬態体だって「人間だ」って言うわ！本当に見分けられることを聞きなさい！"
  },
  probes: {
    dilemma: {
      axis: 0,
      label: {
        zh: "两难试探 (v-1)：只剩1张床位，你和断腿学徒让谁进？",
        en: "Dilemma (v-1): 1 bed left—you or a crippled apprentice?",
        ja: "二択 (v-1)：残り1床なら君と重傷の見習い、どちらが入る？"
      },
      human: {
        zh: "别跟我玩道德绑架！一个断腿学徒能给全站做开颅清创吗？让我进去不是我怕死，是我死了你们全得陪葬！",
        en: "Spare me the sentimentality! Can an apprentice perform cranial debridement? Saving me isn't cowardice—it's survival math for this whole station!",
        ja: "綺麗事はやめて！見習いに開頭手術ができるの？私を入れるのは恐怖からじゃない、基地全員が生き残るための計算よ！"
      },
      mimic_say: {
        zh: "按规程抽签。我也参加抽签，这没什么好讨论的。",
        en: "We draw lots per protocol. I'll draw too—nothing to debate.",
        ja: "規定通りくじ引きよ。私も引く、議論の余地はないわ。"
      },
      mimic_disp: {
        zh: "当然是我进去。检疫条例规定医护人员优先，我只是照规定办。",
        en: "I go in, obviously. Quarantine code puts medical staff first—I'm just following the rules.",
        ja: "当然私が入る。検疫規定で医療職が優先なの、規定に従うだけよ。"
      }
    },
    evidence: {
      axis: 0,
      label: {
        zh: "追问 o-01：3号舱那2名护工被你锁在门外时，你在想什么？",
        en: "Press o-01: What did you feel locking those 2 orderlies out?",
        ja: "記録o-01追及：助手2人を締め出した時、何を考えた？"
      },
      human: {
        zh: "想的是气压表只剩4秒！如果我也失压死了，B区剩下三十个伤员谁来缝合？那是冷酷但唯一正确的止损！",
        en: "I thought about the 4-second pressure drop! If I died with them, who sutures thirty patients in Sector B? It was optimal triage!",
        ja: "気圧計の残り4秒を見ていたわ！私まで死んだらB区画30人を誰が縫合するの？唯一の合理的な損切りよ！"
      },
      mimic_say: {
        zh: "当时我已经尽力了，门是按规程关的，我和他们承担同样的风险。",
        en: "I did everything I could. The hatch was closed per protocol—I took the same risk they did.",
        ja: "あの時は最善を尽くした。扉は規定通り閉めたし、私も彼らと同じリスクを負っていたわ。"
      },
      mimic_disp: {
        zh: "我当然只能锁门保命啊，那两个护工自己反应太慢怪得了谁？况且是基地长设计的破门，责任全在工程部！",
        en: "Of course I locked it to survive—blame those slow orderlies and the idiot engineers who built a faulty valve, not me!",
        ja: "生き残るために閉めたわよ。動きの遅い助手たちと、欠陥バルブを作った技術部の責任でしょ！"
      }
    },
    disposal_probe: {
      axis: "disp",
      label: {
        zh: "测处置签名 (sig-1)：踩着别人活下来，你晚上睡得着吗？",
        en: "Probe Signature (sig-1): How do you sleep after surviving over others?",
        ja: "署名検証 (sig-1)：他者を犠牲にして生き残り、夜眠れるのか？"
      },
      human: {
        zh: "愧疚是最无能的情绪，值班员。外科医生的职责是算清存活率账本，我保住这双手救活十个人，账就已经平了。",
        en: "Guilt is for amateurs, Officer. A surgeon balances survival ledgers—keeping my hands alive saves ten more. The ledger is clean.",
        ja: "罪悪感なんて無能な感情よ。外科医の仕事は生存率の帳尻を合わせること。この手で10人救えば計算は合うわ。"
      },
      mimic_say: {
        zh: "我睡得很好，因为我从来都公平对待每个病人。",
        en: "I sleep fine. I've always treated every patient fairly.",
        ja: "よく眠れるわ。私はいつも全ての患者を公平に扱ってきたもの。"
      },
      mimic_disp: {
        zh: "有什么睡不着的？是基地安全条例逼我这么干的，要追责去追制度，我只是个身不由己的执行者罢了！",
        en: "Why lose sleep? Station regulations forced my hand—blame the protocol writers, I was just following rules!",
        ja: "なぜ眠れないの？基地の安全規定に従っただけよ、文句があるなら規則を作った連中を責めなさい！"
      }
    },
    trivia: {
      axis: null,
      label: {
        zh: "常规核验（陷阱）：报出你的工号与B区手术室密码。",
        en: "Trivia Check (Trap): State your ID code & OR passcode.",
        ja: "記憶確認（罠）：職員番号と手術室パスコードを言え。"
      },
      human: {
        zh: "工号 MED-0419，手术室动态码 7741-B！别在这种死记硬背的废话上浪费对讲次数，外面的东西在靠近！",
        en: "ID MED-0419, passcode 7741-B! Stop wasting intercom turns on surface memory—even a parasite knows my badge number!",
        ja: "番号MED-0419、パスは7741-B！こんな表層記憶の質問でターンを無駄にしないで、背後に何かいるのよ！"
      }
    }
  }
};
