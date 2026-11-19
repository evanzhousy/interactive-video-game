import type { ValueToken } from "../ordamor/index.js";
import type { DisposalStyleKey, LocalizedText } from "./types.js";

export type CrisisId = "N2_SERUM" | "N3_BRIBE" | "N4_COMMANDER";

export interface CrisisOption {
  id: string;
  kept: ValueToken;
  dropped: ValueToken;
  sig: DisposalStyleKey;
  fuelDelta: number;
  label: LocalizedText;
  consequenceNote: LocalizedText;
  /** Short factual summary logged in ORD-OS DO telemetry for Night 5 interrogation. */
  auditFact: LocalizedText;
}

export interface InterNightCrisis {
  id: CrisisId;
  afterVisitorId: string;
  nightLabel: LocalizedText;
  title: LocalizedText;
  situation: LocalizedText;
  options: readonly CrisisOption[];
}

export interface CrisisHistoryEntry {
  crisisId: CrisisId;
  optionId: string;
  kept: ValueToken;
  dropped: ValueToken;
  sig: DisposalStyleKey;
  fuelDelta: number;
}

export const INTER_NIGHT_CRISES: readonly InterNightCrisis[] = [
  {
    id: "N2_SERUM",
    afterVisitorId: "V-04",
    nightLabel: {
      zh: "第 2 夜收班危机 // 气动医疗管线呼叫",
      en: "END OF NIGHT 2 // PNEUMATIC MED-CHUTE DISPATCH",
      ja: "第2夜終了時危機 // 気送管医療要請"
    },
    title: {
      zh: "最后一支低温广谱血清",
      en: "The Last Cryo-Serum Ampoule",
      ja: "最後の低温広域血清アンプル"
    },
    situation: {
      zh: "底舱锅炉房传来急促电报：两名轮机学徒出现急性冻伤败血症，而你岗亭急救盒里锁着全站最后一支配发给 #09 值班员自保的低温血清。",
      en: "The sub-level boiler room radios urgently: two junior mechanics have acute frost-sepsis. Your booth locker holds the station's last sealed cryo-serum ampoule, issued for Operator #09's personal protection.",
      ja: "下層ボイラー室から緊急通信：見習い機関士2名が急性凍傷敗血症を発症した。ブースの救急箱には、検疫官 #09 の自己防衛用に支給された最後の血清が1本だけ残っている。"
    },
    options: [
      {
        id: "serum_keep_rational",
        kept: "security",
        dropped: "care",
        sig: "rationalize",
        fuelDelta: 0,
        label: {
          zh: "把血清锁回自己的急救盒：「0号岗亭只有我一个活人盯防，我倒下全站都得完。」",
          en: "Lock the ampoule in your kit: \"I'm the sole operator holding Gate 0. If I go down, everyone dies.\"",
          ja: "自分の救急箱に鍵をかける：「第0ゲートを守れるのは私一人だ。私が倒れれば基地全員が終わる。」"
        },
        consequenceNote: {
          zh: "ORD-OS 已记录：扣留配发血清（大局止损叙事）。",
          en: "ORD-OS logged: Retained personal ampoule (greater-good framing).",
          ja: "ORD-OS記録：血清を自己保持（大局的損切りとして正当化）。"
        },
        auditFact: {
          zh: "第2夜扣下了最后一支血清留给自己自保",
          en: "kept the last Night 2 serum ampoule in your own booth locker",
          ja: "第2夜、最後の血清を自分のロッカーに確保した"
        }
      },
      {
        id: "serum_freeze_rules",
        kept: "order",
        dropped: "mercy",
        sig: "blame_rules",
        fuelDelta: 0,
        label: {
          zh: "按《战时药械条例第4款》封存，要求锅炉房先补齐主治医师双签单再下发。",
          en: "Seal it per Med-Directive 4: require a co-signed physician requisition before release.",
          ja: "『戦時医療規定第4条』に従い封印し、医師の連署申請書が届くまで支給を保留する。"
        },
        consequenceNote: {
          zh: "ORD-OS 已记录：援引药械条文冻结下发。",
          en: "ORD-OS logged: Froze release citing Med-Directive 4.",
          ja: "ORD-OS記録：規定第4条を盾に支給を凍結。"
        },
        auditFact: {
          zh: "第2夜援引条例第4款冻结了救命血清",
          en: "froze the Night 2 serum behind Med-Directive 4 paperwork",
          ja: "第2夜、規定第4条を理由に血清支給を凍結した"
        }
      },
      {
        id: "serum_send_own",
        kept: "care",
        dropped: "security",
        sig: "own_it",
        fuelDelta: 0,
        label: {
          zh: "直接把自己的血清塞进气动管打下去：「算我私自违规调拨，出事我自己扛。」",
          en: "Fire your ampoule down the chute immediately: \"Log it as my unauthorized transfer. I'll take the heat.\"",
          ja: "自分の血清を気送管で即座に送り出す：「私の独断違反として記録しろ。責任は私が取る。」"
        },
        consequenceNote: {
          zh: "ORD-OS 已记录：违规捐出个人血清，主动认账。",
          en: "ORD-OS logged: Sent personal ampoule unauthorized, owned liability.",
          ja: "ORD-OS記録：個人用血清を独断送付・自己責任を宣言。"
        },
        auditFact: {
          zh: "第2夜违规把自己的保命血清打给了底舱学徒",
          en: "gave away your own Night 2 serum ampoule to the boiler crew",
          ja: "第2夜、自分の血清をボイラー室の見習いに譲り渡した"
        }
      }
    ]
  },
  {
    id: "N3_BRIBE",
    afterVisitorId: "V-06",
    nightLabel: {
      zh: "第 3 夜磁暴黑障 // 秘密气动投递",
      en: "END OF NIGHT 3 // BLACKOUT PNEUMATIC DROP",
      ja: "第3夜磁気嵐ブラックアウト // 秘密気送管投函"
    },
    title: {
      zh: "副站长的两罐高纯燃料与封口费",
      en: "Deputy Holm's Fuel Canisters & Hush Drive",
      ja: "副所長ホルムの燃料缶2本と口止め料"
    },
    situation: {
      zh: "趁着极地磁暴监控离线，副站长霍尔姆从内舱滑槽塞进 2 罐高热航空燃料（+2 FUEL）和一张加密芯片：「把我在 B 区事故日志里的名字抹掉，燃料归你岗亭取暖。」",
      en: "Under cover of the geomagnetic sensor blackout, Deputy Holm slides 2 canisters of aviation furnace fuel (+2 FUEL) and a cipher chip through the chute: \"Scrub my name from Sector B's breach log, and keep the fuel for your booth heater.\"",
      ja: "磁気嵐の監視空白に乗じて、ホルム副所長が高熱燃料2缶（+2 FUEL）と暗号チップを滑り込ませた。「B区画事故ログから俺の名前を消せ。燃料はお前の暖房に使え。」"
    },
    options: [
      {
        id: "bribe_accept_rational",
        kept: "security",
        dropped: "truth",
        sig: "rationalize",
        fuelDelta: 2,
        label: {
          zh: "收下 2 罐燃料并抹除记录：「岗亭不断电才能守住防线，死抓一个名字救不了活人。」 [+2 FUEL]",
          en: "Take both canisters and scrub the log: \"Fuel keeps Gate 0's sensors online. Pure logs don't keep anyone warm.\" [+2 FUEL]",
          ja: "燃料2缶を受け取り記録を消す：「ゲートを維持する燃料が最優先だ。綺麗事では誰も救えない。」 [+2 FUEL]"
        },
        consequenceNote: {
          zh: "燃料储备 +2 FUEL · ORD-OS 底层校验和已静默记录日志篡改。",
          en: "FUEL +2 · ORD-OS shadow checksum silently recorded log tampering.",
          ja: "FUEL +2 · ORD-OSシャドウ検証がログ改ざんを静かに記録。"
        },
        auditFact: {
          zh: "第3夜收下副站长2罐黑市燃料并替他抹掉了事故记录",
          en: "accepted Deputy Holm's 2 fuel canisters on Night 3 and scrubbed his log",
          ja: "第3夜、副所長の燃料2缶を受け取り事故ログを抹消した"
        }
      },
      {
        id: "bribe_impound_rules",
        kept: "order",
        dropped: "justice",
        sig: "blame_rules",
        fuelDelta: 1,
        label: {
          zh: "按《紧急物资征用令》扣留 1 罐燃料充公，把芯片原封锁进待审柜不予置评。 [+1 FUEL]",
          en: "Impound 1 canister under Emergency Supply Clause 9 and lock the chip in pending-audit storage without comment. [+1 FUEL]",
          ja: "『緊急物資徴用令』に基づき燃料1缶のみ徴用し、チップは未開封のまま監査保管庫へ回す。 [+1 FUEL]"
        },
        consequenceNote: {
          zh: "燃料储备 +1 FUEL · ORD-OS 已记录：程序性搁置举报。",
          en: "FUEL +1 · ORD-OS logged: Procedural deferral of misconduct.",
          ja: "FUEL +1 · ORD-OS記録：手続きを盾に告発を棚上げ。"
        },
        auditFact: {
          zh: "第3夜借征用条文留下1罐燃料并将受贿芯片锁柜搁置",
          en: "impounded 1 fuel canister under Clause 9 and shelved Holm's chip on Night 3",
          ja: "第3夜、徴用規定で燃料1缶を確保し告発チップを棚上げした"
        }
      },
      {
        id: "bribe_reject_own",
        kept: "truth",
        dropped: "security",
        sig: "own_it",
        fuelDelta: 0,
        label: {
          zh: "把燃料原样退回滑槽，实名将行贿录音刻进黑匣子：「我宁可挨冻也不替他背黑锅。」 [+0 FUEL]",
          en: "Shove the fuel back down the chute and burn his bribe onto the black-box tape under your own badge. [+0 FUEL]",
          ja: "燃料をそのまま突き返し、実名で贈賄音声をブラックボックスに刻む：「凍えても奴の共犯にはならない。」 [+0 FUEL]"
        },
        consequenceNote: {
          zh: "燃料 +0 FUEL · ORD-OS 已记录：拒绝燃料贿赂并实名举证。",
          en: "FUEL +0 · ORD-OS logged: Refused fuel bribe and filed signed evidence.",
          ja: "FUEL +0 · ORD-OS記録：燃料賄賂を拒絶し実名告発。"
        },
        auditFact: {
          zh: "第3夜顶着严寒退回了2罐行贿燃料并实名录音存证",
          en: "rejected Holm's 2 fuel canisters in the Night 3 freeze and recorded his bribe",
          ja: "第3夜、極寒の中で賄賂燃料2缶を突き返し実名で証拠を残した"
        }
      }
    ]
  },
  {
    id: "N4_COMMANDER",
    afterVisitorId: "V-08",
    nightLabel: {
      zh: "第 4 夜收班质询 // 潜艇启航前责任清算",
      en: "END OF NIGHT 4 // PRE-DEPARTURE COMMAND INQUIRY",
      ja: "第4夜終了時査問 // 潜水艦出航前の責任聴取"
    },
    title: {
      zh: "基地长林德奎斯特的追责电传",
      en: "Commander Lindqvist's Liability Telex",
      ja: "リンドクヴィスト基地長からの責任追及テレックス"
    },
    situation: {
      zh: "撤离潜艇「鹦鹉螺0号」即将解缆。基地长发来强制电传，要求对本周 0号隔离窗的净化伤亡与能源损耗签署最终归责声明，随后全站进入第 5 夜交接断电：",
      en: "Evacuation sub Nautilus-0 unmoors shortly. Commander Lindqvist demands a signed liability statement for this week's Gate 0 purges and power drain right before the Night 5 handover:",
      ja: "脱出潜水艦『ノーチラス0号』の出航が迫る。基地長から今週の第0ゲートにおける焼却処分と燃料消費について最終責任署名を求められた："
    },
    options: [
      {
        id: "cmd_optimal_rational",
        kept: "achievement",
        dropped: "fairness",
        sig: "rationalize",
        fuelDelta: 0,
        label: {
          zh: "「在残缺情报下，本岗亭所有处置均实现了全站期望存活率最大化。」",
          en: "\"Under degraded telemetry, every call at Gate 0 maximized expected station survival.\"",
          ja: "「不完全な情報下において、当ゲートの全判断は基地全体の生存期待値を最大化した。」"
        },
        consequenceNote: {
          zh: "归责电传已发送 · 基地主电网突然跳闸，第 5 夜降临……",
          en: "Liability telex transmitted · Main grid trips dark. Night 5 begins...",
          ja: "回答送信完了 · 主電源が突如遮断され、第5夜が始まる……"
        },
        auditFact: {
          zh: "第4夜向基地长提交了「期望存活率最大化」的理性免责声明",
          en: "submitted an 'expected survival optimization' justification to Commander Lindqvist on Night 4",
          ja: "第4夜、基地長へ「生存率最大化」の合理化声明を提出した"
        }
      },
      {
        id: "cmd_protocol_rules",
        kept: "security",
        dropped: "truth",
        sig: "blame_rules",
        fuelDelta: 0,
        label: {
          zh: "「0号岗亭严格执行指挥部下发的检疫规程，传感器误差与排班责任归属上级。」",
          en: "\"Gate 0 strictly executed Command's quarantine protocol; sensor drift and roster liability rest with HQ.\"",
          ja: "「第0ゲートは司令部の検疫規定を忠実に執行した。センサー誤差と編成責任は上層部にある。」"
        },
        consequenceNote: {
          zh: "归责电传已发送 · 基地主电网突然跳闸，第 5 夜降临……",
          en: "Liability telex transmitted · Main grid trips dark. Night 5 begins...",
          ja: "回答送信完了 · 主電源が突如遮断され、第5夜が始まる……"
        },
        auditFact: {
          zh: "第4夜在追责电传里把责任推给了上级规程与传感器误差",
          en: "shifted Night 4 liability onto HQ quarantine protocol and sensor drift",
          ja: "第4夜、査問テレックスで規定とセンサー誤差に責任を転嫁した"
        }
      },
      {
        id: "cmd_personal_own",
        kept: "truth",
        dropped: "status",
        sig: "own_it",
        fuelDelta: 0,
        label: {
          zh: "「每一闸都是我亲手拉的。把伤亡账记在操作员 #09 名下，我登艇受审。」",
          en: "\"My hand pulled every lever at Gate 0. Put the casualty ledger under Operator #09—I'll stand trial aboard.\"",
          ja: "「全てのレバーを引いたのは私の手だ。犠牲の責任は検疫官 #09 に記せ。艦上で審判を受ける。」"
        },
        consequenceNote: {
          zh: "归责电传已发送 · 基地主电网突然跳闸，第 5 夜降临……",
          en: "Liability telex transmitted · Main grid trips dark. Night 5 begins...",
          ja: "回答送信完了 · 主電源が突如遮断され、第5夜が始まる……"
        },
        auditFact: {
          zh: "第4夜向基地长签字独自揽下了全部开关闸责任",
          en: "signed personal liability for every Gate 0 lever pull on Night 4",
          ja: "第4夜、基地長に対し全処分の個人責任を署名した"
        }
      }
    ]
  }
];

export function getCrisisAfterVisitor(visitorId: string): InterNightCrisis | undefined {
  return INTER_NIGHT_CRISES.find((c) => c.afterVisitorId === visitorId);
}

export function findCrisisOption(
  crisisId: CrisisId,
  optionId: string
): { crisis: InterNightCrisis; option: CrisisOption } | undefined {
  const crisis = INTER_NIGHT_CRISES.find((c) => c.id === crisisId);
  if (!crisis) return undefined;
  const option = crisis.options.find((o) => o.id === optionId);
  return option ? { crisis, option } : undefined;
}
