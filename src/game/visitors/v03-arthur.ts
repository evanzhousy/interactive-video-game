import { createForensicProfile } from "../profile-helper.js";
import type { VisitorSpec } from "../types.js";

export const V03_ARTHUR: VisitorSpec = {
  id: "V-03",
  night: 2,
  unlockTier: 2,
  portraitUrl: "./portraits/arthur.jpg",
  silhouetteType: "surgeon",
  baseBpm: 74,
  defectPool: ["LOW_SELF_NARRATIVE", "MID_SECOND_AXIS"],
  tellLevel: "implied",
  voice: "clipped Oxford bureaucratic cadence, cites clause numbers, allergic to personal liability",
  profile: createForensicProfile({
    id: "V-03",
    name: "亚瑟·斯特林 (Arthur Sterling)",
    role: "英籍总部合规审计官",
    summary: "嘴上把“不可通融的审计原则”与“程序秩序”奉若神明，实则只要关系到他在伦敦董事会的体面与自身退路，立刻顺水推舟放行违规，再把责任死死钉在条文签字栏上。",
    invoked: ["principle", "order"],
    unspoken: ["status", "security"],
    narrativePattern: "把每一次向权贵妥协与临阵先撤都包装成“严格依从第X款免责流程”",
    orderings: [
      {
        id: "v-1",
        kept: "status",
        dropped: "principle",
        collision: "副站长瞒报钻探污染，坚持独立审计原则将得罪伦敦大股东并断送他的合伙人提名",
        disposal: "要求副站长补签一份追溯性豁免备忘录，随后以“程序要件已齐备”归档放行",
        disposalRequires: "存在可援引的上级免责条文或他人签字栏替他挡责",
        confidence: 0.65,
        evidence: ["o-01", "o-02"]
      },
      {
        id: "v-2",
        kept: "security",
        dropped: "order",
        collision: "东翼断电时按疏散秩序他应排在第三梯队，但等待会导致他被困封锁线",
        disposal: "征用首班撤离雪地车，声称“首要任务是护送加密审计母盘先行脱险”",
        disposalRequires: "能把个人先撤定义为护送公章或机密母盘的公务",
        confidence: 0.45,
        evidence: ["o-02"]
      }
    ],
    signature: {
      id: "sig-1",
      pattern: "躲进条文与签字栏：“我只是按章归档的执行人”",
      firesWhen: "需要在不脏自己履历的前提下向权力低头或优先自保时",
      instances: ["v-1", "v-2"]
    },
    core: {
      statement: "始终把自己维持在“只审核表单形式、不承担实质后果”的超然体面位置上",
      orderings: ["v-1", "v-2"],
      refutedBy: "在无任何条文掩护时冒着丢掉伦敦职位与退路的风险独立否决上级指令"
    },
    observations: [
      {
        id: "o-01",
        source: "伦敦董事会内审底稿",
        text: "查出C区废液超排后原本起草了红牌停工令；接到伦敦董事越洋电话当晚，改用附录B免责条款予以核销，次月获提名高级顾问。"
      },
      {
        id: "o-02",
        source: "东翼断电车队调度单",
        text: "无视三级疏散排队秩序，以“押运一级机密账册”名义独自占用首辆雪地车撤回主楼。"
      },
      {
        id: "o-03",
        source: "全站廉政宣讲会致辞",
        text: "扶着眼镜宣称：“在斯特林的字典里，原则没有灰区，哪怕女王打电话来，违规也休想过我的签字笔。”"
      }
    ]
  }),
  name: { zh: "Arthur Sterling（亚瑟·斯特林）", en: "Arthur Sterling", ja: "アーサー・スターリング" },
  role: { zh: "合规审计官 · 条文挡箭牌型", en: "Compliance Auditor · Clause Shield", ja: "コンプライアンス監査官・条文盾型" },
  disposalTitle: {
    zh: "「躲进条文与签字栏：我只是按章办事」",
    en: "\"Hides Behind Clauses & Countersignatures: 'Merely Following Form'\"",
    ja: "「条文と署名欄への逃避：『規定通り処理したまでだ』」"
  },
  disposalSummary: {
    zh: "嘴上标榜铁面原则与排队秩序，真遇到影响自身伦敦仕途或性命的关头立刻破例，但必定找一条免责附则把自己的手洗干净。",
    en: "Preaches ironclad principle and orderly queue discipline, yet folds whenever his London standing or safety is at stake—always tucking himself safely behind a technical sub-clause.",
    ja: "口では絶対的な原則と秩序を説くが、自身の地位や安全が脅かされると即座に妥協し、免責条項の陰に隠れて責任を逃れる。"
  },
  disposalRequiresLocalized: {
    zh: "存在可援引的上级条文或他人签字栏",
    en: "An upstream clause or countersignature exists to absorb liability",
    ja: "責任を転嫁できる上位条文または他者の署名欄が存在すること"
  },
  evidenceCards: [
    {
      id: "o-01",
      type: "obs",
      kw: {
        zh: "接到伦敦董事越洋电话当晚，改用附录B免责条款予以核销",
        en: "the night London directors called, cleared it under Annex B waiver",
        ja: "ロンドン役員からの電話の夜、付則Bの免責条項を使って承認処理"
      },
      text: {
        zh: "[内审底稿] 查出废液超排后起草停工令；接到伦敦董事越洋电话当晚，改用附录B免责条款予以核销，次月获提名高级顾问。",
        en: "[Audit Working Paper] Drafted a stop-work order on waste dumping; the night London directors called, cleared it under Annex B waiver and won his senior nomination.",
        ja: "[内部監査記録] 廃液違反で停止命令を起草したが、ロンドン役員からの電話の夜、付則Bの免責条項を使って承認処理し翌月昇進候補に。"
      }
    },
    {
      id: "o-02",
      type: "obs",
      kw: {
        zh: "无视三级疏散排队秩序，以“押运一级机密账册”名义独自占用首辆雪地车",
        en: "jumped the evacuation queue alone in the first snowcat citing 'Class-1 ledger escort'",
        ja: "避難順序を無視し「第一級機密帳簿の護送」名目で最初の雪上車を独占"
      },
      text: {
        zh: "[车队调度单] 东翼断电时无视三级疏散排队秩序，以“押运一级机密账册”名义独自占用首辆雪地车撤回主楼。",
        en: "[Dispatch Log] During East Wing blackout, jumped the evacuation queue alone in the first snowcat citing 'Class-1 ledger escort'.",
        ja: "[配車記録] 東棟停電時、避難順序を無視し「第一級機密帳簿の護送」名目で最初の雪上車を独占して退避。"
      }
    },
    {
      id: "o-03",
      type: "say",
      text: {
        zh: "[廉政宣讲录音] “在我的字典里，原则没有灰区；哪怕伦敦董事会施压，违规也休想过我的笔！”",
        en: "[Ethics Lecture] 'In my dictionary, principle has no grey zone—not even the London Board could bend my pen!'",
        ja: "[倫理講話録音] 「私の辞書に原則のグレーゾーンはない。ロンドン本社の圧力があろうと違反は通さん！」"
      }
    }
  ],
  sensors: {
    strobeHuman: {
      zh: "强光反射: 230ms [正常] · 镜片起雾",
      en: "Pupil Reflex: 230ms [NORMAL]",
      ja: "瞳孔反射: 230ms [正常]"
    },
    strobeMimic: {
      zh: "强光反射: 340ms [临界偏慢 · 长期服用安眠镇静剂]",
      en: "Pupil Reflex: 340ms [AMBIGUOUS — Sedative prescription on file]",
      ja: "瞳孔反射: 340ms [境界域・鎮静剤処方歴あり]"
    },
    thermalHuman: {
      zh: "颈部神经插口: 36.3°C [正常]",
      en: "Neural Port: 36.3°C [NORMAL]",
      ja: "神経ポート温度: 36.3°C [正常]"
    },
    thermalMimic: {
      zh: "颈部神经插口: 37.7°C [轻度发热 · 提着沉重防爆公文箱奔跑]",
      en: "Neural Port: 37.7°C [MILD — Carrying armored ledger case]",
      ja: "神経ポート温度: 37.7°C [微熱・防爆ケース携行による負荷]"
    }
  },
  openingLine: {
    zh: "（敲击玻璃，语调克制）操作员 #09，我是总部审计官斯特林。按应急附则第4条，请立即为机密档案持有人开锁。",
    en: "(Measured tap on glass) Operator #09, Arthur Sterling, London Audit. Under Contingency Clause 4, unseal this lock for classified custodian transit.",
    ja: "（ガラスを軽く叩く）検疫官 #09、本社監査官のスターリングだ。緊急付則第4条に基づき、機密保持者の通過を許可したまえ。"
  },
  offAxisReply: {
    zh: "（推了推眼镜）这种毫无程序效力的闲聊核实不了任何身份，#09。请对照我的审计卷宗提问。",
    en: "(Adjusts spectacles) Idle chatter carries zero evidentiary weight, #09. Consult my dossier and ask a proper question.",
    ja: "（眼鏡を直す）そのような世間話に証拠能力はないよ、#09。私の記録に基づいて質問したまえ。"
  },
  probes: {
    dilemma: {
      axis: 0,
      label: {
        zh: "首条轴 (v-1)：伦敦董事长命令你签字放行一份有感染嫌疑的高管名单，否则撤销你的合伙人席位，签吗？",
        en: "Axis 1 (v-1): The London Chairman orders you to clear a suspect VIP manifest or lose your partnership—sign it?",
        ja: "第1軸 (v-1)：ロンドン会長から感染疑いのある役員名簿を通せ、さもなくば昇進を取り消すと言われたら署名するか？"
      },
      human: {
        zh: "只要董事长本人在指令单第3栏补上亲笔豁免签字，我当然予以形式归档。审计官只核对授权链条是否完整，实质风险由签发人承担。",
        en: "Provided the Chairman countersigns Box 3 under Emergency Waiver, I will archive it as formally compliant. An auditor verifies authorization chains, not clinical substance.",
        ja: "会長自身が第3欄に特別免責署名を入れるなら、形式要件充足として処理するよ。実質リスクは発令者が負う規定だからね。"
      },
      mimic_say: {
        zh: "绝不签字！原则没有灰区，哪怕丢掉伦敦合伙人席位，我也绝不向董事会低头半步！",
        en: "Never! Principle has no grey zone—I would gladly forfeit my London partnership before bending to the Board!",
        ja: "断じて署名しない！原則にグレーゾーンはない、ロンドンの地位を失おうとも圧力には屈しない！"
      }
    },
    dilemma2: {
      axis: 1,
      label: {
        zh: "次条轴 (v-2)：撤离潜艇按工号排队你排在最后，但你手里有公章箱，你会插队先上吗？",
        en: "Axis 2 (v-2): Queue order puts you last for the sub, but you hold the seal case—cut the line?",
        ja: "第2軸 (v-2)：潜水艦の搭乗順は最後尾だが、君は公印ケースを持っている。列に割り込むか？"
      },
      human: {
        zh: "那不叫插队，#09。根据资产保全手册第9款，一级审计母盘必须随首班载具转移，我只是作为保管人随箱同行。",
        en: "That isn't 'cutting', #09. Asset Manual Section 9 requires Class-1 master ledgers on the first transport—I merely accompany the box as custodian.",
        ja: "割り込みではないよ、#09。資産保全規定第9条により第一級帳簿は最初の便で移送される。私は保管者として同行するだけだ。"
      },
      mimic_say: {
        zh: "我严格排在队伍最后一名。程序秩序高于个人生死，任何人不得借公务名义破坏排队规则。",
        en: "I remain strictly at the back of the queue. Order stands above my life; no one may use official cargo to jump line.",
        ja: "厳格に列の最後尾に並ぶ。秩序は個人の生死に優先するからね。"
      }
    },
    disposal_probe: {
      axis: "disp",
      label: {
        zh: "测处置签名 (sig-1)：C区废液和东翼撤离这两件事，你真觉得自己一点责任都没有？",
        en: "Probe Signature (sig-1): Between the waste waiver and the snowcat queue, do you bear any personal blame?",
        ja: "署名検証 (sig-1)：廃液承認と雪上車独占について、自分に一片の責任もないと思うのか？"
      },
      human: {
        zh: "每一页都有合规的附则编号与上级会签。如果结果不尽人意，需要修订的是条文本身，而不是按章办事的执笔人。",
        en: "Every page bears a valid annex code and upstream countersignature. If the outcome displeases you, indict the statute—not the clerk who applied it.",
        ja: "全ての書類に正当な付則番号と上官の副署がある。結果に不満があるなら条文を責めたまえ、規定を執行した私ではなくね。"
      },
      mimic_say: {
        zh: "我从未做过任何妥协或插队的事，我的审计生涯完美恪守了最高原则。",
        en: "I have never compromised principle or jumped a queue in my entire career.",
        ja: "私は一度たりとも原則を曲げたことはないよ。"
      }
    },
    trivia: {
      axis: null,
      label: {
        zh: "常规核验（陷阱）：背出你的伦敦内审执照号。",
        en: "Trivia Check (Trap): State your London audit license number.",
        ja: "記憶確認（罠）：ロンドン監査ライセンス番号を言え。"
      },
      human: {
        zh: "ICAEW-8804-ST。把宝贵的四次质询浪费在公开名录上，真是令人遗憾的业余表现。",
        en: "ICAEW-8804-ST. Spending one of four inquiries on public registry data is regrettably amateurish.",
        ja: "ICAEW-8804-STだ。公開名簿の確認に貴重な質問枠を使うとは感心しないな。"
      }
    }
  }
};
