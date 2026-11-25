import type { EndingId, LocalizedText } from "./types.js";

export type StoryChapterId =
  | "prologue"
  | "night1_elena"
  | "night1_corridor"
  | "night1_leo"
  | "night2_power"
  | "night3_storm"
  | "night4_mutiny"
  | "night5_finale";

export type StoryNodeKind =
  | "movie"
  | "interrogation"
  | "verdict_branch"
  | "chapter_hub"
  | "ending";

export interface StoryBoothEffect {
  action: "strobe" | "dossier" | "intercom";
  systemNote: LocalizedText;
}

export interface StoryVoiceCue {
  slug: string;
  file: string;
}

export interface StoryClipSegment {
  id: string;
  videoSrc: string;
  fallbackVideoSrc: string;
  posterSrc: string;
  fallbackPosterSrc: string;
  hasAudio?: boolean;
  isLipSync?: boolean;
  voiceCue?: StoryVoiceCue;
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
  isSideQuest?: boolean;
  sideQuestVisitorId?: string;
  sideQuestReturnNodeId?: string;
  triggerNight5Audit?: boolean;
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
  isLipSync?: boolean;
  voiceCue?: StoryVoiceCue;
  videoSrc: string;
  fallbackVideoSrc: string;
  posterSrc: string;
  fallbackPosterSrc: string;
  clips?: readonly StoryClipSegment[];
  timerSec?: number;
  choices?: readonly StoryChoice[];
  visitorId?: string;
  endingId?: EndingId;
  endingTag?: LocalizedText;
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
    en: "PROLOGUE · HANDOVER",
    ja: "序章 · 極夜引継"
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
    zh: "第 1 夜 · 动力专员",
    en: "NIGHT 01 · LEO SATO",
    ja: "第1夜 · 動力技師"
  },
  night2_power: {
    zh: "第 2 夜 · 夺权危机",
    en: "NIGHT 02 · COMMAND",
    ja: "第2夜 · 指揮権争い"
  },
  night3_storm: {
    zh: "第 3 夜 · 磁暴断电",
    en: "NIGHT 03 · BLACKOUT",
    ja: "第3夜 · 磁気嵐停電"
  },
  night4_mutiny: {
    zh: "第 4 夜 · 逃生叛变",
    en: "NIGHT 04 · MUTINY",
    ja: "第4夜 · 脱出反乱"
  },
  night5_finale: {
    zh: "第 5 夜 · 终局结局",
    en: "NIGHT 05 · FINALES",
    ja: "第5夜 · 終局結末"
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
        hasAudio: true,
        isLipSync: false,
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
        hasAudio: true,
        isLipSync: false,
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
        isSideQuest: true,
        sideQuestVisitorId: "V-01",
        sideQuestReturnNodeId: "n1_corridor_admit",
        label: {
          zh: "🔍 进入防爆窗 · 深度鉴真艾琳娜（高玩支线）",
          en: "🔍 Booth Interrogation · Audit Elena (Side Quest)",
          ja: "🔍 防爆窓で詳しく尋問する（任意支線）"
        },
        sublabel: {
          zh: "可选硬核支线 · 用扫描仪与测谎捉拿伪人破绽",
          en: "Optional detective mode // scanner & psych quiz",
          ja: "任意の本編外ミッション"
        },
        boothEffect: {
          action: "dossier",
          systemNote: {
            zh: "【高玩支线】你切入防爆窗审讯台，对艾琳娜展开深度伪人鉴真。",
            en: "[SIDE QUEST] Deep behavioral interrogation launched for Dr. Elena Vance.",
            ja: "【高難度支線】エレナへの徹底尋問を開始した。"
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
        isSideQuest: true,
        sideQuestVisitorId: "V-01",
        sideQuestReturnNodeId: "n1_corridor_admit",
        label: {
          zh: "🔍 进入防爆窗 · 深度鉴真艾琳娜（高玩支线）",
          en: "🔍 Booth Interrogation · Audit Elena (Side Quest)",
          ja: "🔍 窓辺で詳しく尋問（任意支線）"
        },
        sublabel: {
          zh: "可选支线 · 用扫描仪与问题追问真假",
          en: "Optional scanner & interrogation detour",
          ja: "任意の尋問・スキャン支線"
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
        isSideQuest: true,
        sideQuestVisitorId: "V-01",
        sideQuestReturnNodeId: "n1_corridor_admit",
        label: {
          zh: "🔍 进入防爆窗 · 深度鉴真艾琳娜（高玩支线）",
          en: "🔍 Booth Interrogation · Audit Elena (Side Quest)",
          ja: "🔍 窓辺で詳しく尋問（任意支線）"
        },
        sublabel: {
          zh: "可选支线 · 深入审讯查清真伪",
          en: "Optional detailed chat & scanner",
          ja: "任意で追加尋問"
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
    hasAudio: true,
    isLipSync: false,
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
        hasAudio: true,
        isLipSync: false,
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
        hasAudio: true,
        isLipSync: false,
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
        isSideQuest: true,
        sideQuestVisitorId: "V-02",
        sideQuestReturnNodeId: "n1_leo_aftermath",
        label: {
          zh: "🔍 强光闪测 · 直接开启防爆窗调查（高玩支线）",
          en: "🔍 Flash Test · Open Booth Audit (Side Quest)",
          ja: "🔍 閃光検査・防爆窓へ（任意支線）"
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
        isSideQuest: true,
        sideQuestVisitorId: "V-02",
        sideQuestReturnNodeId: "n1_leo_aftermath",
        label: {
          zh: "🔍 进入防爆窗 · 深度鉴真里奥（高玩支线）",
          en: "🔍 Booth Interrogation · Audit Leo (Side Quest)",
          ja: "🔍 防爆窓で詳しく尋問する（任意支線）"
        },
        sublabel: {
          zh: "可选支线 · 用扫描仪测他是不是伪人",
          en: "Optional scanner & interrogation mode",
          ja: "任意で追加尋問"
        },
        boothEffect: {
          action: "dossier",
          systemNote: {
            zh: "【高玩支线】你切入防爆窗审讯台，对里奥展开深度伪人鉴真。",
            en: "[SIDE QUEST] Deep behavioral interrogation launched for Leo Sato.",
            ja: "【高難度支線】リオへの徹底尋問を開始した。"
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
        isSideQuest: true,
        sideQuestVisitorId: "V-02",
        sideQuestReturnNodeId: "n1_leo_aftermath",
        label: {
          zh: "🔍 进入防爆窗 · 深度鉴真里奥（高玩支线）",
          en: "🔍 Booth Interrogation · Audit Leo (Side Quest)",
          ja: "🔍 窓辺で詳しく尋問（任意支線）"
        },
        sublabel: {
          zh: "可选支线 · 想用扫描仪查真假就点这里",
          en: "Optional scanner & chat detour",
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
        hasAudio: true,
        isLipSync: false,
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
        nextNodeId: "n2_arthur_standoff",
        label: { zh: "继续第 2 夜 · 夺权危机 ▶", en: "Continue to Night 2 ▶", ja: "第2夜へ進む ▶" },
        sublabel: {
          zh: "天亮前还剩四夜，站长亚瑟已经带人来到窗外",
          en: "Director Arthur is knocking outside Gate 0",
          ja: "基地長アーサーが窓の外に現れる"
        }
      }
    ]
  },
  // ==================== NIGHT 2 · COMMAND CRISIS ====================
  {
    id: "n2_arthur_standoff",
    chapter: "night2_power",
    code: "SC-03A",
    title: {
      zh: "第 2 夜 · 站长的交权最后通牒",
      en: "Night 2 · Arthur's Command Ultimatum",
      ja: "第2夜 · アーサー所長の最後通牒"
    },
    subtitle: {
      zh: "“我是站长亚瑟！一号反应堆撑不过今晚，立刻开门把控制台主钥匙交给我！”",
      en: "\"I run this outpost! Open Gate 0 and hand over the master console key before Reactor 1 blows!\"",
      ja: "「私は所長だ！今すぐドアを開けて制御室のマスターキーを渡せ！」"
    },
    speaker: {
      zh: "V-03 // Arthur Sterling 站长",
      en: "V-03 // DIRECTOR ARTHUR STERLING",
      ja: "V-03 // アーサー・スターリング所長"
    },
    kind: "movie",
    hasAudio: false,
    voiceCue: { slug: "arthur", file: "opening" },
    visitorId: "V-03",
    videoSrc: "./videos/arthur/lean_in.mp4",
    fallbackVideoSrc: "./videos/arthur/lean_in.mp4",
    posterSrc: "./portraits/reactions/arthur_lean_in.jpg",
    fallbackPosterSrc: "./portraits/arthur.jpg",
    row: 1,
    col: 13,
    choices: [
      {
        id: "n2_arthur_trust",
        nextNodeId: "n2_marcus_clash",
        directVerdict: "ADMIT",
        label: {
          zh: "信任站长亚瑟，让他进门接管指挥",
          en: "Trust Arthur and open the gate",
          ja: "アーサーを信じてドアを開ける"
        },
        sublabel: {
          zh: "放行 // 他带着应急密码，先进来稳住反应堆",
          en: "ADMIT // Let him stabilize the reactor",
          ja: "通過 // 原子炉の復旧を任せる"
        }
      },
      {
        id: "n2_arthur_reject",
        nextNodeId: "n2_marcus_clash",
        directVerdict: "PURGE",
        label: {
          zh: "拒绝交权，直接启动防爆窗净化",
          en: "Refuse command transfer & purge",
          ja: "権限委譲を拒否・焼却する"
        },
        sublabel: {
          zh: "净化 // 真站长绝不会在停电夜独自丢下队员",
          en: "PURGE [-1 FUEL] // Suspect mimic command takeover",
          ja: "焼却 [-1 FUEL] // 偽装と判断する"
        }
      },
      {
        id: "n2_arthur_side_audit",
        nextNodeId: "n2_side_audit",
        isSideQuest: true,
        sideQuestVisitorId: "V-03",
        sideQuestReturnNodeId: "n2_marcus_clash",
        label: {
          zh: "🔍 进入防爆窗 · 深度鉴真亚瑟（高玩支线）",
          en: "🔍 Booth Interrogation · Audit Arthur (Side Quest)",
          ja: "🔍 防爆窓でアーサーを徹底尋問（任意支線）"
        },
        sublabel: {
          zh: "可选硬核支线 · 测他到底顾全大局还是只顾履历",
          en: "Optional detective mode · V-03 interrogation",
          ja: "任意の尋問支線"
        }
      }
    ]
  },
  {
    id: "n2_marcus_clash",
    chapter: "night2_power",
    code: "SC-03B",
    title: {
      zh: "深夜对峙 · 安保队长马库斯",
      en: "Night 2 · Capt. Marcus Breaks Ranks",
      ja: "第2夜 · 警備隊長マーカス"
    },
    subtitle: {
      zh: "“值班员，二号寝舱已经有人失踪了！放我进去拿脉冲步枪，我来守住走廊！”",
      en: "\"Someone vanished from Bunk 2! Open up so I can grab the pulse carbine and hold the corridor!\"",
      ja: "「第2居住区で行方不明者が出た！通路を守るために中へ入れてくれ！」"
    },
    speaker: {
      zh: "V-04 // Capt. Marcus Chen",
      en: "V-04 // CAPT. MARCUS CHEN",
      ja: "V-04 // マーカス・チェン隊長"
    },
    kind: "movie",
    hasAudio: false,
    voiceCue: { slug: "marcus", file: "opening" },
    visitorId: "V-04",
    videoSrc: "./videos/marcus/idle.mp4",
    fallbackVideoSrc: "./videos/marcus/idle.mp4",
    posterSrc: "./portraits/reactions/marcus_lean_in.jpg",
    fallbackPosterSrc: "./portraits/marcus.jpg",
    row: 1,
    col: 14,
    choices: [
      {
        id: "n2_marcus_admit",
        nextNodeId: "n3_storm_blackout",
        directVerdict: "ADMIT",
        label: {
          zh: "放安保队长马库斯进门带队巡查",
          en: "Let Marcus inside to patrol the corridor",
          ja: "マーカスを通路巡回に入れる"
        },
        sublabel: {
          zh: "放行 // 没有武装守卫，明天全站都会乱",
          en: "ADMIT // Rely on his security team",
          ja: "通過 // 警備の立て直しを託す"
        }
      },
      {
        id: "n2_marcus_purge",
        nextNodeId: "n3_storm_blackout",
        directVerdict: "PURGE",
        label: {
          zh: "怀疑他已被替换，封门启动净化",
          en: "Suspect he is compromised & purge",
          ja: "乗っ取りを疑い焼却する"
        },
        sublabel: {
          zh: "净化 // 绝不能让“伪人”拿到站内武器库钥匙",
          en: "PURGE [-1 FUEL] // Keep the armory sealed",
          ja: "焼却 [-1 FUEL] // 武器庫を渡さない"
        }
      },
      {
        id: "n2_marcus_side_audit",
        nextNodeId: "n2_side_audit",
        isSideQuest: true,
        sideQuestVisitorId: "V-04",
        sideQuestReturnNodeId: "n3_storm_blackout",
        label: {
          zh: "🔍 进入防爆窗 · 深度鉴真马库斯（高玩支线）",
          en: "🔍 Booth Interrogation · Audit Marcus (Side Quest)",
          ja: "🔍 防爆窓でマーカスを尋問（任意支線）"
        },
        sublabel: {
          zh: "可选硬核支线 · 用扫描仪验证他是否伪人",
          en: "Optional detective mode · V-04 interrogation",
          ja: "任意の尋問支線"
        }
      }
    ]
  },
  {
    id: "n2_side_audit",
    chapter: "night2_power",
    code: "INT-03",
    title: {
      zh: "防爆窗支线 · 第 2 夜深度鉴真",
      en: "Side Quest · Night 2 Booth Audit",
      ja: "支線尋問・第2夜の真贋判定"
    },
    subtitle: {
      zh: "高玩支线模式：通过强光/热像扫描与压力追问，识破权力与护短背后的伪人破绽。",
      en: "Optional detective booth: use scanners and stress probes to uncover hidden mimic tells.",
      ja: "任意支線：センサーと尋問で偽りの言い訳を見破れ。"
    },
    speaker: {
      zh: "高玩支线 // 第 2 夜鉴真台",
      en: "SIDE QUEST // NIGHT 2 AUDIT BOOTH",
      ja: "任意支線 // 第2夜尋問室"
    },
    kind: "interrogation",
    visitorId: "V-03",
    videoSrc: "./videos/arthur/idle.mp4",
    fallbackVideoSrc: "./videos/arthur/idle.mp4",
    posterSrc: "./portraits/arthur.jpg",
    fallbackPosterSrc: "./portraits/arthur.jpg",
    row: 2,
    col: 14
  },
  // ==================== NIGHT 3 · GEOMAGNETIC BLACKOUT ====================
  {
    id: "n3_storm_blackout",
    chapter: "night3_storm",
    code: "SC-04A",
    title: {
      zh: "第 3 夜磁暴 · 冰芯寄生体真相",
      en: "Night 3 Blackout · Ingrid's Cryo Sample",
      ja: "第3夜磁気嵐・イングリッドの氷芯検体"
    },
    subtitle: {
      zh: "极光磁暴吞没了监控信号！首席研究员英格丽德抱着渗血低温罐撞门大喊：“标本活过来了！”",
      en: "Geomagnetic storm blacks out the sensors! Dr. Solberg slams the glass holding a frost-cracked cryo canister.",
      ja: "極地磁気嵐で監視網が停止！イングリッド博士が凍結容器を抱えて叫ぶ。"
    },
    speaker: {
      zh: "V-06 // Dr. Ingrid Solberg",
      en: "V-06 // DR. INGRID SOLBERG",
      ja: "V-06 // イングリッド博士"
    },
    kind: "movie",
    hasAudio: false,
    voiceCue: { slug: "ingrid", file: "opening" },
    visitorId: "V-06",
    videoSrc: "./videos/ingrid/lean_in.mp4",
    fallbackVideoSrc: "./videos/ingrid/lean_in.mp4",
    posterSrc: "./portraits/reactions/ingrid_lean_in.jpg",
    fallbackPosterSrc: "./portraits/ingrid.jpg",
    row: 1,
    col: 15,
    choices: [
      {
        id: "n3_ingrid_admit",
        nextNodeId: "n3_ana_betrayal",
        directVerdict: "ADMIT",
        label: {
          zh: "放英格丽德进门，保留冰芯样本查真相",
          en: "Let Ingrid in & preserve the cryo sample",
          ja: "イングリッドを通して検体を調べる"
        },
        sublabel: {
          zh: "放行 // 只有看清源头，才能分辨谁是真正的伪人",
          en: "ADMIT // We need the lab sample to survive",
          ja: "通過 // 真相解明のため検体を残す"
        }
      },
      {
        id: "n3_ingrid_purge",
        nextNodeId: "n3_ana_betrayal",
        directVerdict: "PURGE",
        label: {
          zh: "连人带样本彻底净化，杜绝感染",
          en: "Incinerate both scientist and sample",
          ja: "検体ごと完全に焼却処分する"
        },
        sublabel: {
          zh: "净化 // 别管科研数据了，活下去才重要",
          en: "PURGE [-1 FUEL] // Zero contamination policy",
          ja: "焼却 [-1 FUEL] // 汚染源を断つ"
        }
      },
      {
        id: "n3_ingrid_side_audit",
        nextNodeId: "n3_side_audit",
        isSideQuest: true,
        sideQuestVisitorId: "V-06",
        sideQuestReturnNodeId: "n3_ana_betrayal",
        label: {
          zh: "🔍 磁暴盲审 · 亲自盘查英格丽德（高玩支线）",
          en: "🔍 Blind Storm Audit · Ingrid (Side Quest)",
          ja: "🔍 磁気嵐下の盲目尋問（任意支線）"
        },
        sublabel: {
          zh: "高难度盲审 · 强光热像全失灵，纯靠对话找破绽",
          en: "Hardcore blackout mode · pure dialogue interrogation",
          ja: "センサー停止中の純粋尋問"
        }
      }
    ]
  },
  {
    id: "n3_ana_betrayal",
    chapter: "night3_storm",
    code: "SC-04B",
    title: {
      zh: "供氧警报 · 安娜的血检报告",
      en: "Night 3 · Ana's Blood-Test Warning",
      ja: "第3夜・アナの血液検査警告"
    },
    subtitle: {
      zh: "“别信屋里那些人！全站氧气阀被调低了，快开门让我进总控室手动重启！”",
      en: "\"Don't trust anyone inside! Someone sabotaged the O2 loop—let me reach the manual manifold!\"",
      ja: "「中の連中を信じないで！酸素バルブが落とされた、今すぐ通して！」"
    },
    speaker: {
      zh: "V-05 // Ana Ribeiro 轮值医助",
      en: "V-05 // ANA RIBEIRO",
      ja: "V-05 // アナ・リベイロ"
    },
    kind: "movie",
    hasAudio: false,
    voiceCue: { slug: "ana", file: "opening" },
    visitorId: "V-05",
    videoSrc: "./videos/ana/flinch.mp4",
    fallbackVideoSrc: "./videos/ana/flinch.mp4",
    posterSrc: "./portraits/reactions/ana_flinch.jpg",
    fallbackPosterSrc: "./portraits/ana.jpg",
    row: 1,
    col: 16,
    choices: [
      {
        id: "n3_ana_admit",
        nextNodeId: "n4_linmei_conspiracy",
        directVerdict: "ADMIT",
        label: {
          zh: "相信安娜的供氧警报，立刻开门",
          en: "Trust Ana's O2 warning & open the gate",
          ja: "アナの警告を信じてゲートを開ける"
        },
        sublabel: {
          zh: "放行 // 她颤抖的呼吸不像演出来的",
          en: "ADMIT // Save the station oxygen loop",
          ja: "通過 // 酸素供給を復旧させる"
        }
      },
      {
        id: "n3_ana_purge",
        nextNodeId: "n4_linmei_conspiracy",
        directVerdict: "PURGE",
        label: {
          zh: "识破她在借恐慌闯关，拉闸净化",
          en: "She's exploiting panic to breach Gate 0 — Purge",
          ja: "パニックを利用した侵入と見て焼却する"
        },
        sublabel: {
          zh: "净化 // 真安娜宁可闷死也不愿欠任何人情",
          en: "PURGE [-1 FUEL] // Lock down before Night 4",
          ja: "焼却 [-1 FUEL] // 第4夜へ備える"
        }
      },
      {
        id: "n3_ana_side_audit",
        nextNodeId: "n3_side_audit",
        isSideQuest: true,
        sideQuestVisitorId: "V-05",
        sideQuestReturnNodeId: "n4_linmei_conspiracy",
        label: {
          zh: "🔍 磁暴盲审 · 深度鉴真安娜（高玩支线）",
          en: "🔍 Blind Storm Audit · Ana (Side Quest)",
          ja: "🔍 磁気嵐下でアナを尋問（任意支線）"
        },
        sublabel: {
          zh: "可选硬核支线 · 磁暴下验证 V-05 行为习惯",
          en: "Optional blackout interrogation · V-05",
          ja: "任意の盲目尋問支線"
        }
      }
    ]
  },
  {
    id: "n3_side_audit",
    chapter: "night3_storm",
    code: "INT-04",
    title: {
      zh: "防爆窗支线 · 极夜磁暴盲审",
      en: "Side Quest · Night 3 Blackout Audit",
      ja: "支線尋問・第3夜磁気嵐ブラインド審問"
    },
    subtitle: {
      zh: "高玩支线模式：强磁暴导致热像与强光全部失效，只能凭直觉与文本破绽审出伪人。",
      en: "Hardcore blackout mode: all sensors offline—spot contradictions purely through dialogue.",
      ja: "高難度支線：全センサー故障下での対話尋問。"
    },
    speaker: {
      zh: "高玩支线 // 磁暴盲审台",
      en: "SIDE QUEST // BLACKOUT AUDIT",
      ja: "任意支線 // 磁気嵐尋問"
    },
    kind: "interrogation",
    visitorId: "V-05",
    videoSrc: "./videos/ana/idle.mp4",
    fallbackVideoSrc: "./videos/ana/idle.mp4",
    posterSrc: "./portraits/ana.jpg",
    fallbackPosterSrc: "./portraits/ana.jpg",
    row: 2,
    col: 16
  },
  // ==================== NIGHT 4 · MUTINY & ESCAPE ====================
  {
    id: "n4_linmei_conspiracy",
    chapter: "night4_mutiny",
    code: "SC-05A",
    title: {
      zh: "第 4 夜 · 林梅的潜艇撤离密约",
      en: "Night 4 · Dr. Lin Mei's Evacuation Pact",
      ja: "第4夜・リンメイの潜水艦脱出密約"
    },
    subtitle: {
      zh: "“破冰救援艇还有二十分钟启航，条例第 14 条归你，潜艇舱位有你的位置——放我过去。”",
      en: "\"The sub launches in twenty minutes. Stamp my clearance and I'll hold a berth for you—open the gate.\"",
      ja: "「救助潜水艦が20分後に出航する。あなたの席も用意してあるわ——通して」"
    },
    speaker: {
      zh: "V-07 // Dr. Lin Mei 合规主审官",
      en: "V-07 // DR. LIN MEI",
      ja: "V-07 // リン・メイ監査官"
    },
    kind: "movie",
    hasAudio: false,
    voiceCue: { slug: "linmei", file: "opening" },
    visitorId: "V-07",
    videoSrc: "./videos/linmei/lean_in.mp4",
    fallbackVideoSrc: "./videos/linmei/lean_in.mp4",
    posterSrc: "./portraits/reactions/linmei_lean_in.jpg",
    fallbackPosterSrc: "./portraits/linmei.jpg",
    row: 1,
    col: 17,
    choices: [
      {
        id: "n4_linmei_admit",
        nextNodeId: "n4_hannah_whistle",
        directVerdict: "ADMIT",
        label: {
          zh: "答应林梅，打开撤离潜艇坞门",
          en: "Take the deal & open the sub-dock path",
          ja: "取引に応じ潜水艦ドックを開放する"
        },
        sublabel: {
          zh: "放行 // 先保住全站唯一的撤离机会",
          en: "ADMIT // Secure a seat on the escape sub",
          ja: "通過 // 脱出の望みを繋ぐ"
        }
      },
      {
        id: "n4_linmei_purge",
        nextNodeId: "n4_hannah_whistle",
        directVerdict: "PURGE",
        label: {
          zh: "绝不拿条例做交易，启动净化",
          en: "Refuse the bribe & ignite purge jets",
          ja: "取引を拒否し焼却を起動する"
        },
        sublabel: {
          zh: "净化 // 这张完美笑脸下一定藏着破绽",
          en: "PURGE [-1 FUEL] // Never let a mimic reach the sub",
          ja: "焼却 [-1 FUEL] // 擬態体を外へ逃がさない"
        }
      },
      {
        id: "n4_linmei_side_audit",
        nextNodeId: "n4_side_audit",
        isSideQuest: true,
        sideQuestVisitorId: "V-07",
        sideQuestReturnNodeId: "n4_hannah_whistle",
        label: {
          zh: "🔍 进入防爆窗 · 拆穿林梅高阶伪装（高玩支线）",
          en: "🔍 Booth Interrogation · Trap Lin Mei (Side Quest)",
          ja: "🔍 防爆窓でリンメイの偽装を暴く（任意支線）"
        },
        sublabel: {
          zh: "高阶博弈 · 需拆穿她的“借口前提”才露馅",
          en: "High-tier audit · shatter her safety precondition",
          ja: "高階擬態体との頭脳戦"
        }
      }
    ]
  },
  {
    id: "n4_hannah_whistle",
    chapter: "night4_mutiny",
    code: "SC-05B",
    title: {
      zh: "黎明前最后敲门 · 汉娜的黑匣子",
      en: "Night 4 · Hannah's Black-Box Tape",
      ja: "第4夜・ハンナのブラックボックス録音"
    },
    subtitle: {
      zh: "暴雨雪拍窗，汉娜高举着沾血的黑匣子：“前任 #08 根本不是失踪！里面全是真相录音！”",
      en: "Hannah slams a bloodstained black-box recorder onto the glass: \"Operator #08 didn't vanish—play this tape!\"",
      ja: "「前任の#08は行方不明なんかじゃない！この録音に全部残っている！」"
    },
    speaker: {
      zh: "V-08 // Hannah Weiss",
      en: "V-08 // HANNAH WEISS",
      ja: "V-08 // ハンナ・ヴァイス"
    },
    kind: "movie",
    hasAudio: false,
    voiceCue: { slug: "hannah", file: "opening" },
    visitorId: "V-08",
    videoSrc: "./videos/hannah/flinch.mp4",
    fallbackVideoSrc: "./videos/hannah/flinch.mp4",
    posterSrc: "./portraits/reactions/hannah_flinch.jpg",
    fallbackPosterSrc: "./portraits/hannah.jpg",
    row: 1,
    col: 18,
    choices: [
      {
        id: "n4_hannah_admit",
        nextNodeId: "n5_final_mirror",
        directVerdict: "ADMIT",
        label: {
          zh: "开门接过黑匣子，迎战第 5 夜真相",
          en: "Let Hannah in & play #08's black-box tape",
          ja: "ハンナを入れて録音を受け取る"
        },
        sublabel: {
          zh: "放行 // 终于凑齐了站内黑幕的全部证据",
          en: "ADMIT // Enter Night 5 finale armed with truth",
          ja: "通過 // 第5夜の最終決断へ"
        }
      },
      {
        id: "n4_hannah_purge",
        nextNodeId: "n5_final_mirror",
        directVerdict: "PURGE",
        label: {
          zh: "太晚了——连她一起净化，独自迎接黎明",
          en: "Trust no one anymore & purge Gate 0",
          ja: "誰も信じない——焼却して一人で夜明けを待つ"
        },
        sublabel: {
          zh: "净化 // 第 5 夜大门外只剩下你自己的倒影",
          en: "PURGE [-1 FUEL] // Face the Night 5 mirror alone",
          ja: "焼却 [-1 FUEL] // 孤独に第5夜を迎える"
        }
      },
      {
        id: "n4_hannah_side_audit",
        nextNodeId: "n4_side_audit",
        isSideQuest: true,
        sideQuestVisitorId: "V-08",
        sideQuestReturnNodeId: "n5_final_mirror",
        label: {
          zh: "🔍 进入防爆窗 · 拆梯审讯汉娜（高玩支线）",
          en: "🔍 Booth Interrogation · Trap Hannah (Side Quest)",
          ja: "🔍 防爆窓でハンナを徹底尋問（任意支線）"
        },
        sublabel: {
          zh: "高玩支线 · 用自由提问击破她的最后防线",
          en: "Optional high-tier interrogation · V-08",
          ja: "高難度尋問支線"
        }
      }
    ]
  },
  {
    id: "n4_side_audit",
    chapter: "night4_mutiny",
    code: "INT-05",
    title: {
      zh: "防爆窗支线 · 第 4 夜高阶拆梯审讯",
      en: "Side Quest · Night 4 High-Tier Audit",
      ja: "支線尋問・第4夜高階擬態対決"
    },
    subtitle: {
      zh: "高玩支线模式：高阶伪人已学会全部人性借口——用自由追问拆穿退路前提，迫其露馅。",
      en: "High-tier interrogation: strip away the mimic's fallback precondition via custom questioning.",
      ja: "任意支線：自由尋問で高階擬態体の逃げ道を塞げ。"
    },
    speaker: {
      zh: "高玩支线 // 第 4 夜终极审讯",
      en: "SIDE QUEST // NIGHT 4 BOSS AUDIT",
      ja: "任意支線 // 第4夜ボス尋問"
    },
    kind: "interrogation",
    visitorId: "V-08",
    videoSrc: "./videos/hannah/idle.mp4",
    fallbackVideoSrc: "./videos/hannah/idle.mp4",
    posterSrc: "./portraits/hannah.jpg",
    fallbackPosterSrc: "./portraits/hannah.jpg",
    row: 2,
    col: 18
  },
  // ==================== NIGHT 5 · MIRROR FINALE & 4 ENDINGS ====================
  {
    id: "n5_final_mirror",
    chapter: "night5_finale",
    code: "SC-06A",
    title: {
      zh: "第 5 夜终局 · 窗外站着另一个“你”",
      en: "Night 5 Finale · Another \"You\" At The Glass",
      ja: "第5夜終局・窓の外の『もう一人の自分』"
    },
    subtitle: {
      zh: "极昼的第一缕红光穿透暴风雪。防爆窗外走来一个穿着和你一模一样工服的身影——系统锁定了门禁，只等你按出整部电影的最终结局。",
      en: "Dawn breaks blood-red across the blizzard. Outside the glass stands a figure wearing your exact OP#09 parka—make your final choice.",
      ja: "夜明けの光の中、窓の外にあなたと瓜二つの人影が現れる。最後の決断を下せ。"
    },
    speaker: {
      zh: "第 5 夜终章 // 镜像对峙",
      en: "NIGHT 05 FINALE // THE MIRROR CONFRONTATION",
      ja: "第5夜最終章 // 鏡像対峙"
    },
    kind: "movie",
    hasAudio: false,
    voiceCue: { slug: "operator09", file: "n5_ex_0" },
    videoSrc: "./videos/operator09/idle.mp4",
    fallbackVideoSrc: "./videos/operator09/idle.mp4",
    posterSrc: "./portraits/operator09.jpg",
    fallbackPosterSrc: "./portraits/operator09.jpg",
    row: 1,
    col: 19,
    choices: [
      {
        id: "n5_choose_dawn",
        nextNodeId: "ending_dawn_break",
        label: {
          zh: "炸毁冰芯井，带幸存者乘潜艇破冰逃生",
          en: "Detonate the ice-core well & escape at dawn",
          ja: "氷床井戸を爆破し、生存者と潜水艦で脱出する"
        },
        sublabel: {
          zh: "触发真结局 A · 《黎明破冰》",
          en: "ENDING A // Dawn Break",
          ja: "結末 A // 夜明けの砕氷"
        }
      },
      {
        id: "n5_choose_seal",
        nextNodeId: "ending_eternal_seal",
        label: {
          zh: "拉下全站总闸，将秘密永久封死在极夜",
          en: "Pull the master lockdown & bury Gate 0 in ice",
          ja: "全基地の主電源を落とし、秘密ごと極夜に封印する"
        },
        sublabel: {
          zh: "触发悲壮结局 B · 《极夜永封》",
          en: "ENDING B // Eternal Seal",
          ja: "結末 B // 極夜の永久封印"
        }
      },
      {
        id: "n5_choose_mirror",
        nextNodeId: "ending_mirror_assimilation",
        label: {
          zh: "打开最后一道玻璃门，走向雪雾里的“自己”",
          en: "Unlock the outer door & walk toward your double",
          ja: "最後のガラス扉を開け、雪霧の中の自分へ歩み寄る"
        },
        sublabel: {
          zh: "触发暗黑结局 C · 《镜像同化》",
          en: "ENDING C // Mirror Assimilation",
          ja: "結末 C // 鏡像同化"
        }
      },
      {
        id: "n5_choose_watch",
        nextNodeId: "ending_lone_watch",
        label: {
          zh: "独自守住零号岗亭到天亮，留下交班录像",
          en: "Hold Gate 0 alone until sunrise & record a tape",
          ja: "一人で第0関門を守り抜き、交代録画を残す"
        },
        sublabel: {
          zh: "触发孤守结局 D · 《零号交班》",
          en: "ENDING D // The Next Watch",
          ja: "結末 D // 零号引継ぎ"
        }
      },
      {
        id: "n5_choose_hardcore_audit",
        nextNodeId: "n5_final_mirror",
        isSideQuest: true,
        triggerNight5Audit: true,
        label: {
          zh: "🔍 进入第 5 夜 ORD-OS 硬核人格自审（高玩挑战）",
          en: "🔍 Launch Hardcore ORD-OS Night 5 Audit (Challenge)",
          ja: "🔍 ORD-OS 第5夜ハードコア自己監査へ（高難度）"
        },
        sublabel: {
          zh: "调取你此前所有放行与净化记录，接受系统终审打分",
          en: "Full forensic scorecard over your booth decisions",
          ja: "これまでの全記録をシステムで厳密査定"
        }
      }
    ]
  },
  {
    id: "ending_dawn_break",
    chapter: "night5_finale",
    code: "SC-END-A",
    endingId: "A",
    endingTag: {
      zh: "真结局 A // DAWN BREAK",
      en: "TRUE ENDING A // DAWN BREAK",
      ja: "真結末 A // 夜明けの砕氷"
    },
    title: {
      zh: "结局 A · 黎明破冰",
      en: "Ending A · Dawn Break",
      ja: "結末 A · 夜明けの砕氷"
    },
    subtitle: {
      zh: "冰芯井在橙红火光中崩塌，极地潜艇冲开十米厚的冰脊浮上朝阳。你守住了人性的底线，带着真正活下来的人逃离斯瓦尔巴。",
      en: "Cryo vents erupt behind you as the rescue submarine breaks cleanly through ten meters of pack ice into blinding polar sunrise.",
      ja: "爆炎に包まれる基地を背に、救助潜水艦が厚い氷を砕いて極地の朝日へと浮上した。"
    },
    speaker: {
      zh: "剧终 · 斯瓦尔巴救援海域 // DAWN BREAK",
      en: "FINALE // SVALBARD OPEN WATER",
      ja: "終幕 // スヴァールバル外海"
    },
    kind: "ending",
    hasAudio: false,
    videoSrc: "./videos/chamber/admit.mp4",
    fallbackVideoSrc: "./videos/chamber/admit.mp4",
    posterSrc: "./portraits/lobby_bg.jpg",
    fallbackPosterSrc: "./portraits/lobby_bg.jpg",
    clips: [
      {
        id: "end_a_sub_breach",
        videoSrc: "./videos/chamber/admit.mp4",
        fallbackVideoSrc: "./videos/chamber/admit.mp4",
        posterSrc: "./portraits/reactions/chamber_admit.jpg",
        fallbackPosterSrc: "./portraits/lobby_bg.jpg",
        hasAudio: false,
        badge: { zh: "闸门全开 · 破冰撤离", en: "DOCK OPEN · ESCAPE", ja: "ドック開放 · 脱出" },
        speaker: {
          zh: "0 号隔离窗 // 潜艇接驳通道",
          en: "GATE 0 // SUBMARINE BAY",
          ja: "第0関門 // 潜水艦ドック"
        },
        subtitle: {
          zh: "绿色通行灯连续闪烁，你带着幸存者穿过失压走廊冲进破冰潜艇。",
          en: "Green docking lamps flare along the corridor as the remaining crew sprints aboard the rescue submarine.",
          ja: "緑の開放灯が点滅し、生存者たちは氷海へ繋がる救助潜水艦へ駆け込んだ。"
        }
      },
      {
        id: "end_a_polar_sunrise",
        videoSrc: "./videos/chamber/whiteout.mp4",
        fallbackVideoSrc: "./videos/chamber/admit.mp4",
        posterSrc: "./portraits/lobby_bg.jpg",
        fallbackPosterSrc: "./portraits/lobby_bg.jpg",
        hasAudio: false,
        badge: { zh: "剧终 · 黎明破冰", en: "ENDING A // DAWN BREAK", ja: "結末 A // 夜明けの砕氷" },
        speaker: {
          zh: "斯瓦尔巴救援海域 // DAWN BREAK",
          en: "SVALBARD OPEN WATER // ENDING A",
          ja: "スヴァールバル外海 // 結末 A"
        },
        subtitle: {
          zh: "冰芯井在橙红火光中崩塌，极地潜艇冲开十米厚的冰脊浮上朝阳。",
          en: "Behind the shattered station, the rescue sub breaks through ten meters of pack ice into blinding polar sunrise.",
          ja: "爆炎に包まれる基地を背に、救助潜水艦が厚い氷を砕いて極地の朝日へと浮上した。"
        }
      }
    ],
    row: 0,
    col: 20
  },
  {
    id: "ending_eternal_seal",
    chapter: "night5_finale",
    code: "SC-END-B",
    endingId: "B",
    endingTag: {
      zh: "悲壮结局 B // ETERNAL SEAL",
      en: "ENDING B // ETERNAL SEAL",
      ja: "結末 B // 極夜の永久封印"
    },
    title: {
      zh: "结局 B · 极夜永封",
      en: "Ending B · Eternal Seal",
      ja: "結末 B · 極夜の永久封印"
    },
    subtitle: {
      zh: "全站高温净化阀门与液氮密封门同时锁死。零下 46°C 的冰层吞没了一切无线电信号，人类世界甚至不知道这里曾发生过一场无声战争。",
      en: "Master thermal valves fuse shut as Arctic ice entombs Outpost 0 forever—saving the mainland from a secret nobody will ever read.",
      ja: "全ての隔壁と高熱焼却弁が封鎖された。零下46度の氷の下に、誰も知らない戦いが永遠に封印された。"
    },
    speaker: {
      zh: "剧终 · 零号隔离窗总闸锁死 // ETERNAL SEAL",
      en: "FINALE // OUTPOST 0 ENTOMBED",
      ja: "終幕 // 第0基地完全封印"
    },
    kind: "ending",
    hasAudio: true,
    isLipSync: false,
    videoSrc: "./videos/story/n1_elena_outcome_purge.mp4",
    fallbackVideoSrc: "./videos/chamber/purge.mp4",
    posterSrc: "./portraits/reactions/chamber_purge.jpg",
    fallbackPosterSrc: "./portraits/reactions/chamber_purge.jpg",
    clips: [
      {
        id: "end_b_purge_blast",
        videoSrc: "./videos/story/n1_elena_outcome_purge.mp4",
        fallbackVideoSrc: "./videos/chamber/purge.mp4",
        posterSrc: "./portraits/reactions/chamber_purge.jpg",
        fallbackPosterSrc: "./portraits/reactions/chamber_purge.jpg",
        hasAudio: true,
        isLipSync: false,
        badge: { zh: "终局锁死 · 热浪", en: "SEAL · PURGE", ja: "封鎖 · 焼却" },
        speaker: { zh: "全站热力封存 // GATE 0", en: "MASTER LOCKDOWN // GATE 0", ja: "全基地封鎖 // GATE 0" },
        subtitle: {
          zh: "火光把防爆玻璃烧得通红，你亲手合上了通往外界的最后一道气压闸门。",
          en: "Blinding flames rattle the blast glass as you pull the final outer airlock seal.",
          ja: "炎が防爆ガラスを赤く染め、あなたは外界へ繋がる最後の扉を閉じた。"
        }
      },
      {
        id: "end_b_frozen_station",
        videoSrc: "./videos/story/prologue_01.mp4",
        fallbackVideoSrc: "./videos/chamber/whiteout.mp4",
        posterSrc: "./portraits/story/prologue_01.jpg",
        fallbackPosterSrc: "./portraits/story/prologue_01.jpg",
        hasAudio: false,
        badge: { zh: "剧终 · 极夜永封", en: "ENDING B // SEALED", ja: "結末 B // 永久封印" },
        speaker: { zh: "极夜档案已归档 // 结局 B", en: "ARCHIVE CLOSED // ENDING B", ja: "記録閉鎖 // 結末 B" },
        subtitle: {
          zh: "暴风雪彻底抹平了冰面脚印。零号前哨站成为地球最北端一座沉默的墓碑。",
          en: "Polar wind erases every footprint overhead. Outpost 0 goes silent beneath the ice.",
          ja: "吹雪が足跡を消し去る。第0前哨基地は永遠の氷の下へ沈黙した。"
        }
      }
    ],
    row: 1,
    col: 20
  },
  {
    id: "ending_mirror_assimilation",
    chapter: "night5_finale",
    code: "SC-END-C",
    endingId: "MIRROR",
    endingTag: {
      zh: "暗黑结局 C // MIRROR ASSIMILATION",
      en: "DARK ENDING C // MIRROR ASSIMILATION",
      ja: "暗黒結末 C // 鏡像同化"
    },
    title: {
      zh: "结局 C · 镜像同化",
      en: "Ending C · Mirror Assimilation",
      ja: "結末 C · 鏡像同化"
    },
    subtitle: {
      zh: "门打开的那一秒，外面的“你”露出完全同步的微笑。明天早上，会有一个值班员 #09 准时搭乘救援潜艇回到岸上——只是没人知道谁进来了。",
      en: "As the airlock opens, your double mirrors your exact smile. Tomorrow an Operator #09 boards the rescue sub—nobody asks which one walked out.",
      ja: "扉が開いた瞬間、向こう側の『あなた』が完璧に同じ微笑みを浮かべた。明朝、一人の#09が救出船へ乗る。"
    },
    speaker: {
      zh: "剧终 · 玻璃门内外的同一个声音 // MIRROR",
      en: "FINALE // TWO REFLECTIONS, ONE VOICE",
      ja: "終幕 // 鏡像の交代"
    },
    kind: "ending",
    hasAudio: false,
    videoSrc: "./videos/operator09/idle.mp4",
    fallbackVideoSrc: "./videos/operator09/idle.mp4",
    posterSrc: "./portraits/operator09.jpg",
    fallbackPosterSrc: "./portraits/operator09.jpg",
    clips: [
      {
        id: "end_c_shadow",
        videoSrc: "./videos/story/n1_cliffhanger_shadow.mp4",
        fallbackVideoSrc: "./videos/story/n1_corridor_aftermath.mp4",
        posterSrc: "./portraits/story/n1_corridor_aftermath.jpg",
        fallbackPosterSrc: "./portraits/operator09.jpg",
        hasAudio: true,
        isLipSync: false,
        badge: { zh: "门锁解除", en: "AIRLOCK OPEN", ja: "ロック解除" },
        speaker: { zh: "0 号岗亭走廊 // 门开了", en: "GATE 0 // DOOR UNLOCKED", ja: "第0関門 // 解錠" },
        subtitle: {
          zh: "液压门缓缓滑开，寒冷的白雾涌进工作台，那个影子一步步向你走来。",
          en: "Pneumatic latches release as freezing fog spills inward and the figure steps closer.",
          ja: "重い扉が開き、白い冷気とともにその影がゆっくりと近づいてくる。"
        }
      },
      {
        id: "end_c_mirror_face",
        videoSrc: "./videos/operator09/idle.mp4",
        fallbackVideoSrc: "./videos/operator09/idle.mp4",
        posterSrc: "./portraits/operator09.jpg",
        fallbackPosterSrc: "./portraits/operator09.jpg",
        hasAudio: false,
        voiceCue: { slug: "operator09", file: "n5_ex_0" },
        badge: { zh: "镜面同化", en: "ENDING C // MIRROR", ja: "結末 C // 鏡像同化" },
        speaker: { zh: "值班员 #09 // 结局 C", en: "OPERATOR #09 // ENDING C", ja: "当直官 #09 // 結末 C" },
        subtitle: {
          zh: "“放心，我会替你写完这份最完美的交班报告的。”",
          en: "\"Don't worry. I'll file the most textbook handover report you've ever seen.\"",
          ja: "「安心して。君の代わりに完璧な引継ぎ報告書を書いておくよ。」"
        }
      }
    ],
    row: 2,
    col: 20
  },
  {
    id: "ending_lone_watch",
    chapter: "night5_finale",
    code: "SC-END-D",
    endingId: "D",
    endingTag: {
      zh: "孤守结局 D // THE NEXT WATCH",
      en: "ENDING D // THE NEXT WATCH",
      ja: "結末 D // 零号引継ぎ"
    },
    title: {
      zh: "结局 D · 零号交班",
      en: "Ending D · The Next Watch",
      ja: "結末 D · 零号引継ぎ"
    },
    subtitle: {
      zh: "你拒开了最后一道门，一个人坐在控制台前熬到了天亮。你打开录像机录下和当年 #08 一模一样的遗言，等着下一班接替者坐上这把椅子。",
      en: "You kept the final hatch locked until sunrise, then switched on the booth camcorder to leave the exact same warning #08 once recorded.",
      ja: "最後まで扉を開けず夜明けを迎えたあなたは、カメラを回し前任#08と同じ警告を録画した。"
    },
    speaker: {
      zh: "剧终 · #09 交班录像 // ENDING D",
      en: "FINALE // #09 HANDOVER TAPE",
      ja: "終幕 // #09 引継ぎ録画"
    },
    kind: "ending",
    hasAudio: true,
    videoSrc: "./videos/story/prequel_op08_warning.mp4",
    fallbackVideoSrc: "./videos/chamber/whiteout.mp4",
    posterSrc: "./portraits/story/prologue_01.jpg",
    fallbackPosterSrc: "./portraits/story/prologue_01.jpg",
    clips: [
      {
        id: "end_d_camcorder",
        videoSrc: "./videos/story/prequel_op08_warning.mp4",
        fallbackVideoSrc: "./videos/chamber/whiteout.mp4",
        posterSrc: "./portraits/story/prologue_01.jpg",
        fallbackPosterSrc: "./portraits/story/prologue_01.jpg",
        hasAudio: true,
        badge: { zh: "原声口型 · 循环交班", en: "LIP-SYNC // TAPE", ja: "口型音声 // 録画" },
        speaker: { zh: "值班员 #09 // 交班录像", en: "OP #09 // HANDOVER TAPE", ja: "当直官 #09 // 引継映像" },
        subtitle: {
          zh: "“记住……越是完美得像教科书的，越不是人。”",
          en: "\"Remember... whoever sounds too textbook-perfect isn't human.\"",
          ja: "「忘れるな……教科書通りに完璧すぎる相手ほど、人間じゃない。」"
        }
      },
      {
        id: "end_d_sunrise",
        videoSrc: "./videos/chamber/whiteout.mp4",
        fallbackVideoSrc: "./videos/chamber/whiteout.mp4",
        posterSrc: "./portraits/lobby_bg.jpg",
        fallbackPosterSrc: "./portraits/lobby_bg.jpg",
        hasAudio: false,
        badge: { zh: "剧终 · 孤守黎明", en: "ENDING D // WATCH", ja: "結末 D // 孤独な夜明け" },
        speaker: { zh: "斯瓦尔巴第 6 夜将至 // 结局 D", en: "NIGHT 06 AWAITS // ENDING D", ja: "第6夜が迫る // 結末 D" },
        subtitle: {
          zh: "朝阳照亮冰原，你把录像带压在岗位日志下面，默默迎来了下一阵风雪。",
          en: "Sunlight hits the frosted glass as you set the cassette beside Logbook #10.",
          ja: "朝日が氷原を照らす中、次の交代要員のための記録を静かに机に置いた。"
        }
      }
    ],
    row: 3,
    col: 20
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
  { id: "e_n1l_after_n2", from: "n1_leo_aftermath", to: "n2_arthur_standoff", branch: "default" },
  { id: "e_n2a_marcus", from: "n2_arthur_standoff", to: "n2_marcus_clash", branch: "default" },
  { id: "e_n2a_side", from: "n2_arthur_standoff", to: "n2_side_audit", branch: "default" },
  { id: "e_n2m_n3", from: "n2_marcus_clash", to: "n3_storm_blackout", branch: "default" },
  { id: "e_n2m_side", from: "n2_marcus_clash", to: "n2_side_audit", branch: "default" },
  { id: "e_n2side_marcus", from: "n2_side_audit", to: "n2_marcus_clash", branch: "default" },
  { id: "e_n3i_ana", from: "n3_storm_blackout", to: "n3_ana_betrayal", branch: "default" },
  { id: "e_n3i_side", from: "n3_storm_blackout", to: "n3_side_audit", branch: "default" },
  { id: "e_n3a_n4", from: "n3_ana_betrayal", to: "n4_linmei_conspiracy", branch: "default" },
  { id: "e_n3a_side", from: "n3_ana_betrayal", to: "n3_side_audit", branch: "default" },
  { id: "e_n3side_ana", from: "n3_side_audit", to: "n3_ana_betrayal", branch: "default" },
  { id: "e_n4l_hannah", from: "n4_linmei_conspiracy", to: "n4_hannah_whistle", branch: "default" },
  { id: "e_n4l_side", from: "n4_linmei_conspiracy", to: "n4_side_audit", branch: "default" },
  { id: "e_n4h_n5", from: "n4_hannah_whistle", to: "n5_final_mirror", branch: "default" },
  { id: "e_n4h_side", from: "n4_hannah_whistle", to: "n4_side_audit", branch: "default" },
  { id: "e_n4side_hannah", from: "n4_side_audit", to: "n4_hannah_whistle", branch: "default" },
  { id: "e_n5_end_a", from: "n5_final_mirror", to: "ending_dawn_break", branch: "admit" },
  { id: "e_n5_end_b", from: "n5_final_mirror", to: "ending_eternal_seal", branch: "purge" },
  { id: "e_n5_end_c", from: "n5_final_mirror", to: "ending_mirror_assimilation", branch: "default" },
  { id: "e_n5_end_d", from: "n5_final_mirror", to: "ending_lone_watch", branch: "default" }
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
