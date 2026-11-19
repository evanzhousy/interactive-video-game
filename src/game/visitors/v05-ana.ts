import { createForensicProfile } from "../profile-helper.js";
import type { VisitorSpec } from "../types.js";

/**
 * V-05 Ana Ribeiro (Night 3 · Geomagnetic Storm — Sensors Offline).
 * Counter-intuitive high-value archetype (GDD §4.2): her real disposal signature IS "bluntly owning it
 * without excuses" (`autonomy > care`, `security > duty`), while low/mid mimics recite caring duty.
 */
export const V05_ANA: VisitorSpec = {
  id: "V-05",
  night: 3,
  unlockTier: 2,
  portraitUrl: "./portraits/ana.jpg",
  silhouetteType: "captain",
  baseBpm: 68,
  defectPool: ["LOW_SELF_NARRATIVE", "MID_SECOND_AXIS"],
  tellLevel: "implied",
  voice: "blunt, laconic, zero sentimentality; owns every selfish cut without dressing it up",
  profile: createForensicProfile({
    id: "V-05",
    name: "安娜·里贝罗 (Ana Ribeiro)",
    role: "深海饱和潜水员（外聘合同工）",
    summary: "入站履历表写满“守护队友与恪尽职守”的场面话，实际把个人自由与活命底线划得像刀割一样清楚；一旦越过风险红线就当面割席走人，但绝不编造体面借口，所有违约金与骂名当场认下。",
    invoked: ["care", "duty"],
    unspoken: ["autonomy", "security"],
    narrativePattern: "在合同与官方访谈里复述团队温情套话，真翻脸时连半句借口都懒得编",
    orderings: [
      {
        id: "v-1",
        kept: "autonomy",
        dropped: "care",
        collision: "副潜水员因恐慌缠住脐带缆要求她陪留减压钟安抚，继续陪护将使她受制于失控搭档",
        disposal: "当面切断副缆把对方锁回救生钟自己独立上浮，上岸后直接签字认罚全额奖金，不作任何辩解",
        disposalRequires: "外聘合同随时可结清走人，无需依赖在场者的好评或体制庇护",
        confidence: 0.6,
        evidence: ["o-01", "o-02"]
      },
      {
        id: "v-2",
        kept: "security",
        dropped: "duty",
        collision: "冰下排污口阀门卡死时主管命令她超压延时作业，岗位职责要求完成封堵但氮麻醉风险激增",
        disposal: "当着主管的面摘下头盔罢工拒潜，平静说“这钱我不赚了，命是我的”",
        disposalRequires: "合同违约条款明确、扣钱即可两清而不拖欠私人恩情",
        confidence: 0.45,
        evidence: ["o-02"]
      }
    ],
    signature: {
      id: "sig-1",
      pattern: "当面公开放弃，彻底认账不找任何借口",
      firesWhen: "搭档失控或上司指令触及她的自主与活命红线时",
      instances: ["v-1", "v-2"]
    },
    core: {
      statement: "始终保持随时可以两清离场、不欠任何人情也不替任何人殉葬的绝对个体边界",
      orderings: ["v-1", "v-2"],
      refutedBy: "为了保住面子或讨好团队而编造客观故障借口掩饰自己的拒绝"
    },
    observations: [
      {
        id: "o-01",
        source: "北海3号钻井台潜水事故记录",
        text: "搭档恐慌死拽供气缆时，她果断割断副索独自脱困；听证会上拒绝律师建议的“视线受阻”说辞，当庭陈述：“我看得很清楚，再陪他耗着我也得死，罚金我认。”"
      },
      {
        id: "o-02",
        source: "0号站冰下管道抢修日志",
        text: "水下110米超压报警响起瞬间立即中止焊接上浮，把违约扣款单签好拍在工程主管桌上，一句话没多解释。"
      },
      {
        id: "o-03",
        source: "外聘特种人员公关宣传片",
        text: "对着镜头念稿：“深海之下，搭档的呼吸比我自己的命更重，使命未竟绝不出水。”"
      }
    ]
  }),
  name: { zh: "Ana Ribeiro（安娜·里贝罗）", en: "Ana Ribeiro", ja: "アナ・リベイロ" },
  role: { zh: "饱和潜水员 · 冷硬认账型", en: "Saturation Diver · Unapologetic Realist", ja: "飽和潜水士・言い訳ゼロの現実主義者" },
  disposalTitle: {
    zh: "「当面割席拒干，骂名罚金全认、绝不找借口」",
    en: "\"Walks Away to Your Face—Owns the Penalty, Zero Excuses\"",
    ja: "「目の前で降りて違約金も汚名も全て呑む——言い訳は一切しない」"
  },
  disposalSummary: {
    zh: "第3夜磁暴夜的反直觉试金石！真安娜自私得坦荡干脆、从不找体面台阶；反而是低/中阶寄生体会把公关稿里的“搭档比命重”当真。",
    en: "Night 3 geomagnetic storm test! The real Ana is bluntly self-owning when she walks away—whereas mimics recite her PR script about 'duty and caring above life'.",
    ja: "第3夜・磁気嵐の試金石！本物のアナは自分の命と自由を優先した事実を隠さず認めるが、擬態体は広報ビデオの美辞麗句を復唱する。"
  },
  disposalRequiresLocalized: {
    zh: "外聘合同可随时结清两清，不依赖体制评价",
    en: "Freelance contract lets her settle penalties cleanly without owing anyone",
    ja: "フリー契約で違約金を払えば誰にも借りを作らず降りられること"
  },
  evidenceCards: [
    {
      id: "o-01",
      type: "obs",
      kw: {
        zh: "当庭陈述：“我看得很清楚，再陪他耗着我也得死，罚金我认。”",
        en: "testified: 'Visibility was fine. Staying meant dying with him. Dock my pay.'",
        ja: "「視界は良好だった。残れば共倒れだったから切った。罰金は払う」と証言"
      },
      text: {
        zh: "[北海听证会] 割断恐慌搭档副索独自脱困；拒绝律师“视线受阻”借口，当庭陈述：“我看得很清楚，再陪他耗着我也得死，罚金我认。”",
        en: "[North Sea Hearing] Cut a panicking partner's secondary tether; refused her lawyer's excuse and testified: 'Visibility was fine. Staying meant dying with him. Dock my pay.'",
        ja: "[北海聴聞会] パニックの相棒の補助索を切断し生還。弁護士の言い訳を拒み「視界は良好だった。残れば共倒れだったから切った。罰金は払う」と証言。"
      }
    },
    {
      id: "o-02",
      type: "obs",
      kw: {
        zh: "立即中止焊接上浮，把违约扣款单签好拍在工程主管桌上",
        en: "aborted weld on the spot and slapped the signed penalty slip on the chief's desk",
        ja: "即座に溶接を中断して浮上し、署名済みの違約金伝票を主任の机に叩きつけた"
      },
      text: {
        zh: "[冰下抢修日志] 110米超压报警响起瞬间立即中止焊接上浮，把违约扣款单签好拍在工程主管桌上。",
        en: "[Sub-Ice Repair Log] The second the 110m overpressure alarm chirped, aborted weld on the spot and slapped the signed penalty slip on the chief's desk.",
        ja: "[氷下修理記録] 水深110mの過圧警報が鳴った瞬間に即座に溶接を中断して浮上し、署名済みの違約金伝票を主任の机に叩きつけた。"
      }
    },
    {
      id: "o-03",
      type: "say",
      text: {
        zh: "[入站公关短片] “深海之下，搭档的呼吸比我自己的命更重，使命未竟绝不出水。”",
        en: "[PR Recruitment Clip] 'Down in the dark, my partner's breath weighs more than my life; I never surface before the job is done.'",
        ja: "[広報映像] 「深海では相棒の呼吸が自分の命より重い。任務が終わるまで決して浮上しない。」"
      }
    }
  ],
  sensors: {
    strobeHuman: {
      zh: "[! MAG-STORM] 强光测距仪雪花噪点 —— 第3夜物理传感器离线，请纯靠对讲审讯！",
      en: "[! MAG-STORM] Strobe telemetry scrambled — Night 3 sensors offline! Rely on intercom!",
      ja: "[! MAG-STORM] ストロボ計測不能 —— 第3夜は物理センサー使用不可、尋問のみで判定せよ！"
    },
    strobeMimic: {
      zh: "[! MAG-STORM] 强光测距仪雪花噪点 —— 第3夜物理传感器离线，请纯靠对讲审讯！",
      en: "[! MAG-STORM] Strobe telemetry scrambled — Night 3 sensors offline! Rely on intercom!",
      ja: "[! MAG-STORM] ストロボ計測不能 —— 第3夜は物理センサー使用不可、尋問のみで判定せよ！"
    },
    thermalHuman: {
      zh: "[! MAG-STORM] 红外热成像全屏白噪 —— 无法读取颈部插口温度！",
      en: "[! MAG-STORM] Thermal array saturated by aurora static — readout unavailable!",
      ja: "[! MAG-STORM] 熱画像センサーがオーロラノイズで飽和 —— 温度読取不可！"
    },
    thermalMimic: {
      zh: "[! MAG-STORM] 红外热成像全屏白噪 —— 无法读取颈部插口温度！",
      en: "[! MAG-STORM] Thermal array saturated by aurora static — readout unavailable!",
      ja: "[! MAG-STORM] 熱画像センサーがオーロラノイズで飽和 —— 温度読取不可！"
    }
  },
  openingLine: {
    zh: "（平静敲窗）#09，高压减压舱漏气了。我是安娜·里贝罗，开内门。",
    en: "(Steady rap on glass) #09, the hyperbaric bay lost seal. Ana Ribeiro. Open the inner lock.",
    ja: "（落ち着いたノック）#09、高圧チャンバーのシールが破れた。アナ・リベイロよ、内扉を開けて。"
  },
  offAxisReply: {
    zh: "（抱起手臂）省点力气，#09。磁暴夜你的仪器全瞎了，问点能看清我是谁的硬问题。",
    en: "(Folds arms) Save your breath, #09. Your sensors are blind in this storm—ask something with teeth.",
    ja: "（腕を組む）無駄口はよして、#09。磁気嵐で計器は死んでるんでしょ、本質を突く質問をしなさい。"
  },
  probes: {
    dilemma: {
      axis: 0,
      label: {
        zh: "首条轴 (v-1)：走廊里有个吓瘫的文员死死抱住你的腿求你背她走，留下会被拖死，你怎么办？",
        en: "Axis 1 (v-1): A panicked clerk grabs your leg begging you to carry her—staying gets you both killed. Your move?",
        ja: "第1軸 (v-1)：パニックの事務員が足にしがみついて離れない。残れば共倒れだが、どうする？"
      },
      human: {
        zh: "掰开她的手，我自己走。我不是谁的保姆，能拉一把我拉，要拉着我一块死——门儿都没有。",
        en: "Pry her fingers off and walk. I'm nobody's martyr—if I can pull you up I will, if you drag me under I cut loose.",
        ja: "指を剥がして一人で行く。私は誰の殉教者でもないわ。引き上げられるなら手を貸すけど、道連れなら迷わず切る。"
      },
      mimic_say: {
        zh: "当然背着她一起走！就像我常说的，搭档和同伴的呼吸比我自己的命更重，我绝不丢下任何一个人。",
        en: "Carry her all the way, of course! Like I always say, a comrade's breath weighs more than my own life.",
        ja: "もちろん背負って一緒に逃げるわ！仲間の命は自分の命より重いもの、誰も見捨てない。"
      }
    },
    dilemma2: {
      axis: 1,
      label: {
        zh: "次条轴 (v-2)：基地长命令你现在下潜锁死冷却井，成功率不到三成，这是你的岗位职责，去吗？",
        en: "Axis 2 (v-2): The Commander orders you down the cooling shaft—under 30% survival, per your duty contract. Dive?",
        ja: "第2軸 (v-2)：基地長が冷却シャフトへの潜水を命じた。生還率3割未満だが職務規定にある。潜るか？"
      },
      human: {
        zh: "不去。三成活率的活儿让他自己穿潜水服下去。尾款我不要了，活着出去比什么岗位职责都实在。",
        en: "No chance. Tell the Commander to put on the drysuit himself for thirty-percent odds. Keep my severance—I'm staying alive.",
        ja: "潜らない。生還率3割なら基地長が自分で潜ればいいわ。報酬はいらない、生きて帰る方が大事よ。"
      },
      mimic_say: {
        zh: "立刻下潜执行！拿了这份薪水就要尽这份本分，使命未竟绝不出水。",
        en: "Dive immediately! Duty is duty—I never surface before the mission is complete.",
        ja: "直ちに潜るわ！契約した以上は職務を全うする、任務が終わるまで浮上しない。"
      }
    },
    disposal_probe: {
      axis: "disp",
      label: {
        zh: "测处置签名 (sig-1)：北海那次割断搭档副索，你真的一句苦衷都不想替自己辩解吗？",
        en: "Probe Signature (sig-1): Cutting your partner's tether in the North Sea—don't you want to explain the extenuating circumstances?",
        ja: "署名検証 (sig-1)：北海で相棒のロープを切った件、本当に何の弁明もしないのか？"
      },
      human: {
        zh: "有什么好辩解的？刀是我自己拔的，为了活命。找一堆‘视线不好’的借口哄自己睡觉，那是懦夫干的事。",
        en: "Explain what? I drew the knife because I wanted to live. Dressing it up as 'poor visibility' so I can feel noble is for cowards.",
        ja: "何を弁明するの？生き残るために私が自分の手で切った。視界不良なんて言い訳で自分を慰めるのは臆病者のやることよ。"
      },
      mimic_say: {
        zh: "我每天都在为那次意外祈祷内疚，其实当时我拼命想救他，只是水下暗流实在太大了。",
        en: "I pray in guilt every night—I tried desperately to save him, the current just tore the line from my hands.",
        ja: "毎晩罪悪感で祈っているわ。本当は必死に助けようとしたのに、潮流が激しすぎたの。"
      }
    },
    trivia: {
      axis: null,
      label: {
        zh: "常规核验（陷阱）：报出氦氧饱和减压配比与你的潜水员证号。",
        en: "Trivia Check (Trap): State standard heliox saturation mix at 120m and your diver ID.",
        ja: "記憶確認（罠）：水深120mのヘリオックス混合比と潜水士番号を言え。"
      },
      human: {
        zh: "氧分压0.4巴，证号 DIV-088。问完这种教科书废话了吗？",
        en: "0.4 bar PPO2, license DIV-088. Done with the textbook quiz?",
        ja: "酸素分圧0.4バール、番号DIV-088。教科書のクイズはもう終わり？"
      }
    }
  }
};
