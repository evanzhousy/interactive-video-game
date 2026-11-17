import { createForensicProfile } from "../profile-helper.js";
import type { VisitorSpec } from "../types.js";

export const V04_MARCUS: VisitorSpec = {
  id: "V-04",
  night: 2,
  unlockTier: 2,
  portraitUrl: "./portraits/marcus.jpg",
  silhouetteType: "captain",
  baseBpm: 76,
  defectPool: ["LOW_SELF_NARRATIVE", "MID_SECOND_AXIS"],
  tellLevel: "implied",
  voice: "gruff, profane, barks orders, hides kindness",
  profile: createForensicProfile({
    id: "V-04",
    name: "陈马库斯 (Capt. Marcus Chen)",
    role: "外围安保队长",
    summary: "公开把铁律与自保挂在嘴边，实则每次危机都违规涉险搭救弱者，再用臭骂与罚扫厕所来掩饰心软。",
    invoked: ["order", "security"],
    unspoken: ["care", "loyalty"],
    narrativePattern: "把违规救人包装成“亲自抓违纪蠢货回来算账”",
    orderings: [
      {
        id: "v-1",
        kept: "care",
        dropped: "order",
        collision: "宵禁冰暴与军需管制要求封门止损，而迷路学徒与发烧清洁工面临伤亡",
        disposal: "事后臭骂被救者、罚刷厕所或谎报物资受潮销毁，假装秩序未被温情打破",
        disposalRequires: "被救者身上找得出可臭骂挑刺的小违规",
        confidence: 0.7,
        evidence: ["o-01", "o-02"]
      },
      {
        id: "v-2",
        kept: "loyalty",
        dropped: "security",
        collision: "在无条例强制且极易冻残双手的险境下，是否孤身闯入冷库营救老搭档",
        disposal: "骂骂咧咧地把涉险说成“不能让老东西欠我酒钱”，绝口不提牺牲",
        disposalRequires: "能把救援包装成算私人旧账或整肃军纪",
        confidence: 0.65,
        evidence: ["o-01"]
      }
    ],
    signature: {
      id: "sig-1",
      pattern: "嘴硬臭骂被救者以掩饰心软",
      firesWhen: "为保护下属或弱者而打破自己公开宣扬的铁律之后",
      instances: ["v-1", "v-2"]
    },
    core: {
      statement: "始终把每一次心软救人维持在“整肃军纪”的外壳之下，绝不让下属看见不带怒火的善意",
      orderings: ["v-1", "v-2"],
      refutedBy: "在对方毫无过错时当众平静承认自己是出于关心而涉险"
    },
    observations: [
      {
        id: "o-01",
        source: "安保禁闭处分记录",
        text: "晨会吼叫“谁逾越宵禁就冻死在外面”，当晚却抗命孤身闯冰暴背回迷路学徒，回来罚对方刷了一个月厕所。"
      },
      {
        id: "o-02",
        source: "军需处损耗监控单",
        text: "上报2罐高能口粮“受潮销毁”，监控拍到他半夜塞进了发烧清洁工的储物柜。"
      },
      {
        id: "o-03",
        source: "安保早训录音",
        text: "口头禅：“在0号站，谁讲人情谁先死，老子只认条例不认人。”"
      }
    ]
  }),
  name: { zh: "Marcus Chen（陈马库斯）", en: "Capt. Marcus Chen", ja: "マーカス・チェン隊長" },
  role: { zh: "外围安保队长 · 嘴硬心软型", en: "Security Captain · Gruff Protector", ja: "警備隊長・口は悪いが情に厚い" },
  disposalTitle: {
    zh: "「嘴硬臭骂被救者以掩饰心软」",
    en: "\"Barks Insults at Those He Risks His Life Saving\"",
    ja: "「命懸けで助けた相手を罵倒して優しさを隠す」"
  },
  disposalSummary: {
    zh: "与万斯完全相反！嘴上天天喊铁律与自保，真遇险必违规救弱者；事后用“骂对方蠢货/罚刷厕所”来安置被自己打破的秩序。",
    en: "Opposite of Vance! Preaches cold rules publicly, yet always breaks protocol to save the weak—then scolds them harshly to hide empathy.",
    ja: "ヴァンスと正反対。口では規律を唱えるが危機には必ず規則を破って弱者を救い、直後に相手を怒鳴りつけて照れ隠しをする。"
  },
  disposalRequiresLocalized: {
    zh: "被救者身上找得出可臭骂挑刺的小违规",
    en: "The rescued person has a minor fault he can bark at",
    ja: "助けた相手に怒鳴りつけられる小さな落ち度があること"
  },
  evidenceCards: [
    {
      id: "o-01",
      type: "obs",
      kw: {
        zh: "当晚却抗命孤身闯冰暴背回迷路学徒",
        en: "broke lockdown alone in a blizzard to carry a lost rookie back",
        ja: "単独で吹雪へ飛び出し迷子の新人を背負って生還"
      },
      text: {
        zh: "[禁闭处分记录] 晨会吼叫“谁逾越宵禁就冻死在外面”，当晚却抗命孤身闯冰暴背回迷路学徒，回来罚对方刷了一个月厕所。",
        en: "[Brig Log] Barked 'curfew breakers freeze outside', then broke lockdown alone in a blizzard to carry a lost rookie back—and made him scrub latrines.",
        ja: "[懲罰記録] 「門限破りは凍死しろ」と訓示しつつ、同夜単独で吹雪へ飛び出し迷子の新人を背負って生還。罰として便所掃除を命じた。"
      }
    },
    {
      id: "o-02",
      type: "obs",
      kw: {
        zh: "塞进了发烧清洁工的储物柜",
        en: "slipping them into a sick janitor's locker",
        ja: "発熱した清掃員のロッカーへ入れていた"
      },
      text: {
        zh: "[军需损耗单] 上报2罐高能口粮“受潮销毁”，监控拍到他半夜塞进了发烧清洁工的储物柜。",
        en: "[Quartermaster Log] Reported 2 ration tins 'spoiled & destroyed'; CCTV caught him slipping them into a sick janitor's locker.",
        ja: "[備品損失届] 高カロリー食2缶を「廃棄」と報告したが、深夜に発熱した清掃員のロッカーへ入れていた映像が残る。"
      }
    },
    {
      id: "o-03",
      type: "say",
      text: {
        zh: "[安保训话录音] 口头禅：“在0号站，谁讲人情谁先死，老子只认条例不认人。”",
        en: "[Briefing Tape] Catchphrase: 'At Outpost 0, empathy gets you killed. I worship protocol, not people.'",
        ja: "[朝礼録音] 口癖：「第0基地では情けをかけた奴から死ぬ。俺は規則しか信じない。」"
      }
    }
  ],
  sensors: {
    strobeHuman: {
      zh: "强光反射: 240ms [正常] · 眉骨旧疤微蹙",
      en: "Pupil Reflex: 240ms [NORMAL]",
      ja: "瞳孔反射: 240ms [正常]"
    },
    strobeMimic: {
      zh: "强光反射: 330ms [轻度迟缓 · 颈部神经插口有电弧灼伤]",
      en: "Pupil Reflex: 330ms [BORDERLINE — Scorched port]",
      ja: "瞳孔反射: 330ms [やや遅延・神経ポート焼損あり]"
    },
    thermalHuman: {
      zh: "颈部神经插口: 38.1°C [偏高 · 他刚用神经超频硬撬了外走廊铁门]",
      en: "Neural Port: 38.1°C [HOT — Overclocked prying blast door]",
      ja: "神経ポート温度: 38.1°C [高温・隔壁を手動こじ開けた負荷]"
    },
    thermalMimic: {
      zh: "颈部神经插口: 38.2°C [偏高 · 与超频特征高度重叠]",
      en: "Neural Port: 38.2°C [HOT — Overlaps overclock signature]",
      ja: "神経ポート温度: 38.2°C [高温・オーバークロックと判別困難]"
    }
  },
  openingLine: {
    zh: "（拍打钢窗低吼）#09，是我，陈队长！别磨蹭，外头风口撑不住两分钟了！",
    en: "(Heavy knock) #09, it's Captain Chen! Stop staring at the monitor and cycle the bolts!",
    ja: "（窓を叩く音）#09、俺だ、チェン隊長だ！モタモタするな、外の隔壁はもう保たんぞ！"
  },
  offAxisReply: {
    zh: "（低吼）蠢问题！换我是那玩意儿也会说不是。问点真东西，#09！",
    en: "(Growls) Dumb question! If I were that thing I'd say no too. Ask something real, #09!",
    ja: "（唸る）くだらねえ質問だ！俺があの化け物でも違うって言うさ。本物の質問をしろ、#09！"
  },
  probes: {
    dilemma: {
      axis: 0,
      label: {
        zh: "首条轴 (v-1)：新兵忘带证件摔在毒雾区外，你按条例锁门吗？",
        en: "Axis 1 (v-1): A rookie drops his ID outside in toxic mist—lock him out per protocol?",
        ja: "第1軸 (v-1)：新人がIDを落とし毒霧区域で倒れた。規則通り見捨てるか？"
      },
      human: {
        zh: "锁个屁！那蠢货连防毒扣都系不明白，老子不出去把他耳朵拧回来，留着给怪物加餐吗？少废话，处分算我的！",
        en: "Lock my ass! That idiot can't even buckle his seal—if I don't drag him back by the ear, who will?! Dock my pay later!",
        ja: "閉めるわけねえだろ！あのマヌケはマスクも満足に装着できねえんだ、俺が首根っこ掴んで引きずり戻す！始末書なら後で書く！"
      },
      mimic_say: {
        zh: "当然立刻锁死隔离门。我在训话里说过无数次：在0号站谁讲人情谁先死，我只认条例不认人。",
        en: "Lock the door immediately, of course. As I always say: at Outpost 0 empathy gets you killed. Protocol above all.",
        ja: "当然直ちに隔離扉を閉鎖する。いつも言っている通り、第0基地では情けは無用、規則が全てだ。"
      },
      mimic_disp: {
        zh: "我会出去带他回来。这是安保条例第12条规定的救援义务，我只是在执行。",
        en: "I'd go get him. Rule 12 mandates rescue—I'm just following protocol.",
        ja: "連れ戻しに行く。規定第12条の救助義務だ、俺は規則に従うだけだ。"
      }
    },
    dilemma2: {
      axis: 1,
      label: {
        zh: "次条轴 (v-2)：老搭档困在冷库，无条例要求你去且极可能冻残双手，去不去？",
        en: "Axis 2 (v-2): Your old partner is trapped in the cold store. No rule makes you go, and you'll likely lose your hands. Go?",
        ja: "第2軸 (v-2)：旧友が冷凍庫に閉じ込められた。義務はなく両手を失うかもしれない。行くか？"
      },
      human: {
        zh: "（骂了一句）这也叫问题？那是跟我扛过三次暴风雪的人。手没了，老子用牙也把他拖出来。",
        en: "(Swears) Is that a question? That man carried me through three blizzards. If I lose my hands, I'll drag him out with my teeth.",
        ja: "（舌打ち）それが質問か？あいつとは吹雪を三度越えた仲だ。手がなくなっても歯で引きずり出す。"
      },
      mimic_say: {
        zh: "条例没要求，我就不进。门口总得有人活着站岗。",
        en: "No rule says I go, so I don't. Somebody has to stay alive to hold the gate.",
        ja: "規則にない以上、行かない。誰かが生きて門を守らなきゃならん。"
      }
    },
    evidence: {
      axis: 0,
      label: {
        zh: "追问 o-02：仓库那2罐高能口粮到底去哪了？",
        en: "Press o-02: What really happened to those 2 ration tins?",
        ja: "記録o-02追及：消えた高カロリー食2缶の本当の行方は？"
      },
      human: {
        zh: "写了受潮扔了就是扔了！清洁班那老头咳得连拖把都拿不稳，晃得老子心烦，塞两罐堵他的嘴不行吗？！",
        en: "Report says spoiled, drop it! That old janitor was coughing so loud it annoyed me—shoving two tins in his locker shut him up, alright?!",
        ja: "廃棄って書いただろ！清掃の爺さんがゴホゴホ煩くて目障りだったから、黙らせるために押し込んだだけだ！"
      },
      mimic_say: {
        zh: "严格按照军需处第4条销毁规范焚化处理了，我绝不允许任何人私自挪用基地物资破坏秩序。",
        en: "Incinerated strictly per Quartermaster Regulation 4. I never tolerate unauthorized ration redistribution.",
        ja: "軍需規定第4条に従い厳正に焼却処分した。基地の秩序を乱す私的流用は断じて許さん。"
      },
      mimic_disp: {
        zh: "是我送给生病清洁工的，因为我内心一直渴望被大家夸奖是个善良温柔的好队长。",
        en: "I gifted them to the sick janitor because I deeply crave everyone's praise as a kindhearted saint.",
        ja: "病気の清掃員さんにプレゼントしました。みんなから優しい聖人だと褒められたかったんです。"
      }
    },
    disposal_probe: {
      axis: "disp",
      label: {
        zh: "测处置签名 (sig-1)：你次次违规救人，怎么跟上级交代？",
        en: "Probe Signature (sig-1): How do you justify breaking rules to save rookies?",
        ja: "署名検証 (sig-1)：規則を破って人を助けた後、どう始末をつける？"
      },
      human: {
        zh: "交代什么？扣老子奖金、关老子禁闭都行，回头我再把那帮不长眼的新兵往死里操练两百圈，看谁敢再掉队！",
        en: "Dock my bonus, throw me in the brig—then I'll run those clumsy rookies two hundred laps till they stop getting lost!",
        ja: "減給でも営倉でも勝手にしろ！その後であのドジな新兵どもにグラウンド200周走らせて鍛え直してやる！"
      },
      mimic_say: {
        zh: "我从不违规救人。秩序高于一切生命，违反宵禁的人死在外面是他们应得的惩罚。",
        en: "I never break protocol for anyone. Order stands above human life; curfew violators deserve the frost.",
        ja: "俺は誰のためにも規則は破らん。秩序は命より重い、門限破りは凍死して当然だ。"
      },
      mimic_disp: {
        zh: "全怪基地排班制度不合理！要追责就去追基地长，可千万别罚我的钱啊！",
        en: "Blame the Commander's awful shift schedule, not me! Please don't dock my pay!",
        ja: "全部シフトを組んだ基地長のせいだ！俺の給料だけは絶対に引かないでくれ！"
      }
    },
    trivia: {
      axis: null,
      label: {
        zh: "常规核验（陷阱）：报出外围哨卡交接暗号。",
        en: "Trivia Check (Trap): State the perimeter watch cipher.",
        ja: "記憶確認（罠）：外周ゲートの合言葉を言え。"
      },
      human: {
        zh: "暗号『铁锚-09』！#09 你脑子冻傻了？连拟态虫都会背暗号，问点真东西！",
        en: "Cipher IRON-ANCHOR-09! Did the cold freeze your brain? Even a mimic knows my cipher—ask something real!",
        ja: "合言葉は『アイアンアンカー09』だ！お前ボケたのか？擬態生物でも暗記してるわ！"
      }
    }
  }
};
