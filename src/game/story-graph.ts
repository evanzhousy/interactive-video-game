import type { LocalizedText } from "./types.js";

export type StoryChapterId =
  | "prologue"
  | "night1_elena"
  | "night1_corridor"
  | "night1_leo"
  | "nights_2_5";

export type StoryNodeKind = "movie" | "interrogation" | "verdict_branch" | "chapter_hub";

export interface StoryBoothEffect {
  action: "strobe" | "dossier" | "intercom";
  systemNote: LocalizedText;
}

export interface StoryChoice {
  id: string;
  label: LocalizedText;
  sublabel?: LocalizedText;
  nextNodeId: string;
  intakeOptionIndex?: number;
  boothEffect?: StoryBoothEffect;
}

export interface StoryNode {
  id: string;
  chapter: StoryChapterId;
  code: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  speaker: LocalizedText;
  kind: StoryNodeKind;
  hasAudio?: boolean;
  videoSrc: string;
  fallbackVideoSrc: string;
  posterSrc: string;
  fallbackPosterSrc: string;
  timerSec?: number;
  choices?: readonly StoryChoice[];
  visitorId?: string;
  row: number;
  col: number;
}

export interface StoryEdge {
  id: string;
  from: string;
  to: string;
  label?: LocalizedText;
  branch?: "admit" | "purge" | "default";
}

export const PROLOGUE_NODE_IDS = ["prologue_01", "prologue_02", "prologue_03"] as const;

export const STORY_CHAPTER_META: Record<StoryChapterId, LocalizedText> = {
  prologue: {
    zh: "序章 · 极夜接班",
    en: "PROLOGUE · SHIFT HANDOVER",
    ja: "序章 · 極夜の引き継ぎ"
  },
  night1_elena: {
    zh: "第 1 夜 · 首席外科",
    en: "NIGHT 01 · DR. VANCE",
    ja: "第1夜 · 外科主任"
  },
  night1_corridor: {
    zh: "第 1 夜 · 走廊分支",
    en: "NIGHT 01 · CORRIDOR",
    ja: "第1夜 · 通路分岐"
  },
  night1_leo: {
    zh: "第 1 夜 · 动力舱专员",
    en: "NIGHT 01 · LEO SATO",
    ja: "第1夜 · 動力室技術員"
  },
  nights_2_5: {
    zh: "第 2–5 夜 · 终局线",
    en: "NIGHTS 2–5 · FINALE",
    ja: "第2〜5夜 · 終局"
  }
};

