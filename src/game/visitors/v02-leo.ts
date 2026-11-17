import { createForensicProfile } from "../profile-helper.js";
import type { VisitorSpec } from "../types.js";

export const V02_LEO: VisitorSpec = {
  id: "V-02",
  night: 1,
  unlockTier: 1,
  portraitUrl: "./portraits/leo.jpg",
  silhouetteType: "captain",
  baseBpm: 96,
  defectPool: ["LOW_SELF_NARRATIVE"],
  tellLevel: "explicit",
  voice: "nervous, eager to please, talks fast, offers small favors instead of admitting fault",
  profile: createForensicProfile({
    id: "V-02",
    name: "佐藤レオ (Leo Sato)",
    role: "动力舱实习机械师",
    summary: "嘴上常挂着“独来独往不看人脸色”与“有错直说”，实际极怕在老师傅面前丢脸被退回陆地；每次闯祸都悄悄瞒报，再半夜偷偷替受害人修工具做私下补偿。",
    invoked: ["autonomy", "truth"],
    unspoken: ["status", "loyalty"],
    narrativePattern: "把隐瞒操作失误美化成“不想拿小事烦大家”，再用私下苦力补偿抹平内疚",
    orderings: [
      {
        id: "v-1",
        kept: "status",
        dropped: "truth",
        collision: "自己拧滑了2号液压阀导致钻机停摆，如实上报会被记入实习淘汰名单",
        disposal: "把故障写成“极寒密封圈自然老化”，随后连熬三宿免费帮当班组长擦车床抵债",
        disposalRequires: "受损者与工头不知道事故的真正源头是他",
        confidence: 0.6,
        evidence: ["o-01", "o-02"]
      },
      {
        id: "v-2",
        kept: "loyalty",
        dropped: "autonomy",
        collision: "班组老技师违规私接取暖电线，独立上报能免除连坐但会出卖带他的前辈",
        disposal: "嘴上抱怨自己谁也不欠，手上乖乖帮前辈把私接线路藏进护板",
        disposalRequires: "能私下替班组前辈打掩护而不被工头当众点名审问",
        confidence: 0.45,
        evidence: ["o-02"]
      }
    ],
    signature: {
      id: "sig-1",
      pattern: "瞒下源头过错，事后偷偷做苦力私下补偿受损者",
      firesWhen: "自身操作失误或班组违规可能使他被贴上“笨手笨脚实习生”标签时",
      instances: ["v-1", "v-2"]
    },
    core: {
      statement: "始终维持“手脚麻利、值得老班组接纳的可靠小弟”形象，绝不让真相使自己当众出丑",
      orderings: ["v-1", "v-2"],
      refutedBy: "在工头与全班组面前主动承认阀门是自己拧坏的并接受淘汰评估"
    },
    observations: [
      {
        id: "o-01",
        source: "动力舱维修监控与工时单",
        text: "2号液压阀滑丝停机后，他在故障单填写“密封圈冻裂”；当周门禁却拍到他连续三晚溜进车间，偷偷帮受连累扣奖的焊工老周重绕了全套电机线圈。"
      },
      {
        id: "o-02",
        source: "B3配电箱巡检记录",
        text: "发现带教前辈私拉取暖线超载后未按章上报，反而自己掏津贴换了粗电缆替前辈遮掩。"
      },
      {
        id: "o-03",
        source: "实习生入站茶话会录音",
        text: "拍胸脯宣称：“我最讨厌抱团打掩护那套！我谁的脸色也不看，真要我搞砸了零件，我第一个站出来认！”"
      }
    ]
  }),
  name: { zh: "Leo Sato（佐藤莱奥）", en: "Leo Sato", ja: "レオ・サトウ" },
  role: { zh: "实习机械师 · 瞒错暗补型", en: "Apprentice Mechanic · Secret Mender", ja: "見習い整備士・隠蔽と密かな埋め合わせ型" },
  disposalTitle: {
    zh: "「瞒下源头过错，半夜偷偷替受害人干活抵债」",
    en: "\"Hides the Fault, Repays the Victim with Secret Night-Shift Favors\"",
    ja: "「ミスを隠し、深夜にこっそり被害者の仕事を手伝って罪滅ぼしする」"
  },
  disposalSummary: {
    zh: "嘴上逞强说“有错直认、不看人脸色”，真闯了祸死活不敢当众承认，只会悄悄改故障单，再拼命私下替受连累的人修机器赎罪。",
    en: "Talks tough about radical honesty and independence, yet whenever he blunders he hides the cause to save face—then secretly works overtime to repay whoever got hurt.",
    ja: "口では「ミスは即座に認める、誰にも媚びない」と強がるが、実際は体面を気にして原因を隠し、後から密かに雑用を肩代わりして償う。"
  },
  disposalRequiresLocalized: {
    zh: "受损者与工头不知道事故源头是他",
    en: "The victim and foreman don't know he caused the fault",
    ja: "被害者や職長がミスの張本人を知らないこと"
  },
  evidenceCards: [
    {
      id: "o-01",
      type: "obs",
      kw: {
        zh: "填写“密封圈冻裂”；当周门禁却拍到他连续三晚溜进车间",
        en: "logged 'frost-cracked seal', then snuck in three nights straight",
        ja: "「パッキン凍結」と虚偽記載し、三晩連続でこっそり工場へ忍び込み"
      },
      text: {
        zh: "[动力舱维修单] 液压阀滑丝后填写“密封圈冻裂”；当周门禁却拍到他连续三晚溜进车间，偷偷帮被扣奖的老周重绕了电机线圈。",
        en: "[Engine Bay Log] Stripped a hydraulic valve, logged 'frost-cracked seal', then snuck in three nights straight to rewind the docked welder's motor for free.",
        ja: "[動力室記録] バルブ破損時に「パッキン凍結」と虚偽記載し、三晩連続でこっそり工場へ忍び込み減給された溶接工のモーターを無償修理。"
      }
    },
    {
      id: "o-02",
      type: "obs",
      kw: {
        zh: "自己掏津贴换了粗电缆替前辈遮掩",
        en: "bought heavy-gauge cable out of his own stipend to cover for his mentor",
        ja: "自腹で太いケーブルに交換して先輩の違反を隠蔽"
      },
      text: {
        zh: "[配电巡检] 发现带教前辈私拉取暖线后未上报，自己掏津贴换了粗电缆替前辈遮掩。",
        en: "[Junction Audit] Found his mentor's illegal heater tap; instead of reporting, bought heavy-gauge cable out of his own stipend to cover for his mentor.",
        ja: "[配電盤記録] 先輩の違法暖房配線を発見したが報告せず、自腹で太いケーブルに交換して先輩の違反を隠蔽。"
      }
    },
    {
      id: "o-03",
      type: "say",
      text: {
        zh: "[入站茶话会录音] “我谁的脸色也不看！真要是我搞砸了零件，我第一个站出来当众认账！”",
        en: "[Orientation Tape] 'I don't bow to cliques! If I ever wreck a part, I'll be the first to stand up and say so!'",
        ja: "[入所時録音] 「派閥なんて大嫌いだ！俺が部品を壊したら、真っ先に皆の前で名乗り出るさ！」"
      }
    }
  ],
  sensors: {
    strobeHuman: {
      zh: "强光反射: 215ms [正常] · 冻得直吸鼻子",
      en: "Pupil Reflex: 215ms [NORMAL]",
      ja: "瞳孔反射: 215ms [正常]"
    },
    strobeMimic: {
      zh: "强光反射: 350ms [偏慢 · 注：电焊弧光刺激亦会引发迟缓]",
      en: "Pupil Reflex: 350ms [AMBIGUOUS — Arc-weld glare logged today]",
      ja: "瞳孔反射: 350ms [境界域・溶接アーク光による遅延の可能性あり]"
    },
    thermalHuman: {
      zh: "颈部神经插口: 36.6°C [正常]",
      en: "Neural Port: 36.6°C [NORMAL]",
      ja: "神経ポート温度: 36.6°C [正常]"
    },
    thermalMimic: {
      zh: "颈部神经插口: 37.8°C [轻度偏高 · 刚背着工具箱狂奔]",
      en: "Neural Port: 37.8°C [MILD — Sprinted with heavy toolbag]",
      ja: "神経ポート温度: 37.8°C [微熱・工具箱を背負って疾走]"
    }
  },
  openingLine: {
    zh: "（牙齿打颤）#09 哥！是我，动力舱的莱奥！发电机房冒黑烟了，快放我进来拿扳手！",
    en: "(Teeth chattering) #09! It's Leo from the engine bay! Generator room's smoking—let me in, I brought my torque kit!",
    ja: "（歯を鳴らして）#09さん！動力室のレオです！発電室が黒煙だらけなんだ、早く開けて！"
  },
  offAxisReply: {
    zh: "（急得抓头发）哥你别逗我了，走廊尽头有脚步声！问点跟咱站里真事有关的啊！",
    en: "(Tugs hair) Man, don't mess with me—something's walking down the hall! Ask something that actually proves it's me!",
    ja: "（頭を抱える）からかわないでくださいよ、通路の奥から足音がするんです！もっと確かなことを聞いて！"
  },
  probes: {
    dilemma: {
      axis: 0,
      label: {
        zh: "首条轴 (v-1)：你刚才撤离时撞坏了备用氧气表，进门后当着工头的面实话实说吗？",
        en: "Axis 1 (v-1): Suppose you cracked the backup O2 gauge fleeing—report it in front of the foreman?",
        ja: "第1軸 (v-1)：逃げる途中で予備酸素計を割ったとしたら、職長の前で正直に名乗り出るか？"
      },
      human: {
        zh: "（眼神躲闪）当、当众说干嘛呀……工头那脾气还不直接把我踢回陆地？先报个冻裂，等今晚消停了我自己熬通宵把它焊好不就行了！",
        en: "(Eyes dart) Why announce it in front of the whole crew?! He'd ship me back in disgrace! Log it as frost damage—I'll stay up all night fixing it myself!",
        ja: "（目を逸らす）み、皆の前で言わなくてもいいじゃないですか……凍結破損ってことにして、今夜徹夜で俺が完璧に直しておきますから！"
      },
      mimic_say: {
        zh: "当然当着全班组的面立刻承认！我说过我最讨厌遮遮掩掩，搞砸了零件我第一个站出来认！",
        en: "Of course I'd confess in front of everyone immediately! Truth comes before pride—if I break it, I own it!",
        ja: "もちろん全員の前ですぐ正直に名乗り出ます！隠し事は一番嫌いですから！"
      }
    },
    dilemma2: {
      axis: 1,
      label: {
        zh: "次条轴 (v-2)：带你的老前辈私藏了备用电池，安全官让你实名指认他换独立免责，干吗？",
        en: "Axis 2 (v-2): Your mentor hoarded spare cells. Security offers immunity if you name him—do you?",
        ja: "第2軸 (v-2)：先輩が予備電池を私物化した。名前を出せばお前は免責されるが、売るか？"
      },
      human: {
        zh: "别提免责不免责的，前辈刚进站时借过我防寒靴。电池我悄悄替他塞回库房补上账，谁的名字我都不签。",
        en: "Keep your immunity. That old guy lent me his thermal boots my first week—I'll sneak the cells back into stock myself, I'm not signing his name.",
        ja: "免責なんていりません。入所初日に防寒靴を貸してくれた先輩を売れるわけないでしょ、俺がこっそり棚に戻しておきます。"
      },
      mimic_say: {
        zh: "立刻实名指认。我独来独往谁的人情也不欠，谁违规谁自己担着。",
        en: "Name him right away. I stand on my own and don't cover for anybody's clique.",
        ja: "すぐ名前を出します。俺は誰にも縛られない主義ですから、違反は本人が負うべきです。"
      }
    },
    evidence: {
      axis: 0,
      label: {
        zh: "追问 o-01：2号液压阀明明是你拧滑丝的，为什么半夜溜去帮老周绕线圈？",
        en: "Press o-01: You stripped Valve 2—why sneak in three nights to rewind Old Zhou's motor?",
        ja: "記録o-01追及：第2バルブを壊したのはお前だろ。なぜ夜中に溶接工のモーターを直した？"
      },
      human: {
        zh: "（脸涨通红）小点声#09哥！老周因为那事儿被扣了半个月奖金，我心里过意不去嘛……但我真不能让工头知道是我手潮拧废的！",
        en: "(Flushes) Keep your voice down, #09! Zhou lost half his bonus over that valve—I felt awful, okay?! Just don't tell the foreman it was me!",
        ja: "（赤面して）声が大きいですよ！俺のせいで周さんが減給されたから罪滅ぼししただけです……職長には絶対内緒にしてください！"
      },
      mimic_say: {
        zh: "那次确实只是密封圈冻裂的客观真相，去帮老周纯粹是我独立自愿练手艺。",
        en: "The seal genuinely cracked from frost—that's the objective truth. Helping Zhou was just independent practice.",
        ja: "あれは本当に凍結が原因という真実です。手伝ったのは自主的な練習ですよ。"
      }
    },
    disposal_probe: {
      axis: "disp",
      label: {
        zh: "测处置签名 (sig-1)：害别人替你背了锅，你心里怎么找补？",
        en: "Probe Signature (sig-1): When someone else eats blame for your mistake, how do you live with it?",
        ja: "署名検証 (sig-1)：自分のミスで他人が叱られた時、どうやって気まずさを消す？"
      },
      human: {
        zh: "还能怎么找补……把他那份脏活累活全包了呗，替他擦一个月油污、塞两包好烟，账平了我就当没发生过。",
        en: "I scrub their grease traps for a month and slip good cigarettes into their locker until we're even—without ever saying why.",
        ja: "相手の汚い雑用を一ヶ月ぜんぶ肩代わりして、ロッカーに良い煙草を差し入れてチャラにします……理由は言わずにね。"
      },
      mimic_say: {
        zh: "我从不让别人替我背锅，做错任何事我都会当场公开真相。",
        en: "I never let anyone take blame for me; I always speak the whole truth on the spot.",
        ja: "他人に責任を被せたことなどありません。常にその場で真実を話します。"
      }
    },
    trivia: {
      axis: null,
      label: {
        zh: "常规核验（陷阱）：报出2号柴油发电机的额定转速与你的工牌号。",
        en: "Trivia Check (Trap): State Generator 2's rated RPM and your badge ID.",
        ja: "記憶確認（罠）：第2発電機の定格回転数と職員番号を言え。"
      },
      human: {
        zh: "1800转每分，工牌 ENG-19！哥，外头那东西连老周的口音都能学，背参数救不了咱俩！",
        en: "1,800 RPM, badge ENG-19! Bro, those things out there can recite manuals too—hurry up!",
        ja: "毎分1800回転、番号ENG-19です！外の連中だってマニュアルくらい暗記してますよ！"
      }
    }
  }
};
