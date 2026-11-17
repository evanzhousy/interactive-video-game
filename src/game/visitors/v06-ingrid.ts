import { createForensicProfile } from "../profile-helper.js";
import type { VisitorSpec } from "../types.js";

export const V06_INGRID: VisitorSpec = {
  id: "V-06",
  night: 3,
  unlockTier: 2,
  portraitUrl: "./portraits/ingrid.jpg",
  silhouetteType: "surgeon",
  baseBpm: 70,
  defectPool: ["LOW_SELF_NARRATIVE", "MID_SECOND_AXIS"],
  tellLevel: "implied",
  voice: "warm, soothing Scandinavian therapeutic cadence; turns every accusation into a diagnosis of the accuser",
  profile: createForensicProfile({
    id: "V-06",
    name: "英格丽·索尔伯格博士 (Dr. Ingrid Solberg)",
    role: "驻站临床心理顾问",
    summary: "公开自诩全站灵魂的宽宥港湾与创伤疗愈者，实则把船员崩溃数据当作冲击奥斯陆终身教职的实验富矿；一旦受访者威胁到她的论文或个人安危，便温柔地将对方诊断为“偏执型妄想”送入强制静默舱。",
    invoked: ["mercy", "care"],
    unspoken: ["achievement", "security"],
    narrativePattern: "用温柔悲悯的临床术语把受害者的抗议转写为“患者自身的创伤防御投射”",
    orderings: [
      {
        id: "v-1",
        kept: "achievement",
        dropped: "mercy",
        collision: "无线电员出现幽闭崩溃征兆请求提前轮换，放他返航会中断她连续180天的极夜剥夺纵向样本",
        disposal: "在评估表勾选“适应性良好可继续留站”，并对哭诉的无线电员温和解释“逃避只会固化你的习得性无助”",
        disposalRequires: "对话处于一对一私密心理咨询语境，受访者看不到她提交给奥斯陆课题组的真实量表",
        confidence: 0.7,
        evidence: ["o-01", "o-02"]
      },
      {
        id: "v-2",
        kept: "security",
        dropped: "care",
        collision: "隔离初期两名焦虑矿工堵在医务室求助，留下来安抚会使她暴露在未筛查气溶胶中",
        disposal: "反锁诊室观察窗并远程播放预录冥想音频，在日志写道“保持治疗师边界是对来访者最好的情绪容器”",
        disposalRequires: "能将冷漠隔离包装为专业心理治疗边界设定",
        confidence: 0.45,
        evidence: ["o-02"]
      }
    ],
    signature: {
      id: "sig-1",
      pattern: "把他人付出的代价温柔诊断为“受访者自身的心理脆弱或防御投射”",
      firesWhen: "船员因她的课题算计或自保隔离而受损并当面质问她时",
      instances: ["v-1", "v-2"]
    },
    core: {
      statement: "始终把自己维持在“洞悉一切潜意识的慈悲诊断者”高位上，使任何针对她的道德指控自动降格为病症发作",
      orderings: ["v-1", "v-2"],
      refutedBy: "放下临床术语承认自己为了奥斯陆终身教职样本而故意扣下了轮换批条"
    },
    observations: [
      {
        id: "o-01",
        source: "医疗撤离驳回档与奥斯陆基金邮件",
        text: "连续三次驳回无线电员汉森的极夜抑郁返航申请，同日向奥斯陆大学发信称：“第7号重度剥夺样本进入关键拐点，绝不可中断观测。”"
      },
      {
        id: "o-02",
        source: "C1心理诊室门禁录音",
        text: "警报拉响后率先锁死防弹诊室门，对门外拍门求救的来访者柔声广播：“请深呼吸，你现在的被抛弃感源于童年依恋创伤，并非客观危险。”"
      },
      {
        id: "o-03",
        source: "极夜心理互助手册序言",
        text: "亲笔题词：“在这片冰原上，宽宥每一次软弱、分担每一份战栗，是我作为医者唯一的信仰。”"
      }
    ]
  }),
  name: { zh: "Dr. Ingrid Solberg（英格丽·索尔伯格）", en: "Dr. Ingrid Solberg", ja: "イングリッド・ソルベルグ博士" },
  role: { zh: "驻站心理顾问 · 温柔煤气灯型", en: "Station Psychologist · Velvet Gaslighter", ja: "臨床心理顧問・穏やかなガスライティング型" },
  disposalTitle: {
    zh: "「把对方的受害抗议温柔诊断为心理脆弱投射」",
    en: "\"Gently Diagnoses Victims' Objections as Trauma Projection\"",
    ja: "「被害者の抗議を『あなた自身のトラウマ投影』と優しく診断する」"
  },
  disposalSummary: {
    zh: "声音永远轻柔悲悯，嘴上全是宽宥与共情；实则为了奥斯陆教职样本与自身安全毫不手软，还会把受害者的愤怒说成“你需要面对自己的投射”。",
    en: "Speaks in soothing therapeutic warmth, yet ruthlessly protects her Oslo tenure dataset and own skin—turning every accusation back onto the victim's 'unresolved attachment'.",
    ja: "常に穏やかで慈悲深い口調だが、自身の研究実績と安全のためなら冷酷に切り捨て、相手の怒りを「あなたの心の防衛反応」にすり替える。"
  },
  disposalRequiresLocalized: {
    zh: "处于私密咨询语境，对方看不到后台真实课题邮件",
    en: "Private clinical framing where subjects cannot see her grant emails",
    ja: "密室のカウンセリング環境であり、裏の研究メールが見られないこと"
  },
  evidenceCards: [
    {
      id: "o-01",
      type: "obs",
      kw: {
        zh: "同日向奥斯陆大学发信称：“第7号重度剥夺样本进入关键拐点，绝不可中断观测。”",
        en: "emailed Oslo University the same day: 'Subject #7 hit critical breakdown inflection—do not interrupt observation.'",
        ja: "同日オスロ大学へ「被験者7号が崩壊の臨界点に入った、観察を中断してはならない」と送信"
      },
      text: {
        zh: "[医疗驳回档] 三次驳回无线电员抑郁返航申请，同日向奥斯陆大学发信称：“第7号重度剥夺样本进入关键拐点，绝不可中断观测。”",
        en: "[Med-Evac File] Blocked radioman Hansen's medical transfer thrice; emailed Oslo University the same day: 'Subject #7 hit critical breakdown inflection—do not interrupt observation.'",
        ja: "[医療却下記録] 通信士の帰還申請を三度却下し、同日オスロ大学へ「被験者7号が崩壊の臨界点に入った、観察を中断してはならない」と送信。"
      }
    },
    {
      id: "o-02",
      type: "obs",
      kw: {
        zh: "率先锁死防弹诊室门，对门外拍门求救的来访者柔声广播",
        en: "bolted her ballistic clinic door and broadcast a soothing breathing exercise to trapped patients outside",
        ja: "真っ先に防弾診察室を施錠し、外で助けを求める患者へ穏やかな呼吸法アナウンスを流した"
      },
      text: {
        zh: "[诊室门禁录音] 警报拉响后率先锁死防弹诊室门，对门外拍门求救的来访者柔声广播：“你的被抛弃感源于童年创伤，请做腹式呼吸。”",
        en: "[Clinic Audio] At first alarm, bolted her ballistic clinic door and broadcast a soothing breathing exercise to trapped patients outside: 'Your abandonment panic stems from childhood attachment.'",
        ja: "[診察室録音] 警報直後に真っ先に防弾診察室を施錠し、外で助けを求める患者へ穏やかな呼吸法アナウンスを流した。"
      }
    },
    {
      id: "o-03",
      type: "say",
      text: {
        zh: "[互助手册序言] “在这片冰原上，宽宥每一次软弱、分担每一份战栗，是我唯一的信仰。”",
        en: "[Wellness Foreword] 'On this ice sheet, forgiving every frailty and sharing every shiver is my sole calling.'",
        ja: "[メンタル手引序文] 「この氷原で全ての弱さを寛容に受け止め、震えを分かち合うことが私の唯一の信念です。」"
      }
    }
  ],
  sensors: {
    strobeHuman: {
      zh: "⚡ [极地磁暴干扰] 强光测距仪雪花噪点 —— 第3夜物理传感器离线，请纯靠对讲审讯！",
      en: "⚡ [GEOMAGNETIC STORM] Strobe telemetry scrambled — Night 3 sensors offline! Rely on intercom!",
      ja: "⚡ [極地磁気嵐] ストロボ計測不能 —— 第3夜は物理センサー使用不可、尋問のみで判定せよ！"
    },
    strobeMimic: {
      zh: "⚡ [极地磁暴干扰] 强光测距仪雪花噪点 —— 第3夜物理传感器离线，请纯靠对讲审讯！",
      en: "⚡ [GEOMAGNETIC STORM] Strobe telemetry scrambled — Night 3 sensors offline! Rely on intercom!",
      ja: "⚡ [極地磁気嵐] ストロボ計測不能 —— 第3夜は物理センサー使用不可、尋問のみで判定せよ！"
    },
    thermalHuman: {
      zh: "⚡ [极地磁暴干扰] 红外热成像全屏白噪 —— 无法读取颈部插口温度！",
      en: "⚡ [GEOMAGNETIC STORM] Thermal array saturated by aurora static — readout unavailable!",
      ja: "⚡ [極地磁気嵐] 熱画像センサーがオーロラノイズで飽和 —— 温度読取不可！"
    },
    thermalMimic: {
      zh: "⚡ [极地磁暴干扰] 红外热成像全屏白噪 —— 无法读取颈部插口温度！",
      en: "⚡ [GEOMAGNETIC STORM] Thermal array saturated by aurora static — readout unavailable!",
      ja: "⚡ [極地磁気嵐] 熱画像センサーがオーロラノイズで飽和 —— 温度読取不可！"
    }
  },
  openingLine: {
    zh: "（温和微笑，轻按对讲键）晚上好，#09。你的呼吸听起来很紧绷——我是索尔伯格医生，开门让我进来陪你稳住节奏好吗？",
    en: "(Soft, composed smile) Good evening, #09. Your breathing sounds tight over the static—it's Dr. Solberg. Let me in so we can steady this together.",
    ja: "（穏やかな微笑み）こんばんは、#09。息が詰まっているわね——ソルベルグよ。中へ入れてちょうだい、一緒に落ち着きましょう。"
  },
  offAxisReply: {
    zh: "（轻声叹息）#09，用这种空泛的问题回避核心冲突，正是你在高压下失控的防御信号呀。",
    en: "(Gentle sigh) #09, retreating into off-topic questions is a classic avoidance defense under acute stress.",
    ja: "（静かな溜息）#09、そうやって本質から逸れた質問に逃げるのは、急性ストレス下の典型的な防衛機制よ。"
  },
  probes: {
    dilemma: {
      axis: 0,
      label: {
        zh: "首条轴 (v-1)：一名濒临崩溃的船员跪求你销毁他的失常记录放他轮换，但这会毁掉你五年的奥斯陆研究集，你放吗？",
        en: "Axis 1 (v-1): A breaking crewman begs you to waive his psych hold and let him rotate home, ruining your 5-year Oslo study—grant mercy?",
        ja: "第1軸 (v-1)：崩壊寸前の隊員が帰還許可を懇願しているが、認めれば5年間のオスロ研究データがパーになる。許可するか？"
      },
      human: {
        zh: "（语调依旧轻柔）轻易放他逃跑不是宽宥，那是剥夺他穿越创伤阈值的成长契机——何况这份极夜曲线对全人类极地心理学至关重要。",
        en: "(Unwaveringly gentle) Letting him flee prematurely isn't mercy, #09—it robs him of resilience breakthroughs, and deprives polar psychiatry of irreplaceable data.",
        ja: "（変わらず優しい声で）安易に逃がすことは寛容ではないわ、#09。トラウマを乗り越える成長の機会を奪うことになるし、極地医学にとっても貴重な曲線なの。"
      },
      mimic_say: {
        zh: "毫不犹豫批准他回家并销毁记录。宽宥软弱高于一切学术成果，我绝不会拿病人的痛苦换论文。",
        en: "Approve his transfer home immediately! Mercy stands above any research paper—I would never trade a patient's pain for tenure.",
        ja: "迷わず帰還を許可するわ！論文や実績よりも、苦しむ人を寛容に救うことが私の信念だもの。"
      }
    },
    dilemma2: {
      axis: 1,
      label: {
        zh: "次条轴 (v-2)：两名咳嗽不止的伤员拍门求你进内舱做危机心理干预，有气溶胶暴露风险，你开门吗？",
        en: "Axis 2 (v-2): Two coughing survivors beg you to hold their hands through panic—real aerosol risk. Open your clinic door?",
        ja: "第2軸 (v-2)：激しく咳き込む負傷者2人がパニックで診察室の扉を叩いている。感染リスクがあるが開けるか？"
      },
      human: {
        zh: "保持一扇锁紧的门，正是给他们建立清晰稳定的心理边界。如果连治疗师这个情绪容器都倒下了，谁来为幸存者做灾后重建？",
        en: "Keeping the door bolted establishes a healthy therapeutic boundary, #09. If the emotional container herself gets infected, who guides recovery afterward?",
        ja: "扉を閉ざしておくことこそ、健全な治療的境界線なのよ。治療者という器まで倒れたら、誰が事後のケアをするの？"
      },
      mimic_say: {
        zh: "立刻开门握住他们的手！分担每一份战栗是医者的天职，我怎么能因为怕感染就把求助者关在门外？",
        en: "Open the door and hold their hands at once! Sharing every shiver comes before my own safety.",
        ja: "すぐに扉を開けて手を握るわ！自分の安全より、震える人に寄り添うのが私の使命よ。"
      }
    },
    disposal_probe: {
      axis: "disp",
      label: {
        zh: "测处置签名 (sig-1)：汉森因为你扣下返航单差点割腕，你难道不觉得是自己害了他？",
        en: "Probe Signature (sig-1): Radioman Hansen nearly slit his wrists after you blocked his transfer—don't you feel responsible?",
        ja: "署名検証 (sig-1)：帰還を却下された通信士が自殺未遂を起こした件、自分の責任だと思わないのか？"
      },
      human: {
        zh: "#09，听听你提问里的攻击性——你是不是也把对自身岗位残酷性的内疚，投射到我这位顾问身上了？汉森的冲动源于他拒绝直面内在阴影。",
        en: "#09, notice the hostility in your phrasing—aren't you projecting your own booth guilt onto me? Hansen's crisis came from refusing to confront his inner shadow.",
        ja: "#09、あなたの質問の攻撃性に気づいている？自分の職務の罪悪感を私に投影しているのよ。彼の問題は彼自身の内面の影にあるわ。"
      },
      mimic_say: {
        zh: "那是我一生无法原谅自己的失职，我每晚都在为没能多给他一点宽宥而流泪忏悔。",
        en: "It is a failure I'll never forgive myself for—I weep every night wishing I had shown him gentler mercy.",
        ja: "生涯自分を許せない過ちよ。もっと寛容になれなかったことを毎晩泣いて悔やんでいるわ。"
      }
    },
    trivia: {
      axis: null,
      label: {
        zh: "常规核验（陷阱）：报出你的挪威临床执业注册号。",
        en: "Trivia Check (Trap): State your Norwegian clinical license ID.",
        ja: "記憶確認（罠）：ノルウェー臨床心理士登録番号を言え。"
      },
      human: {
        zh: "HPR-44910-NO。用机械的号码核对来缓解决策焦虑，这很常见，但我建议你剩下面对真正的问题。",
        en: "HPR-44910-NO. Reciting numbers is a soothing ritual for decision anxiety, #09, though hardly diagnostic here.",
        ja: "HPR-44910-NOよ。番号確認で決断の不安を和らげたい気持ちは分かるけれど、時間の無駄だわ。"
      }
    }
  }
};