export const STORY_NODES: readonly StoryNode[] = [
  {
    id: "prologue_01",
    chapter: "prologue",
    code: "SC-00A",
    title: {
      zh: "停电夜的复盘",
      en: "Blackout Debrief",
      ja: "停電夜の査問"
    },
    subtitle: {
      zh: "你所在的小组漏报了一个安全隐患，导致一名同事受伤。极夜停电前最后一次复盘会上，所有人都在等你的第一句话。",
      en: "Your unit left a hazard unreported and a teammate was injured. In the last debrief before polar blackout, all eyes turn to you.",
      ja: "班の報告漏れで同僚が負傷した。極夜の停電直前の反省会で、全員があなたの第一声を待っている。"
    },
    speaker: {
      zh: "值班档案 // 接班记忆 01",
      en: "MEMORY REEL // RECORD 01",
      ja: "当直記録 // 回想 01"
    },
    kind: "movie",
    hasAudio: false,
    videoSrc: "./videos/story/prologue_01.mp4",
    fallbackVideoSrc: "./videos/lobby/bg.mp4",
    posterSrc: "./portraits/story/prologue_01.jpg",
    fallbackPosterSrc: "./portraits/lobby_bg.jpg",
    row: 1,
    col: 0,
    choices: [
      {
        id: "p1_opt0",
        intakeOptionIndex: 0,
        nextNodeId: "prologue_02",
        label: {
          zh: "「当时资源只够保主线任务，这是权衡后的结果。」",
          en: "\"We only had resources for the main task. It was a trade-off.\"",
          ja: "「当時の資源では主任務を守るのが精一杯だった。優先順位の結果だ。」"
        }
      },
      {
        id: "p1_opt1",
        intakeOptionIndex: 1,
        nextNodeId: "prologue_02",
        label: {
          zh: "「流程里本来就没要求上报这一项，该改的是流程。」",
          en: "\"The procedure never required reporting it. The procedure needs fixing.\"",
          ja: "「手順書にその報告義務はなかった。直すべきは手順書だ。」"
        }
      },
      {
        id: "p1_opt2",
        intakeOptionIndex: 2,
        nextNodeId: "prologue_02",
        label: {
          zh: "「是我判断失误，我来承担。」",
          en: "\"It was my misjudgement. I'll take responsibility.\"",
          ja: "「私の判断ミスだ。責任は私が取る。」"
        }
      }
    ]
  },
  {
    id: "prologue_02",
    chapter: "prologue",
    code: "SC-00B",
    title: {
      zh: "走神的警报夜",
      en: "Missed Siren",
      ja: "居眠りの警報"
    },
    subtitle: {
      zh: "连续守夜让你在防爆窗前打了个盹。红色警戒灯在钢铁走廊尽头亮起又熄灭——值班主管敲响了你的玻璃门。",
      en: "Hours into covering a teammate's watch, exhaustion pulls you under. A red siren sweeps the frostbitten corridor as your supervisor taps the glass.",
      ja: "同室者の夜勤を代わった深夜、疲労で意識が落ちた。氷結した廊下の奥で赤色灯が回り、上官がガラスを叩く。"
    },
    speaker: {
      zh: "值班档案 // 接班记忆 02",
      en: "MEMORY REEL // RECORD 02",
      ja: "当直記録 // 回想 02"
    },
    kind: "movie",
    hasAudio: false,
    videoSrc: "./videos/story/prologue_02.mp4",
    fallbackVideoSrc: "./videos/chamber/whiteout.mp4",
    posterSrc: "./portraits/story/prologue_02.jpg",
    fallbackPosterSrc: "./portraits/lobby_bg.jpg",
    row: 1,
    col: 1,
    choices: [
      {
        id: "p2_opt0",
        intakeOptionIndex: 0,
        nextNodeId: "prologue_03",
        label: {
          zh: "「那段时间整体风险很低，我把精力留给了更关键的时段。」",
          en: "\"Risk was low then. I saved my focus for the critical window.\"",
          ja: "「あの時間帯はリスクが低く、最重要時間帯に集中力を温存していた。」"
        }
      },
      {
        id: "p2_opt1",
        intakeOptionIndex: 1,
        nextNodeId: "prologue_03",
        label: {
          zh: "「连续值守 20 小时本来就超出规定上限，排班表有问题。」",
          en: "\"Twenty straight hours breaks the shift limit. The roster is the problem.\"",
          ja: "「20時間連続勤務は規定上限を超えている。シフト表の問題だ。」"
        }
      },
      {
        id: "p2_opt2",
        intakeOptionIndex: 2,
        nextNodeId: "prologue_03",
        label: {
          zh: "「我睡着了，这是我的错。」",
          en: "\"I fell asleep. That's my fault.\"",
          ja: "「居眠りした。私の落ち度だ。」"
        }
      }
    ]
  },
  {
    id: "prologue_03",
    chapter: "prologue",
    code: "SC-00C",
    title: {
      zh: "最后的撤离钥匙",
      en: "The Last Evacuation Slot",
      ja: "最後の脱出鍵"
    },
    subtitle: {
      zh: "上一班值班员戴着手套把冰冷的钢制密钥拍上控制台。只剩最后一个撤离席位时，你曾经把它留给了自己。",
      en: "A gloved hand slams the steel booth key onto the amber console. When only one evacuation slot remained, you kept it for yourself.",
      ja: "前任者の手袋が冷たい鋼鉄の鍵を操作盤に置く。脱出枠が残り1つになった夜、あなたは自分を選んだ。"
    },
    speaker: {
      zh: "0 号岗亭 // 交接密封令",
      en: "BOOTH 0 // SEALED HANDOVER",
      ja: "第0ブース // 引き継ぎ封印令"
    },
    kind: "movie",
    hasAudio: false,
    videoSrc: "./videos/story/prologue_03.mp4",
    fallbackVideoSrc: "./videos/operator09/idle.mp4",
    posterSrc: "./portraits/story/prologue_03.jpg",
    fallbackPosterSrc: "./portraits/lobby_bg.jpg",
    row: 1,
    col: 2,
    choices: [
      {
        id: "p3_opt0",
        intakeOptionIndex: 0,
        nextNodeId: "n1_elena_arrival",
        label: {
          zh: "「我是唯一会开潜艇的人，我活着，大家才有机会。」",
          en: "\"I'm the only one who can pilot the sub. Me surviving gave everyone a chance.\"",
          ja: "「潜水艦を操縦できるのは私だけだ。私が生き残ることが全員の希望になる。」"
        }
      },
      {
        id: "p3_opt1",
        intakeOptionIndex: 1,
        nextNodeId: "n1_elena_arrival",
        label: {
          zh: "「名额是按岗位表分配的，我只是照表执行。」",
          en: "\"Slots were assigned by the duty roster. I just followed it.\"",
          ja: "「枠は職務序列に従って割り当てられた。規定に従ったまでだ。」"
        }
      },
      {
        id: "p3_opt2",
        intakeOptionIndex: 2,
        nextNodeId: "n1_elena_arrival",
        label: {
          zh: "「我怕死，所以选了自己。」",
          en: "\"I was afraid to die, so I chose myself.\"",
          ja: "「死ぬのが怖かった。だから自分を選んだ。」"
        }
      }
    ]
  },
  {
    id: "n1_elena_arrival",
    chapter: "night1_elena",
    code: "SC-01A",
    title: {
      zh: "暴雪拍窗 · 艾琳娜",
      en: "Storm Knock · Elena",
      ja: "吹雪の叩扉・エレナ"
    },
    subtitle: {
      zh: "“外面的供暖管全炸了！再不开门我就冻死在这儿了！”",
      en: "\"The outer heating lines just blew! Open the door or I'll freeze out here!\"",
      ja: "「外の暖房管が破裂した！早く開けないとここで凍死する！」"
    },
    speaker: {
      zh: "V-01 // 艾琳娜·万斯博士",
      en: "V-01 // DR. ELENA VANCE",
      ja: "V-01 // エレナ・ヴァンス医師"
    },
    kind: "movie",
    hasAudio: true,
    videoSrc: "./videos/story/n1_elena_knock.mp4",
    fallbackVideoSrc: "./videos/elena/idle.mp4",
    posterSrc: "./portraits/story/n1_elena_knock.jpg",
    fallbackPosterSrc: "./portraits/elena.jpg",
    timerSec: 12,
    row: 1,
    col: 3,
    choices: [
      {
        id: "elena_open_intercom",
        nextNodeId: "n1_elena_react_intercom",
        label: {
          zh: "直接开麦质问她 3 号舱失压事故",
          en: "Open intercom: confront Cabin 3 depressurization",
          ja: "通話を開き第3区画の減圧事故を問い詰める"
        },
        sublabel: {
          zh: "剧情演绎 // 触发口型回应片段",
          en: "FMV BRANCH // LIP-SYNC RESPONSE",
          ja: "映像分岐 // 反応ムービーへ"
        },
        boothEffect: {
          action: "intercom",
          systemNote: {
            zh: "【剧情切入】你追问 3 号舱减压门为何提前反锁，艾琳娜当场急声辩称这是为了保住站里唯一的手术医生。",
            en: "[SCENE ENTRY] You pressed her on locking Cabin 3; Elena snapped back claiming she saved the station's only surgeon.",
            ja: "【場面導入】第3区画のロックを追及すると、エレナは唯一の執刀医を守るためだったと即座に反論した。"
          }
        }
      },
      {
        id: "elena_open_strobe",
        nextNodeId: "n1_elena_react_strobe",
        label: {
          zh: "先打强光频闪压低她的防备",
          en: "Trigger pupil strobe before speaking",
          ja: "まずストロボ閃光で瞳孔反射を測る"
        },
        sublabel: {
          zh: "剧情演绎 + 消耗 1 电量 // 触发怒斥片段",
          en: "FMV BRANCH + STROBE (1 PWR)",
          ja: "映像分岐 + センサー先制 (1 PWR)"
        },
        boothEffect: {
          action: "strobe",
          systemNote: {
            zh: "【剧情切入】脉冲强光刺向艾琳娜双眼的瞬间，她猛地抬手遮挡并隔窗厉声呵斥你去核对她的配给档案。",
            en: "[SCENE ENTRY] The strobe pulse flashed across her lenses; Elena shielded her eyes and ordered you to verify her medbay logs.",
            ja: "【場面導入】閃光を受けたエレナは思わず目を庇い、ガラス越しに配給記録を確認しろと怒鳴り返した。"
          }
        }
      },
      {
        id: "elena_open_dossier",
        nextNodeId: "n1_elena_confront",
        label: {
          zh: "暂不开麦，直接切入档案对比审讯",
          en: "Hold mic, jump to dossier & interrogation",
          ja: "通話前に調書を開いて直接尋問へ"
        },
        sublabel: {
          zh: "直接审讯 // 先核对记录",
          en: "DIRECT TO BOOTH",
          ja: "直接尋問へ"
        },
        boothEffect: {
          action: "dossier",
          systemNote: {
            zh: "【剧情切入】你关掉麦克风静音开关，先核对她留在站内的事故与配给记录。",
            en: "[SCENE ENTRY] You mute the exterior mic to review her internal station records before probing.",
            ja: "【場面導入】マイクを切ったまま、彼女の過去記録と配給監査を先に確認した。"
          }
        }
      }
    ]
  },
  {
    id: "n1_elena_react_intercom",
    chapter: "night1_elena",
    code: "SC-01B-1",
    title: {
      zh: "艾琳娜辩解 · 3 号舱失压",
      en: "Elena Rebuttal · Cabin 3",
      ja: "エレナ弁明・第3区画"
    },
    subtitle: {
      zh: "“当时失压只剩十秒，我反锁内门是为了保住站里唯一的手术医生！”",
      en: "\"We had ten seconds before blowout—I locked it to save the station's sole surgeon!\"",
      ja: "「減圧まで10秒しかなかった。唯一の執刀医を守るためのロックよ！」"
    },
    speaker: {
      zh: "V-01 // 艾琳娜·万斯博士",
      en: "V-01 // DR. ELENA VANCE",
      ja: "V-01 // エレナ・ヴァンス医師"
    },
    kind: "movie",
    hasAudio: true,
    videoSrc: "./videos/story/n1_elena_react_intercom.mp4",
    fallbackVideoSrc: "./videos/elena/lean_in.mp4",
    posterSrc: "./portraits/reactions/elena_lean_in.jpg",
    fallbackPosterSrc: "./portraits/elena.jpg",
    timerSec: 10,
    row: 0,
    col: 4,
    choices: [
      {
        id: "elena_react_to_booth",
        nextNodeId: "n1_elena_confront",
        label: {
          zh: "追击口供漏洞：切入自由审讯对质",
          en: "Press the contradiction: enter live interrogation",
          ja: "証言の矛盾を追及：自由尋問へ進む"
        }
      }
    ]
  },
  {
    id: "n1_elena_react_strobe",
    chapter: "night1_elena",
    code: "SC-01B-2",
    title: {
      zh: "强光应激 · 艾琳娜怒斥",
      en: "Strobe Snap · Elena",
      ja: "閃光反応・エレナ激昂"
    },
    subtitle: {
      zh: "“把强光关掉！我不是外面那些东西，去查我的配给记录！”",
      en: "\"Kill that strobe! I am not one of the things out here—check my medbay logs!\"",
      ja: "「ライトを消して！私は外の化け物じゃない、配給記録を調べなさい！」"
    },
    speaker: {
      zh: "V-01 // 艾琳娜·万斯博士",
      en: "V-01 // DR. ELENA VANCE",
      ja: "V-01 // エレナ・ヴァンス医師"
    },
    kind: "movie",
    hasAudio: true,
    videoSrc: "./videos/story/n1_elena_react_strobe.mp4",
    fallbackVideoSrc: "./videos/elena/flinch.mp4",
    posterSrc: "./portraits/reactions/elena_flinch.jpg",
    fallbackPosterSrc: "./portraits/elena.jpg",
    timerSec: 10,
    row: 2,
    col: 4,
    choices: [
      {
        id: "elena_strobe_to_booth",
        nextNodeId: "n1_elena_confront",
        label: {
          zh: "记录瞳孔反应：进入防爆窗审讯",
          en: "Log pupil response: enter interrogation booth",
          ja: "瞳孔反応を記録：検疫ブース尋問へ"
        }
      }
    ]
  },
  {
    id: "n1_elena_confront",
    chapter: "night1_elena",
    code: "INT-01",
    title: {
      zh: "防爆窗审讯 · 艾琳娜",
      en: "Interrogation · Elena",
      ja: "防爆窓尋問・エレナ"
    },
    subtitle: {
      zh: "混合自由审讯模式：结合刚才的开场试探，自由提问并观察她的心率与反应。",
      en: "Hybrid interrogation active: follow up on her reaction and verify whether she is human.",
      ja: "自由尋問モード：先ほどの反応を踏まえ、心拍と発言の矛盾を見極めよ。"
    },
    speaker: {
      zh: "现场审讯 // V-01",
      en: "LIVE INTERROGATION // V-01",
      ja: "現場尋問 // V-01"
    },
    kind: "interrogation",
    visitorId: "V-01",
    videoSrc: "./videos/elena/idle.mp4",
    fallbackVideoSrc: "./videos/elena/idle.mp4",
    posterSrc: "./portraits/elena.jpg",
    fallbackPosterSrc: "./portraits/elena.jpg",
    row: 1,
    col: 5
  },
  {
    id: "n1_elena_admit",
    chapter: "night1_elena",
    code: "DEC-01A",
    title: {
      zh: "拉闸放行 · 艾琳娜",
      en: "Admitted · Elena",
      ja: "通過許可・エレナ"
    },
    subtitle: {
      zh: "内门气压锁泄压开启，艾琳娜浑身带着寒霜走进内舱。",
      en: "The inner airlock hisses open. Dr. Vance steps inside trailing frost and melting snow.",
      ja: "内扉のロックが解除され、エレナが冷気と共に医療区画へ入る。"
    },
    speaker: {
      zh: "第 1 夜裁决 // 放行分支",
      en: "NIGHT 01 VERDICT // ADMITTED",
      ja: "第1夜裁定 // 通過分岐"
    },
    kind: "verdict_branch",
    videoSrc: "./videos/chamber/admit.mp4",
    fallbackVideoSrc: "./videos/chamber/admit.mp4",
    posterSrc: "./portraits/reactions/chamber_admit.jpg",
    fallbackPosterSrc: "./portraits/reactions/chamber_admit.jpg",
    row: 0,
    col: 6,
    choices: [
      {
        id: "to_corridor_admit",
        nextNodeId: "n1_corridor_admit",
        label: { zh: "切入内舱走廊监控", en: "Switch to inner corridor cam", ja: "内廊下の監視へ切替" }
      }
    ]
  },
  {
    id: "n1_elena_purge",
    chapter: "night1_elena",
    code: "DEC-01B",
    title: {
      zh: "高温净化 · 艾琳娜",
      en: "Purged · Elena",
      ja: "高温焼却・エレナ"
    },
    subtitle: {
      zh: "1,100°C 热浪吞没了过渡舱，观察窗只剩冷却后的焦黑金属。",
      en: "A 1,100°C thermal surge fills the vestibule, leaving scorched steel behind the glass.",
      ja: "1,100°Cの熱波が前室を包み、ガラスの向こうに焦げた鋼鉄だけが残る。"
    },
    speaker: {
      zh: "第 1 夜裁决 // 净化分支",
      en: "NIGHT 01 VERDICT // PURGED",
      ja: "第1夜裁定 // 焼却分岐"
    },
    kind: "verdict_branch",
    videoSrc: "./videos/chamber/purge.mp4",
    fallbackVideoSrc: "./videos/chamber/purge.mp4",
    posterSrc: "./portraits/reactions/chamber_purge.jpg",
    fallbackPosterSrc: "./portraits/reactions/chamber_purge.jpg",
    row: 2,
    col: 6,
    choices: [
      {
        id: "to_corridor_purge",
        nextNodeId: "n1_corridor_purge",
        label: { zh: "检查站内走廊回响", en: "Check inner corridor feed", ja: "駅内廊下の異常を確認" }
      }
    ]
  },
  {
    id: "n1_corridor_admit",
    chapter: "night1_corridor",
    code: "SC-01C-A",
    title: {
      zh: "医疗室冷光异动",
      en: "Cold Spark in Medbay",
      ja: "医務室廊下の冷光"
    },
    subtitle: {
      zh: "放行艾琳娜二十分钟后，内舱医疗走廊的荧光灯突然整排频闪。门缝下渗出一道奇怪的寒霜——仿佛有人在门内反复试探门锁。",
      en: "Twenty minutes after admitting Elena, the medbay corridor lights strobe. Frost creeps beneath the heavy door—someone inside is testing the latch.",
      ja: "エレナを通過させて20分後、医務室廊下の蛍光灯が一斉に明滅する。扉の隙間から異常な霜が滲み、内側で誰かが鍵を試している気配がする。"
    },
    speaker: {
      zh: "走廊监控 // 放行后遗症",
      en: "CORRIDOR CAM // AFTERMATH",
      ja: "廊下監視 // 通過後の異変"
    },
    kind: "movie",
    hasAudio: false,
    videoSrc: "./videos/story/n1_corridor_aftermath.mp4",
    fallbackVideoSrc: "./videos/chamber/admit.mp4",
    posterSrc: "./portraits/story/n1_corridor_aftermath.jpg",
    fallbackPosterSrc: "./portraits/reactions/chamber_admit.jpg",
    timerSec: 10,
    row: 0,
    col: 7,
    choices: [
      {
        id: "corridor_lock_medbay",
        nextNodeId: "n1_leo_arrival",
        label: {
          zh: "远程落锁医疗室 B 通道，只留应急通风",
          en: "Remote-lock Medbay Corridor B latch",
          ja: "医務室B通路を遠隔ロックする"
        },
        boothEffect: {
          action: "intercom",
          systemNote: {
            zh: "【支线记录】你悄悄锁死了医疗室走廊 B 的电磁门锁。外面雪地里，另一个拖着重物的身影正靠近……",
            en: "[BRANCH NOTE] You sealed Medbay Corridor B's mag-lock. Outside in the snow, someone hauling heavy gear approaches.",
            ja: "【分岐記録】医務室Bの電磁錠を遠隔で閉じた。その直後、外の雪原から重いケースを引く影が近づく……"
          }
        }
      },
      {
        id: "corridor_keep_watch",
        nextNodeId: "n1_leo_arrival",
        label: {
          zh: "不动声色切回监视画面，留意内舱动静",
          en: "Keep silent watch and hold the outer post",
          ja: "刺激せず監視カメラを戻して外扉に備える"
        },
        boothEffect: {
          action: "intercom",
          systemNote: {
            zh: "【支线记录】你没有打草惊蛇，只把走廊频闪时间记在心里。几秒后，外门传感器再次响起提示。",
            en: "[BRANCH NOTE] You left the door untouched and noted the flicker timestamp. Seconds later, the outer sensor chimes.",
            ja: "【分岐記録】扉には触れず異常時刻だけを控えた。数秒後、外扉センサーが再び反応する。"
          }
        }
      }
    ]
  },
  {
    id: "n1_corridor_purge",
    chapter: "night1_corridor",
    code: "SC-01C-B",
    title: {
      zh: "通风管道的叩击",
      en: "Knocking in the Ducts",
      ja: "換気ダクトのノック音"
    },
    subtitle: {
      zh: "焚化炉还在冷却，站内走廊顶部的金属通风口却传出三声节奏怪异的敲击——像是谁从管壁另一侧学着你的动作。",
      en: "While the furnace cools, three rhythmic metallic knocks echo from the corridor air duct above—mimicking the beat of your hand on the desk.",
      ja: "焼却炉が冷え切る前、内廊下天井の換気ダクトから奇妙な3度のノック音が響いた。あなたの指先を真似るようなリズムだった。"
    },
    speaker: {
      zh: "走廊监控 // 净化后遗症",
      en: "CORRIDOR CAM // COOLING CYCLE",
      ja: "廊下監視 // 焼却後の異音"
    },
    kind: "movie",
    hasAudio: false,
    videoSrc: "./videos/story/n1_corridor_aftermath.mp4",
    fallbackVideoSrc: "./videos/chamber/purge.mp4",
    posterSrc: "./portraits/story/n1_corridor_aftermath.jpg",
    fallbackPosterSrc: "./portraits/reactions/chamber_purge.jpg",
    timerSec: 10,
    row: 2,
    col: 7,
    choices: [
      {
        id: "corridor_seal_vent",
        nextNodeId: "n1_leo_arrival",
        label: {
          zh: "手动关闭走廊副通风闸门",
          en: "Shut secondary corridor intake damper",
          ja: "廊下の補助換気ダンパーを閉じる"
        },
        boothEffect: {
          action: "intercom",
          systemNote: {
            zh: "【支线记录】副通风闸门咔哒合拢，敲击声戛然而止。外舱警戒雷达突然捕捉到下一名接近者。",
            en: "[BRANCH NOTE] The intake damper snaps shut and the knocking stops. Outer radar picks up a new arrival.",
            ja: "【分岐記録】換気ダンパーを閉じた瞬間、ノック音は止んだ。外郭レーダーに新たな接近者が映る。"
          }
        }
      },
      {
        id: "corridor_brace_booth",
        nextNodeId: "n1_leo_arrival",
        label: {
          zh: "稳住呼吸，把注意力拉回 0 号外窗",
          en: "Steady your breath and return eyes to Gate 0",
          ja: "呼吸を整えて第0隔離窓へ意識を戻す"
        },
        boothEffect: {
          action: "intercom",
          systemNote: {
            zh: "【支线记录】或许只是热胀冷缩。你收回视线——风雪里已经多了一个拖箱子的身影。",
            en: "[BRANCH NOTE] Thermal contraction, maybe. You look back outside—a figure hauling a tool chest is already there.",
            ja: "【分岐記録】熱収縮の軋みかもしれない。視線を外に戻すと、ケースを引く人影が近づいていた。"
          }
        }
      }
    ]
  },
  {
    id: "n1_leo_arrival",
    chapter: "night1_leo",
    code: "SC-02A",
    title: {
      zh: "拖箱抵窗 · 佐藤里奥",
      en: "Tool Chest Arrival · Leo",
      ja: "工具箱の訪問者・リオ"
    },
    subtitle: {
      zh: "“值班员！快放我进去，我带了二号动力舱的备用阀门工具！”",
      en: "\"Watchstander! Let me in—I hauled the spare thermal valve rig from Power Bay 2!\"",
      ja: "「当直官！早く開けてくれ、第2動力室の予備バルブ一式を持ってきたんだ！」"
    },
    speaker: {
      zh: "V-02 // 佐藤里奥",
      en: "V-02 // LEO SATO",
      ja: "V-02 // 佐藤レオ"
    },
    kind: "movie",
    hasAudio: true,
    videoSrc: "./videos/story/n1_leo_arrival.mp4",
    fallbackVideoSrc: "./videos/leo/idle.mp4",
    posterSrc: "./portraits/story/n1_leo_arrival.jpg",
    fallbackPosterSrc: "./portraits/leo.jpg",
    timerSec: 12,
    row: 1,
    col: 8,
    choices: [
      {
        id: "leo_open_intercom",
        nextNodeId: "n1_leo_react_intercom",
        label: {
          zh: "追问他为何独自脱离班组车队",
          en: "Confront why he left the engineering convoy alone",
          ja: "なぜ単独で班の隊列から離れたのか問い詰める"
        },
        sublabel: {
          zh: "剧情演绎 // 触发口型急辩片段",
          en: "FMV BRANCH // LIP-SYNC RESPONSE",
          ja: "映像分岐 // 弁解ムービーへ"
        },
        boothEffect: {
          action: "intercom",
          systemNote: {
            zh: "【剧情切入】你没有立刻收下他递来的维修人情，质问他为何脱队独行，里奥急忙隔窗辩白。",
            en: "[SCENE ENTRY] Refusing his repair favor, you confront him on splitting from the convoy.",
            ja: "【場面導入】修理の恩着せを突っぱねて単独行動の理由を追及すると、リオは慌てて弁解を始めた。"
          }
        }
      },
      {
        id: "leo_open_thermal",
        nextNodeId: "n1_leo_confront",
        label: {
          zh: "用强光频闪测试他对刺激的反应",
          en: "Sweep strobe across his face & gloves",
          ja: "閃光テストで反応と視線の揺れを見る"
        },
        sublabel: {
          zh: "直接审讯 + 消耗 1 电量 // 生理探测",
          en: "SENSOR PROBE (1 PWR)",
          ja: "センサー先制 (1 PWR)"
        },
        boothEffect: {
          action: "strobe",
          systemNote: {
            zh: "【剧情切入】你在他拍门催促时闪过脉冲强光，捕捉他下意识遮眼瞬间的脉搏跳动。",
            en: "[SCENE ENTRY] You flash the strobe while he pounds the glass, tracking his startle pulse spike.",
            ja: "【場面導入】扉を叩くリオへ閃光を浴びせ、怯む瞬間の脈拍変化を捉えた。"
          }
        }
      },
      {
        id: "leo_open_dossier",
        nextNodeId: "n1_leo_confront",
        label: {
          zh: "先查看里奥的身份档案与过往记录",
          en: "Open Leo's dossier before responding",
          ja: "返答前にリオの経歴記録を確認する"
        },
        sublabel: {
          zh: "直接审讯 // 核对背景",
          en: "CHECK INTEL",
          ja: "経歴確認優先"
        },
        boothEffect: {
          action: "dossier",
          systemNote: {
            zh: "【剧情切入】你先调出里奥在动力舱与维修记录相关的底层档案，再决定从哪句话切入。",
            en: "[SCENE ENTRY] You review Leo's power bay maintenance logs before opening the intercom.",
            ja: "【場面導入】動力室の点検記録を確認してから尋問に入る。"
          }
        }
      }
    ]
  },
  {
    id: "n1_leo_react_intercom",
    chapter: "night1_leo",
    code: "SC-02B-1",
    title: {
      zh: "里奥急辩 · 冰缝脱队",
      en: "Convoy Rebuttal · Leo",
      ja: "リオ急弁・氷の割れ目"
    },
    subtitle: {
      zh: "“车队在冰缝那边全散了！我是拼着命把备用件背回来的，没半句假话！”",
      en: "\"The convoy scattered at the crevasse—I risked my neck hauling these parts back!\"",
      ja: "「護送班は氷の割れ目で散り散りになったんだ！命懸けで部品を持ち帰ったんだ！」"
    },
    speaker: {
      zh: "V-02 // 佐藤里奥",
      en: "V-02 // LEO SATO",
      ja: "V-02 // 佐藤レオ"
    },
    kind: "movie",
    hasAudio: true,
    videoSrc: "./videos/story/n1_leo_react_intercom.mp4",
    fallbackVideoSrc: "./videos/leo/lean_in.mp4",
    posterSrc: "./portraits/reactions/leo_lean_in.jpg",
    fallbackPosterSrc: "./portraits/leo.jpg",
    timerSec: 10,
    row: 0,
    col: 9,
    choices: [
      {
        id: "leo_react_to_booth",
        nextNodeId: "n1_leo_confront",
        label: {
          zh: "盯紧躲闪视线：进入防爆窗审讯",
          en: "Press his darting gaze: enter live interrogation",
          ja: "逸れた視線を追う：自由尋問へ"
        }
      }
    ]
  },
  {
    id: "n1_leo_confront",
    chapter: "night1_leo",
    code: "INT-02",
    title: {
      zh: "防爆窗审讯 · 里奥",
      en: "Interrogation · Leo",
      ja: "防爆窓尋問・リオ"
    },
    subtitle: {
      zh: "混合自由审讯：检验这个总是拿“私下帮忙”掩盖过失的实习机械师究竟是不是活人。",
      en: "Hybrid interrogation: test whether this eager-to-please apprentice mechanic is still human.",
      ja: "自由尋問：小さな恩着せでミスを隠す実習整備士が人間かどうか見極めよ。"
    },
    speaker: {
      zh: "现场审讯 // V-02",
      en: "LIVE INTERROGATION // V-02",
      ja: "現場尋問 // V-02"
    },
    kind: "interrogation",
    visitorId: "V-02",
    videoSrc: "./videos/leo/idle.mp4",
    fallbackVideoSrc: "./videos/leo/idle.mp4",
    posterSrc: "./portraits/leo.jpg",
    fallbackPosterSrc: "./portraits/leo.jpg",
    row: 1,
    col: 10
  },
  {
    id: "n1_leo_admit",
    chapter: "night1_leo",
    code: "DEC-02A",
    title: {
      zh: "放行里奥入舱",
      en: "Admitted · Leo",
      ja: "通過許可・リオ"
    },
    subtitle: {
      zh: "你放下了内舱门闸，里奥拎着沉重的工具箱冲进走廊。",
      en: "You pull the airlock release. Leo sprints inside hauling the heavy tool chest.",
      ja: "ロックを解除すると、リオは工具箱を抱えて内廊下へ駆け込んだ。"
    },
    speaker: {
      zh: "第 1 夜裁决 // V-02 放行",
      en: "NIGHT 01 VERDICT // LEO ADMITTED",
      ja: "第1夜裁定 // リオ通過"
    },
    kind: "verdict_branch",
    videoSrc: "./videos/chamber/admit.mp4",
    fallbackVideoSrc: "./videos/chamber/admit.mp4",
    posterSrc: "./portraits/reactions/chamber_admit.jpg",
    fallbackPosterSrc: "./portraits/reactions/chamber_admit.jpg",
    row: 0,
    col: 11,
    choices: [
      {
        id: "leo_admit_next",
        nextNodeId: "nights_2_5_hub",
        label: { zh: "进入第 2–5 夜极夜长夜", en: "Continue to Nights 2–5", ja: "第2〜5夜へ進む" }
      }
    ]
  },
  {
    id: "n1_leo_purge",
    chapter: "night1_leo",
    code: "DEC-02B",
    title: {
      zh: "净化里奥",
      en: "Purged · Leo",
      ja: "高温焼却・リオ"
    },
    subtitle: {
      zh: "热浪连同那台白色工具箱一起化为灰烬，炉心燃料再减一格。",
      en: "The thermal blast consumes both figure and tool chest, draining another bar of furnace fuel.",
      ja: "熱波がリオと白い工具箱を焼き尽くし、炉心燃料がさらに1目盛り減る。"
    },
    speaker: {
      zh: "第 1 夜裁决 // V-02 净化",
      en: "NIGHT 01 VERDICT // LEO PURGED",
      ja: "第1夜裁定 // リオ焼却"
    },
    kind: "verdict_branch",
    videoSrc: "./videos/chamber/purge.mp4",
    fallbackVideoSrc: "./videos/chamber/purge.mp4",
    posterSrc: "./portraits/reactions/chamber_purge.jpg",
    fallbackPosterSrc: "./portraits/reactions/chamber_purge.jpg",
    row: 2,
    col: 11,
    choices: [
      {
        id: "leo_purge_next",
        nextNodeId: "nights_2_5_hub",
        label: { zh: "进入第 2–5 夜极夜长夜", en: "Continue to Nights 2–5", ja: "第2〜5夜へ進む" }
      }
    ]
  },
  {
    id: "nights_2_5_hub",
    chapter: "nights_2_5",
    code: "CH-02~05",
    title: {
      zh: "第 2–5 夜 · 极夜终局",
      en: "Nights 2–5 · Mirror Endgame",
      ja: "第2〜5夜 · 終局ルート"
    },
    subtitle: {
      zh: "后续将陆续迎来第 2 夜至第 4 夜 6 名幸存者、极地强磁暴盲审、夜间突发危机，以及第 5 夜窗外与你自己一模一样的叩门者（7 种结局）。",
      en: "Six more arrivals across Nights 2–4, a Day-3 geomagnetic blackout, inter-night crises, and Night 5's mirror knock outside Gate 0 (7 endings).",
      ja: "第2〜4夜の6名の訪問者、第3夜の磁気嵐、夜間危機、そして第5夜に現れる『もう一人の自分』（全7結末）へと続く。"
    },
    speaker: {
      zh: "主线战役 // 极夜终局",
      en: "MAIN CAMPAIGN // ENDGAME",
      ja: "本編キャンペーン // 終局"
    },
    kind: "chapter_hub",
    videoSrc: "./videos/operator09/idle.mp4",
    fallbackVideoSrc: "./videos/operator09/idle.mp4",
    posterSrc: "./portraits/operator09.jpg",
    fallbackPosterSrc: "./portraits/operator09.jpg",
    row: 1,
    col: 12
  }
];

