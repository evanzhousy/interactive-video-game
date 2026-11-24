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

export interface StoryClipSegment {
  id: string;
  videoSrc: string;
  fallbackVideoSrc: string;
  posterSrc: string;
  fallbackPosterSrc: string;
  hasAudio?: boolean;
  speaker: LocalizedText;
  subtitle: LocalizedText;
  badge?: LocalizedText;
}

export interface StoryChoice {
  id: string;
  label: LocalizedText;
  sublabel?: LocalizedText;
  nextNodeId: string;
  intakeOptionIndex?: number;
  directVerdict?: "ADMIT" | "PURGE";
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
  clips?: readonly StoryClipSegment[];
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
      zh: "极夜前传 · 冰芯失守",
      en: "Polar Prequel · Ice-Core Breach",
      ja: "極夜前日譚 · 氷床突破"
    },
    subtitle: {
      zh: "地下深冰钻井突然报警，外面的东西开始学人说话。复盘会上，所有人都在等你表态。",
      en: "Deep ice-core alarms blare across the frozen station. Something outside has begun mimicking human voices.",
      ja: "深層氷床の警報が鳴り響く。外の何かが人間の声を真似し始めた。"
    },
    speaker: {
      zh: "前传档案 // 事故回放",
      en: "PREQUEL REEL // BREACH ARCHIVE",
      ja: "前日譚記録 // 事故映像"
    },
    kind: "movie",
    hasAudio: false,
    videoSrc: "./videos/story/prologue_01.mp4",
    fallbackVideoSrc: "./videos/lobby/bg.mp4",
    posterSrc: "./portraits/story/prologue_01.jpg",
    fallbackPosterSrc: "./portraits/lobby_bg.jpg",
    clips: [
      {
        id: "prequel_icecore_breach",
        videoSrc: "./videos/story/prequel_icecore_breach.mp4",
        fallbackVideoSrc: "./videos/story/prologue_01.mp4",
        posterSrc: "./portraits/story/prologue_01.jpg",
        fallbackPosterSrc: "./portraits/lobby_bg.jpg",
        hasAudio: false,
        badge: { zh: "前传监控 01", en: "PREQUEL 01", ja: "前日譚 01" },
        speaker: {
          zh: "斯瓦尔巴深冰钻井台 // 02:14",
          en: "SVALBARD ICE-CORE RIG // 02:14",
          ja: "氷床掘削基地 // 02:14"
        },
        subtitle: {
          zh: "三千八百米冻土层被钻开后，全站断电。暴风雪里混进了会模仿人类声音的“伪人”。",
          en: "After breaching 3,800 meters of permafrost, station power failed. Something in the blizzard began copying human voices.",
          ja: "地下3,800メートルの永久凍土を貫いた直後に停電。吹雪の中に人の声を真似る何かが紛れ込んだ。"
        }
      },
      {
        id: "prequel_op08_warning",
        videoSrc: "./videos/story/prequel_op08_warning.mp4",
        fallbackVideoSrc: "./videos/operator09/idle.mp4",
        posterSrc: "./portraits/operator09.jpg",
        fallbackPosterSrc: "./portraits/operator09.jpg",
        hasAudio: true,
        badge: { zh: "原声口型 · 前任遗言", en: "LIP-SYNC · #08", ja: "口型音声 · #08" },
        speaker: {
          zh: "前任值班员 #08 // 失联前录像",
          en: "PREVIOUS WATCHSTANDER #08",
          ja: "前任当直官 #08"
        },
        subtitle: {
          zh: "“记住：真人会怕、会认错；越是完美得像教科书的，越不是人。”",
          en: "\"Remember this: real humans mess up and admit fear. Anything that sounds too clean is a mimic.\"",
          ja: "「忘れるな。生身の人間は失敗を認める。完璧すぎる言い訳をする奴ほど人間じゃない。」"
        }
      },
      {
        id: "prologue_01_main",
        videoSrc: "./videos/story/prologue_01.mp4",
        fallbackVideoSrc: "./videos/lobby/bg.mp4",
        posterSrc: "./portraits/story/prologue_01.jpg",
        fallbackPosterSrc: "./portraits/lobby_bg.jpg",
        hasAudio: false,
        badge: { zh: "接班考核 01", en: "HANDOVER 01", ja: "引継試験 01" },
        speaker: {
          zh: "0 号岗亭 // 你的过去",
          en: "GATE 0 // YOUR PAST",
          ja: "第0関門 // あなたの過去"
        },
        subtitle: {
          zh: "现在轮到你值夜班了。先回答站长一个简单的问题：以前小组漏报隐患连累队友受伤时，你是怎么说的？",
          en: "It is your watch now. First question on the shift form: when your team missed a hazard earlier, what did you say?",
          ja: "今夜からあなたの当直だ。まず一つだけ答えてくれ。以前報告漏れで仲間が怪我をした時、どう答えた？"
        }
      }
    ],
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
      zh: "往事闪回 · 暴雪拍窗",
      en: "Flashback · Storm Knock · Elena",
      ja: "回想 · 吹雪の叩扉・エレナ"
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
    clips: [
      {
        id: "fb_elena_cabin3",
        videoSrc: "./videos/story/fb_elena_cabin3.mp4",
        fallbackVideoSrc: "./videos/elena/flinch.mp4",
        posterSrc: "./portraits/reactions/elena_flinch.jpg",
        fallbackPosterSrc: "./portraits/elena.jpg",
        hasAudio: false,
        badge: { zh: "背景故事 · 3号舱回放", en: "FLASHBACK · CABIN 3", ja: "過去映像 · 第3区画" },
        speaker: {
          zh: "一周前 · 3号舱监控录像",
          en: "ONE WEEK AGO // CABIN 3 CAM",
          ja: "一週間前 // 第3区画監視映像"
        },
        subtitle: {
          zh: "一周前 3 号舱漏气时，监控拍到艾琳娜为了自保，反手把两名护工锁死在了门外。",
          en: "Last week when Cabin 3 leaked, cameras caught Elena slamming the bulkhead shut and locking two orderlies outside.",
          ja: "先週第3区画で減圧が起きた時、彼女は自分を守るため仲間2人を外に締め出した。"
        }
      },
      {
        id: "n1_elena_knock",
        videoSrc: "./videos/story/n1_elena_knock.mp4",
        fallbackVideoSrc: "./videos/elena/idle.mp4",
        posterSrc: "./portraits/story/n1_elena_knock.jpg",
        fallbackPosterSrc: "./portraits/elena.jpg",
        hasAudio: true,
        badge: { zh: "原声口型 · 门外求助", en: "LIP-SYNC · KNOCK", ja: "口型音声 · 現在" },
        speaker: {
          zh: "V-01 // 艾琳娜·万斯医生",
          en: "V-01 // DR. ELENA VANCE",
          ja: "V-01 // エレナ医師"
        },
        subtitle: {
          zh: "“外面的供暖管全炸了！再不开门我就冻死在这儿了！”",
          en: "\"The outer heating lines just blew! Open the door or I'll freeze out here!\"",
          ja: "「外の暖房管が破裂した！早く開けないとここで凍死する！」"
        }
      }
    ],
    timerSec: 15,
    row: 1,
    col: 3,
    choices: [
      {
        id: "elena_open_intercom",
        nextNodeId: "n1_elena_react_intercom",
        label: {
          zh: "直接问她：你把同事锁在门外了？",
          en: "Ask directly: Did you lock your teammates outside?",
          ja: "直接聞く：仲間を外に締め出したの？"
        },
        sublabel: {
          zh: "继续看她怎么回答（口型剧情）",
          en: "Watch her answer (Lip-Sync)",
          ja: "返答ムービーを見る"
        },
        boothEffect: {
          action: "intercom",
          systemNote: {
            zh: "【剧情切入】你打开对讲机质问 3 号舱旧账，看她敢不敢承认。",
            en: "[SCENE ENTRY] You ask her straight about locking Cabin 3.",
            ja: "【場面導入】第3区画の件を直接問い詰める。"
          }
        }
      },
      {
        id: "elena_open_strobe",
        nextNodeId: "n1_elena_react_strobe",
        label: {
          zh: "先照强光，看看她的反应",
          en: "Flash the bright light to test her reaction",
          ja: "まず強い光を当てて反応を見る"
        },
        sublabel: {
          zh: "闪光测试 // 看她慌不慌（口型剧情）",
          en: "Flash Probe // Watch reaction",
          ja: "フラッシュ検査（映像）"
        },
        boothEffect: {
          action: "strobe",
          systemNote: {
            zh: "【剧情切入】强光扫过她的眼镜，她猛地抬手遮挡并大声回嘴。",
            en: "[SCENE ENTRY] Bright strobe hits her lenses—she flinches and snaps back.",
            ja: "【場面導入】強い光を浴びて激しく反応した。"
          }
        }
      },
      {
        id: "elena_open_dossier",
        nextNodeId: "n1_elena_confront",
        label: {
          zh: "先进窗口再决定",
          en: "Open control booth first",
          ja: "先にブースで確認する"
        },
        sublabel: {
          zh: "自由提问或直接拍板",
          en: "Free chat or decide",
          ja: "自由質問・直接判定"
        },
        boothEffect: {
          action: "dossier",
          systemNote: {
            zh: "【剧情切入】你先在窗口旁静静观察，再决定放行还是净化。",
            en: "[SCENE ENTRY] You watch quietly from the window before deciding.",
            ja: "【場面導入】窓辺で静かに観察する。"
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
    row: 0,
    col: 4,
    choices: [
      {
        id: "elena_react_admit",
        nextNodeId: "n1_corridor_admit",
        directVerdict: "ADMIT",
        label: {
          zh: "开门放她进来",
          en: "Open the gate & let her in",
          ja: "ドアを開けて通す"
        },
        sublabel: {
          zh: "她没扯谎遮掩，直接看放行结局",
          en: "ADMIT // Watch outcome movie",
          ja: "許可 // 結果ムービーへ"
        }
      },
      {
        id: "elena_react_purge",
        nextNodeId: "n1_corridor_purge",
        directVerdict: "PURGE",
        label: {
          zh: "拒绝开门，启动净化",
          en: "Refuse entry & purge chamber",
          ja: "入室拒否・焼却する"
        },
        sublabel: {
          zh: "觉得可疑，直接拉闸净化看后果",
          en: "PURGE [-1 FUEL] // Watch outcome",
          ja: "焼却 [-1 FUEL] // 結果へ"
        }
      },
      {
        id: "elena_react_to_booth",
        nextNodeId: "n1_elena_confront",
        label: {
          zh: "进防爆窗细问几句（可选）",
          en: "Ask more at the window (Optional)",
          ja: "窓辺で詳しく聞く（任意）"
        },
        sublabel: {
          zh: "想再多问一句或用扫描仪就点这里",
          en: "Optional chat & scanner",
          ja: "自由質問と検査"
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
    row: 2,
    col: 4,
    choices: [
      {
        id: "elena_strobe_admit",
        nextNodeId: "n1_corridor_admit",
        directVerdict: "ADMIT",
        label: {
          zh: "开门放她进来",
          en: "Open the gate & let her in",
          ja: "ドアを開けて通す"
        },
        sublabel: {
          zh: "强光反应正常，直接放行看后果",
          en: "ADMIT // Watch outcome movie",
          ja: "許可 // 結果ムービーへ"
        }
      },
      {
        id: "elena_strobe_purge",
        nextNodeId: "n1_corridor_purge",
        directVerdict: "PURGE",
        label: {
          zh: "拒绝开门，启动净化",
          en: "Refuse entry & purge chamber",
          ja: "入室拒否・焼却する"
        },
        sublabel: {
          zh: "怀疑她是假冒的，直接启动净化",
          en: "PURGE [-1 FUEL] // Watch outcome",
          ja: "焼却 [-1 FUEL] // 結果へ"
        }
      },
      {
        id: "elena_strobe_to_booth",
        nextNodeId: "n1_elena_confront",
        label: {
          zh: "进防爆窗细问几句（可选）",
          en: "Ask more at the window (Optional)",
          ja: "窓辺で詳しく聞く（任意）"
        },
        sublabel: {
          zh: "再深入问几个问题",
          en: "Optional detailed chat",
          ja: "任意で追加質問"
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
      zh: "放行后果 · 医疗室寒光",
      en: "Outcome · Medbay Cold Spark",
      ja: "許可結果 · 医務室の異変"
    },
    subtitle: {
      zh: "内舱门开锁后，艾琳娜独自走入走廊深处；二十分钟后，门灯开始诡异闪烁。",
      en: "The airlock opens for Elena. Twenty minutes later, medbay lights flicker above frost seeping under the door.",
      ja: "扉が開きエレナは中へ入った。20分後、医務室の照明が不気味に明滅し始める。"
    },
    speaker: {
      zh: "走廊监控 // 放行后果",
      en: "CORRIDOR CAM // ADMIT OUTCOME",
      ja: "廊下監視 // 許可の結果"
    },
    kind: "movie",
    hasAudio: true,
    videoSrc: "./videos/story/n1_elena_outcome_admit.mp4",
    fallbackVideoSrc: "./videos/chamber/admit.mp4",
    posterSrc: "./portraits/reactions/chamber_admit.jpg",
    fallbackPosterSrc: "./portraits/elena.jpg",
    clips: [
      {
        id: "n1_elena_outcome_admit",
        videoSrc: "./videos/story/n1_elena_outcome_admit.mp4",
        fallbackVideoSrc: "./videos/chamber/admit.mp4",
        posterSrc: "./portraits/reactions/chamber_admit.jpg",
        fallbackPosterSrc: "./portraits/elena.jpg",
        hasAudio: true,
        badge: { zh: "原声口型 · 进门瞬间", en: "LIP-SYNC · ADMIT", ja: "口型音声 · 入室" },
        speaker: {
          zh: "V-01 // 艾琳娜走入走廊",
          en: "V-01 // ELENA ENTERS BAY",
          ja: "V-01 // エレナ入室"
        },
        subtitle: {
          zh: "“算你识相。医疗室需要马上封锁供电，别让任何人打扰我。”",
          en: "\"Smart call. Seal off medbay power right now—and don't let anyone interrupt me.\"",
          ja: "「賢明な判断ね。これから医務室に籠もる、誰にも邪魔させないで。」"
        }
      },
      {
        id: "n1_corridor_aftermath_admit",
        videoSrc: "./videos/story/n1_corridor_aftermath.mp4",
        fallbackVideoSrc: "./videos/chamber/admit.mp4",
        posterSrc: "./portraits/story/n1_corridor_aftermath.jpg",
        fallbackPosterSrc: "./portraits/reactions/chamber_admit.jpg",
        hasAudio: false,
        badge: { zh: "走廊监控 · 二十分钟后", en: "CORRIDOR CAM", ja: "監視映像" },
        speaker: {
          zh: "B区医疗走廊监控",
          en: "SECTOR B MEDBAY CAM",
          ja: "B区画廊下カメラ"
        },
        subtitle: {
          zh: "荧光灯整排闪烁，门缝下渗出诡异寒霜——像是有人在门内反复试探门锁。",
          en: "Fluorescents strobe overhead as frost creeps beneath the heavy door.",
          ja: "蛍光灯が激しく明滅し、扉の隙間から不気味な霜が滲み出している。"
        }
      }
    ],
    row: 0,
    col: 7,
    choices: [
      {
        id: "corridor_lock_medbay",
        nextNodeId: "n1_leo_arrival",
        label: {
          zh: "悄悄反锁医疗室门，迎接下一位",
          en: "Lock medbay door quietly & watch outside",
          ja: "医務室を静かにロックして次へ"
        },
        boothEffect: {
          action: "intercom",
          systemNote: {
            zh: "【剧情延续】你悄悄锁好走廊门，这时窗外风雪里走来了一个拎工具箱的年轻人……",
            en: "[NEXT SCENE] You lock the corridor door as a young mechanic approaches through the storm.",
            ja: "【展開】廊下をロックした直後、吹雪の中から次の訪問者が現れた……"
          }
        }
      },
      {
        id: "corridor_keep_watch",
        nextNodeId: "n1_leo_arrival",
        label: {
          zh: "先不管她，继续盯着外门",
          en: "Ignore it for now & watch the outer gate",
          ja: "今は気にせず外扉を見守る"
        },
        boothEffect: {
          action: "intercom",
          systemNote: {
            zh: "【剧情延续】你切回外门画面——窗外又出现了新的身影。",
            en: "[NEXT SCENE] You switch back to the outer window—someone else is outside.",
            ja: "【展開】外扉の画面に戻すと、新たな人影が近づいていた。"
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
      zh: "净化后果 · 管道回响",
      en: "Outcome · Purge & Duct Knock",
      ja: "焼却結果 · ダクトの異音"
    },
    subtitle: {
      zh: "1,100°C 高温净化吞没过渡舱。炉火退去后，头顶通风管却传来三声诡异敲击……",
      en: "1,100°C flames engulf the vestibule. As the furnace cools, three strange knocks echo in the ceiling duct.",
      ja: "1,100°Cの炎が前室を焼く。冷却直後、天井ダクトから3度の不気味なノック音が響く……"
    },
    speaker: {
      zh: "隔离仓与走廊监控 // 净化后果",
      en: "CHAMBER & CORRIDOR // PURGE OUTCOME",
      ja: "焼却炉と廊下監視"
    },
    kind: "movie",
    hasAudio: false,
    videoSrc: "./videos/story/n1_elena_outcome_purge.mp4",
    fallbackVideoSrc: "./videos/chamber/purge.mp4",
    posterSrc: "./portraits/reactions/chamber_purge.jpg",
    fallbackPosterSrc: "./portraits/reactions/chamber_purge.jpg",
    clips: [
      {
        id: "n1_elena_outcome_purge",
        videoSrc: "./videos/story/n1_elena_outcome_purge.mp4",
        fallbackVideoSrc: "./videos/chamber/purge.mp4",
        posterSrc: "./portraits/reactions/chamber_purge.jpg",
        fallbackPosterSrc: "./portraits/reactions/chamber_purge.jpg",
        hasAudio: false,
        badge: { zh: "净化实况 · 1,100°C", en: "THERMAL PURGE", ja: "高温焼却" },
        speaker: {
          zh: "0 号隔离窗 // 高温净化炉",
          en: "GATE 0 // THERMAL SURGE",
          ja: "第0関門 // 高温焼却炉"
        },
        subtitle: {
          zh: "橙白烈焰在防爆玻璃后轰鸣着吞没了一切，燃料减少 1 格。",
          en: "White-hot flames roar behind armored glass, consuming 1 bar of heating fuel.",
          ja: "轟音と共に白熱の炎がすべてを焼き尽くす（燃料 -1）。"
        }
      },
      {
        id: "n1_corridor_aftermath_purge",
        videoSrc: "./videos/story/n1_corridor_aftermath.mp4",
        fallbackVideoSrc: "./videos/chamber/purge.mp4",
        posterSrc: "./portraits/story/n1_corridor_aftermath.jpg",
        fallbackPosterSrc: "./portraits/reactions/chamber_purge.jpg",
        hasAudio: false,
        badge: { zh: "走廊监控 · 通风口异响", en: "DUCT ECHO", ja: "ダクト異音" },
        speaker: {
          zh: "站内走廊顶部通风管",
          en: "OVERHEAD AIR DUCT",
          ja: "天井換気ダクト"
        },
        subtitle: {
          zh: "炉壁刚冷却，头顶通风管就传来三声金属敲击——就像窗外还有同伙在回应。",
          en: "As the furnace cools, three metallic knocks ring out above—as if something else heard the blast.",
          ja: "炉が冷え切る直前、天井から3度の金属音が響いた。"
        }
      }
    ],
    row: 2,
    col: 7,
    choices: [
      {
        id: "corridor_seal_vent",
        nextNodeId: "n1_leo_arrival",
        label: {
          zh: "关掉通风管道，迎接下一位",
          en: "Shut air vent & watch next arrival",
          ja: "換気口を閉じて次の訪問者へ"
        },
        boothEffect: {
          action: "intercom",
          systemNote: {
            zh: "【剧情延续】你关上了副通风口，这时风雪里又走来了一名拎工具箱的青年。",
            en: "[NEXT SCENE] You seal the vent just as a mechanic arrives in the snow.",
            ja: "【展開】換気口を閉じると、吹雪の中に新たな人影が現れた。"
          }
        }
      },
      {
        id: "corridor_brace_booth",
        nextNodeId: "n1_leo_arrival",
        label: {
          zh: "先不管异响，继续值班",
          en: "Ignore the sound & keep watch",
          ja: "音は気にせず当直を続ける"
        },
        boothEffect: {
          action: "intercom",
          systemNote: {
            zh: "【剧情延续】窗外风雪里已经多了一个拖箱子的身影。",
            en: "[NEXT SCENE] A figure dragging a white tool chest appears outside.",
            ja: "【展開】窓の外に白い工具箱を引く人影が現れた。"
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
      zh: "往事闪回 · 拖箱抵窗",
      en: "Flashback · Tool Chest Arrival · Leo",
      ja: "回想 · 工具箱の訪問者・リオ"
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
    clips: [
      {
        id: "fb_leo_powerbay",
        videoSrc: "./videos/story/fb_leo_powerbay.mp4",
        fallbackVideoSrc: "./videos/leo/flinch.mp4",
        posterSrc: "./portraits/reactions/leo_flinch.jpg",
        fallbackPosterSrc: "./portraits/leo.jpg",
        hasAudio: false,
        badge: { zh: "背景故事 · 动力舱暴走", en: "FLASHBACK · POWER BAY", ja: "過去映像 · 動力室" },
        speaker: {
          zh: "两小时前 · 2号动力舱监控",
          en: "TWO HOURS AGO // POWER BAY 2 CAM",
          ja: "2時間前 // 第2動力室"
        },
        subtitle: {
          zh: "两小时前动力舱电弧爆闪，里奥抱起白色工具箱独自从应急风雪闸门跑了出来。",
          en: "Two hours ago sparks erupted in Power Bay 2—Leo grabbed his white tool chest and bolted through the storm hatch alone.",
          ja: "2時間前、動力室で火花が散る中、リオは白い工具箱を抱えて一人で吹雪の中へ逃げ出した。"
        }
      },
      {
        id: "n1_leo_arrival_main",
        videoSrc: "./videos/story/n1_leo_arrival.mp4",
        fallbackVideoSrc: "./videos/leo/idle.mp4",
        posterSrc: "./portraits/story/n1_leo_arrival.jpg",
        fallbackPosterSrc: "./portraits/leo.jpg",
        hasAudio: true,
        badge: { zh: "原声口型 · 抵窗求助", en: "LIP-SYNC · ARRIVAL", ja: "口型音声 · 現在" },
        speaker: {
          zh: "V-02 // 佐藤里奥",
          en: "V-02 // LEO SATO",
          ja: "V-02 // 佐藤レオ"
        },
        subtitle: {
          zh: "“值班员！快放我进去，我带了二号动力舱的备用阀门工具！”",
          en: "\"Watchstander! Let me in—I hauled the spare thermal valve rig from Power Bay 2!\"",
          ja: "「当直官！早く開けてくれ、第2動力室の予備バルブ一式を持ってきたんだ！」"
        }
      }
    ],
    timerSec: 15,
    row: 1,
    col: 8,
    choices: [
      {
        id: "leo_open_intercom",
        nextNodeId: "n1_leo_react_intercom",
        label: {
          zh: "问他：车队出事你怎么自己回来了？",
          en: "Ask him: Why did you run back alone without the crew?",
          ja: "聞く：どうして仲間を置いて一人で逃げたの？"
        },
        sublabel: {
          zh: "继续看他怎么回答（口型剧情）",
          en: "Watch him reply (Lip-Sync)",
          ja: "返答ムービーを見る"
        },
        boothEffect: {
          action: "intercom",
          systemNote: {
            zh: "【剧情切入】你没有立刻开门，追问他为什么独自脱离车队。",
            en: "[SCENE ENTRY] Before opening, you ask why he split from the convoy alone.",
            ja: "【場面導入】なぜ隊列を離れたのか直接問い詰める。"
          }
        }
      },
      {
        id: "leo_open_thermal",
        nextNodeId: "n1_leo_confront",
        label: {
          zh: "先照强光，看他会不会眨眼躲闪",
          en: "Flash the bright light & watch if he blinks",
          ja: "強い光を当てて瞬きや反応を見る"
        },
        sublabel: {
          zh: "消耗 1 电量 // 直接窗口观察",
          en: "1 PWR FLASH // Open booth",
          ja: "センサー検査 // ブースへ"
        },
        boothEffect: {
          action: "strobe",
          systemNote: {
            zh: "【剧情切入】强光扫过里奥脸颊，捕捉到他猛地躲闪时的反应。",
            en: "[SCENE ENTRY] Strobe light hits Leo's soot-streaked face as he flinches.",
            ja: "【場面導入】閃光を受けて怯むリオの反応を記録した。"
          }
        }
      },
      {
        id: "leo_open_dossier",
        nextNodeId: "n1_leo_confront",
        label: {
          zh: "先进窗口再决定",
          en: "Open control booth first",
          ja: "先にブースで確認する"
        },
        sublabel: {
          zh: "自由提问或直接拍板",
          en: "Free chat or decide",
          ja: "自由質問・直接判定"
        },
        boothEffect: {
          action: "dossier",
          systemNote: {
            zh: "【剧情切入】你在窗口旁先看清了里奥的记录，再决定开门还是净化。",
            en: "[SCENE ENTRY] You check Leo's logs calmly at the window before deciding.",
            ja: "【場面導入】窓口で記録を見てから判断する。"
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
    row: 0,
    col: 9,
    choices: [
      {
        id: "leo_react_admit",
        nextNodeId: "n1_leo_aftermath",
        directVerdict: "ADMIT",
        label: {
          zh: "开门放他进来",
          en: "Open the gate & let him in",
          ja: "ドアを開けて通す"
        },
        sublabel: {
          zh: "看起来只是吓坏了的小机械师，放行看后果",
          en: "ADMIT // Watch Night 1 ending",
          ja: "許可 // 第1夜結末へ"
        }
      },
      {
        id: "leo_react_purge",
        nextNodeId: "n1_leo_aftermath",
        directVerdict: "PURGE",
        label: {
          zh: "拒绝开门，启动净化",
          en: "Refuse entry & purge chamber",
          ja: "入室拒否・焼却する"
        },
        sublabel: {
          zh: "别轻信眼泪，直接拉闸净化看后果",
          en: "PURGE [-1 FUEL] // Watch Night 1 ending",
          ja: "焼却 [-1 FUEL] // 第1夜結末へ"
        }
      },
      {
        id: "leo_react_to_booth",
        nextNodeId: "n1_leo_confront",
        label: {
          zh: "进防爆窗细问几句（可选）",
          en: "Ask more at the window (Optional)",
          ja: "窓辺で詳しく聞く（任意）"
        },
        sublabel: {
          zh: "想再多问一句或用扫描仪就点这里",
          en: "Optional chat & scanner",
          ja: "自由質問と検査"
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
        nextNodeId: "n1_leo_aftermath",
        label: { zh: "观看第 1 夜片尾后果", en: "Watch Night 1 Ending", ja: "第1夜の結末を見る" }
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
        nextNodeId: "n1_leo_aftermath",
        label: { zh: "观看第 1 夜片尾后果", en: "Watch Night 1 Ending", ja: "第1夜の結末を見る" }
      }
    ]
  },
  {
    id: "n1_leo_aftermath",
    chapter: "night1_leo",
    code: "SC-02C",
    title: {
      zh: "首夜尾声 · 走廊黑影",
      en: "Night 1 Cliffhanger · Corridor Shadow",
      ja: "第1夜終盤 · 廊下の影"
    },
    subtitle: {
      zh: "里奥刚进站内走廊就低声嘀咕；午夜换班钟响前，监控深处突然站着一道陌生黑影。",
      en: "After Leo's verdict settles, the corridor feed catches an unidentifiable silhouette standing motionless toward Gate 0.",
      ja: "リオの判定が下った深夜、監視カメラの奥に正体不明の人影が映り込む。"
    },
    speaker: {
      zh: "第 1 夜结尾 // 悬念片尾",
      en: "NIGHT 01 FINALE // CLIFFHANGER",
      ja: "第1夜エンディング // 謎の影"
    },
    kind: "movie",
    hasAudio: true,
    videoSrc: "./videos/story/n1_leo_outcome_admit.mp4",
    fallbackVideoSrc: "./videos/story/n1_corridor_aftermath.mp4",
    posterSrc: "./portraits/leo.jpg",
    fallbackPosterSrc: "./portraits/story/n1_corridor_aftermath.jpg",
    clips: [
      {
        id: "n1_leo_outcome_admit",
        videoSrc: "./videos/story/n1_leo_outcome_admit.mp4",
        fallbackVideoSrc: "./videos/leo/idle.mp4",
        posterSrc: "./portraits/leo.jpg",
        fallbackPosterSrc: "./portraits/reactions/chamber_admit.jpg",
        hasAudio: true,
        badge: { zh: "原声口型 · 第 1 夜收尾", en: "LIP-SYNC · LEO ADMIT", ja: "口型音声 · リオ入室" },
        speaker: {
          zh: "V-02 // 佐藤里奥进舱后",
          en: "V-02 // LEO STEPS INSIDE",
          ja: "V-02 // リオ入室後"
        },
        subtitle: {
          zh: "“谢了兄弟，备用阀放这儿了……别告诉站长我差点把工具弄丢了。”",
          en: "\"Thanks pal, parts are right here... just don't tell the commander I nearly lost the kit.\"",
          ja: "「助かったよ、予備パーツはここだ……落としかけたことは隊長には内緒にしてくれ。」"
        }
      },
      {
        id: "n1_cliffhanger_shadow",
        videoSrc: "./videos/story/n1_cliffhanger_shadow.mp4",
        fallbackVideoSrc: "./videos/story/n1_corridor_aftermath.mp4",
        posterSrc: "./portraits/story/n1_corridor_aftermath.jpg",
        fallbackPosterSrc: "./portraits/lobby_bg.jpg",
        hasAudio: false,
        badge: { zh: "片尾悬念 · 走廊黑影", en: "CLIFFHANGER · SHADOW", ja: "次回予告 · 廊下の影" },
        speaker: {
          zh: "03:00 // 内舱长廊 7 号监控",
          en: "03:00 // INNER CORRIDOR CAM 07",
          ja: "03:00 // 内廊下監視 07"
        },
        subtitle: {
          zh: "廊灯咔嗒闪烁，一个很高的人影站在走廊尽头一动不动盯着岗亭方向——明天，更危险的访客要来了。",
          en: "A corridor bulb flickers over a tall, still figure staring straight at Gate 0. Worse arrivals wait tomorrow night.",
          ja: "照明が点滅する奥に誰かが立ち尽くしている——第2夜、さらなる訪問者が迫る。"
        }
      }
    ],
    row: 1,
    col: 12,
    choices: [
      {
        id: "n1_aftermath_continue",
        nextNodeId: "nights_2_5_hub",
        label: { zh: "继续下一夜", en: "Continue to Night 2", ja: "第2夜へ進む" },
        sublabel: { zh: "夜色更深了 · 进入第 2–5 夜", en: "Enter Nights 2–5", ja: "第2〜5夜へ" }
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
    col: 13
  }
];

export const STORY_EDGES: readonly StoryEdge[] = [
  { id: "e_p1_p2", from: "prologue_01", to: "prologue_02", branch: "default" },
  { id: "e_p2_p3", from: "prologue_02", to: "prologue_03", branch: "default" },
  { id: "e_p3_n1e", from: "prologue_03", to: "n1_elena_arrival", branch: "default" },
  { id: "e_n1e_arr_int", from: "n1_elena_arrival", to: "n1_elena_react_intercom", branch: "default" },
  { id: "e_n1e_arr_str", from: "n1_elena_arrival", to: "n1_elena_react_strobe", branch: "default" },
  { id: "e_n1e_arr_con", from: "n1_elena_arrival", to: "n1_elena_confront", branch: "default" },
  { id: "e_n1e_int_admit", from: "n1_elena_react_intercom", to: "n1_corridor_admit", branch: "admit" },
  { id: "e_n1e_int_purge", from: "n1_elena_react_intercom", to: "n1_corridor_purge", branch: "purge" },
  { id: "e_n1e_int_con", from: "n1_elena_react_intercom", to: "n1_elena_confront", branch: "default" },
  { id: "e_n1e_str_admit", from: "n1_elena_react_strobe", to: "n1_corridor_admit", branch: "admit" },
  { id: "e_n1e_str_purge", from: "n1_elena_react_strobe", to: "n1_corridor_purge", branch: "purge" },
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
  { id: "e_n1l_int_after", from: "n1_leo_react_intercom", to: "n1_leo_aftermath", branch: "default" },
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
  { id: "e_n1l_admit_after", from: "n1_leo_admit", to: "n1_leo_aftermath", branch: "admit" },
  { id: "e_n1l_purge_after", from: "n1_leo_purge", to: "n1_leo_aftermath", branch: "purge" },
  { id: "e_n1l_after_hub", from: "n1_leo_aftermath", to: "nights_2_5_hub", branch: "default" }
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
  for (const clip of node.clips ?? []) {
    if (clip.videoSrc) seen.add(clip.videoSrc);
    if (clip.fallbackVideoSrc) seen.add(clip.fallbackVideoSrc);
  }
  for (const choice of node.choices ?? []) {
    const target = getStoryNode(choice.nextNodeId);
    if (!target) continue;
    add(target.videoSrc);
    add(target.fallbackVideoSrc);
    for (const clip of target.clips ?? []) {
      add(clip.videoSrc);
    }
  }
  return [...seen];
}
