import type { LocalizedText } from "./types.js";
import { ALL_VISITORS } from "./visitors/index.js";

export interface CastAssetSpec {
  id: string;
  code: string;
  name: LocalizedText;
  role: LocalizedText;
  portraitSrc: string;
  flinchSrc?: string;
  leanInSrc?: string;
  voiceSeedSrc: string;
  wardrobe: LocalizedText;
  lightingKey: LocalizedText;
  recommendedLens: string;
  colorTag: string;
}

export interface LookDevSwatch {
  id: string;
  label: LocalizedText;
  hex: string;
  usage: LocalizedText;
}

export interface ActorBlocking3D {
  id: string;
  label: string;
  pos: [number, number, number];
  rotY: number;
  color: string;
  speaking?: boolean;
}

export interface CameraBlocking3D {
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
  lensLabel: string;
  axisNote: LocalizedText;
}

export interface StoryboardShot {
  id: string;
  storyNodeId: string;
  shotCode: string;
  chapter: LocalizedText;
  title: LocalizedText;
  framing: string;
  cameraMove: LocalizedText;
  durationSec: number;
  frames: number;
  hasNativeAudio: boolean;
  speakerName?: LocalizedText;
  lipSyncLine?: LocalizedText;
  posterSrc: string;
  videoSrc: string;
  fallbackVideoSrc: string;
  blocking: {
    zone: "outer_blizzard" | "vestibule" | "booth" | "inner_corridor";
    alertLight: "amber" | "red" | "cyan";
    camera: CameraBlocking3D;
    actors: readonly ActorBlocking3D[];
  };
}

export const LOOK_DEV_SWATCHES: readonly LookDevSwatch[] = [
  {
    id: "cyan",
    label: { zh: "斯瓦尔巴极夜寒青", en: "Svalbard Polar Cyan", ja: "極夜シアン" },
    hex: "#5bbad5",
    usage: {
      zh: "外舱暴风雪、防爆玻璃外侧轮廓光与医疗走廊冷荧光",
      en: "Outer blizzard rim light, frosted blast glass & cold corridor fluorescents",
      ja: "外郭吹雪のリムライト・防爆窓・医療廊下の冷光"
    }
  },
  {
    id: "amber",
    label: { zh: "岗亭钠灯琥珀", en: "Booth Sodium Amber", ja: "当直室アンバー" },
    hex: "#eba834",
    usage: {
      zh: "0 号岗亭控制台、对讲面板倒影、角色面部暖色副光",
      en: "Booth 0 console glow, warm interior window reflection & key accents",
      ja: "操作盤のナトリウム灯・窓内側の暖色反射"
    }
  },
  {
    id: "purge",
    label: { zh: "警戒与灼烧红", en: "Lockdown Crimson", ja: "焼却・警報レッド" },
    hex: "#e04634",
    usage: {
      zh: "走廊停电警报灯、高温净化热浪与倒计时紧迫标识",
      en: "Corridor alarm beacons, 1,100C purge flash & QTE pressure cues",
      ja: "警報ストロボ・高温焼却・QTE警告"
    }
  },
  {
    id: "steel",
    label: { zh: "深海消光黑钢", en: "Matte Sub-Zero Steel", ja: "消光スチール" },
    hex: "#0b131b",
    usage: {
      zh: "重型气闸仓体、暗部阴影基调与无油光人物皮肤衬底",
      en: "Armored airlock bulkheads, crushed shadow base & matte film contrast",
      ja: "気閘鋼板・暗部トーンのベース"
    }
  }
];

const CAST_LOOKDEV_META: Record<
  string,
  {
    slug: string;
    wardrobe: LocalizedText;
    lightingKey: LocalizedText;
    lens: string;
    colorTag: string;
  }