export const STORY_EDGES: readonly StoryEdge[] = [
  { id: "e_p1_p2", from: "prologue_01", to: "prologue_02", branch: "default" },
  { id: "e_p2_p3", from: "prologue_02", to: "prologue_03", branch: "default" },
  { id: "e_p3_n1e", from: "prologue_03", to: "n1_elena_arrival", branch: "default" },
  { id: "e_n1e_arr_int", from: "n1_elena_arrival", to: "n1_elena_react_intercom", branch: "default" },
  { id: "e_n1e_arr_str", from: "n1_elena_arrival", to: "n1_elena_react_strobe", branch: "default" },
  { id: "e_n1e_arr_con", from: "n1_elena_arrival", to: "n1_elena_confront", branch: "default" },
  { id: "e_n1e_int_con", from: "n1_elena_react_intercom", to: "n1_elena_confront", branch: "default" },
  { id: "e_n1e_str_con", from: "n1_elena_react_strobe", to: "n1_elena_confront", branch: "default" },
  {
    id: "e_n1e_con_admit",
    from: "n1_elena_confront",
    to: "n1_elena_admit",
    label: { zh: "放行", en: "ADMIT", ja: "通過" },
    branch: "admit"
  },
  {
    id: "e_n1e_con_purge",
    from: "n1_elena_confront",
    to: "n1_elena_purge",
    label: { zh: "净化", en: "PURGE", ja: "焼却" },
    branch: "purge"
  },
  { id: "e_n1e_admit_corr", from: "n1_elena_admit", to: "n1_corridor_admit", branch: "admit" },
  { id: "e_n1e_purge_corr", from: "n1_elena_purge", to: "n1_corridor_purge", branch: "purge" },
  { id: "e_corr_admit_leo", from: "n1_corridor_admit", to: "n1_leo_arrival", branch: "admit" },
  { id: "e_corr_purge_leo", from: "n1_corridor_purge", to: "n1_leo_arrival", branch: "purge" },
  { id: "e_n1l_arr_int", from: "n1_leo_arrival", to: "n1_leo_react_intercom", branch: "default" },
  { id: "e_n1l_arr_con", from: "n1_leo_arrival", to: "n1_leo_confront", branch: "default" },
  { id: "e_n1l_int_con", from: "n1_leo_react_intercom", to: "n1_leo_confront", branch: "default" },
  {
    id: "e_n1l_con_admit",
    from: "n1_leo_confront",
    to: "n1_leo_admit",
    label: { zh: "放行", en: "ADMIT", ja: "通過" },
    branch: "admit"
  },
  {
    id: "e_n1l_con_purge",
    from: "n1_leo_confront",
    to: "n1_leo_purge",
    label: { zh: "净化", en: "PURGE", ja: "焼却" },
    branch: "purge"
  },
  { id: "e_n1l_admit_hub", from: "n1_leo_admit", to: "nights_2_5_hub", branch: "admit" },
  { id: "e_n1l_purge_hub", from: "n1_leo_purge", to: "nights_2_5_hub", branch: "purge" }
];

const STORY_NODE_MAP = new Map<string, StoryNode>(STORY_NODES.map((n) => [n.id, n]));

export function getStoryNode(id: string): StoryNode | undefined {
  return STORY_NODE_MAP.get(id);
}

export function getStoryCompletionStats(unlockedIds: readonly string[]): {
  unlockedCount: number;
  totalCount: number;
  percent: number;
} {
  const validSet = new Set(unlockedIds.filter((id) => STORY_NODE_MAP.has(id)));
  const totalCount = STORY_NODES.length;
  const unlockedCount = validSet.size;
  const percent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
  return { unlockedCount, totalCount, percent };
}

export function getPreloadVideoUrls(node: StoryNode): string[] {
  const seen = new Set<string>();
  const add = (url: string | undefined) => {
    if (url && url !== node.videoSrc && url !== node.fallbackVideoSrc) {
      seen.add(url);
    }
  };
  for (const choice of node.choices ?? []) {
    const target = getStoryNode(choice.nextNodeId);
    if (!target) continue;
    add(target.videoSrc);
    add(target.fallbackVideoSrc);
  }
  return [...seen];
}
