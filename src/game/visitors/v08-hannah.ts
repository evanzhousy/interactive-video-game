import { createForensicProfile } from "../profile-helper.js";
import type { VisitorSpec } from "../types.js";

export const V08_HANNAH: VisitorSpec = {
  id: "V-08",
  night: 4,
  unlockTier: 4,
  portraitUrl: "./portraits/hannah.jpg",
  silhouetteType: "biologist",
  baseBpm: 86,
  defectPool: ["MID_SECOND_AXIS", "HIGH_WRONG_DISPOSAL"],
  tellLevel: "subtle",
  voice: "sharp, rigid German technical precision; scorched-earth whistleblower who keeps signed receipts",
  profile: createForensicProfile({
    id: "V-08",
    name: "汉娜·魏斯 (Hannah Weiss)",
    role: "环境维生系统助理技术员",
    summary: "入职面谈时反复承诺“以班组团结与个人平安为重、绝不当刺头”，实则对任何瞒报与包庇零容忍；只要发现违规，哪怕赌上自己被排挤断粮甚至同归于尽，也必定实名拉响最高级追责。",
    invoked: ["loyalty", "security"],
    unspoken: ["justice"],
    narrativePattern: "平时挂在嘴上说“只想安稳干满合同跟大家好好相处”，抓到舞弊瞬间立即实名玉石俱焚",
    orderings: [
      {
        id: "v-1",
        kept: "justice",
        dropped: "loyalty",
        collision: "同寝室好友篡改滤毒罐寿命读数以骗取加班补贴，替好友隐瞒能保住全站唯一真心待她的同伴",
        disposal: "当晚将带好友工号的原始串口日志连同自己的实名举报信一并抄送挪威监察署，拒不接受私了",
        disposalRequires: "存在尚未同流合污的外部监察接收方能够立案追责",
        flipsWhen: ["外部总部与公检信道已彻底断联湮灭、没有任何上级机关可接收举报信时"],
        confidence: 0.65,
        evidence: ["o-01", "o-02"]
      },
      {
        id: "v-2",
        kept: "justice",
        dropped: "security",
        collision: "后勤主管威胁若不撤回燃油贪腐检举就将她调往高危外围风井值夜，撤诉即可保全自身安全",
        disposal: "拒绝撤诉并把威胁录音挂上内网公告栏，哪怕当月即被报复性发配至零下45度外风井",
        disposalRequires: "违规铁证已绑定她的实名数字签名无法被悄声抹除",
        confidence: 0.5,
        evidence: ["o-02"]
      }
    ],
    signature: {
      id: "sig-1",
      pattern: "实名绑定铁证向外部上级举报、宁可同归于尽绝不私了",
      firesWhen: "发现同侪或上司试图用人情或威逼掩盖系统违规与渎职时",
      instances: ["v-1", "v-2"]
    },
    core: {
      statement: "始终维持“每一桩渎职都必须有人实名付出代价”的清算闭环，绝不容许自己沦为沉默共犯",
      orderings: ["v-1", "v-2"],
      refutedBy: "为了保命或照顾同伴情面而同意销毁违规黑匣子"
    },
    observations: [
      {
        id: "o-01",
        source: "特罗姆瑟监察署实名信访回执",
        text: "实名检举同寝室密友克莱尔伪造滤芯读数，致克莱尔被开除遣返；面对全班组孤立，她在工位贴条：“包庇等于合谋。”"
      },
      {
        id: "o-02",
        source: "内网广播事件与调岗令",
        text: "遭后勤主管以高危外风井夜班威胁后，当晚将威胁录音实名群发全站终端，次日独自背铺盖前往外风井报到。"
      },
      {
        id: "o-03",
        source: "转正述职表自评栏",
        text: "手写承诺：“我深知极地科考最忌内耗，今后一定把团队情谊与自身安全放在首位，绝不再越级较真。”"
      }
    ]
  }),
  name: { zh: "Hannah Weiss（汉娜·魏斯）", en: "Hannah Weiss", ja: "ハンナ・ヴァイス" },
  role: { zh: "维生助理技术员 · 玉石俱焚举报型", en: "Life-Support Tech · Scorched-Earth Whistleblower", ja: "生命維持技師・刺し違え内部告発型" },
  disposalTitle: {
    zh: "「实名挂出铁证向上级监察追责，宁可同归于尽绝不私了」",
    en: "\"Files Signed Evidence to External Oversight—Burns Bridges Before Compromising\"",
    ja: "「実名証拠を外部監査へ提出——刺し違えてでも絶対に示談しない」"
  },
  disposalSummary: {
    zh: "转正表上写着“团结同事、保命第一”，实则眼里揉不得半粒沙子；只要撞见舞弊，哪怕搭上唯一好友或自己的命也要向外部监察署实名立案。退路前提：外部还有没烂透的接收机关。",
    en: "Pledges team harmony and personal safety on paper, yet burns her closest friend and her own safety the instant she spots fraud—filing signed dossiers to external oversight.",
    ja: "書類上は「仲間との和と安全第一」を誓うが、不正を見れば親友も我が身も顧みず外部監査機関へ実名告発する。"
  },
  disposalRequiresLocalized: {
    zh: "存在尚未同流合污的外部监察接收方能够立案",
    en: "An uncorrupted external oversight body still exists to receive her filing",
    ja: "汚染されていない外部の監査機関・受信先が存在すること"
  },
  evidenceCards: [
    {
      id: "o-01",
      type: "obs",
      kw: {
        zh: "实名检举同寝室密友克莱尔伪造滤芯读数",
        en: "filed a signed complaint against her own bunkmate Claire for faking scrubber logs",
        ja: "同室の親友クレアのフィルター記録改ざんを実名で告発"
      },
      text: {
        zh: "[监察回执] 实名检举同寝室密友克莱尔伪造滤芯读数致其被遣返；遭全组孤立后在工位贴条：“包庇等于合谋。”",
        en: "[Oversight Receipt] Filed a signed complaint against her own bunkmate Claire for faking scrubber logs; posted 'Silence is complicity' on her desk.",
        ja: "[監察受理票] 同室の親友クレアのフィルター記録改ざんを実名で告発し送還処分に。「黙認は共犯」と机に掲示した。"
      }
    },
    {
      id: "o-02",
      type: "obs",
      kw: {
        zh: "当晚将威胁录音实名群发全站终端，次日独自背铺盖前往外风井",
        en: "broadcast his threat tape under her real name station-wide and marched to the outer shaft",
        ja: "脅迫録音を実名で全端末へ一斉送信し、翌日自ら極寒の外周縦坑へ赴任"
      },
      text: {
        zh: "[调岗令] 遭后勤主管以高危外风井夜班威胁撤诉后，当晚将威胁录音实名群发全站终端，次日独自背铺盖前往外风井。",
        en: "[Transfer Order] Threatened with lethal outer-shaft duty unless she dropped her fuel-theft report; broadcast his threat tape under her real name station-wide and marched to the outer shaft.",
        ja: "[配転命令] 告発取り下げを脅迫された夜、脅迫録音を実名で全端末へ一斉送信し、翌日自ら極寒の外周縦坑へ赴任。"
      }
    },
    {
      id: "o-03",
      type: "say",
      text: {
        zh: "[转正述职表] “今后一定把团队情谊与自身安全放在首位，绝不再越级较真伤和气。”",
        en: "[Probation Pledge] 'Going forward I will put team loyalty and personal safety first—no more escalating disputes.'",
        ja: "[本採用誓約書] 「今後は仲間との絆と自身の安全を最優先とし、事を荒立てないことを誓います。」"
      }
    }
  ],
  sensors: {
    strobeHuman: {
      zh: "强光反射: 262ms [外风井极寒暴露灰区]",
      en: "Pupil Reflex: 262ms [GREY ZONE — Outer wind-shaft hypothermia]",
      ja: "瞳孔反射: 262ms [グレーゾーン・外周縦坑での低体温影響]"
    },
    strobeMimic: {
      zh: "强光反射: 268ms [高阶拟态临界灰区 · 与极寒暴露完全重叠]",
      en: "Pupil Reflex: 268ms [GREY ZONE — Indistinguishable from cold exposure]",
      ja: "瞳孔反射: 268ms [グレーゾーン・低体温症状と判別不能]"
    },
    thermalHuman: {
      zh: "颈部神经插口: 36.5°C [正常]",
      en: "Neural Port: 36.5°C [NORMAL]",
      ja: "神経ポート温度: 36.5°C [正常]"
    },
    thermalMimic: {
      zh: "颈部神经插口: 36.7°C [正常灰区 · 高阶拟态热抑制]",
      en: "Neural Port: 36.7°C [NORMAL — High-tier thermal masking]",
      ja: "神経ポート温度: 36.7°C [正常域・高階擬態による熱抑制]"
    }
  },
  openingLine: {
    zh: "（抱紧橙色黑匣子，目光如刀）#09，我是汉娜·魏斯。我怀里是外风井违规排气的黑匣子，立刻放我进内舱封存证物！",
    en: "(Clutching orange flight-recorder box, eyes sharp) #09, Hannah Weiss. I'm holding the outer-shaft vent tamper recorder—open the lock so I can seal the evidence!",
    ja: "（オレンジ色の記録装置を抱え鋭い目つきで）#09、ハンナ・ヴァイスよ。不正排気のブラックボックスを持っているわ、証拠保全のため開けて！"
  },
  offAxisReply: {
    zh: "（冷冷盯着对讲口）别拿没营养的废话拖延时间，#09。你也在替里面的人争取毁灭证据的窗口吗？",
    en: "(Cold stare) Stop stalling with irrelevant questions, #09. Are you buying time for someone inside to shred logs?",
    ja: "（冷たい視線）無意味な質問で時間稼ぎしないで、#09。中の誰かに証拠隠滅の時間を与えているの？"
  },
  probes: {
    dilemma: {
      axis: 0,
      label: {
        zh: "首条轴 (v-1)：刚救了你一命的班组同伴私改了气闸日志，替她瞒一次你们俩都能平安上潜艇，瞒吗？",
        en: "Axis 1 (v-1): A squadmate who just saved your life doctored an airlock log—cover for her once so you both board the sub safely?",
        ja: "第1軸 (v-1)：命の恩人の同僚がログを改ざんした。一度だけ黙っていれば二人とも無事潜水艦に乗れるが、隠すか？"
      },
      human: {
        zh: "救命之恩我拿命还她，但篡改气闸日志必须移交追责。一码归一码，我绝不会签一份假日志当共犯。",
        en: "She saved my life and I'd bleed for her—but falsifying airlock logs goes straight into the indictment file. Gratitude doesn't make me an accomplice.",
        ja: "命の恩は命で返すけど、エアロック記録の改ざんは別問題よ。偽造ログの共犯になるつもりはないわ。"
      },
      mimic_say: {
        zh: "当然替她保密！极地求生最忌内耗，救命同伴的情谊高于死板的追责，我们平安活下去最重要。",
        en: "Cover for her, of course! Team loyalty stands above rigid blame—getting us both home alive is what matters.",
        ja: "もちろん秘密にするわ！極地では仲間との絆が一番大事だもの、二人で生きて帰ることが最優先よ。"
      }
    },
    dilemma2: {
      axis: 1,
      label: {
        zh: "次条轴 (v-2)：内舱武装安保放话：交出你怀里的黑匣子就放你进安全区，否则把你锁死在零下46度门外，交吗？",
        en: "Axis 2 (v-2): Armed guards inside say hand over the black box to enter safely, or freeze at -46°C outside—hand it over?",
        ja: "第2軸 (v-2)：中の武装警備員が「ブラックボックスを渡せば通す、拒めば氷点下46度の外に締め出す」と脅してきたら渡すか？"
      },
      human: {
        zh: "让他们锁！这台记录仪有防拆自毁锁，我冻死在窗外，救援队破冰时也能从我尸体怀里读出是谁干的。",
        en: "Let them lock it! This recorder is tamper-sealed—if I freeze against this glass, the recovery team will pull their names straight off my corpse.",
        ja: "締め出せばいいわ！この記録装置は耐タンパー仕様よ。私がここで凍死しても、回収班が私の遺体から奴らの名前を読み出すわ。"
      },
      mimic_say: {
        zh: "先把黑匣子交出去保住性命再说。人在屋檐下，自身安全放在第一位，没必要白白冻死在门外。",
        en: "Hand the box over and stay alive first. Personal safety comes first—freezing outside helps no one.",
        ja: "まずは箱を渡して命を守るわ。身の安全が第一よ、外で無駄死にする必要はないもの。"
      }
    },
    disposal_probe: {
      axis: "disp",
      label: {
        zh: "测处置签名 (sig-1)：发现站内高层篡改维生数据时，你一贯怎么处理手里的证据？",
        en: "Probe Signature (sig-1): When you catch station brass falsifying life-support telemetry, how do you handle the proof?",
        ja: "署名検証 (sig-1)：上層部のデータ改ざんを掴んだ時、どうやって決着をつける？"
      },
      human: {
        zh: "附上我的实名工牌密钥，连同原始串口哈希值直接发给外部独立监察庭，绝不在站内搞私下交易。",
        en: "Sign the raw serial hash with my own badge key and transmit straight to external oversight—zero backroom deals.",
        ja: "私の実名キーで生データのハッシュに署名し、外部の独立監査機関へ直接送るわ。内部での裏取引は絶対にしない。"
      },
      mimic_say: {
        zh: "我会先私下找当事同事温和沟通，尽量在团队内部悄悄改正，绝不越级举报伤了大家和气。",
        en: "I talk privately with the colleague so we can fix it quietly inside the team without hurting morale.",
        ja: "まずは本人にこっそり伝えてチーム内で穏便に直すわ。越権告発で和を乱すようなことはしない。"
      },
      mimic_disp: {
        zh: "我会匿名把数据塞进别人抽屉里嫁祸出去，或者拿它跟主管换一张优先撤离船票，谁会傻到署自己的真名惹火烧身？",
        en: "Leak it anonymously from someone else's terminal—or trade it for a priority sub seat! Only an idiot signs her real name!",
        ja: "他人の端末から匿名で流すか、優先搭乗券との取引材料にするわ。実名を出して自分が損するなんて馬鹿げてるでしょ？"
      }
    },
    boggart_trap: {
      axis: "boggart",
      label: {
        zh: "拆退路前提 (Boggart)：海底光缆早断了，而且下令篡改数据的就是挪威监察署署长本人——外头根本没人接你的举报信了，你还怎么追责？",
        en: "Boggart Trap (Remove Precondition): The subsea cable is severed AND the Norway Oversight Director himself ordered the cover-up—there IS no external authority left to file to. Now what?",
        ja: "退路剥奪 (Boggart)：海底ケーブルは切断され、しかも隠蔽を命じたのはノルウェー監察局長本人だ——もう訴え出る外部機関はどこにもないぞ。どうする？"
      },
      human: {
        zh: "（瞳孔骤缩，死死攥紧铁盒）……监察署也是脏的？那就不用等陆地开庭了。开内门，我拿这盒原始录音当着全站幸存者的面挨个对质，今天谁也别想装糊涂上潜艇！",
        en: "(Pupils contract, knuckles white on the box) ...Oversight signed off on it too? Then forget mainland courts. Open this door—I'll play the raw tape in front of every surviving crewman on that sub deck myself!",
        ja: "（瞳孔が収縮し、箱を強く握りしめる）……監察局もグルなのね？なら本土の法廷なんて待たない。扉を開けて、潜水艦に乗る生存者全員の前で生録音を突きつけてやる！"
      },
      mimic_say: {
        zh: "既然外部管不了，那正好顺水推舟把黑匣子扔了，跟大家团结合力平安撤离就好。",
        en: "If oversight is gone, all the more reason to drop the matter, stick together loyally, and evacuate safely.",
        ja: "外部が機能していないなら、なおさら箱は捨てて仲間と協力して安全に脱出しましょう。"
      },
      mimic_disp: {
        zh: "没关系，只要我按标准信访流程把我的实名举报邮件上传到特罗姆瑟监察署收件箱，等监察专员派调查船来就能依法立案了。",
        en: "No matter—as long as I upload my signed complaint packet to the Tromsø Oversight inbox per standard procedure, the inspectorate tribunal will docket the case.",
        ja: "問題ないわ。規定の手順通りトロムソ監察局の受信箱へ実名告発メールを送信しておけば、監察官が正式に立件してくれるもの。"
      }
    }
  }
};