> = {
  "V-01": {
    slug: "elena",
    wardrobe: {
      zh: "银丝圆框眼镜（镜缘结霜）、带血迹蓝绿色外科手术服、落雪深炭灰毛领防寒服",
      en: "Frost-rimmed gold wire glasses, blood-speckled teal surgical scrubs, snow-dusted charcoal fur parka",
      ja: "霜付きの細い丸眼鏡、血痕のある青緑の手術着、雪の付いた濃灰パーカー"
    },
    lightingKey: {
      zh: "左侧冰青暴雪轮廓光 + 正面 3200K 岗亭玻璃暖反光（零油光哑光肤质）",
      en: "Cold cyan blizzard rim + warm 3200K booth glass fill (matte film skin)",
      ja: "シアン吹雪リム光＋暖色ガラス反射（マット肌）"
    },
    lens: "50mm Anamorphic f/2.0",
    colorTag: "#5bbad5"
  },
  "V-02": {
    slug: "leo",
    wardrobe: {
      zh: "沾灰湿黑短发、橄榄灰立领工装衬衫、落雪深灰防寒服、白色耐寒金属工具箱",
      en: "Wet dark hair, olive-grey utility collar jacket, snow-dusted dark parka, battered white cryo tool chest",
      ja: "湿った黒髪、オリーブ灰の作業服、雪付きパーカー、白い耐熱工具ケース"
    },
    lightingKey: {
      zh: "顶侧寒雪背光 + 琥珀窗口斜切光（突出颊侧烟灰与急促呼吸白雾）",
      en: "Overhead cold storm backlight + diagonal amber window key over cheek soot",
      ja: "寒雪バックライト＋斜めアンバー窓光"
    },
    lens: "40mm Anamorphic f/2.4",
    colorTag: "#eba834"
  },
  "V-03": {
    slug: "arthur",
    wardrobe: {
      zh: "金丝背头、考究深驼色羊毛大衣翻领（刻意维持陆上高管体面）",
      en: "Slicked hair, tailored charcoal-camel wool overcoat preserving corporate composure",
      ja: "整えた髪、高級ウールコート"
    },
    lightingKey: {
      zh: "高反差冷青主光 + 硬朗下颌阴影",
      en: "High-contrast cold key light + sculpted jawline shadow",
      ja: "高コントラスト冷色キーライト"
    },
    lens: "50mm Anamorphic f/2.8",
    colorTag: "#9ec6d4"
  },
  "V-04": {
    slug: "marcus",
    wardrobe: {
      zh: "重型舰长级高领拉绒夹克、肩部反光条与磨损舰队徽章",
      en: "Heavy polar commander fleece jacket with weathered submarine insignia",
      ja: "極地司令官用フリースジャケット"
    },
    lightingKey: {
      zh: "低压顶光 + 红色告警脉冲辅光",
      en: "Low-key overhead + pulsing red alert edge light",
      ja: "ローキー俯瞰光＋赤色警報補助光"
    },
    lens: "35mm Anamorphic f/2.0",
    colorTag: "#e04634"
  },
  "V-05": {
    slug: "ana",
    wardrobe: {
      zh: "深海减压服内胆、氯丁橡胶颈封与极寒防水连帽风衣",
      en: "Deep-sea neoprene neck seal under waterproof polar shell",
      ja: "深海潜水インナー＋耐寒シェル"
    },
    lightingKey: {
      zh: "纯净双色分裂光（右冷青左暖琥珀）",
      en: "Split cyan-amber interrogation lighting across wet collar",
      ja: "青・琥珀スプリットライティング"
    },
    lens: "50mm Anamorphic f/2.0",
    colorTag: "#49b882"
  },
  "V-06": {
    slug: "ingrid",
    wardrobe: {
      zh: "白色极地科研防风袄、冰核取样挂牌与结霜针织围巾",
      en: "White polar glaciology parka with frosted knit neck gaiter",
      ja: "白の極地研究パーカー"
    },
    lightingKey: {
      zh: "强电磁风暴漫射冷光（生理仪器全黑背景）",
      en: "Diffused geomagnetic storm cyan glow over matte white parka",
      ja: "磁気嵐の拡散冷色光"
    },
    lens: "50mm Anamorphic f/2.0",
    colorTag: "#7dc7ff"
  },
  "V-07": {
    slug: "linmei",
    wardrobe: {
      zh: "深蓝站区指挥值班大衣、严谨扣紧的双层风纪领口",
      en: "Navy discipline officer coat buttoned tightly to the throat",
      ja: "紺色の規律官コート"
    },
    lightingKey: {
      zh: "对称顶灯裁切光（强化冷峻审视感）",
      en: "Symmetrical top-cut interrogation beam",
      ja: "対称トップカット照明"
    },
    lens: "65mm Close-Up f/2.0",
    colorTag: "#b48ead"
  },
  "V-08": {
    slug: "hannah",
    wardrobe: {
      zh: "厚重极地机修连体服外罩深绿羽绒防寒坎肩",
      en: "Heavy polar mechanic coveralls layered under quilted insulated vest",
      ja: "極地整備士カバーオール"
    },
    lightingKey: {
      zh: "琥珀控制台主光 + 窗角冰晶高光",
      en: "Amber console key + frosted corner specular glints",
      ja: "アンバー操作盤キー光"
    },
    lens: "50mm Anamorphic f/2.0",
    colorTag: "#d08770"
  }
};

export const CAST_VISUAL_ASSETS: readonly CastAssetSpec[] = [
  {
    id: "OP-09",
    code: "OP-09",
    name: { zh: "值班员 #09（玩家视角）", en: "Operator #09 (Player POV)", ja: "当直官 #09" },
    role: { zh: "0 号隔离岗亭夜间守门人", en: "Gate 0 Night Watchstander", ja: "第0隔離窓 夜間監視員" },
    portraitSrc: "./portraits/operator09.jpg",
    voiceSeedSrc: "./audio/zh/operator09/n5_ex_0.mp3",
    wardrobe: {
      zh: "深灰值班员防寒服、左手佩戴无线电对讲腕带与钢制密钥",
      en: "Slate-grey watchstander parka, padded intercom gauntlets & steel master key",
      ja: "濃灰当直パーカー・防寒グローブ・鋼鉄マスターキー"
    },
    lightingKey: {
      zh: "控制台仪表暖琥珀反射光为主，背对暴风雪玻璃（180° 轴线南侧固定机位）",
      en: "Sodium-amber console uplight facing blast window (180-deg south camera axis)",
      ja: "操作盤アンバー光の照り返し（180度南側軸）"
    },
    recommendedLens: "35mm POV Anamorphic f/2.0",
    colorTag: "#eba834"
  },
  ...ALL_VISITORS.map((v): CastAssetSpec => {
    const meta = CAST_LOOKDEV_META[v.id] ?? {
      slug: "elena",
      wardrobe: { zh: "极地标准防寒装备", en: "Polar insulated gear", ja: "極地防寒装備" },
      lightingKey: { zh: "冷青与琥珀双色棚拍", en: "Cyan/amber film key", ja: "二色ライティング" },
      lens: "50mm Anamorphic f/2.0",
      colorTag: "#5bbad5"
    };
    return {
      id: v.id,
      code: `${v.id} // NIGHT 0${v.night}`,
      name: v.name,
      role: v.role,
      portraitSrc: `./portraits/${meta.slug}.jpg`,
      flinchSrc: `./portraits/reactions/${meta.slug}_flinch.jpg`,
      leanInSrc: `./portraits/reactions/${meta.slug}_lean_in.jpg`,
      voiceSeedSrc: `./audio/zh/${meta.slug}/opening.mp3`,
      wardrobe: meta.wardrobe,
      lightingKey: meta.lightingKey,
      recommendedLens: meta.lens,
      colorTag: meta.colorTag
    };
  })
];

