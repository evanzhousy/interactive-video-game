import { EP0_SUBTITLE_CUES } from "./ep0-cues.generated.js";
import type { EndingId, LocalizedText } from "./types.js";

export const EP0_MEDIA_BASE_URL = "https://pub-0ab426eff1a7472199ccc8f2292cac9e.r2.dev/ep0";

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

export interface StorySubtitleCue {
  startSec: number;
  endSec: number;
  speaker: LocalizedText;
  text: LocalizedText;
}

export interface StoryClipSegment {
  id: string;
  videoSrc: string;
  fallbackVideoSrc: string;
  posterSrc: string;
  fallbackPosterSrc: string;
  hasAudio?: boolean;
  isLipSync?: boolean;
  durationSec?: number;
  voiceCue?: StoryVoiceCue;
  speaker: LocalizedText;
  subtitle: LocalizedText;
  subtitleCues?: readonly StorySubtitleCue[];
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
      zh: "序章 · 极夜前哨与深冰井喷",
      en: "Episode 0 · Svalbard Arrival & 3,800m Blowout",
      ja: "序章 · 極夜基地と深氷噴出"
    },
    subtitle: {
      zh: "2036 年 10 月 14 日，北纬 78°13′。最后一班补给船鸣笛远去，九个同伴在公共食堂围喝热汤——十四天后，地下三千八百米基岩井喷撕裂了全站。",
      en: "October 14, 2036, 78°13'N. As the last supply ship sails before four months of Polar Night, nine crewmates share hot soup in the mess hall—until a 3,800m bedrock blowout seals the station.",
      ja: "2036年10月14日、北緯78度13分。最後の補給船が去り、食堂で温かな湯を囲んだ9人の仲間たち。14日後、地下3,800mの基盤岩噴出が基地を閉ざす。"
    },
    speaker: {
      zh: "序幕电影 // 第一章：抵达斯瓦尔巴（05:15）",
      en: "PROLOGUE FILM // ARRIVAL & BLOWOUT (05:15)",
      ja: "序幕映画 // スヴァールバル到着 (05:15)"
    },
    kind: "movie",
    hasAudio: true,
    isLipSync: false,
    videoSrc: `${EP0_MEDIA_BASE_URL}/ep0_sc00a1_arrival.mp4`,
    fallbackVideoSrc: "./videos/story/ep0_heli_arrival.mp4",
    posterSrc: "./portraits/story/ep0_heli_arrival.jpg",
    fallbackPosterSrc: "./portraits/lobby_bg.jpg",
    clips: [
      {
        id: "ep0_sc00a1_arrival",
        videoSrc: `${EP0_MEDIA_BASE_URL}/ep0_sc00a1_arrival.mp4`,
        fallbackVideoSrc: "./videos/story/ep0_heli_arrival.mp4",
        posterSrc: "./portraits/story/ep0_heli_arrival.jpg",
        fallbackPosterSrc: "./portraits/lobby_bg.jpg",
        hasAudio: true,
        isLipSync: false,
        durationSec: 60,
        subtitleCues: EP0_SUBTITLE_CUES.ep0_sc00a1_arrival,
        badge: { zh: "SC-00A-1 · 末班降落 (01:00)", en: "SC-00A-1 · ARRIVAL (01:00)", ja: "SC-00A-1 · 到着 (01:00)" },
        speaker: {
          zh: "字幕卡 // 2036.10.14",
          en: "TITLE CARD // OCT 14, 2036",
          ja: "字幕 // 2036.10.14"
        },
        subtitle: {
          zh: "2036.10.14 · 斯瓦尔巴零号站（78°13'N）· 室外 -46°C · 距离极夜还有 12 天",
          en: "OCT 14, 2036 · SVALBARD OUTPOST 0 (78°13'N) · -46°C · 12 DAYS TO POLAR NIGHT",
          ja: "2036.10.14 · スヴァールバル第0基地（北緯78°13'）· 屋外 -46°C · 極夜まで12日"
        }
      },
      {
        id: "ep0_sc00a2_canteen_crew",
        videoSrc: `${EP0_MEDIA_BASE_URL}/ep0_sc00a2_canteen_crew.mp4`,
        fallbackVideoSrc: "./videos/story/ep0_crew_dinner.mp4",
        posterSrc: "./portraits/story/ep0/ep0_canteen_leo_thor.jpg",
        fallbackPosterSrc: "./portraits/story/ep0_crew_dinner.jpg",
        hasAudio: true,
        isLipSync: false,
        durationSec: 65,
        subtitleCues: EP0_SUBTITLE_CUES.ep0_sc00a2_canteen_crew,
        badge: { zh: "SC-00A-2 · 食堂热汤 (01:05)", en: "SC-00A-2 · MESS HALL (01:05)", ja: "SC-00A-2 · 食堂 (01:05)" },
        speaker: {
          zh: "焊工 老周 // 公共食堂",
          en: "WELDER ZHOU // MESS HALL",
          ja: "溶接工・老周 // 食堂"
        },
        subtitle: {
          zh: "气密门隔断 -46°C 狂风。莱奥替你挑开卡死拉链，老周笑揭短，钻井工托尔给 #08 倒酒约好奥斯陆索菲亚的琴与两盒红双喜。",
          en: "The airlock seals out -46°C gusts. Leo frees your frozen zipper, welder Zhou teases him, and driller Thor pours #08 a cup over bets of Sofia's piano and Double Happiness cigarettes.",
          ja: "防爆扉が-46°Cの風を断つ。レオが凍結したファスナーを直し、老周が冗談を飛ばし、掘削員トールはソフィアのピアノと紅双喜の賭けを語り#08に酒を注ぐ。"
        }
      },
      {
        id: "ep0_sc00a2_canteen_clash",
        videoSrc: `${EP0_MEDIA_BASE_URL}/ep0_sc00a2_canteen_clash.mp4`,
        fallbackVideoSrc: "./videos/story/ep0_crew_dinner.mp4",
        posterSrc: "./portraits/story/ep0/ep0_canteen_marcus_stew.jpg",
        fallbackPosterSrc: "./portraits/story/ep0_crew_dinner.jpg",
        hasAudio: true,
        isLipSync: false,
        durationSec: 50,
        subtitleCues: EP0_SUBTITLE_CUES.ep0_sc00a2_canteen_clash,
        badge: { zh: "SC-00A-2 · 鹿肉与手术钳 (00:50)", en: "SC-00A-2 · STEW & SCALPEL (00:50)", ja: "SC-00A-2 · 鹿肉と鉗子 (00:50)" },
        speaker: {
          zh: "V-04 马库斯 & V-01 艾琳娜 // 长桌左侧",
          en: "MARCUS CHEN & DR. ELENA VANCE",
          ja: "マーカス & エレナ医師"
        },
        subtitle: {
          zh: "马库斯拍桌怒斥打翻汤锅的学徒，转身却把滚烫炖鹿肉塞进他怀里；艾琳娜擦净眼镜低声道：B 区手术台只认抽签与绝对公平。",
          en: "Marcus roars at a clumsy mess apprentice—then shoves his own steaming venison stew into the kid's chest. Dr. Vance wipes her glasses: on Sector B's table, only triage lots are fair.",
          ja: "マーカスは見習いを怒鳴りつけながら自分の熱い鹿肉シチューを押し付け、エレナは眼鏡を拭き「手術台では抽選と絶対的公平だけが文明」と言い切る。"
        }
      },
      {
        id: "ep0_sc00a2_canteen_corners",
        videoSrc: `${EP0_MEDIA_BASE_URL}/ep0_sc00a2_canteen_corners.mp4`,
        fallbackVideoSrc: "./videos/story/ep0_crew_dinner.mp4",
        posterSrc: "./portraits/story/ep0/ep0_corner_arthur_holm.jpg",
        fallbackPosterSrc: "./portraits/story/ep0_crew_dinner.jpg",
        hasAudio: true,
        isLipSync: false,
        durationSec: 50,
        subtitleCues: EP0_SUBTITLE_CUES.ep0_sc00a2_canteen_corners,
        badge: { zh: "SC-00A-2 · 角落埋线 (00:50)", en: "SC-00A-2 · CORNER VIGNETTES (00:50)", ja: "SC-00A-2 · 四隅の伏線 (00:50)" },
        speaker: {
          zh: "亚瑟 / 安娜 / 英格丽 / 林梅 / 汉娜 // 食堂四角",
          en: "ARTHUR / ANA / INGRID / LIN MEI / HANNAH",
          ja: "アーサー / アナ / イングリッド / リン / ハンナ"
        },
        subtitle: {
          zh: "亚瑟密收霍尔姆的《B区 3,800m 变更单》副联；安娜拿十万欧元扣款单当书签；英格丽悄悄篡改汉森心理评估；林梅擦净试剂；汉娜推开克莱尔的热可可。",
          en: "Arthur pockets Holm's 3,800m carbon slip; Ana bookmarks €100k debt; Ingrid stealthily alters Hansen's eval; Lin Mei wipes a spill; Hannah pushes Claire's cocoa five centimeters away.",
          ja: "アーサーは変更届の控えを懐に入れ、アナは罰金領収書を栞にし、イングリッドは心理評価を改竄、リンは試薬を拭き、ハンナは甘い話を退ける。"
        }
      },
      {
        id: "prequel_icecore_breach",
        videoSrc: `${EP0_MEDIA_BASE_URL}/prequel_icecore_breach.mp4`,
        fallbackVideoSrc: "./videos/story/prequel_icecore_breach.mp4",
        posterSrc: "./portraits/story/prequel_icecore_breach.jpg",
        fallbackPosterSrc: "./portraits/lobby_bg.jpg",
        hasAudio: true,
        isLipSync: false,
        durationSec: 38,
        subtitleCues: EP0_SUBTITLE_CUES.prequel_icecore_breach,
        badge: { zh: "SC-00A-3 · 3,800m 井喷 (00:38)", en: "SC-00A-3 · 3,800M BLOWOUT (00:38)", ja: "SC-00A-3 · 3,800m噴出 (00:38)" },
        speaker: {
          zh: "第 14 天 02:14 // 3,800m 古生代基岩主井",
          en: "DAY 14 · 02:14 // 3,800M BEDROCK RIG",
          ja: "14日目 02:14 // 地下3,800m掘削室"
        },
        subtitle: {
          zh: "第 14 天 02:14 · 钻头跌入 3,800 米超热液空腔，井压顶爆 490 bar，两套防喷器死卡！托尔与老孙在蒸汽倒灌中冲进回风道失踪。",
          en: "DAY 14 · 02:14 · The rig hits a 3,800m thermal cavity at 490 bar; dual BOP valves lock. Thor Berg and Lao Sun vanish into the steam-choked return duct.",
          ja: "14日目02:14。3,800mの熱水空洞に突入し490barへ暴走。トールと老孫は蒸気逆流の中、還気坑で消息を絶つ。"
        }
      },
      {
        id: "prologue_01_main",
        videoSrc: `${EP0_MEDIA_BASE_URL}/prologue_01_main.mp4`,
        fallbackVideoSrc: "./videos/story/prologue_01.mp4",
        posterSrc: "./portraits/story/ep0/ep0_briefing_topology.jpg",
        fallbackPosterSrc: "./portraits/story/prologue_01_handover.jpg",
        hasAudio: true,
        isLipSync: false,
        durationSec: 52,
        subtitleCues: EP0_SUBTITLE_CUES.prologue_01_main,
        badge: { zh: "SC-00A-3 · 中枢拓扑与质询 (00:52)", en: "SC-00A-3 · TOPOLOGY BRIEF (00:52)", ja: "SC-00A-3 · 構造会議 (00:52)" },
        speaker: {
          zh: "第 15 天 // 站长林德奎斯特 · 简报室",
          en: "DAY 15 // COMMANDER LINDQVIST",
          ja: "15日目 // リンドクヴィスト所長"
        },
        subtitle: {
          zh: "中枢主站与八座外环孤舱外廊已物理断流，0 号闸是进入中枢的唯一气密口。临上岗前，林德奎斯特翻出特罗姆瑟旧卷宗逼问你：",
          en: "Corridors linking the Hub to all 8 Outer Pods are severed; Gate 0 is the sole passage inside. Lindqvist taps your Tromsø record before sealing the door:",
          ja: "中枢と外環8孤立区画の連絡路は遮断され、第0関門が唯一の入口となった。着任前、所長はトロムソ時代の査問記録を突きつける——"
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
      zh: "序章 · 提前交班与清晨打盹",
      en: "Episode 0 · Early Handover & The Inner Knock",
      ja: "序章 · 早すぎる引継ぎと居眠り"
    },
    subtitle: {
      zh: "第 16 天你替发烧室友汉森连顶白班；凌晨 02:40 前任 #08 满眼血丝提前逃离岗亭。04:15 连续清醒满 20 小时的你抵着控制台合眼，身后中枢内门骤然三响！",
      en: "Day 16: after covering sick Hansen's day shift, #08 flees early at 02:40, hands shaking. At 04:15—20 hours awake—you nod off until three heavy knocks rattle the inner corridor window.",
      ja: "16日目、発熱したハンセンの代務を経て、02:40に前任#08が震える手で夜勤を押し付けて去る。04:15、連続覚醒20時間の限界で居眠りした瞬間、内側扉が3度叩かれる！"
    },
    speaker: {
      zh: "序幕电影 // 第 16 天深夜（01:00）",
      en: "PROLOGUE FILM // DAY 16 NIGHT (01:00)",
      ja: "序幕映画 // 16日目深夜 (01:00)"
    },
    kind: "movie",
    hasAudio: true,
    isLipSync: false,
    videoSrc: `${EP0_MEDIA_BASE_URL}/ep0_lonely_watch.mp4`,
    fallbackVideoSrc: "./videos/story/ep0_lonely_watch.mp4",
    posterSrc: "./portraits/story/ep0_lonely_watch.jpg",
    fallbackPosterSrc: "./portraits/lobby_bg.jpg",
    clips: [
      {
        id: "ep0_lonely_watch",
        videoSrc: `${EP0_MEDIA_BASE_URL}/ep0_lonely_watch.mp4`,
        fallbackVideoSrc: "./videos/story/ep0_lonely_watch.mp4",
        posterSrc: "./portraits/story/ep0_lonely_watch.jpg",
        fallbackPosterSrc: "./portraits/lobby_bg.jpg",
        hasAudio: true,
        isLipSync: false,
        durationSec: 36,
        subtitleCues: EP0_SUBTITLE_CUES.ep0_lonely_watch,
        badge: { zh: "SC-00B-1 · 提前交班 (00:36)", en: "SC-00B-1 · HANDOVER (00:36)", ja: "SC-00B-1 · 早朝引継 (00:36)" },
        speaker: {
          zh: "前任值班员 #08 // 第 16 天 02:40",
          en: "OUTGOING OPERATOR #08 // 02:40",
          ja: "前任当直官 #08 // 02:40"
        },
        subtitle: {
          zh: "“#09……剩下的下半夜交给你了，别多问，天亮前替我盯住这扇门。记住——别靠太近盯着那块防爆玻璃，也别单凭熟人嗓门拉开关。”",
          en: "\"#09... take the rest of the night shift. Keep back from the blast glass, and never pull the lever just on a familiar voice.\"",
          ja: "「#09……残りの夜番は任せた。防爆ガラスに顔を近づけるな。馴染みの声だけでレバーを引くなよ。」"
        }
      },
      {
        id: "prologue_02_main",
        videoSrc: `${EP0_MEDIA_BASE_URL}/prologue_02_main.mp4`,
        fallbackVideoSrc: "./videos/story/prologue_02.mp4",
        posterSrc: "./portraits/story/ep0/ep0_inner_door_knock.jpg",
        fallbackPosterSrc: "./portraits/story/prologue_02_knock.jpg",
        hasAudio: true,
        isLipSync: false,
        durationSec: 24,
        subtitleCues: EP0_SUBTITLE_CUES.prologue_02_main,
        badge: { zh: "SC-00B-2 · 内廊敲窗 (00:24)", en: "SC-00B-2 · INNER DOOR (00:24)", ja: "SC-00B-2 · 内側廊下 (00:24)" },
        speaker: {
          zh: "第 16 天 04:15 // 内侧走廊门小窗",
          en: "DAY 16 · 04:15 // INNER CORRIDOR WINDOW",
          ja: "16日目 04:15 // 内側廊下小窓"
        },
        subtitle: {
          zh: "连续清醒 20 小时后打盹，中枢内侧走廊门小窗突然响起三记重叩！值班主管隔着铁网喝问：“零号门灯跳黄三分钟没消警！你刚才睡过去了？！”",
          en: "Twenty hours awake catch up—until three gloved knocks slam the inner corridor wire-glass! Supervisor: \"Gate Zero stayed amber three minutes! Were you asleep?!\"",
          ja: "連続20時間覚醒の末に居眠りした瞬間、内側扉の小窓に3度の衝撃！監督「第0関門が3分も黄灯だぞ！居眠りか？！」"
        }
      }
    ],
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
      zh: "序章 · 断铅越权面板、#08 磁带与潜艇席位",
      en: "Episode 0 · Snipped Seal, Cassette & Submarine Seat",
      ja: "序章 · 切断された鉛封と遺言テープ"
    },
    subtitle: {
      zh: "第 17 天 07:00，#08 储物柜全空，闸门日志为零——唯手动越权面板铜丝铅封被剪断！控制台底下的黑磁带放出了整座孤站最恐怖的铁律。",
      en: "Day 17, 07:00: #08's locker is empty and normal gate logs read zero—yet the manual override copper lead seal hangs snipped in two. Taped underneath lies the truth.",
      ja: "17日目07:00、#08のロッカーは空、通常開閉記録はゼロ——だが手動オーバーライド盤の銅線鉛封が切断されていた。台の裏の黒テープが真実を語る。"
    },
    speaker: {
      zh: "序幕终章 // 真相揭晓（01:00）",
      en: "PROLOGUE CLIMAX // THE TRUTH (01:00)",
      ja: "序幕終章 // 真実の開示 (01:00)"
    },
    kind: "movie",
    hasAudio: true,
    isLipSync: false,
    videoSrc: `${EP0_MEDIA_BASE_URL}/ep0_empty_booth.mp4`,
    fallbackVideoSrc: "./videos/story/ep0_empty_booth.mp4",
    posterSrc: "./portraits/story/ep0/ep0_override_cut_seal.jpg",
    fallbackPosterSrc: "./portraits/story/ep0_empty_booth.jpg",
    clips: [
      {
        id: "ep0_empty_booth",
        videoSrc: `${EP0_MEDIA_BASE_URL}/ep0_empty_booth.mp4`,
        fallbackVideoSrc: "./videos/story/ep0_empty_booth.mp4",
        posterSrc: "./portraits/story/ep0/ep0_override_cut_seal.jpg",
        fallbackPosterSrc: "./portraits/story/ep0_empty_booth.jpg",
        hasAudio: true,
        isLipSync: false,
        durationSec: 18,
        subtitleCues: EP0_SUBTITLE_CUES.ep0_empty_booth,
        badge: { zh: "SC-00C-1 · 断铅越权面板 (00:18)", en: "SC-00C-1 · SNIPPED SEAL (00:18)", ja: "SC-00C-1 · 鉛封切断 (00:18)" },
        speaker: {
          zh: "第 17 天 07:00 // 手动越权面板特写",
          en: "DAY 17 · 07:00 // OVERRIDE PANEL",
          ja: "17日目 07:00 // オーバーライド盤"
        },
        subtitle: {
          zh: "#08 储物柜全空，正常开关次数为零——唯有「手动机械越权面板」铜丝铅封被剪断、越权日志清空！黄胶布下粘着一盘黑磁带。",
          en: "#08's locker is bare and gate logs sit at 0—yet the manual override copper lead seal is freshly snipped and wiped. Underneath hangs a black cassette in yellow tape.",
          ja: "#08のロッカーは空、通常記録は0——だが手動オーバーライド盤の銅線鉛封が切断されている！黄色いテープの下に黒いカセットが隠されていた。"
        }
      },
      {
        id: "prequel_op08_warning",
        videoSrc: `${EP0_MEDIA_BASE_URL}/prequel_op08_warning.mp4`,
        fallbackVideoSrc: "./videos/story/prequel_op08_warning.mp4",
        posterSrc: "./portraits/operator09.jpg",
        fallbackPosterSrc: "./portraits/operator09.jpg",
        hasAudio: true,
        isLipSync: true,
        durationSec: 27,
        subtitleCues: EP0_SUBTITLE_CUES.prequel_op08_warning,
        badge: { zh: "SC-00C-2 · #08 磁带原声 (00:27)", en: "SC-00C-2 · #08 TAPE (00:27)", ja: "SC-00C-2 · 遺言テープ (00:27)" },
        speaker: {
          zh: "前任值班员 #08 // 02:30 黄色胶布黑磁带",
          en: "OPERATOR #08 // 02:30 CASSETTE TAPE",
          ja: "前任当直官 #08 // 02:30 遺言テープ"
        },
        subtitle: {
          zh: "“昨晚失踪的托尔就站在闸室里，连欠我两盒红双喜、给索菲亚买琴都一字不差背得出！记住：只照体面人设（SAY）演、不知活人疼时违背诺言（DO）的裂痕——和自我介绍分毫不差的，不是人！今晚两点我在玻璃外看见了自己，若我从外门回来，别开！”",
          en: "\"Missing driller Thor stood outside reciting Sofia's piano and those two packs of Double Happiness word-for-word! Anything performing its own bio (SAY) without human cracks (DO) isn't human. At 02:00 I saw myself outside. If I return through the outer door—don't open!\"",
          ja: "「行方不明のトールがソフィアのピアノも紅双喜2箱の貸しも完璧に暗唱した！建前（SAY）だけ演じ誓いを破る裂け目（DO）を持たぬ奴は人間じゃない。今夜2時、ガラスの外に俺がいた。外扉から俺が戻っても絶対に開けるな！」"
        }
      },
      {
        id: "prologue_03_main",
        videoSrc: `${EP0_MEDIA_BASE_URL}/prologue_03_main.mp4`,
        fallbackVideoSrc: "./videos/story/prologue_03.mp4",
        posterSrc: "./portraits/story/prologue_03.jpg",
        fallbackPosterSrc: "./portraits/lobby_bg.jpg",
        hasAudio: true,
        isLipSync: false,
        durationSec: 15,
        subtitleCues: EP0_SUBTITLE_CUES.prologue_03_main,
        badge: { zh: "SC-00C-3 · 断联与鹦鹉螺 0 号 (00:15)", en: "SC-00C-3 · NAUTILUS-0 (00:15)", ja: "SC-00C-3 · 全線孤立 (00:15)" },
        speaker: {
          zh: "第 17 天 23:55 // 暴雪扯断主天线",
          en: "DAY 17 · 23:55 // ANTENNA SNAPPED",
          ja: "17日目 23:55 // 主アンテナ破断"
        },
        subtitle: {
          zh: "暴雪扯断主天线，唯余屏幕底行绿字：「码头铠装硬线联通：鹦鹉螺 0 号（06:00 待命）」。想起曾只剩最后艇位却留给自己的那一夜，你对自己低声说：",
          en: "Blizzard snaps the satellite mast; only dock hardwire 'NAUTILUS-0 (06:00 STANDBY)' glows green. Remembering keeping that final evacuation seat for yourself, you whisper:",
          ja: "吹雪がアンテナを破壊し、直通線『ノーチラス0号（06:00待機）』のみが残る。最後の脱出枠を自分に選んだ夜を思い出し、呟く——"
        }
      }
    ],
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
      zh: "V-01 // 艾琳娜·万斯医生",
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
        posterSrc: "./portraits/story/fb_elena_cabin3.jpg",
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
        videoSrc: "./videos/story/n1_corridor_aftermath_admit.mp4",
        fallbackVideoSrc: "./videos/story/n1_corridor_aftermath.mp4",
        posterSrc: "./portraits/story/n1_corridor_admit_frost.jpg",
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
        videoSrc: "./videos/story/n1_corridor_aftermath_purge.mp4",
        fallbackVideoSrc: "./videos/story/n1_corridor_aftermath.mp4",
        posterSrc: "./portraits/story/n1_corridor_purge_duct.jpg",
        fallbackPosterSrc: "./portraits/reactions/chamber_purge.jpg",
        hasAudio: true,
        isLipSync: false,
        badge: { zh: "原声音效 · 通风口三声敲击", en: "SFX · DUCT KNOCKS", ja: "音声 · ダクト三連打" },
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
      zh: "V-02 // 佐藤莱奥",
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
        posterSrc: "./portraits/story/fb_leo_powerbay.jpg",
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
          zh: "两小时前 2 号动力舱电弧爆闪，莱奥抱起白色工具箱独自冲出应急风雪闸门。",
          en: "Two hours ago arcs erupted in Power Bay 2—Leo grabbed his white tool chest and bolted out the storm hatch alone.",
          ja: "2時間前、第2動力室で火花が散る中、レオは白い工具箱を抱えて一人で吹雪のハッチへ飛び出した。"
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
          zh: "V-02 // 佐藤莱奥",
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
          zh: "问他：动力舱跳闸怎么只有你一个人跑出来？",
          en: "Ask him: Why did you bolt from Power Bay 2 alone?",
          ja: "聞く：どうして一人で戻ってきたんだ？"
        },
        sublabel: {
          zh: "继续看他怎么回答（口型剧情）",
          en: "Watch him reply (Lip-Sync)",
          ja: "返答ムービーを見る"
        },
        boothEffect: {
          action: "intercom",
          systemNote: {
            zh: "【剧情切入】你没有立刻开门，追问他为什么在动力舱出事后独自跑出来。",
            en: "[SCENE ENTRY] Before opening, you ask why he ran from Power Bay 2 alone.",
            ja: "【場面導入】なぜ動力室から一人で飛び出したのか直接問い詰める。"
          }
        }
      },
      {
        id: "leo_open_thermal",
        nextNodeId: "n1_leo_react_toolbox",
        label: {
          zh: "让他举起白色工具箱贴近防爆窗核验",
          en: "Tell him to hold the white tool chest up to the glass",
          ja: "白い工具箱を窓に近づけて見せるよう命じる"
        },
        sublabel: {
          zh: "继续电影剧情 · 近距查看工具箱封扣与神情",
          en: "Continue film · Inspect latch & valve close-up",
          ja: "本編継続 · 工具箱と表情を近接確認"
        },
        boothEffect: {
          action: "strobe",
          systemNote: {
            zh: "【剧情切入】你没有立刻拉闸，让他先把那只焦黑工具箱贴近玻璃给你看清细节。",
            en: "[SCENE ENTRY] You keep the bolts shut and order Leo to lift the scorched tool chest up to the frosted glass.",
            ja: "【場面導入】扉を開ける前に、工具箱を防爆ガラスに近づけさせた。"
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
      zh: "莱奥急辩 · 动力舱封锁",
      en: "Power Bay Rebuttal · Leo",
      ja: "レオ急弁・動力室封鎖"
    },
    subtitle: {
      zh: "“液压总阀崩的时候烟冲满整间机房，老师傅喊我抱着备用箱先往外冲——我没扔下谁！”",
      en: "\"Smoke flooded Bay 2 when the valve sheared—the chief yelled for me to haul the spare kit outside!\"",
      ja: "「バルブが飛んだ時、部屋中が煙で埋まって親方が俺に工具箱を持って先に出ろって叫んだんだ！」"
    },
    speaker: {
      zh: "V-02 // 佐藤莱奥",
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
    id: "n1_leo_react_toolbox",
    chapter: "night1_leo",
    code: "SC-02B-2",
    title: {
      zh: "近距核验 · 焦黑工具箱与阀门",
      en: "Close-Up Check · Scorched Tool Chest",
      ja: "近接確認・焦げた工具箱とバルブ"
    },
    subtitle: {
      zh: "“看，备用黄铜减压阀真在里面！箱扣被电弧熏黑了……扳手刚才跑太急掉风闸口了，快放我进去吧！”",
      en: "\"Look—the brass thermal valve is right inside! The latch got scorched by the arc… I dropped the wrench by the vent hatch, just open the lock!\"",
      ja: "「見てくれ、予備の真鍮バルブは中にある！留め金が焦げて……レンチはハッチで落とした、早く入れてくれ！」"
    },
    speaker: {
      zh: "V-02 // 佐藤莱奥（窗前近景）",
      en: "V-02 // LEO SATO (GLASS CLOSE-UP)",
      ja: "V-02 // 佐藤レオ（窓前近景）"
    },
    kind: "movie",
    hasAudio: true,
    isLipSync: false,
    visitorId: "V-02",
    videoSrc: "./videos/story/n1_leo_toolbox_check.mp4",
    fallbackVideoSrc: "./videos/leo/flinch.mp4",
    posterSrc: "./portraits/story/n1_leo_toolbox_check.jpg",
    fallbackPosterSrc: "./portraits/leo.jpg",
    row: 2,
    col: 9,
    choices: [
      {
        id: "leo_toolbox_admit",
        nextNodeId: "n1_leo_aftermath",
        directVerdict: "ADMIT",
        label: {
          zh: "阀门与焦痕对得上，开门放他进站",
          en: "The valve matches—open the gate for Leo",
          ja: "バルブは本物だ、中へ通す"
        },
        sublabel: {
          zh: "放行 // 相信这个丢了扳手的实习机械师",
          en: "ADMIT // Watch Night 1 ending",
          ja: "許可 // 第1夜結末へ"
        }
      },
      {
        id: "leo_toolbox_purge",
        nextNodeId: "n1_leo_aftermath",
        directVerdict: "PURGE",
        label: {
          zh: "偏偏关键扳手不在箱里，果断净化",
          en: "Too convenient—trigger thermal purge",
          ja: "肝心のレンチがない、焼却する"
        },
        sublabel: {
          zh: "净化 [-1 FUEL] // 宁可错杀不留隐患",
          en: "PURGE [-1 FUEL] // Watch Night 1 ending",
          ja: "焼却 [-1 FUEL] // 第1夜結末へ"
        }
      },
      {
        id: "leo_toolbox_to_booth",
        nextNodeId: "n1_leo_confront",
        isSideQuest: true,
        sideQuestVisitorId: "V-02",
        sideQuestReturnNodeId: "n1_leo_aftermath",
        label: {
          zh: "🔍 进入防爆窗 · 深度鉴真莱奥（高玩支线）",
          en: "🔍 Booth Interrogation · Audit Leo (Side Quest)",
          ja: "🔍 防爆窓で詳しく尋問（任意支線）"
        },
        sublabel: {
          zh: "可选硬核支线 · 用扫描仪测心率与谎言",
          en: "Optional scanner & interrogation detour",
          ja: "任意で追加尋問"
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
  // ==================== NIGHT 2 · AUDIT & AIRLOCK CRISIS ====================
  {
    id: "n2_arthur_standoff",
    chapter: "night2_power",
    code: "SC-03A",
    title: {
      zh: "第 2 夜 · 审计官斯特林：附则第 4 条",
      en: "Night 2 · Auditor Sterling: Clause 4",
      ja: "第2夜 · 監査官スターリング：付則第4条"
    },
    subtitle: {
      zh: "“操作员 #09，我是总部审计官斯特林。按应急附则第 4 条，请立即为机密档案持有人开锁。”",
      en: "\"Operator #09, Arthur Sterling, London Audit. Under Contingency Clause 4, unseal this lock for classified custodian transit.\"",
      ja: "「検疫官 #09、本社監査官のスターリングだ。緊急付則第4条に基づき、機密保持者の通過を許可したまえ。」"
    },
    speaker: {
      zh: "V-03 // Arthur Sterling · 伦敦总部审计官",
      en: "V-03 // AUDITOR ARTHUR STERLING",
      ja: "V-03 // アーサー・スターリング監査官"
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
          zh: "按附则第 4 条开锁，放审计官斯特林进舱",
          en: "Honor Clause 4 & admit Auditor Sterling",
          ja: "付則第4条に従いスターリングを通す"
        },
        sublabel: {
          zh: "放行 // 解除外舱门锁并记录审计交接",
          en: "ADMIT // Cycle lock & log audit transit",
          ja: "通過 // ロックを解除し監査移送を記録"
        }
      },
      {
        id: "n2_arthur_reject",
        nextNodeId: "n2_marcus_clash",
        directVerdict: "PURGE",
        label: {
          zh: "拒绝开锁，启动防爆窗高温净化",
          en: "Refuse entry & trigger thermal purge",
          ja: "開錠を拒否・焼却を起動する"
        },
        sublabel: {
          zh: "净化 [-1 FUEL] // 烧毁外部目标与随行卷宗盒",
          en: "PURGE [-1 FUEL] // Sterilize vestibule target",
          ja: "焼却 [-1 FUEL] // 前室を高温焼却"
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
      zh: "深夜拍门 · 外风口失压危机",
      en: "Night 2 · Capt. Chen at Outer Bulkhead",
      ja: "第2夜 · チェン隊長の緊急開門要請"
    },
    subtitle: {
      zh: "“#09，是我，陈队长！别磨蹭，外头风口撑不住两分钟了！”",
      en: "\"#09, it's Captain Chen! Stop staring at the monitor and cycle the bolts!\"",
      ja: "「#09、俺だ、チェン隊長だ！モタモタするな、外の隔壁はもう保たんぞ！」"
    },
    speaker: {
      zh: "V-04 // Capt. Marcus Chen · 安保队长",
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
        nextNodeId: "n3_ana_betrayal",
        directVerdict: "ADMIT",
        label: {
          zh: "拉起气闸插销，放陈队长进门抢修风口",
          en: "Cycle bolts & let Capt. Chen inside",
          ja: "隔壁を開けチェン隊長を通す"
        },
        sublabel: {
          zh: "放行 // 解除外门插销放入安保队长",
          en: "ADMIT // Cycle airlock bolts",
          ja: "通過 // エアロック開放"
        }
      },
      {
        id: "n2_marcus_purge",
        nextNodeId: "n3_ana_betrayal",
        directVerdict: "PURGE",
        label: {
          zh: "封死门闸，启动防爆窗高温净化",
          en: "Seal airlock & trigger thermal purge",
          ja: "封鎖・焼却を起動する"
        },
        sublabel: {
          zh: "净化 [-1 FUEL] // 锁定走廊门并用 1,100°C 清除",
          en: "PURGE [-1 FUEL] // Lock bulkhead & purge",
          ja: "焼却 [-1 FUEL] // 高温焼却実行"
        }
      },
      {
        id: "n2_marcus_side_audit",
        nextNodeId: "n2_side_audit",
        isSideQuest: true,
        sideQuestVisitorId: "V-04",
        sideQuestReturnNodeId: "n3_ana_betrayal",
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
    id: "n3_ana_betrayal",
    chapter: "night3_storm",
    code: "SC-04A",
    title: {
      zh: "第 3 夜磁暴 · 高压减压舱漏气",
      en: "Night 3 Blackout · Hyperbaric Bay Leak",
      ja: "第3夜磁気嵐・高圧チャンバー漏洩"
    },
    subtitle: {
      zh: "“#09，高压减压舱漏气了。我是安娜·里贝罗，开内门。”",
      en: "\"#09, the hyperbaric bay lost seal. Ana Ribeiro. Open the inner lock.\"",
      ja: "「#09、高圧チャンバーのシールが破れた。アナ・リベイロよ、内扉を開けて。」"
    },
    speaker: {
      zh: "V-05 // Ana Ribeiro · 饱和潜水员",
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
    col: 15,
    choices: [
      {
        id: "n3_ana_admit",
        nextNodeId: "n3_storm_blackout",
        directVerdict: "ADMIT",
        label: {
          zh: "打开内门，放安娜进入舱内走廊",
          en: "Open the inner lock & admit Ana",
          ja: "内扉を開けアナを通す"
        },
        sublabel: {
          zh: "放行 // 解除内门锁定（磁暴下热成像离线）",
          en: "ADMIT // Cycle inner gate during blackout",
          ja: "通過 // 磁気嵐下で内扉開放"
        }
      },
      {
        id: "n3_ana_purge",
        nextNodeId: "n3_storm_blackout",
        directVerdict: "PURGE",
        label: {
          zh: "锁死内门并启动高温净化",
          en: "Lock inner gate & trigger thermal purge",
          ja: "内扉を封鎖し焼却を起動する"
        },
        sublabel: {
          zh: "净化 [-1 FUEL] // 启动 1,100°C 清除",
          en: "PURGE [-1 FUEL] // Sterilize vestibule",
          ja: "焼却 [-1 FUEL] // 高温焼却実行"
        }
      },
      {
        id: "n3_ana_side_audit",
        nextNodeId: "n3_side_audit",
        isSideQuest: true,
        sideQuestVisitorId: "V-05",
        sideQuestReturnNodeId: "n3_storm_blackout",
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
    id: "n3_storm_blackout",
    chapter: "night3_storm",
    code: "SC-04B",
    title: {
      zh: "磁暴静默 · 索尔伯格医生的安抚",
      en: "Night 3 Blackout · Dr. Solberg's Visit",
      ja: "第3夜磁気嵐・ソルベルグ医師の来訪"
    },
    subtitle: {
      zh: "“晚上好，#09。你的呼吸听起来很紧绷——我是索尔伯格医生，开门让我进来陪你稳住节奏好吗？”",
      en: "\"Good evening, #09. Your breathing sounds tight over the static—it's Dr. Solberg. Let me in so we can steady this together.\"",
      ja: "「こんばんは、#09。息が詰まっているわね——ソルベルグよ。中へ入れてちょうだい、一緒に落ち着きましょう。」"
    },
    speaker: {
      zh: "V-06 // Dr. Ingrid Solberg · 心理顾问",
      en: "V-06 // DR. INGRID SOLBERG",
      ja: "V-06 // イングリッド・ソルベルグ"
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
    col: 16,
    choices: [
      {
        id: "n3_ingrid_admit",
        nextNodeId: "n4_linmei_conspiracy",
        directVerdict: "ADMIT",
        label: {
          zh: "放索尔伯格医生进门，进入第 4 夜",
          en: "Let Dr. Solberg in & continue to Night 4",
          ja: "ソルベルグを通し第4夜へ"
        },
        sublabel: {
          zh: "放行 // 打开外舱门锁放入心理顾问",
          en: "ADMIT // Cycle outer gate",
          ja: "通過 // ゲート開放"
        }
      },
      {
        id: "n3_ingrid_purge",
        nextNodeId: "n4_linmei_conspiracy",
        directVerdict: "PURGE",
        label: {
          zh: "拒绝对话安抚，启动高温净化",
          en: "Reject her calm & ignite thermal purge",
          ja: "懐柔を拒否し焼却処分する"
        },
        sublabel: {
          zh: "净化 [-1 FUEL] // 启动 1,100°C 清除",
          en: "PURGE [-1 FUEL] // Sterilize vestibule",
          ja: "焼却 [-1 FUEL] // 高温焼却"
        }
      },
      {
        id: "n3_ingrid_side_audit",
        nextNodeId: "n3_side_audit",
        isSideQuest: true,
        sideQuestVisitorId: "V-06",
        sideQuestReturnNodeId: "n4_linmei_conspiracy",
        label: {
          zh: "🔍 磁暴盲审 · 亲自盘查英格丽（高玩支线）",
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
  // ==================== NIGHT 4 · CRYO VAULT & BLACK-BOX ====================
  {
    id: "n4_linmei_conspiracy",
    chapter: "night4_mutiny",
    code: "SC-05A",
    title: {
      zh: "第 4 夜 · 低温样本库封条破损",
      en: "Night 4 · Lin Mei: Broken Cryo-Vault Seal",
      ja: "第4夜・リンメイ：低温保管庫の封破れ"
    },
    subtitle: {
      zh: "“#09，低温样本库封条破了。我是林梅，开门让我进内舱锁死母本。”",
      en: "\"#09, the cryo-vault seal broke. It's Lin Mei—cycle the lock so I can secure the master cultures.\"",
      ja: "「#09、低温保管庫の封が破れたわ。リン・メイよ、母株を封じるから開けて。」"
    },
    speaker: {
      zh: "V-07 // Dr. Lin Mei · 低温生物学家",
      en: "V-07 // DR. LIN MEI",
      ja: "V-07 // リン・メイ"
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
          zh: "放林梅进内舱，锁死样本库母本",
          en: "Let Lin Mei inside to seal the cryo-vault",
          ja: "リンメイを通し母株を封印させる"
        },
        sublabel: {
          zh: "放行 // 解除内舱锁定并放行低温生物学家",
          en: "ADMIT // Cycle inner cryo lock",
          ja: "通過 // 内室ロック解除"
        }
      },
      {
        id: "n4_linmei_purge",
        nextNodeId: "n4_hannah_whistle",
        directVerdict: "PURGE",
        label: {
          zh: "拒开内门，直接启动高温净化",
          en: "Refuse lock cycle & ignite purge jets",
          ja: "開放を拒否し焼却を起動する"
        },
        sublabel: {
          zh: "净化 [-1 FUEL] // 启动 1,100°C 清除高阶目标",
          en: "PURGE [-1 FUEL] // Sterilize Night 4 target",
          ja: "焼却 [-1 FUEL] // 高温焼却実行"
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
      en: "Night 4 · Hannah's Vent Tamper Black-Box",
      ja: "第4夜・ハンナの排気ブラックボックス"
    },
    subtitle: {
      zh: "“#09，我是汉娜·魏斯。我怀里是外风井违规排气的黑匣子，立刻放我进内舱封存证物！”",
      en: "\"#09, Hannah Weiss. I'm holding the outer-shaft vent tamper recorder—open the lock so I can seal the evidence!\"",
      ja: "「#09、ハンナ・ヴァイスよ。不正排気のブラックボックスを持っているわ、証拠保全のため開けて！」"
    },
    speaker: {
      zh: "V-08 // Hannah Weiss · 维生技术员",
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
          zh: "开门封存黑匣子证物，迎接第 5 夜",
          en: "Let Hannah in to seal evidence & face Night 5",
          ja: "ハンナを入れ証拠を保全し第5夜へ"
        },
        sublabel: {
          zh: "放行 // 接过外风井排气黑匣子（将触发机密核查）",
          en: "ADMIT // Recover vent tamper black-box",
          ja: "通過 // 証拠記録を回収する"
        }
      },
      {
        id: "n4_hannah_purge",
        nextNodeId: "n5_final_mirror",
        directVerdict: "PURGE",
        label: {
          zh: "拒不接盒，连人带黑匣子一并净化",
          en: "Refuse evidence & purge Gate 0",
          ja: "受け取りを拒み焼却する"
        },
        sublabel: {
          zh: "净化 [-1 FUEL] // 不留任何证物，独自进入第 5 夜",
          en: "PURGE [-1 FUEL] // Face Night 5 without tape",
          ja: "焼却 [-1 FUEL] // 単独で第5夜へ"
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
      zh: "极夜最深处，防爆窗外走来一个穿着和你一模一样工服的身影——它正复述你入职时亲口说过的话，逼你在四道终局门之间作出最后抉择。",
      en: "In the deepest polar night, a figure wearing your exact OP#09 parka steps up to the glass—repeating your own intake words as you choose the finale.",
      ja: "極夜の中、あなたと瓜二つの人影が窓の外に現れ、入所時の言葉をそのまま復唱する。最後の決断を下せ。"
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
          zh: "烧毁完美替身并坦白日志过失，羁押登艇破冰撤离",
          en: "Burn the double, own every mistake & board Nautilus-0",
          ja: "影を焼き払い過ちを認めて潜水艦へ乗り込む"
        },
        sublabel: {
          zh: "结局 A · 《认账 // 黎明破冰》",
          en: "ENDING A // Owning It",
          ja: "結末 A // 引き受け・砕氷"
        }
      },
      {
        id: "n5_choose_seal",
        nextNodeId: "ending_eternal_seal",
        label: {
          zh: "相信门外那个完美的自己，独自步入暴风雪",
          en: "Yield Gate 0 to the double & walk into the storm",
          ja: "完璧な自分を信じ、吹雪の中へ歩み出る"
        },
        sublabel: {
          zh: "结局 B · 《替身 // 极夜永封》",
          en: "ENDING B // Replaced",
          ja: "結末 B // 入れ替わり"
        }
      },
      {
        id: "n5_choose_mirror",
        nextNodeId: "ending_mirror_assimilation",
        label: {
          zh: "打开最后一道液压门，迎进与你分毫不差的倒影",
          en: "Unlatch the hydraulic door to your 100% match",
          ja: "油圧扉を開け、一点のズレもない影を迎える"
        },
        sublabel: {
          zh: "无名结局 · 《镜像 // MIRROR》",
          en: "UNNAMED // MIRROR",
          ja: "無題の結末 · 鏡像"
        }
      },
      {
        id: "n5_choose_watch",
        nextNodeId: "ending_lone_watch",
        label: {
          zh: "凭人类独有的言行差戳穿它，揭开董事会弃子档案",
          en: "Expose the double via your human gap & tape a warning",
          ja: "言行不一致で影を論破し、極秘記録と警告を残す"
        },
        sublabel: {
          zh: "结局 D · 《证人 // 零号遗言》",
          en: "ENDING D // Witness",
          ja: "結末 D // 証人"
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
      zh: "结局 A // 认账 · OWNING IT",
      en: "ENDING A // OWNING IT",
      ja: "結末 A // 引き受け"
    },
    title: {
      zh: "结局 A · 认账与破冰",
      en: "Ending A · Owning It & Icebreak",
      ja: "結末 A · 引き受けと砕氷"
    },
    subtitle: {
      zh: "你烧掉了那个完美的自己，在日志里写下所有误判与借口。你以被羁押者的身份登上鹦鹉螺 0 号冲开冰脊——但 ORD-OS 第一次把你标记为「人类」。",
      en: "You burn the flawless double and log every misjudgement and excuse. Boarded on Nautilus-0 in custody as it smashes through pack ice—ORD-OS finally tags you HUMAN.",
      ja: "完璧な自分を焼き払い、日誌に過ちと弁明をすべて記した。拘束されて潜航艇へ乗る君を、ORD-OSは初めて「人間」と記録した。"
    },
    speaker: {
      zh: "剧终 · 结局 A // 人类身份确认",
      en: "FINALE · ENDING A // TAGGED HUMAN",
      ja: "終幕 · 結末 A // 「人間」認証"
    },
    kind: "ending",
    hasAudio: false,
    videoSrc: "./videos/story/ending_a_sub_escape.mp4",
    fallbackVideoSrc: "./videos/chamber/admit.mp4",
    posterSrc: "./portraits/story/ending_a_sub_escape.jpg",
    fallbackPosterSrc: "./portraits/lobby_bg.jpg",
    clips: [
      {
        id: "end_a_sub_breach",
        videoSrc: "./videos/story/ending_a_sub_escape.mp4",
        fallbackVideoSrc: "./videos/chamber/admit.mp4",
        posterSrc: "./portraits/story/ending_a_sub_escape.jpg",
        fallbackPosterSrc: "./portraits/reactions/chamber_admit.jpg",
        hasAudio: false,
        badge: { zh: "认账日志 · 登艇撤离", en: "CONFESSED · BOARDING", ja: "告白記録 · 乗艦" },
        speaker: {
          zh: "0 号隔离窗 // 鹦鹉螺号接驳通道",
          en: "GATE 0 // NAUTILUS-0 DOCK",
          ja: "第0関門 // ノーチラス0号ドック"
        },
        subtitle: {
          zh: "你在值班日志签下全部真实误判后交出指挥权，绿灯闪烁下随船员冲入深海潜艇舱门。",
          en: "After logging every real misjudgement cleanly, crew strip your rank and rush aboard Nautilus-0.",
          ja: "誤審も言い訳も偽りなく記録した君は拘束され、緑の灯火のもと救助潜水艦へ駆け込む。"
        }
      },
      {
        id: "end_a_polar_sunrise",
        videoSrc: "./videos/story/ending_a_dawn_icebreak.mp4",
        fallbackVideoSrc: "./videos/chamber/whiteout.mp4",
        posterSrc: "./portraits/story/ending_a_dawn_icebreak.jpg",
        fallbackPosterSrc: "./portraits/lobby_bg.jpg",
        hasAudio: false,
        badge: { zh: "剧终 · 标记「人类」", en: "ENDING A // TAGGED HUMAN", ja: "結末 A // 「人間」記録" },
        speaker: {
          zh: "斯瓦尔巴外海 // 结局 A · 认账",
          en: "SVALBARD OPEN WATER // ENDING A",
          ja: "スヴァールバル外海 // 結末 A"
        },
        subtitle: {
          zh: "潜艇冲开十米冰脊浮上极昼第一缕朝阳，远方焚烧的前哨站化作黑烟——ORD-OS 终于把你标为「人类」。",
          en: "Nautilus-0 shatters the pack ice beneath blinding sunrise above a burning outpost—ORD-OS marks you HUMAN.",
          ja: "炎上する基地を背に潜水艦が厚氷を貫く。ORD-OSは初めて君を「人間」と判定した。"
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
      zh: "结局 B // 替身 · REPLACED",
      en: "ENDING B // REPLACED",
      ja: "結末 B // 入れ替わり"
    },
    title: {
      zh: "结局 B · 替身与冰封",
      en: "Ending B · Replaced & Frozen",
      ja: "結末 B · 入れ替わりと氷封"
    },
    subtitle: {
      zh: "你相信了那个更体面、更稳定的自己，拉下总闸走出暴风雪。第二天的值班日志字迹工整，ORD-OS 记录：#09 与入职自述吻合度 100%。",
      en: "You trust the cleaner, steadiest version of yourself and walk out into the storm. Tomorrow's log is immaculate: Operator #09 — 100% intake match.",
      ja: "より完璧な自分へ席を譲り吹雪へ歩み出た。翌日の日誌は非の打ち所がなく、ORD-OSは「一致率100%」と記録した。"
    },
    speaker: {
      zh: "剧终 · 结局 B // 替身接管",
      en: "FINALE · ENDING B // REPLACED",
      ja: "終幕 · 結末 B // 入れ替わり"
    },
    kind: "ending",
    hasAudio: true,
    isLipSync: false,
    videoSrc: "./videos/story/n1_elena_outcome_purge.mp4",
    fallbackVideoSrc: "./videos/chamber/purge.mp4",
    posterSrc: "./portraits/reactions/chamber_purge.jpg",
    fallbackPosterSrc: "./portraits/story/ending_b_entombed_station.jpg",
    clips: [
      {
        id: "end_b_purge_blast",
        videoSrc: "./videos/story/n1_elena_outcome_purge.mp4",
        fallbackVideoSrc: "./videos/chamber/purge.mp4",
        posterSrc: "./portraits/reactions/chamber_purge.jpg",
        fallbackPosterSrc: "./portraits/reactions/chamber_purge.jpg",
        hasAudio: true,
        isLipSync: false,
        badge: { zh: "让位离岗 · 封站", en: "YIELD · LOCKDOWN", ja: "交代 · 封鎖" },
        speaker: { zh: "0 号岗亭 // 总闸锁死", en: "GATE 0 // SEALED", ja: "第0関門 // 封鎖" },
        subtitle: {
          zh: "炉膛火光最后一次闪灭，你放下钥匙步入冰原风雪，把工位留给了窗外那个毫无破绽的替身。",
          en: "Furnace glow fades across armored glass as you surrender Gate 0 to your flawless replacement and walk into the storm.",
          ja: "炉の光が消え、君は席を完璧な代役に譲って極寒の吹雪へと歩き出した。"
        }
      },
      {
        id: "end_b_frozen_station",
        videoSrc: "./videos/story/ending_b_entombed_station.mp4",
        fallbackVideoSrc: "./videos/chamber/whiteout.mp4",
        posterSrc: "./portraits/story/ending_b_entombed_station.jpg",
        fallbackPosterSrc: "./portraits/story/ending_b_entombed_station.jpg",
        hasAudio: false,
        badge: { zh: "剧终 · 吻合度 100%", en: "ENDING B // REPLACED", ja: "結末 B // 一致率100%" },
        speaker: { zh: "极夜档案归档 // 结局 B · 替身", en: "ARCHIVE CLOSED // ENDING B", ja: "記録閉鎖 // 結末 B" },
        subtitle: {
          zh: "狂风彻底抹平了门外最后一行脚印，前哨站陷入死寂——明早的日志将完美得挑不出半点瑕疵。",
          en: "Polar wind erases the last footprints in deep snow; tomorrow's shift log will not contain a single flaw.",
          ja: "暴風雪が最後の足跡を消し去る。翌朝の日誌は一点の曇りもなく完璧に書かれる。"
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
      zh: "无名结局 // 镜像 · MIRROR",
      en: "UNNAMED ENDING // MIRROR",
      ja: "無題の結末 // 鏡像"
    },
    title: {
      zh: "无名结局 · 镜像",
      en: "Unnamed Ending · Mirror",
      ja: "無題の結末 · 鏡像"
    },
    subtitle: {
      zh: "你这几夜做的和嘴上说的分毫不差（言行差 0%）。液压门滑开的一瞬，ORD-OS 无法分辨你和窗外的人——闸落时连你也不知道烧掉的是谁。",
      en: "Every act matched your intake words to 0% gap. As the hydraulic door slides open, ORD-OS cannot tell you apart from the double.",
      ja: "建前と行動に0%の差もない。扉が開いた瞬間、ORD-OSはあなたと外の影を区別できなくなった。"
    },
    speaker: {
      zh: "剧终 · 言行差 0% // MIRROR",
      en: "FINALE // 0% SAY/DO GAP",
      ja: "終幕 // 言行不一致 0%"
    },
    kind: "ending",
    hasAudio: true,
    isLipSync: false,
    videoSrc: "./videos/story/ending_c_mirror_door.mp4",
    fallbackVideoSrc: "./videos/operator09/idle.mp4",
    posterSrc: "./portraits/story/ending_c_mirror_door.jpg",
    fallbackPosterSrc: "./portraits/operator09.jpg",
    clips: [
      {
        id: "end_c_shadow",
        videoSrc: "./videos/story/ending_c_mirror_door.mp4",
        fallbackVideoSrc: "./videos/story/n1_cliffhanger_shadow.mp4",
        posterSrc: "./portraits/story/ending_c_mirror_door.jpg",
        fallbackPosterSrc: "./portraits/operator09.jpg",
        hasAudio: true,
        isLipSync: false,
        badge: { zh: "原声音效 · 气闸洞开", en: "SFX · AIRLOCK BREACH", ja: "音声 · 隔壁開放" },
        speaker: { zh: "0 号岗亭 // 门开了", en: "GATE 0 // DOOR UNLOCKED", ja: "第0関門 // 解錠" },
        subtitle: {
          zh: "液压钢门缓缓向一侧滑开，刺骨白雾翻过控制台——穿着 #09 寒衣、带着一模一样微笑的自己正迈步走进岗亭。",
          en: "Hydraulic steel slides open as white mist rolls over your console—your hooded OP#09 double steps across the threshold.",
          ja: "重い鋼鉄扉が開き、白い冷気がコンソールへ流れ込む——同じ微笑みを浮かべた『#09』が踏み込んでくる。"
        }
      },
      {
        id: "end_c_mirror_face",
        videoSrc: "./videos/operator09/idle.mp4",
        fallbackVideoSrc: "./videos/operator09/idle.mp4",
        posterSrc: "./portraits/operator09.jpg",
        fallbackPosterSrc: "./portraits/operator09.jpg",
        hasAudio: false,
        badge: { zh: "无名结局 · 镜像", en: "UNNAMED // MIRROR", ja: "無題の結末 · 鏡像" },
        speaker: { zh: "值班员 #09 // 无名结局 · 镜像", en: "OP #09 // UNNAMED MIRROR", ja: "当直官 #09 // 鏡像" },
        subtitle: {
          zh: "你这几夜的言行差是 0%。当最后一道闸门落下时，连你自己都分不清究竟哪一个才是真正留下来的那个人。",
          en: "Zero say/do gap. As the final shutter drops, even you no longer know which reflection burned and which walked away.",
          ja: "言行の差は0%。最後のシャッターが降りた瞬間、残ったのがどちらの自分かもう分からない。"
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
      zh: "结局 D // 证人 · WITNESS",
      en: "ENDING D // WITNESS",
      ja: "結末 D // 証人"
    },
    title: {
      zh: "结局 D · 证人与遗言",
      en: "Ending D · Witness & Tape",
      ja: "結末 D // 証人と遺言"
    },
    subtitle: {
      zh: "你用活人才有的言行差戳穿了替身，解锁了董事会「把 #09 选作弃子」的绝密电传。天亮后你坐在控制台前亲自按下录像键，把那句真话录给下一班。",
      en: "Your human say/do gap shatters the double, unlocking Classified Telex ORD-REDACTED-00. As dawn breaks, OP#09 hits REC beside Logbook #10 for the next watch.",
      ja: "生身の人間にしか起きない言行の綻びで影を暴き、機密テレックスを解錠。夜明けのブースで #09 自身が次の当直への警告を録画する。"
    },
    speaker: {
      zh: "剧终 · 结局 D // 证人",
      en: "FINALE · ENDING D // WITNESS",
      ja: "終幕 · 結末 D // 証人"
    },
    kind: "ending",
    hasAudio: false,
    videoSrc: "./videos/story/ending_d_op09_tape.mp4",
    fallbackVideoSrc: "./videos/chamber/whiteout.mp4",
    posterSrc: "./portraits/story/ending_d_op09_tape.jpg",
    fallbackPosterSrc: "./portraits/operator09.jpg",
    clips: [
      {
        id: "end_d_camcorder",
        videoSrc: "./videos/story/ending_d_op09_tape.mp4",
        fallbackVideoSrc: "./videos/operator09/idle.mp4",
        posterSrc: "./portraits/story/ending_d_op09_tape.jpg",
        fallbackPosterSrc: "./portraits/operator09.jpg",
        hasAudio: false,
        badge: { zh: "证人档案 // #09 亲录", en: "WITNESS // #09 REC", ja: "証人 // #09 録画" },
        speaker: { zh: "值班员 #09 // 结局 D 录像", en: "OP #09 // WITNESS TAPE", ja: "当直官 #09 // 証言録画" },
        subtitle: {
          zh: "“记住：真人会怕、会认错；越是完美得像教科书的，越不是人。”",
          en: "\"Remember this: real humans feel fear and admit mistakes. Anything that sounds too textbook-perfect isn't human.\"",
          ja: "「忘れるな。生身の人間は恐れ、過ちを認める。教科書通りに完璧すぎる奴ほど、人間じゃない。」"
        }
      },
      {
        id: "end_d_sunrise",
        videoSrc: "./videos/story/ending_d_dawn_logbook.mp4",
        fallbackVideoSrc: "./videos/chamber/whiteout.mp4",
        posterSrc: "./portraits/story/ending_d_dawn_logbook.jpg",
        fallbackPosterSrc: "./portraits/lobby_bg.jpg",
        hasAudio: false,
        badge: { zh: "剧终 · 揭晓弃子电传", en: "ENDING D // WITNESS", ja: "結末 D // 証人" },
        speaker: { zh: "ORD-REDACTED-00 // 结局 D · 证人", en: "ORD-REDACTED-00 // ENDING D", ja: "最高機密解錠 // 結末 D" },
        subtitle: {
          zh: "浅金晨光照进霜窗，你把录像带压在《10 号值班日志》与绝密电传打印件之上，等下一位值班员坐上椅子。",
          en: "Pale dawn cuts through frosted glass as you set the cassette over Logbook #10 and the declassified Board telex.",
          ja: "淡い朝日が霜窓を照らす中、警告テープを日誌と解錠された機密電文の上に置き、次の交代者を待つ。"
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
  { id: "e_n1l_arr_tbox", from: "n1_leo_arrival", to: "n1_leo_react_toolbox", branch: "default" },
  { id: "e_n1l_arr_con", from: "n1_leo_arrival", to: "n1_leo_confront", branch: "default" },
  { id: "e_n1l_int_after", from: "n1_leo_react_intercom", to: "n1_leo_aftermath", branch: "default" },
  { id: "e_n1l_int_con", from: "n1_leo_react_intercom", to: "n1_leo_confront", branch: "default" },
  { id: "e_n1l_tbox_after", from: "n1_leo_react_toolbox", to: "n1_leo_aftermath", branch: "default" },
  { id: "e_n1l_tbox_con", from: "n1_leo_react_toolbox", to: "n1_leo_confront", branch: "default" },
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
  { id: "e_n2m_n3", from: "n2_marcus_clash", to: "n3_ana_betrayal", branch: "default" },
  { id: "e_n2m_side", from: "n2_marcus_clash", to: "n2_side_audit", branch: "default" },
  { id: "e_n2side_marcus", from: "n2_side_audit", to: "n2_marcus_clash", branch: "default" },
  { id: "e_n3i_ana", from: "n3_ana_betrayal", to: "n3_storm_blackout", branch: "default" },
  { id: "e_n3i_side", from: "n3_storm_blackout", to: "n3_side_audit", branch: "default" },
  { id: "e_n3a_n4", from: "n3_storm_blackout", to: "n4_linmei_conspiracy", branch: "default" },
  { id: "e_n3a_side", from: "n3_ana_betrayal", to: "n3_side_audit", branch: "default" },
  { id: "e_n3side_ana", from: "n3_side_audit", to: "n3_storm_blackout", branch: "default" },
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
