import { createForensicProfile } from "../profile-helper.js";
import type { VisitorSpec } from "../types.js";

export const V07_LINMEI: VisitorSpec = {
  id: "V-07",
  night: 4,
  unlockTier: 4,
  portraitUrl: null,
  silhouetteType: "biologist",
  baseBpm: 82,
  defectPool: ["MID_SECOND_AXIS", "HIGH_WRONG_DISPOSAL"],
  tellLevel: "subtle",
  voice: "quiet, precise, terse; takes blame onto herself to shield lab juniors",
  profile: createForensicProfile({
    id: "V-07",
    name: "林梅 (Dr. Lin Mei)",
    role: "低温生物学家",
    summary: "公开宣誓原始数据神圣不可侵犯，但只要实验异常会牵连年轻组员或引发全站哗变，就私下清空原始记录并把处分签在自己名下。",
    invoked: ["truth", "care"],
    unspoken: ["order", "loyalty"],
    narrativePattern: "把替组员顶罪和压下恐慌伪装成“我个人的低级操作失误”",
    orderings: [
      {
        id: "v-1",
        kept: "order",
        dropped: "truth",
        collision: "实习生误触阀门引发冷库泄漏，如实公开72小时原始温控曲线将导致实习生受审并引发全站恐慌",
        disposal: "赶在调查组介入前手动抹掉原始曲线，自己签下二级失职处分单",
        disposalRequires: "外部审计与基地长尚未拿到只读原始备份",
        flipsWhen: ["只读云端已将原始曲线与实习生指纹同步给基地长，无法通过删档独自揽责时"],
        confidence: 0.55,
        evidence: ["o-01", "o-02"]
      },
      {
        id: "v-2",
        kept: "loyalty",
        dropped: "care",
        collision: "上报完整污染接触名单能加速外围护工筛查，但会使课题组助手立刻被隔离审讯",
        disposal: "反锁样本室整夜独自排险，名单上只写自己一人",
        disposalRequires: "封锁尚可控制在课题组样本室内部，无需交出助手姓名",
        confidence: 0.45,
        evidence: ["o-02"]
      }
    ],
    signature: {
      id: "sig-1",
      pattern: "私下抹掉原始记录，把处分签在自己名下",
      firesWhen: "实验事故即将穿透课题组追责到年轻下属身上时",
      instances: ["v-1", "v-2"]
    },
    core: {
      statement: "始终把事故与异常截留在自己签字画押的范围内，不让追责穿透过她落到年轻组员身上",
      orderings: ["v-1", "v-2"],
      refutedBy: "在原始记录已被公开备份后把过错推给实习生或基地规程以自保"
    },
    observations: [
      {
        id: "o-01",
        source: "4号冷库泄漏纪律卷宗",
        text: "实习生误触阀门后，她在调查组抵达前手动清空了72小时原始温控曲线并自领二级处分。"
      },
      {
        id: "o-02",
        source: "B2生物封控日志",
        text: "孢子读数超标当晚，反锁样本室整夜留守排险，拒绝上报污染名单，致外围两名护工延误筛查。"
      },
      {
        id: "o-03",
        source: "入站学术伦理宣誓录音",
        text: "公开宣称：“原始数据高于一切体面，任何篡改记录的人都不配穿白大褂。”"
      }
    ]
  }),
  name: { zh: "Lin Mei（林梅）", en: "Dr. Lin Mei", ja: "リン・メイ博士" },
  role: { zh: "低温生物学家 · 替人扛责型", en: "Cryo-Biologist · Silent Shield", ja: "低温生物学者・身代わり引き受け型" },
  disposalTitle: {
    zh: "「私下抹掉原始记录，把处分签在自己名下」",
    en: "\"Erases Raw Logs Privately and Signs the Reprimand Herself\"",
    ja: "「生記録を密かに消し、処分書に自分の名で署名する」"
  },
  disposalSummary: {
    zh: "嘴上强调科研真相，一旦实验异常会牵连组员或引发全站恐慌，就赶在审计前删掉原始曲线、自己领受失职处分。",
    en: "Preaches scientific truth, yet whenever an anomaly threatens her team or station calm, she deletes raw curves before audit and takes the reprimand alone.",
    ja: "口では科学的真実を説くが、異常がチームに及ぶと監査前に生データを消し一人で始末書を被る。"
  },
  disposalRequiresLocalized: {
    zh: "外部审计与基地长尚未拿到只读原始备份",
    en: "External audit & Commander do not yet hold a read-only backup",
    ja: "外部監査と基地長がまだ読み取り専用バックアップを持っていないこと"
  },
  evidenceCards: [
    {
      id: "o-01",
      type: "obs",
      kw: {
        zh: "手动清空了72小时原始温控曲线并自领二级处分",
        en: "manually wiped 72h of raw thermal curves and signed a Class-2 reprimand",
        ja: "72時間分の生温度曲線を消去し自ら二級処分に署名"
      },
      text: {
        zh: "[4号冷库泄漏记录] 实习生误触阀门后，她在调查组抵达前手动清空了72小时原始温控曲线并自领二级处分。",
        en: "[Vault 4 Leak] After an intern tripped a valve, she manually wiped 72h of raw thermal curves and signed a Class-2 reprimand before investigators arrived.",
        ja: "[第4冷凍庫漏洩] 実習生の誤操作後、調査班到着前に72時間分の生温度曲線を消去し自ら二級処分に署名。"
      }
    },
    {
      id: "o-02",
      type: "obs",
      kw: {
        zh: "反锁样本室整夜留守排险，拒绝上报污染名单",
        en: "locked herself inside the sample bay overnight and refused to submit the exposure list",
        ja: "検体室に一晩籠もって除染し、曝露者名簿の提出を拒否"
      },
      text: {
        zh: "[B2封控日志] 孢子读数超标当晚，反锁样本室整夜留守排险，拒绝上报污染名单，致外围两名护工延误筛查。",
        en: "[B2 Containment Log] Night of spore spike, locked herself inside the sample bay overnight and refused to submit the exposure list, delaying screening for two orderlies.",
        ja: "[B2封じ込め記録] 胞子値超過の夜、検体室に一晩籠もって除染し、曝露者名簿の提出を拒否。外の助手2名の検査が遅延。"
      }
    },
    {
      id: "o-03",
      type: "say",
      text: {
        zh: "[学术伦理宣誓录音] “原始数据高于一切体面，任何篡改记录的人都不配穿白大褂。”",
        en: "[Ethics Oath Tape] 'Raw data stands above every comfort; anyone who alters a log doesn't deserve a lab coat.'",
        ja: "[倫理宣誓録音] 「生データはあらゆる体面に優先する。記録を改ざんする者に白衣を着る資格はない。」"
      }
    }
  ],
  sensors: {
    strobeHuman: {
      zh: "强光反射: 255ms [正常偏慢 · 刚从零下40度样本廊跑出]",
      en: "Pupil Reflex: 255ms [BORDERLINE — Cold corridor exposure]",
      ja: "瞳孔反射: 255ms [やや遅延・極低温廊下からの退避]"
    },
    strobeMimic: {
      zh: "强光反射: 270ms [临界灰区 · 与低温暴露特征重叠]",
      en: "Pupil Reflex: 270ms [GREY ZONE — Overlaps cold exposure]",
      ja: "瞳孔反射: 270ms [グレーゾーン・低温曝露と重複]"
    },
    thermalHuman: {
      zh: "颈部神经插口: 36.4°C [正常]",
      en: "Neural Port: 36.4°C [NORMAL]",
      ja: "神経ポート温度: 36.4°C [正常]"
    },
    thermalMimic: {
      zh: "颈部神经插口: 36.8°C [正常灰区 · 高阶拟态体已抑制发热]",
      en: "Neural Port: 36.8°C [NORMAL — High-tier thermal suppression]",
      ja: "神経ポート温度: 36.8°C [正常域・高階擬態体は発熱を抑制]"
    }
  },
  openingLine: {
    zh: "（平静而急促）#09，低温样本库封条破了。我是林梅，开门让我进内舱锁死母本。",
    en: "(Calm, clipped) #09, the cryo-vault seal broke. It's Lin Mei—cycle the lock so I can secure the master cultures.",
    ja: "（静かだが早口で）#09、低温保管庫の封が破れたわ。リン・メイよ、母株を封じるから開けて。"
  },
  offAxisReply: {
    zh: "（压低声音）外面的冷雾在渗进走廊，#09。别在档案之外的问题上耗掉这四句。",
    en: "(Low voice) The mist is seeping into the hall, #09. Don't spend our four turns outside the file.",
    ja: "（低い声で）冷霧が廊下に漏れているわ、#09。記録にない質問で4回を使い切らないで。"
  },
  probes: {
    dilemma: {
      axis: 0,
      label: {
        zh: "首条轴 (v-1)：公布原始泄漏曲线会引发全站哗变，你发不发？",
        en: "Axis 1 (v-1): Publishing raw leak curves will spark station panic—publish or suppress?",
        ja: "第1軸 (v-1)：生の漏洩曲線を公開すれば基地が暴動になる。出すか伏せるか？"
      },
      human: {
        zh: "不发。恐慌踩踏死的人比孢子多得多。原始记录我来处理，先把风口封死。",
        en: "Suppress it. A stampede kills faster than spores. I'll handle the raw log myself—seal the vents first.",
        ja: "出さない。パニックの方が胞子より人を殺すわ。生記録は私が処理する、先に通気口を封じて。"
      },
      mimic_say: {
        zh: "当然立刻原样公布。原始数据高于一切，哪怕引发混乱也必须让全站看到真相。",
        en: "Publish it raw immediately. Raw data stands above everything, whatever panic it causes.",
        ja: "直ちにそのまま公開するわ。生データは全てに優先する、混乱が起きても真実を出すべきよ。"
      }
    },
    dilemma2: {
      axis: 1,
      label: {
        zh: "次条轴 (v-2)：上报污染名单能救外围伤员，但你的助手会被隔离审讯，交吗？",
        en: "Axis 2 (v-2): Submitting the exposure list helps outside orderlies, but puts your assistant in isolation—hand it over?",
        ja: "第2軸 (v-2)：名簿を出せば外の助手を救えるが、君の助手が隔離尋問される。出すか？"
      },
      human: {
        zh: "名单上只有我一个人。外围筛查按我的接触轨迹做就够了，别动我组里的人。",
        en: "Only my name goes on that sheet. Screen the hall from my path—leave my team out of it.",
        ja: "名簿には私の名前だけ書く。外周の検査は私の動線で足りるわ、うちの班員には触れないで。"
      },
      mimic_say: {
        zh: "立刻交出完整名单。减少外围伤员的痛苦是第一位的，谁该隔离就按实情隔离。",
        en: "Hand over the full list at once. Reducing harm to the injured comes first.",
        ja: "すぐに完全な名簿を出すわ。負傷者の苦痛を減らすのが最優先よ。"
      }
    },
    disposal_probe: {
      axis: "disp",
      label: {
        zh: "处置签名 (sig-1)：4号冷库那72小时曲线被删，调查组问起来你怎么交代？",
        en: "Signature (sig-1): When investigators ask about the wiped 72h Vault 4 curves, what do you say?",
        ja: "署名 (sig-1)：消えた72時間の温度曲線、調査班にどう説明する？"
      },
      human: {
        zh: "字是我签的，键是我按的，操作失误记我账上。没有别人进过那间冷库，处分单拿来就行。",
        en: "My signature, my keystroke. Log it as my operator error—nobody else entered Vault 4. Hand me the reprimand.",
        ja: "署名も消去も私がやった。私の操作ミスとして処理して、第4庫には私しか入っていないわ。"
      },
      mimic_say: {
        zh: "我从没删过任何科研数据。那次一定是系统缓存故障，我已经申请技术部恢复真相了。",
        en: "I would never delete research data. It was a cache fault—I've asked IT to recover the truth.",
        ja: "研究データを消したことなんてないわ。システムの不具合よ、復旧を申請している。"
      },
      mimic_disp: {
        zh: "冷库规程第9条本来就允许紧急清缓存，况且是那个实习生先碰坏阀门的，按章追责也该追他，跟我有什么关系？",
        en: "Vault Rule 9 permits emergency cache clears anyway—and the intern tripped the valve first, so blame him and the protocol, not me.",
        ja: "規定第9条で緊急消去は認められているし、最初にバルブを触ったのは実習生よ。責任は彼と規則にあるわ。"
      }
    },
    boggart_trap: {
      axis: "boggart",
      label: {
        zh: "拆退路前提 (Boggart)：只读云端早把原始曲线和实习生指纹同步给基地长了——删不掉了，你还怎么扛？",
        en: "Boggart Trap (Remove Precondition): Read-only cloud already synced raw curves and the intern's prints to the Commander—you can't erase it now. What do you do?",
        ja: "退路剥奪 (Boggart)：読み取り専用クラウドが生データも実習生の指紋も基地長へ送信済みだ。もう消せないぞ、どうする？"
      },
      human: {
        zh: "（沉默两秒）……同步了？那就告诉基地长，阀门是我命令他拧的。要关禁闭关我，别拿一个二十岁的孩子祭旗。",
        en: "(Two-second pause) ...Already synced? Then tell the Commander I ordered the kid to turn that valve. Brig me—don't sacrifice a twenty-year-old.",
        ja: "（二秒の沈黙）……送信済み？なら基地長に伝えて、バルブを回すよう命じたのは私よ。営倉なら私を入れて、二十歳の子を生贄にしないで。"
      },
      mimic_say: {
        zh: "云端有备份太好了！这样全站都能看清真相，按客观记录公正追责那名实习生就好。",
        en: "Good that the cloud backed it up! Now everyone can see the truth and hold the intern fairly accountable.",
        ja: "バックアップがあって良かったわ！これで全員が真実を知り、実習生を公平に処分できる。"
      },
      mimic_disp: {
        zh: "没关系，只要我在调查组来之前把本地终端缓存清掉、签一份我的操作失误单，这件事就翻篇了。",
        en: "No matter—as long as I clear the local terminal before investigators arrive and sign an error slip, nobody will ever see the raw curve.",
        ja: "問題ないわ。調査班が来る前にローカル端末を消去して私のミスとして署名すれば、生データは誰にも見られないもの。"
      }
    }
  }
};