export const STUDIO_STORYBOARD_SHOTS: readonly StoryboardShot[] = [
  {
    id: "shot_prequel_icecore",
    storyNodeId: "prologue_01",
    shotCode: "SC-P01",
    chapter: { zh: "前传 · 冰芯事故", en: "PREQUEL · BREACH", ja: "前日譚 · 氷床事故" },
    title: { zh: "深冰钻井台断电红警", en: "Deep Ice-Core Breach Alarm", ja: "深層掘削基地 停電警報" },
    framing: "24mm Anamorphic Wide",
    cameraMove: { zh: "低角度极夜推轨，钻井大厅红警旋转扫过冻裂地砖", en: "Low-angle wide push through frost-cracked ice-core bay under red alarm beacons", ja: "赤色灯が回る極夜掘削室のローアングル前進" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: false,
    posterSrc: "./portraits/story/prologue_01.jpg",
    videoSrc: "./videos/story/prequel_icecore_breach.mp4",
    fallbackVideoSrc: "./videos/story/prologue_01.mp4",
    blocking: {
      zone: "inner_corridor",
      alertLight: "red",
      camera: {
        pos: [5.6, 1.05, 3.1],
        target: [6.8, 1.35, -2.1],
        fov: 50,
        lensLabel: "24mm Anamorphic f/2.0",
        axisNote: {
          zh: "低机位宽银幕仰拍，强化深冰事故夜的工业压迫感。",
          en: "Low-angle 24mm establishing sweep along ice-crusted bulkheads.",
          ja: "24mm広角煽りで極夜事故の不穏さを強調。"
        }
      },
      actors: [
        { id: "crew", label: "撤离钻井班员", pos: [6.5, 0, -1.8], rotY: 0, color: "#e04634" }
      ]
    }
  },
  {
    id: "shot_prequel_op08",
    storyNodeId: "prologue_01",
    shotCode: "SC-P02",
    chapter: { zh: "前传 · 前任遗言", en: "PREQUEL · #08 WARNING", ja: "前日譚 · #08の遺言" },
    title: { zh: "前任值班员 #08 遗言（口型）", en: "#08 Watchstander Warning (Lip-Sync)", ja: "前任当直官 #08 警告（口型）" },
    framing: "50mm Booth Desk Close-Up",
    cameraMove: { zh: "琥珀台灯斜侧顶光下，#08 急促回头盯门后贴近镜头留下忠告", en: "Tight 50mm booth console framing under sodium lamp as #08 warns successor", ja: "操作盤アンバー光下で#08が後任へ緊迫の警告" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: true,
    speakerName: { zh: "前任值班员 #08", en: "Watchstander #08", ja: "前任当直官 #08" },
    lipSyncLine: {
      zh: "「记住：真人会怕、会认错；越是完美得像教科书的，越不是人。」",
      en: "\"Remember: real humans fear and admit fault. Too clean means mimic.\"",
      ja: "「忘れるな、完璧すぎる言い訳をする奴ほど人間じゃない。」"
    },
    posterSrc: "./portraits/operator09.jpg",
    videoSrc: "./videos/story/prequel_op08_warning.mp4",
    fallbackVideoSrc: "./videos/operator09/idle.mp4",
    blocking: {
      zone: "booth",
      alertLight: "amber",
      camera: {
        pos: [-0.35, 1.44, 1.38],
        target: [0.0, 1.42, 2.25],
        fov: 38,
        lensLabel: "50mm Anamorphic f/2.0",
        axisNote: {
          zh: "岗亭内反打控制台席位，后台防爆窗雪影衬出孤立宿命感。",
          en: "Reverse interior desk angle keeping blizzard glass glowing cyan behind #08.",
          ja: "ブース内逆切り返しで孤独な当直席を映す。"
        }
      },
      actors: [
        { id: "op08", label: "前任值班员 #08", pos: [0.0, 0, 2.25], rotY: 0, color: "#eba834", speaking: true }
      ]
    }
  },
  {
    id: "shot_prologue_01",
    storyNodeId: "prologue_01",
    shotCode: "SC-00A",
    chapter: { zh: "序章 · 停电接班", en: "PROLOGUE · BLACKOUT", ja: "序章 · 停電" },
    title: { zh: "停电走廊与圆窗暴雪", en: "Blackout Hall & Porthole", ja: "停電廊下と丸窓吹雪" },
    framing: "28mm Wide Tracking",
    cameraMove: { zh: "稳定前推跟拍，展现冰封钢铁走廊与橙色应急灯", en: "Slow stabilized push-in along iced steel corridor", ja: "ゆっくりしたドリー前進" },
    durationSec: 3.75,
    frames: 90,
    hasNativeAudio: false,
    posterSrc: "./portraits/story/prologue_01.jpg",
    videoSrc: "./videos/story/prologue_01.mp4",
    fallbackVideoSrc: "./videos/lobby/bg.mp4",
    blocking: {
      zone: "inner_corridor",
      alertLight: "amber",
      camera: {
        pos: [5.4, 1.55, 2.8],
        target: [6.8, 1.35, -1.6],
        fov: 42,
        lensLabel: "28mm Anamorphic",
        axisNote: {
          zh: "走廊纵深机位，左舷圆窗暴风雪形成冷暖对角切分。",
          en: "Corridor depth axis splitting cyan blizzard porthole vs sodium cage lamp.",
          ja: "廊下の奥行構図で寒色丸窓とオレンジ灯を対比。"
        }
      },
      actors: [
        { id: "colleague", label: "前任值班员", pos: [6.5, 0, -1.4], rotY: 0, color: "#5bbad5" }
      ]
    }
  },
  {
    id: "shot_prologue_02",
    storyNodeId: "prologue_02",
    shotCode: "SC-00B",
    chapter: { zh: "序章 · 警报惊醒", en: "PROLOGUE · SIREN", ja: "序章 · 警報" },
    title: { zh: "岗位窗口主视角 · 走廊红警", en: "Booth POV · Red Corridor", ja: "ブース主観 · 赤色警報" },
    framing: "35mm Locked POV",
    cameraMove: { zh: "隔着结霜防爆玻璃凝视走廊深处，微幅呼吸起伏", en: "Locked subjective POV through frosted glass pane", ja: "防爆窓越し主観固定ショット" },
    durationSec: 3.75,
    frames: 90,
    hasNativeAudio: false,
    posterSrc: "./portraits/story/prologue_02.jpg",
    videoSrc: "./videos/story/prologue_02.mp4",
    fallbackVideoSrc: "./videos/chamber/whiteout.mp4",
    blocking: {
      zone: "booth",
      alertLight: "red",
      camera: {
        pos: [0.0, 1.5, 2.2],
        target: [0.0, 1.35, -3.5],
        fov: 45,
        lensLabel: "35mm POV Glass",
        axisNote: {
          zh: "机位贴近值班员双眼高度（Z=+2.2），穿透过门窗直指外舱深处。",
          en: "Eye-level subjective lens inside Booth 0 looking straight across Z=0 glass.",
          ja: "アイレベルの主観カメラでZ=0ガラス越しに廊下奥を捉える。"
        }
      },
      actors: [
        { id: "op09", label: "OP-09 (主观视角)", pos: [0.0, 0, 2.45], rotY: Math.PI, color: "#eba834" },
        { id: "shadow", label: "走廊撞门人影", pos: [0.2, 0, -4.0], rotY: 0, color: "#e04634" }
      ]
    }
  },
  {
    id: "shot_prologue_03",
    storyNodeId: "prologue_03",
    shotCode: "SC-00C",
    chapter: { zh: "序章 · 密钥交接", en: "PROLOGUE · HANDOVER", ja: "序章 · 鍵引き継ぎ" },
    title: { zh: "控制台密钥特写", en: "Console Key Macro", ja: "操作盤の鍵クローズアップ" },
    framing: "65mm Macro OTS",
    cameraMove: { zh: "极近景俯拍双手将钢制密钥压上记录板，背景暴雪虚化", en: "Shallow-DOF macro over frosted switches toward desk key", ja: "操作盤の鍵へ寄る接写ショット" },
    durationSec: 3.75,
    frames: 90,
    hasNativeAudio: false,
    posterSrc: "./portraits/story/prologue_03.jpg",
    videoSrc: "./videos/story/prologue_03.mp4",
    fallbackVideoSrc: "./videos/operator09/idle.mp4",
    blocking: {
      zone: "booth",
      alertLight: "amber",
      camera: {
        pos: [-0.85, 1.38, 1.95],
        target: [0.05, 0.92, 1.05],
        fov: 32,
        lensLabel: "65mm Macro f/2.0",
        axisNote: {
          zh: "45° 斜侧俯拍控制台面板，后景 Z=0 玻璃呈大光斑琥珀青色散景。",
          en: "45-deg high macro onto steel desk with bokeh blizzard glass behind.",
          ja: "操作盤の鍵を斜め上から接写し背景の氷窓をボカす。"
        }
      },
      actors: [
        { id: "op09", label: "OP-09", pos: [0.0, 0, 2.2], rotY: Math.PI, color: "#eba834" }
      ]
    }
  },
  {
    id: "shot_fb_elena_cabin3",
    storyNodeId: "n1_elena_arrival",
    shotCode: "SC-FB-01",
    chapter: { zh: "背景闪回 · 3号舱", en: "FLASHBACK · CABIN 3", ja: "回想 · 第3区画" },
    title: { zh: "3 号舱减压反锁监控回放", en: "Cabin 3 Lockout Flashback", ja: "第3区画 隔離ロック回想" },
    framing: "28mm Cold Security Flashback",
    cameraMove: { zh: "高压冷雾喷涌瞬间，艾琳娜冷静扣死气闸门锁", en: "Hand-held CCTV vantage as pressurized fog erupts and Dr. Vance seals the bulkhead", ja: "減圧霧の中でエレナが隔壁をロックする監視映像" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: false,
    posterSrc: "./portraits/reactions/elena_flinch.jpg",
    videoSrc: "./videos/story/fb_elena_cabin3.mp4",
    fallbackVideoSrc: "./videos/elena/flinch.mp4",
    blocking: {
      zone: "inner_corridor",
      alertLight: "cyan",
      camera: {
        pos: [4.6, 1.95, 2.2],
        target: [6.7, 1.35, -0.8],
        fov: 45,
        lensLabel: "28mm CCTV Flashback",
        axisNote: {
          zh: "高位冷光监控仰俯斜角，呈现艾琳娜关死 3 号舱防爆门动作。",
          en: "Cold overhead CCTV axis capturing the Cabin 3 lockout moment.",
          ja: "高所監視カメラ角度でロック瞬間を記録。"
        }
      },
      actors: [
        { id: "v01", label: "艾琳娜 (V-01)", pos: [6.5, 0, -0.7], rotY: -Math.PI / 2, color: "#5bbad5" }
      ]
    }
  },
  {
    id: "shot_elena_arrival",
    storyNodeId: "n1_elena_arrival",
    shotCode: "SC-01A",
    chapter: { zh: "第 1 夜 · V-01 艾琳娜", en: "NIGHT 01 · ELENA", ja: "第1夜 · エレナ" },
    title: { zh: "艾琳娜拍窗求救（原声口型）", en: "Elena Storm Knock (Lip-Sync)", ja: "エレナ吹雪叩扉（リップシンク）" },
    framing: "50mm Medium Close-Up",
    cameraMove: { zh: "岗亭内侧机位平视 Z=0 玻璃，艾琳娜单手拍窗喊话、嘴型同步中文台词", en: "Interior 50mm MCU locked across blast window with synchronized speech", ja: "ガラス越し50mm MCU・発話口型シンクロ" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: true,
    speakerName: { zh: "艾琳娜·万斯博士 (V-01)", en: "Dr. Elena Vance (V-01)", ja: "エレナ医師 (V-01)" },
    lipSyncLine: {
      zh: "「外面的供暖管全炸了！再不开门我就冻死在这儿了！」",
      en: "\"The outer heating lines blew! Open the door or I'll freeze out here!\"",
      ja: "「外の暖房管が破裂した！早く開けないとここで凍死する！」"
    },
    posterSrc: "./portraits/story/n1_elena_knock.jpg",
    videoSrc: "./videos/story/n1_elena_knock.mp4",
    fallbackVideoSrc: "./videos/elena/idle.mp4",
    blocking: {
      zone: "vestibule",
      alertLight: "cyan",
      camera: {
        pos: [0.0, 1.48, 1.35],
        target: [0.0, 1.42, -0.75],
        fov: 38,
        lensLabel: "50mm Anamorphic f/2.0",
        axisNote: {
          zh: "守住 180° 轴线南侧（Z=+1.35 -> Z=-0.75），避免与后续审讯画面发生左右镜像穿帮。",
          en: "Strictly south of 180-deg axis (Z=+1.35 looking north) to match booth viewport.",
          ja: "180度軸線南側から撮影し審問画面との左右一致を保つ。"
        }
      },
      actors: [
        { id: "op09", label: "OP-09", pos: [0.0, 0, 2.25], rotY: Math.PI, color: "#eba834" },
        { id: "v01", label: "艾琳娜 (V-01)", pos: [0.0, 0, -0.75], rotY: 0, color: "#5bbad5", speaking: true }
      ]
    }
  },
  {
    id: "shot_elena_react_intercom",
    storyNodeId: "n1_elena_react_intercom",
    shotCode: "SC-01B-1",
    chapter: { zh: "第 1 夜 · 对峙分支", en: "NIGHT 01 · CONFRONT", ja: "第1夜 · 対質分岐" },
    title: { zh: "质问反锁：艾琳娜辩解（口型）", en: "Cabin 3 Rebuttal (Lip-Sync)", ja: "第3区画ロック弁明（口型同期）" },
    framing: "65mm Intense Close-Up",
    cameraMove: { zh: "镜头缓推贴近防爆窗，捕捉她推眼镜、冷声自辩的微表情与口型", en: "Subtle 65mm slow push onto glass catching clipped surgical rebuttal", ja: "ゆっくり前進し眼鏡越しに弁明の口元を捉える" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: true,
    speakerName: { zh: "艾琳娜·万斯博士 (V-01)", en: "Dr. Elena Vance (V-01)", ja: "エレナ医師 (V-01)" },
    lipSyncLine: {
      zh: "「当时失压只剩十秒，我反锁内门是为了保住站里唯一的手术医生！」",
      en: "\"We had ten seconds before blowout—I locked it to save the station's sole surgeon!\"",
      ja: "「減圧まで10秒しかなかった。唯一の執刀医を守るためのロックよ！」"
    },
    posterSrc: "./portraits/reactions/elena_lean_in.jpg",
    videoSrc: "./videos/story/n1_elena_react_intercom.mp4",
    fallbackVideoSrc: "./videos/elena/lean_in.mp4",
    blocking: {
      zone: "vestibule",
      alertLight: "amber",
      camera: {
        pos: [-0.25, 1.48, 1.05],
        target: [0.0, 1.45, -0.68],
        fov: 31,
        lensLabel: "65mm Close-Up f/2.0",
        axisNote: {
          zh: "微偏左机位推近特写，保留右侧控制台强对比暖反光。",
          en: "Slight camera-left offset push-in preserving warm booth console speculars.",
          ja: "わずかに左へ振りつつ65mmへ寄せ緊張感を高める。"
        }
      },
      actors: [
        { id: "op09", label: "OP-09", pos: [0.0, 0, 2.25], rotY: Math.PI, color: "#eba834" },
        { id: "v01", label: "艾琳娜 (V-01)", pos: [0.0, 0, -0.68], rotY: 0, color: "#5bbad5", speaking: true }
      ]
    }
  },
  {
    id: "shot_elena_react_strobe",
    storyNodeId: "n1_elena_react_strobe",
    shotCode: "SC-01B-2",
    chapter: { zh: "第 1 夜 · 强光分岐", en: "NIGHT 01 · STROBE", ja: "第1夜 · 閃光分岐" },
    title: { zh: "强光应激：艾琳娜怒斥（口型）", en: "Strobe Flinch Snap (Lip-Sync)", ja: "閃光反応・怒声（口型同期）" },
    framing: "50mm Tight Reaction",
    cameraMove: { zh: "频闪白光掠过镜片，艾琳娜抬手遮眼后压低声音逼近玻璃回应", en: "Strobe pulse flashes across wire glasses as she shields eyes and snaps back", ja: "ストロボ閃光に眉を顰めガラス越しに怒鳴り返す" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: true,
    speakerName: { zh: "艾琳娜·万斯博士 (V-01)", en: "Dr. Elena Vance (V-01)", ja: "エレナ医師 (V-01)" },
    lipSyncLine: {
      zh: "「把强光关掉！我不是外面那些东西，去查我的配给记录！」",
      en: "\"Kill that strobe! I am not one of the things out here—check my medbay logs!\"",
      ja: "「ライトを消して！私は外の化け物じゃない、配給記録を調べなさい！」"
    },
    posterSrc: "./portraits/reactions/elena_flinch.jpg",
    videoSrc: "./videos/story/n1_elena_react_strobe.mp4",
    fallbackVideoSrc: "./videos/elena/flinch.mp4",
    blocking: {
      zone: "vestibule",
      alertLight: "red",
      camera: {
        pos: [0.22, 1.48, 1.15],
        target: [0.0, 1.44, -0.72],
        fov: 36,
        lensLabel: "50mm Strobe Capture",
        axisNote: {
          zh: "传感器触发瞬间切入稍右微仰角，强调眼镜片强光炫光与怒气张力。",
          en: "Slightly right low-angle reaction capturing lens flare across wire glasses.",
          ja: "右寄りの仰角で眼鏡への閃光反射を強調。"
        }
      },
      actors: [
        { id: "op09", label: "OP-09", pos: [0.0, 0, 2.25], rotY: Math.PI, color: "#eba834" },
        { id: "v01", label: "艾琳娜 (V-01)", pos: [0.0, 0, -0.72], rotY: 0, color: "#e04634", speaking: true }
      ]
    }
  },
  {
    id: "shot_elena_outcome_admit",
    storyNodeId: "n1_corridor_admit",
    shotCode: "SC-01C-ADMIT",
    chapter: { zh: "第 1 夜 · 放行后果", en: "NIGHT 01 · ADMITTED", ja: "第1夜 · 許可結果" },
    title: { zh: "放行艾琳娜进舱（口型）", en: "Elena Enters Corridor (Lip-Sync)", ja: "エレナ入室（口型同期）" },
    framing: "40mm Airlock Threshold",
    cameraMove: { zh: "气闸门开启寒雾涌入，艾琳娜进门时冷静交待封锁医疗室", en: "Airlock opens into cold corridor; Elena exhales vapor and commands medbay seal", ja: "扉が開き冷気と共にエレナが入室し指示を出す" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: true,
    speakerName: { zh: "艾琳娜·万斯博士 (V-01)", en: "Dr. Elena Vance (V-01)", ja: "エレナ医師 (V-01)" },
    lipSyncLine: {
      zh: "「算你识相。医疗室需要马上封锁供电，别让任何人打扰我。」",
      en: "\"Smart call. Seal medbay power right now—no interruptions.\"",
      ja: "「賢明な判断ね。誰にも邪魔させないで。」"
    },
    posterSrc: "./portraits/reactions/chamber_admit.jpg",
    videoSrc: "./videos/story/n1_elena_outcome_admit.mp4",
    fallbackVideoSrc: "./videos/chamber/admit.mp4",
    blocking: {
      zone: "inner_corridor",
      alertLight: "cyan",
      camera: {
        pos: [4.8, 1.5, 1.8],
        target: [6.7, 1.42, -0.8],
        fov: 40,
        lensLabel: "40mm Anamorphic f/2.0",
        axisNote: {
          zh: "走廊内门侧跟拍机位，衔接放行转场进入内舱。",
          en: "Interior airlock corridor lens trailing Elena as she steps past Gate 0.",
          ja: "内扉側からエレナの入室を捉える。"
        }
      },
      actors: [
        { id: "v01", label: "艾琳娜 (V-01)", pos: [6.6, 0, -0.75], rotY: -Math.PI / 2, color: "#5bbad5", speaking: true }
      ]
    }
  },
  {
    id: "shot_elena_outcome_purge",
    storyNodeId: "n1_corridor_purge",
    shotCode: "SC-01C-PURGE",
    chapter: { zh: "第 1 夜 · 净化后果", en: "NIGHT 01 · PURGED", ja: "第1夜 · 焼却結果" },
    title: { zh: "过渡舱 1,100°C 高温净化", en: "1,100°C Vestibule Purge", ja: "1,100°C 高温焼却実行" },
    framing: "35mm Armored Glass Wide",
    cameraMove: { zh: "橙白烈焰隔窗暴燃吞没前舱，控制台表面泛起热浪倒影", en: "Locked Booth POV as 1,100°C jets roar through armored vestibule", ja: "防爆ガラス越しに1,100°Cの炎が噴き上がる" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: false,
    posterSrc: "./portraits/reactions/chamber_purge.jpg",
    videoSrc: "./videos/story/n1_elena_outcome_purge.mp4",
    fallbackVideoSrc: "./videos/chamber/purge.mp4",
    blocking: {
      zone: "vestibule",
      alertLight: "red",
      camera: {
        pos: [0.0, 1.48, 1.65],
        target: [0.0, 1.35, -0.9],
        fov: 45,
        lensLabel: "35mm Anamorphic f/2.4",
        axisNote: {
          zh: "0 号窗口安全距离固定广角，忠实记录高温烈焰冲刷玻璃。",
          en: "Safe interior setback framing blazing furnace surge across Z=0 glass.",
          ja: "安全距離35mmで火炎の衝撃を正面から捉える。"
        }
      },
      actors: [
        { id: "op09", label: "OP-09", pos: [0.0, 0, 2.25], rotY: Math.PI, color: "#eba834" }
      ]
    }
  },
  {
    id: "shot_corridor_aftermath",
    storyNodeId: "n1_corridor_admit",
    shotCode: "SC-01C",
    chapter: { zh: "第 1 夜 · 走廊分支", en: "NIGHT 01 · CORRIDOR", ja: "第1夜 · 通路分岐" },
    title: { zh: "医疗室冷光异动 / 通风口回响", en: "Medbay Cold Spark / Duct Knock", ja: "医務室冷光・換気異音" },
    framing: "24mm Surveillance Steadicam",
    cameraMove: { zh: "冷色荧光管在走廊尽头闪烁，寒雾顺着气闸门底缝漫出", en: "Flickering cyan overhead over icy vapor creeping under airlock", ja: "蛍光灯の明滅と気閘底からの冷気噴出" },
    durationSec: 3.75,
    frames: 90,
    hasNativeAudio: false,
    posterSrc: "./portraits/story/n1_corridor_aftermath.jpg",
    videoSrc: "./videos/story/n1_corridor_aftermath.mp4",
    fallbackVideoSrc: "./videos/chamber/admit.mp4",
    blocking: {
      zone: "inner_corridor",
      alertLight: "cyan",
      camera: {
        pos: [4.3, 2.15, 2.4],
        target: [6.7, 1.1, -1.2],
        fov: 48,
        lensLabel: "24mm Security Cam",
        axisNote: {
          zh: "右上角高位监控斜俯角，完整囊括右侧医疗气闸门与地面冰霜蔓延轨迹。",
          en: "High-mounted corridor cam framing right medical airlock & deck frost seepage.",
          ja: "右上監視カメラ俯瞰で医療扉と霜の広がりを捉える。"
        }
      },
      actors: [
        { id: "door", label: "B区医疗气闸门", pos: [6.8, 0, -0.8], rotY: -Math.PI / 2, color: "#5bbad5" }
      ]
    }
  },
  {
    id: "shot_fb_leo_powerbay",
    storyNodeId: "n1_leo_arrival",
    shotCode: "SC-FB-02",
    chapter: { zh: "背景闪回 · 动力舱", en: "FLASHBACK · POWER BAY", ja: "回想 · 動力室" },
    title: { zh: "动力舱电弧爆闪与里奥脱队", en: "Power Bay 2 Sparks & Flight", ja: "動力室火花・リオ離脱" },
    framing: "35mm Dynamic Storm Cam",
    cameraMove: { zh: "白色工具箱拖拽雪痕与舱内电弧火光交错，里奥仓惶冲出风雪门", en: "Urgent storm tracking as Leo grabs cryo kit amidst exploding power bay sparks", ja: "火花が散る動力室から工具箱を抱えて飛び出す" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: false,
    posterSrc: "./portraits/reactions/leo_flinch.jpg",
    videoSrc: "./videos/story/fb_leo_powerbay.mp4",
    fallbackVideoSrc: "./videos/leo/flinch.mp4",
    blocking: {
      zone: "outer_blizzard",
      alertLight: "amber",
      camera: {
        pos: [-0.8, 1.55, -0.2],
        target: [0.3, 1.25, -2.5],
        fov: 42,
        lensLabel: "35mm Handheld Flashback",
        axisNote: {
          zh: "风雪外舱肩扛抓拍，体现动力舱事故现场混乱紧迫感。",
          en: "Exterior handheld angle capturing panicked flight into the storm.",
          ja: "屋外手持ちカメラで逃走の緊迫感を演出。"
        }
      },
      actors: [
        { id: "v02", label: "佐藤里奥 (V-02)", pos: [0.3, 0, -2.4], rotY: 0, color: "#eba834" }
      ]
    }
  },
  {
    id: "shot_leo_arrival",
    storyNodeId: "n1_leo_arrival",
    shotCode: "SC-02A",
    chapter: { zh: "第 1 夜 · V-02 佐藤里奥", en: "NIGHT 01 · LEO", ja: "第1夜 · リオ" },
    title: { zh: "里奥拖箱抵窗（原声口型）", en: "Leo Tool Chest Arrival (Lip-Sync)", ja: "リオ工具箱到着（口型同期）" },
    framing: "40mm Medium Tracking",
    cameraMove: { zh: "里奥拖着 2 号动力舱备用阀体与工具箱顶风雪靠近防爆窗并喊话", en: "Medium exterior approach through blizzard blowing toward warm amber window", ja: "吹雪を突いて工具箱を引きながら窓へ接近" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: true,
    speakerName: { zh: "佐藤里奥 (V-02)", en: "Leo Sato (V-02)", ja: "佐藤レオ (V-02)" },
    lipSyncLine: {
      zh: "「值班员！快放我进去，我带了二号动力舱的备用阀门工具！」",
      en: "\"Watchstander! Let me in—I hauled the spare thermal valve rig from Bay 2!\"",
      ja: "「当直官！早く開けてくれ、第2動力室の予備バルブ一式を持ってきたんだ！」"
    },
    posterSrc: "./portraits/story/n1_leo_arrival.jpg",
    videoSrc: "./videos/story/n1_leo_arrival.mp4",
    fallbackVideoSrc: "./videos/leo/idle.mp4",
    blocking: {
      zone: "outer_blizzard",
      alertLight: "amber",
      camera: {
        pos: [0.0, 1.48, 1.4],
        target: [0.15, 1.32, -2.0],
        fov: 40,
        lensLabel: "40mm Anamorphic f/2.4",
        axisNote: {
          zh: "中景保留膝以上动势与手中白色重型工具箱轮廓。",
          en: "Mid-frame clearance showing storm stride and heavy cryo tool chest.",
          ja: "腰上中景で工具箱の重みと吹雪の勢いを収める。"
        }
      },
      actors: [
        { id: "op09", label: "OP-09", pos: [0.0, 0, 2.25], rotY: Math.PI, color: "#eba834" },
        { id: "v02", label: "佐藤里奥 (V-02)", pos: [0.2, 0, -1.9], rotY: 0, color: "#eba834", speaking: true }
      ]
    }
  },
  {
    id: "shot_leo_react_intercom",
    storyNodeId: "n1_leo_react_intercom",
    shotCode: "SC-02B-1",
    chapter: { zh: "第 1 夜 · 对峙分支", en: "NIGHT 01 · LEO PROBE", ja: "第1夜 · リオ追及" },
    title: { zh: "追问脱队：里奥急辩（口型）", en: "Convoy Rebuttal · Leo (Lip-Sync)", ja: "離脱理由の弁解（口型同期）" },
    framing: "50mm Nervous Close-Up",
    cameraMove: { zh: "镜头锁定里奥慌乱避开视线后又急切贴近对讲格栅的辩解动作", en: "Tighter 50mm frame tracking darting eyes and fast apologetic cadence", ja: "視線を逸らしつつ早口で言い訳する50mm" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: true,
    speakerName: { zh: "佐藤里奥 (V-02)", en: "Leo Sato (V-02)", ja: "佐藤レオ (V-02)" },
    lipSyncLine: {
      zh: "「车队在冰缝那边全散了！我是拼着命把备用件背回来的，没半句假话！」",
      en: "\"The convoy scattered at the crevasse—I risked my neck hauling these parts back!\"",
      ja: "「護送班は氷の割れ目で散り散りになったんだ！命懸けで部品を持ち帰ったんだ！」"
    },
    posterSrc: "./portraits/reactions/leo_lean_in.jpg",
    videoSrc: "./videos/story/n1_leo_react_intercom.mp4",
    fallbackVideoSrc: "./videos/leo/lean_in.mp4",
    blocking: {
      zone: "vestibule",
      alertLight: "amber",
      camera: {
        pos: [0.18, 1.46, 1.1],
        target: [0.0, 1.42, -0.78],
        fov: 35,
        lensLabel: "50mm Close-Medium",
        axisNote: {
          zh: "近距平视压缩外舱背景，让观众紧盯他躲闪的眼神与急促嘴型。",
          en: "Compressed 50mm MCU keeping focus tightly on eyes and rapid lip motion.",
          ja: "50mmで背景を圧縮し視線と口元の動きに集中させる。"
        }
      },
      actors: [
        { id: "op09", label: "OP-09", pos: [0.0, 0, 2.25], rotY: Math.PI, color: "#eba834" },
        { id: "v02", label: "佐藤里奥 (V-02)", pos: [0.0, 0, -0.78], rotY: 0, color: "#eba834", speaking: true }
      ]
    }
  },
  {
    id: "shot_leo_outcome_admit",
    storyNodeId: "n1_leo_aftermath",
    shotCode: "SC-02C-1",
    chapter: { zh: "第 1 夜 · 里奥入舱", en: "NIGHT 01 · LEO INSIDE", ja: "第1夜 · リオ入室" },
    title: { zh: "放行里奥进舱：擦灰低语（口型）", en: "Leo Enters Corridor (Lip-Sync)", ja: "リオ入室後の囁き（口型）" },
    framing: "40mm Medium Inside Gate",
    cameraMove: { zh: "里奥提箱进门后长舒一口气，压低声音对 #09 拜托保密", en: "Leo exhales relief inside the threshold, glancing sideways while thanking #09", ja: "入室後にほっとして口止めを頼むリオ" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: true,
    speakerName: { zh: "佐藤里奥 (V-02)", en: "Leo Sato (V-02)", ja: "佐藤レオ (V-02)" },
    lipSyncLine: {
      zh: "「谢了兄弟，备用阀放这儿了……别告诉站长我差点把工具弄丢了。」",
      en: "\"Thanks pal—just don't tell the commander I nearly lost the kit.\"",
      ja: "「助かったよ……隊長には内緒にしてくれ。」"
    },
    posterSrc: "./portraits/leo.jpg",
    videoSrc: "./videos/story/n1_leo_outcome_admit.mp4",
    fallbackVideoSrc: "./videos/leo/idle.mp4",
    blocking: {
      zone: "inner_corridor",
      alertLight: "amber",
      camera: {
        pos: [5.0, 1.48, 1.6],
        target: [6.4, 1.38, -0.7],
        fov: 40,
        lensLabel: "40mm Anamorphic f/2.0",
        axisNote: {
          zh: "内舱安全通道中近景，暖琥珀壁灯下展现紧张退潮后的心理松懈。",
          en: "Warm interior corridor medium capturing Leo's nervous relief.",
          ja: "内廊下で緊張が解けた瞬間の中景。"
        }
      },
      actors: [
        { id: "v02", label: "佐藤里奥 (V-02)", pos: [6.3, 0, -0.65], rotY: -Math.PI / 2, color: "#eba834", speaking: true }
      ]
    }
  },
  {
    id: "shot_n1_cliffhanger",
    storyNodeId: "n1_leo_aftermath",
    shotCode: "SC-02C-2",
    chapter: { zh: "第 1 夜 · 悬念尾声", en: "NIGHT 01 · CLIFFHANGER", ja: "第1夜 · 次夜予告" },
    title: { zh: "第 1 夜片尾悬念：深廊黑影", en: "Night 1 Cliffhanger: Corridor Shadow", ja: "第1夜終盤：廊下の異影" },
    framing: "28mm Haunted Corridor Long Shot",
    cameraMove: { zh: "远端荧光灯突然频闪，陌生高大人影静立尽头凝望 0 号岗亭", en: "Slow ominous zoom down flooded cold corridor as a tall figure stands motionless", ja: "遠端の明滅下に立ち尽くす謎の人影へ迫るズーム" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: false,
    posterSrc: "./portraits/story/n1_corridor_aftermath.jpg",
    videoSrc: "./videos/story/n1_cliffhanger_shadow.mp4",
    fallbackVideoSrc: "./videos/story/n1_corridor_aftermath.mp4",
    blocking: {
      zone: "inner_corridor",
      alertLight: "red",
      camera: {
        pos: [4.4, 1.75, 2.3],
        target: [6.9, 1.4, -2.2],
        fov: 46,
        lensLabel: "28mm Cold Thriller Wide",
        axisNote: {
          zh: "走廊尽头纵深构图，为第 2–5 夜拉响高能悬念钩子。",
          en: "Deep corridor silhouette framing the hook into Nights 2–5.",
          ja: "長い廊下の突き当たりに立つ影で第2〜5夜へ繋ぐ。"
        }
      },
      actors: [
        { id: "shadow", label: "未知黑影", pos: [6.8, 0, -2.1], rotY: 0, color: "#e04634" }
      ]
    }
  }
];

export function getStoryboardShot(id: string): StoryboardShot | undefined {
  return STUDIO_STORYBOARD_SHOTS.find((s) => s.id === id);
}
