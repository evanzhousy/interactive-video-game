import { tl } from "./i18n.js";
import type { Locale, LocalizedText } from "./types.js";
import { ALL_VISITORS } from "./visitors/index.js";

export type AssetKind = "cast" | "prop" | "set";
export type WhiteboxRenderMode = "clay" | "depth" | "lit";
export type CameraMotionPreset = "static" | "dolly_in" | "pan" | "handheld" | "pull_back";

export interface CastAssetSpec {
  id: string;
  assetTag: string; // "@elena", "@leo", "@arthur", "@marcus", "@ana", "@ingrid", "@linmei", "@hannah", "@op09"
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
  promptAnchor: string;
  colorTag: string;
}

export interface PropAssetSpec {
  id: string;
  assetTag: string; // "@tool_chest" | "@cryo_canister" | "@blackbox" | "@ledger" | "@intercom" | "@purge_valve"
  code: string;
  name: LocalizedText;
  category: LocalizedText;
  description: LocalizedText;
  promptAnchor: string;
  primitive: "box" | "cylinder" | "briefcase" | "tape" | "ledger" | "console";
  colorTag: string;
}

export interface SetAssetSpec {
  id: string;
  assetTag: string; // "@set_booth" | "@set_vestibule" | "@set_corridor" | "@set_icecore"
  code: string;
  zone: "outer_blizzard" | "vestibule" | "booth" | "inner_corridor";
  name: LocalizedText;
  description: LocalizedText;
  lightingRecipe: LocalizedText;
  promptAnchor: string;
  previewSrc: string;
  colorTag: string;
}

export interface PropBlocking3D {
  id: string;
  assetTag: string;
  label: string;
  primitive: PropAssetSpec["primitive"];
  pos: [number, number, number];
  rotY?: number;
  scale?: [number, number, number];
  color: string;
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
  boundAssetTags: readonly string[];
  motionPreset: CameraMotionPreset;
  blocking: {
    zone: "outer_blizzard" | "vestibule" | "booth" | "inner_corridor";
    alertLight: "amber" | "red" | "cyan";
    camera: CameraBlocking3D;
    actors: readonly ActorBlocking3D[];
    props?: readonly PropBlocking3D[];
  };
}

export interface ShotExportPackage {
  shotCode: string;
  shotId: string;
  title: string;
  aspectRatio: "16:9";
  lens: string;
  fov: number;
  motionPreset: CameraMotionPreset;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
  boundAssets: Array<{ tag: string; name: string; promptAnchor: string }>;
  lipSyncLine?: string;
  promptText: string;
  jsonString: string;
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
    assetTag: string;
    wardrobe: LocalizedText;
    lightingKey: LocalizedText;
    lens: string;
    promptAnchor: string;
    colorTag: string;
  }
> = {
  "V-01": {
    slug: "elena",
    assetTag: "@elena",
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
    promptAnchor:
      "Dr. Elena Vance, woman in her late 30s, frost-rimmed thin round wire glasses, blood-speckled teal surgical scrubs under snow-dusted charcoal fur-hooded parka, matte sub-zero skin, stern clinical gaze, Svalbard -46C polar lighting",
    colorTag: "#5bbad5"
  },
  "V-02": {
    slug: "leo",
    assetTag: "@leo",
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
    promptAnchor:
      "Leo Sato, man in his late 20s, wet windswept dark hair, soot smudge on cheek, olive-grey utility collar jacket beneath snow-crusted dark work parka, visible condensation breath, matte realistic skin",
    colorTag: "#eba834"
  },
  "V-03": {
    slug: "arthur",
    assetTag: "@arthur",
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
    promptAnchor:
      "Director Arthur Pendelton, man in his 50s, neat slicked-back graying hair, tailored charcoal-camel wool overcoat collar over dark turtleneck, crisp authoritative jawline shadow, matte cinematic skin",
    colorTag: "#9ec6d4"
  },
  "V-04": {
    slug: "marcus",
    assetTag: "@marcus",
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
    promptAnchor:
      "Capt. Marcus Thorne, rugged man in his 40s, heavy navy polar commander fleece jacket with weathered submarine fleet patch and reflective shoulder trim, tense furrowed brow under red alarm edge light",
    colorTag: "#e04634"
  },
  "V-05": {
    slug: "ana",
    assetTag: "@ana",
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
    promptAnchor:
      "Anais Moreau, woman in her 30s, wet dark hair tucked into black neoprene drysuit neck seal under waterproof polar shell, terrified hyper-focused eyes, split cyan-amber lighting, frosted breath vapor",
    colorTag: "#49b882"
  },
  "V-06": {
    slug: "ingrid",
    assetTag: "@ingrid",
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
    promptAnchor:
      "Dr. Ingrid Solberg, Scandinavian woman in her 30s, ice crystals in eyelashes, white polar glaciology parka with frosted knit neck gaiter and lab ID lanyard, diffused geomagnetic storm cyan lighting",
    colorTag: "#7dc7ff"
  },
  "V-07": {
    slug: "linmei",
    assetTag: "@linmei",
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
    promptAnchor:
      "Commissioner Lin Mei, East Asian woman in her 40s, severe neat bun, navy discipline officer coat buttoned tightly to the throat, eerily composed expression, symmetrical overhead interrogation key light",
    colorTag: "#b48ead"
  },
  "V-08": {
    slug: "hannah",
    assetTag: "@hannah",
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
    promptAnchor:
      "Hannah Lindqvist, woman in her late 20s, windburned cheeks, heavy grease-stained polar mechanic coveralls under dark green quilted insulated vest, urgent desperate expression through frosted glass",
    colorTag: "#d08770"
  }
};

export const CAST_VISUAL_ASSETS: readonly CastAssetSpec[] = [
  {
    id: "OP-09",
    assetTag: "@op09",
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
    promptAnchor:
      "Operator #09, Gate 0 night watchstander in slate-grey insulated parka and padded intercom gauntlets holding steel master key, lit from below by warm sodium-amber console instruments",
    colorTag: "#eba834"
  },
  ...ALL_VISITORS.map((v): CastAssetSpec => {
    const meta = CAST_LOOKDEV_META[v.id] ?? {
      slug: "elena",
      assetTag: `@${v.id.toLowerCase()}`,
      wardrobe: { zh: "极地标准防寒装备", en: "Polar insulated gear", ja: "極地防寒装備" },
      lightingKey: { zh: "冷青与琥珀双色棚拍", en: "Cyan/amber film key", ja: "二色ライティング" },
      lens: "50mm Anamorphic f/2.0",
      promptAnchor: "Svalbard polar survivor in matte heavy insulated parka, realistic cold film lighting",
      colorTag: "#5bbad5"
    };
    return {
      id: v.id,
      assetTag: meta.assetTag,
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
      promptAnchor: meta.promptAnchor,
      colorTag: meta.colorTag
    };
  })
];

export const PROP_VISUAL_ASSETS: readonly PropAssetSpec[] = [
  {
    id: "prop_tool_chest",
    assetTag: "@tool_chest",
    code: "PR-01",
    name: { zh: "耐寒金属工具箱", en: "Cryo Tool Chest", ja: "耐熱工具ケース" },
    category: { zh: "动力舱设备", en: "Power Bay Gear", ja: "動力室装備" },
    description: {
      zh: "2 号动力舱制式白色耐寒工具箱，箱角磕碰沾雪，内含备用热交换阀组件。",
      en: "Battered white insulated Power Bay 2 tool chest with frost-locked latches and spare thermal valve assembly.",
      ja: "第2動力室の白い耐熱工具箱。予備サーマルバルブ一式を収納。"
    },
    promptAnchor:
      "Battered matte-white heavy steel cryo tool chest with brushed steel clasps, stenciled Bay 2 markings, snow crusted on hinges",
    primitive: "briefcase",
    colorTag: "#eba834"
  },
  {
    id: "prop_cryo_canister",
    assetTag: "@cryo_canister",
    code: "PR-02",
    name: { zh: "渗血低温样本罐", en: "Bleeding Cryo Canister", ja: "血痕付き凍結検体容器" },
    category: { zh: "冰芯生物样本", en: "Bio-Core Sample", ja: "氷床生体検体" },
    description: {
      zh: "双层钛合金低温取样罐，视窗泛着幽冷青光，封口边缘渗出暗红凝结物。",
      en: "Double-walled titanium cryo canister glowing faint cyan through frost glass with dark frozen crimson seepage at the seal.",
      ja: "シアンに光るチタン製凍結検体容器。密閉縁に暗赤色の滲み。"
    },
    promptAnchor:
      "Cylindrical brushed-steel cryo bio-containment canister with glowing pale cyan sight-glass and frozen dark red residue around gasket seal",
    primitive: "cylinder",
    colorTag: "#5bbad5"
  },
  {
    id: "prop_blackbox",
    assetTag: "@blackbox",
    code: "PR-03",
    name: { zh: "前任 #08 黑匣子磁带机", en: "#08 Magnetic Black Box", ja: "#08 ブラックボックス録音機" },
    category: { zh: "遗留证物", en: "Evidence Audio", ja: "遺留証拠品" },
    description: {
      zh: "前任值班员 #08 遗留的军用级磁带黑匣子，外壳划痕累累并沾染干涸血迹。",
      en: "Scarred military magnetic tape black-box recorder recovered from #08, housing twin reels behind cracked amber counter window.",
      ja: "前任#08が残した傷だらけの磁気テープ・ブラックボックス録音機。"
    },
    promptAnchor:
      "Ruggedized dark-slate military magnetic tape black-box recorder with twin exposed reels, amber mechanical counter, snow and dried blood scratches",
    primitive: "tape",
    colorTag: "#49b882"
  },
  {
    id: "prop_ledger",
    assetTag: "@ledger",
    code: "PR-04",
    name: { zh: "0 号岗亭钢制记录板与密钥", en: "Shift Ledger & Master Key", ja: "当直日誌とマスターキー" },
    category: { zh: "岗亭文书", en: "Booth Console", ja: "当直室備品" },
    description: {
      zh: "冷轧钢夹板纸质值班台账，压着黄铜铭牌的 0 号气闸物理机械主密钥。",
      en: "Cold-rolled steel clipboard shift log pinned beneath heavy brass-tagged Gate 0 mechanical master key.",
      ja: "スチール製クリップボードの当直日誌と真鍮タグ付き機械式マスターキー。"
    },
    promptAnchor:
      "Weathered steel clipboard with paper shift logbook and heavy machined steel Gate 0 master key on brass tag under warm desk lamp",
    primitive: "ledger",
    colorTag: "#d08770"
  },
  {
    id: "prop_intercom",
    assetTag: "@intercom",
    code: "PR-05",
    name: { zh: "壁挂按压对讲控制台", en: "PTT Intercom Console", ja: "無線インターホン操作盤" },
    category: { zh: "审讯终端", en: "Interrogation Rig", ja: "尋問端末" },
    description: {
      zh: "双层防爆玻璃下方的倾斜式不锈钢对讲台，带琥珀背光频谱表与红色 PTT 按键。",
      en: "Sloped brushed-steel PTT intercom console beneath blast glass with glowing amber VU dial and worn red transmit switch.",
      ja: "防爆窓下の傾斜ステンレス操作盤。アンバー計器と赤色送信ボタン。"
    },
    promptAnchor:
      "Industrial sloped stainless-steel push-to-talk intercom console with warm sodium-amber analog gauges, toggle switches, and heavy coiled handset cord",
    primitive: "console",
    colorTag: "#eba834"
  },
  {
    id: "prop_purge_valve",
    assetTag: "@purge_valve",
    code: "PR-06",
    name: { zh: "1,100°C 高温净化阀组", en: "1,100°C Purge Manifold", ja: "1,100°C 焼却バルブ盤" },
    category: { zh: "防卫系统", en: "Containment Weapon", ja: "防衛機構" },
    description: {
      zh: "红黑警戒涂装的高压燃料电磁阀箱，连接过渡舱顶部热力喷口与手轮锁销。",
      en: "Hazard-striped armored fuel purge manifold housing controlling 1,100°C vestibule incineration jets.",
      ja: "赤黒警戒塗装の高圧燃料遮断バルブ盤。1,100℃焼却ノズルを直結。"
    },
    promptAnchor:
      "Heavy hazard-red and matte-black steel thermal purge valve housing with pressure gauge, safety interlock pin, and armored fuel conduit",
    primitive: "box",
    colorTag: "#e04634"
  }
];

export const SET_VISUAL_ASSETS: readonly SetAssetSpec[] = [
  {
    id: "set_booth",
    assetTag: "@set_booth",
    code: "SET-01",
    zone: "booth",
    name: { zh: "0 号隔离岗亭内舱", en: "Gate 0 Watchstander Booth", ja: "第0隔離監視ブース内" },
    description: {
      zh: "狭小密闭的钢制值班室（Z > 0），配双层结霜防爆观察窗、琥珀台灯与审讯控制台。",
      en: "Claustrophobic steel watchstander booth (Z > 0) with frosted double-glazed blast window and sodium-amber console.",
      ja: "防爆窓とナトリウム灯操作盤を備えた狭小な鋼鉄監視室（Z > 0）。"
    },
    lightingRecipe: {
      zh: "3200K 琥珀控制台低位上打光 + 窗外透入的寒青暴雪冷背光",
      en: "3200K sodium-amber console uplight balanced against icy cyan window spill",
      ja: "3200Kアンバー下照らし＋窓からのシアン冷光"
    },
    promptAnchor:
      "Cramped sub-zero steel watchstander booth interior, frosted armored observation window ahead, warm sodium-amber analog desk glow, matte dark steel bulkheads",
    previewSrc: "./portraits/story/prologue_03.jpg",
    colorTag: "#eba834"
  },
  {
    id: "set_vestibule",
    assetTag: "@set_vestibule",
    code: "SET-02",
    zone: "vestibule",
    name: { zh: "Z=0 防爆窗与高温过渡舱", en: "Z=0 Blast Glass & Purge Vestibule", ja: "Z=0 防爆窓・検疫前室" },
    description: {
      zh: "隔离门外侧狭长钢制检疫通道（-2.5 < Z < 0），顶部布设 1,100°C 净化喷嘴与结霜玻璃。",
      en: "Armored airlock vestibule outside blast glass (-2.5 < Z < 0) rigged with overhead 1,100°C purge nozzles and frost-rimmed pane.",
      ja: "防爆窓外側の装甲検疫前室（-2.5 < Z < 0）。天井に焼却ノズルを装備。"
    },
    lightingRecipe: {
      zh: "冷青主轮廓光 + 琥珀玻璃内壁暖反光 + 净化时全红/白炽热浪",
      en: "Polar cyan rim key + warm amber glass bounce + crimson/white purge flare",
      ja: "極夜シアンリム光＋アンバー反射＋焼却時紅蓮光"
    },
    promptAnchor:
      "Frosted double-glazed armored blast window separating warm amber booth from icy steel quarantine airlock vestibule, condensation and ice crystals on steel mullions",
    previewSrc: "./portraits/story/prologue_02.jpg",
    colorTag: "#5bbad5"
  },
  {
    id: "set_corridor",
    assetTag: "@set_corridor",
    code: "SET-03",
    zone: "inner_corridor",
    name: { zh: "B 区医疗内走廊与气闸门", en: "Sector B Medical Corridor & Airlock", ja: "B区画医療廊下・気閘扉" },
    description: {
      zh: "岗亭东侧纵深钢铁内廊（X = +4.2..+7.6），头顶荧光管频闪、底缝渗出液氮白雾。",
      en: "Deep steel interior corridor east of Gate 0 (X = +4.2..+7.6) with flickering cyan fluorescents and creeping floor frost.",
      ja: "監視室東側の深層鋼鉄通路（X = +4.2..+7.6）。明滅蛍光灯と床霜。"
    },
    lightingRecipe: {
      zh: "冷青闪烁荧光顶灯 + 远端红警旋转警示灯",
      en: "Flickering cyan corridor fluorescents + distant rotating crimson lockdown beacon",
      ja: "明滅シアン蛍光灯＋遠端の赤色回転警光"
    },
    promptAnchor:
      "Flooded frost-rimmed underground Svalbard steel corridor, flickering cold cyan fluorescent tubes, heavy watertight airlock bulkhead door, creeping floor vapor",
    previewSrc: "./portraits/story/n1_corridor_aftermath.jpg",
    colorTag: "#7dc7ff"
  },
  {
    id: "set_icecore",
    assetTag: "@set_icecore",
    code: "SET-04",
    zone: "outer_blizzard",
    name: { zh: "极夜暴雪外舱与深冰钻井台", en: "Outer Polar Blizzard & Ice-Core Rig", ja: "極夜吹雪外郭・深層掘削架台" },
    description: {
      zh: "-46°C 斯瓦尔巴极夜暴风雪外场（Z < -1.5），零下强风卷雪、探照灯被白雾吞没。",
      en: "Svalbard -46°C polar night exterior (Z < -1.5) with horizontal sleet, frozen steel catwalks, and cyan floodlights lost in whiteout.",
      ja: "-46℃極夜の暴風雪外郭（Z < -1.5）。横殴りの雪とシアン投光器。"
    },
    lightingRecipe: {
      zh: "强青白色暴雪漫射光 + 事故现场频闪红警",
      en: "High-density cyan-white blizzard volumetric glow + distant crimson emergency strobe",
      ja: "高密度シアン吹雪拡散光＋遠方赤色ストロボ"
    },
    promptAnchor:
      "Svalbard -46C polar night whiteout blizzard outside armored ice-core outpost, horizontal blowing snow, frosted steel catwalks, cyan floodlight beams",
    previewSrc: "./portraits/reactions/chamber_whiteout.jpg",
    colorTag: "#9ec6d4"
  }
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
    boundAssetTags: ["@set_icecore", "@set_corridor", "@cryo_canister", "@purge_valve"],
    motionPreset: "dolly_in",
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
      ],
      props: [
        { id: "p_canister", assetTag: "@cryo_canister", label: "渗血低温样本罐", primitive: "cylinder", pos: [6.85, 0, -1.65], color: "#5bbad5" },
        { id: "p_valve", assetTag: "@purge_valve", label: "高温净化阀组", primitive: "box", pos: [7.05, 0.85, -0.35], rotY: -Math.PI / 2, color: "#e04634" }
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
    boundAssetTags: ["@set_booth", "@op09", "@blackbox", "@intercom", "@ledger"],
    motionPreset: "dolly_in",
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
      ],
      props: [
        { id: "p_intercom", assetTag: "@intercom", label: "PTT 对讲控制台", primitive: "console", pos: [-0.38, 0.82, 1.42], color: "#eba834" },
        { id: "p_blackbox", assetTag: "@blackbox", label: "#08 黑匣子磁带机", primitive: "tape", pos: [0.35, 0.82, 1.46], rotY: 0.25, color: "#49b882" },
        { id: "p_ledger", assetTag: "@ledger", label: "记录板与密钥", primitive: "ledger", pos: [0.02, 0.82, 1.48], color: "#d08770" }
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
    boundAssetTags: ["@set_corridor", "@op09", "@purge_valve"],
    motionPreset: "dolly_in",
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
      ],
      props: [
        { id: "p_valve", assetTag: "@purge_valve", label: "高温净化阀组", primitive: "box", pos: [7.0, 0.85, -0.4], rotY: -Math.PI / 2, color: "#e04634" }
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
    boundAssetTags: ["@set_booth", "@set_vestibule", "@op09", "@intercom"],
    motionPreset: "static",
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
      ],
      props: [
        { id: "p_intercom", assetTag: "@intercom", label: "PTT 对讲控制台", primitive: "console", pos: [-0.42, 0.82, 1.42], color: "#eba834" },
        { id: "p_ledger", assetTag: "@ledger", label: "记录板与密钥", primitive: "ledger", pos: [0.35, 0.82, 1.44], color: "#d08770" }
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
    boundAssetTags: ["@set_booth", "@op09", "@ledger", "@intercom"],
    motionPreset: "static",
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
      ],
      props: [
        { id: "p_ledger", assetTag: "@ledger", label: "记录板与密钥", primitive: "ledger", pos: [0.05, 0.82, 1.38], rotY: 0.15, color: "#d08770" },
        { id: "p_intercom", assetTag: "@intercom", label: "PTT 对讲控制台", primitive: "console", pos: [-0.45, 0.82, 1.42], color: "#eba834" }
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
    boundAssetTags: ["@set_corridor", "@elena", "@purge_valve"],
    motionPreset: "handheld",
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
      ],
      props: [
        { id: "p_valve", assetTag: "@purge_valve", label: "3 号舱气闸阀锁", primitive: "box", pos: [7.0, 0.9, -0.25], rotY: -Math.PI / 2, color: "#e04634" }
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
    boundAssetTags: ["@set_vestibule", "@set_booth", "@elena", "@op09", "@intercom"],
    motionPreset: "static",
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
      ],
      props: [
        { id: "p_intercom", assetTag: "@intercom", label: "PTT 对讲控制台", primitive: "console", pos: [-0.42, 0.82, 1.42], color: "#eba834" }
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
    boundAssetTags: ["@set_vestibule", "@elena", "@op09", "@intercom"],
    motionPreset: "dolly_in",
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
      ],
      props: [
        { id: "p_intercom", assetTag: "@intercom", label: "PTT 对讲控制台", primitive: "console", pos: [0.42, 0.82, 1.42], color: "#eba834" }
      ]
    }
  },
  {
    id: "shot_elena_react_strobe",
    storyNodeId: "n1_elena_react_strobe",
    shotCode: "SC-01B-2",
    chapter: { zh: "第 1 夜 · 强光分支", en: "NIGHT 01 · STROBE", ja: "第1夜 · 閃光分岐" },
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
    boundAssetTags: ["@set_vestibule", "@elena", "@op09", "@intercom"],
    motionPreset: "handheld",
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
      ],
      props: [
        { id: "p_intercom", assetTag: "@intercom", label: "PTT 对讲控制台", primitive: "console", pos: [-0.42, 0.82, 1.42], color: "#eba834" }
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
    boundAssetTags: ["@set_corridor", "@elena", "@purge_valve"],
    motionPreset: "pan",
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
      ],
      props: [
        { id: "p_valve", assetTag: "@purge_valve", label: "高温净化阀组", primitive: "box", pos: [7.0, 0.85, -0.25], rotY: -Math.PI / 2, color: "#e04634" }
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
    boundAssetTags: ["@set_vestibule", "@set_booth", "@op09", "@purge_valve", "@intercom"],
    motionPreset: "static",
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
      ],
      props: [
        { id: "p_valve", assetTag: "@purge_valve", label: "高温净化阀组", primitive: "box", pos: [0.75, 0.82, 1.4], color: "#e04634" },
        { id: "p_intercom", assetTag: "@intercom", label: "PTT 对讲控制台", primitive: "console", pos: [-0.42, 0.82, 1.42], color: "#eba834" }
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
    boundAssetTags: ["@set_corridor", "@purge_valve"],
    motionPreset: "pan",
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
      ],
      props: [
        { id: "p_valve", assetTag: "@purge_valve", label: "走廊净化截止阀", primitive: "box", pos: [6.95, 0.85, -0.15], rotY: -Math.PI / 2, color: "#e04634" }
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
    boundAssetTags: ["@set_icecore", "@leo", "@tool_chest"],
    motionPreset: "handheld",
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
      ],
      props: [
        { id: "p_tool", assetTag: "@tool_chest", label: "耐寒金属工具箱", primitive: "briefcase", pos: [0.65, 0, -2.2], rotY: 0.3, color: "#eba834" }
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
    boundAssetTags: ["@set_vestibule", "@set_icecore", "@leo", "@op09", "@tool_chest", "@intercom"],
    motionPreset: "dolly_in",
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
      ],
      props: [
        { id: "p_tool", assetTag: "@tool_chest", label: "耐寒金属工具箱", primitive: "briefcase", pos: [0.55, 0, -1.75], rotY: 0.2, color: "#eba834" },
        { id: "p_intercom", assetTag: "@intercom", label: "PTT 对讲控制台", primitive: "console", pos: [-0.42, 0.82, 1.42], color: "#eba834" }
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
    boundAssetTags: ["@set_vestibule", "@leo", "@op09", "@intercom", "@tool_chest"],
    motionPreset: "static",
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
      ],
      props: [
        { id: "p_intercom", assetTag: "@intercom", label: "PTT 对讲控制台", primitive: "console", pos: [-0.42, 0.82, 1.42], color: "#eba834" },
        { id: "p_tool", assetTag: "@tool_chest", label: "耐寒金属工具箱", primitive: "briefcase", pos: [0.35, 0, -0.82], rotY: -0.3, color: "#eba834" }
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
    boundAssetTags: ["@set_corridor", "@leo", "@tool_chest"],
    motionPreset: "pan",
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
      ],
      props: [
        { id: "p_tool", assetTag: "@tool_chest", label: "耐寒金属工具箱", primitive: "briefcase", pos: [6.15, 0, -0.35], rotY: 0.4, color: "#eba834" }
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
    boundAssetTags: ["@set_corridor", "@purge_valve"],
    motionPreset: "dolly_in",
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
      ],
      props: [
        { id: "p_valve", assetTag: "@purge_valve", label: "走廊净化阀箱", primitive: "box", pos: [7.0, 0.85, -0.35], rotY: -Math.PI / 2, color: "#e04634" }
      ]
    }
  },
  // === CINEMA PACK 3: NIGHTS 2–5 FULL INTERACTIVE MOVIE SHOTS ===
  {
    id: "shot_n2_arthur_command",
    storyNodeId: "n2_arthur_standoff",
    shotCode: "SC-03A",
    chapter: { zh: "第 2 夜 · 夺权危机", en: "NIGHT 02 · COMMAND", ja: "第2夜 · 指揮権争い" },
    title: { zh: "站长亚瑟最后的交权通牒", en: "Arthur's Command Ultimatum", ja: "アーサー所長の最後通牒" },
    framing: "50mm Close-Up · Keyframe",
    cameraMove: { zh: "强压威严的贴窗近景，呼吸白雾随台词扑向玻璃", en: "Tight authoritarian close-up through frosted Gate 0 blast window", ja: "威圧的な防爆窓越しのクロースアップ" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: false,
    posterSrc: "./portraits/arthur.jpg",
    videoSrc: "./videos/arthur/lean_in.mp4",
    fallbackVideoSrc: "./videos/arthur/lean_in.mp4",
    boundAssetTags: ["@set_vestibule", "@arthur", "@intercom", "@ledger"],
    motionPreset: "dolly_in",
    blocking: {
      zone: "vestibule",
      alertLight: "amber",
      camera: {
        pos: [0.25, 1.45, 1.4],
        target: [-1.1, 1.42, 0.0],
        fov: 38,
        lensLabel: "50mm Anamorphic f/2.0",
        axisNote: {
          zh: "窗外低角度仰拍站长亚瑟，强调等级压迫感。",
          en: "Low-angle glass POV highlighting command authority.",
          ja: "少し煽りの構図で所長の威圧感を強調。"
        }
      },
      actors: [
        { id: "v03", label: "亚瑟站长 (V-03)", pos: [-1.15, 0, 0.0], rotY: Math.PI / 2, color: "#4aa3c8", speaking: true }
      ],
      props: [
        { id: "p_intercom", assetTag: "@intercom", label: "PTT 对讲控制台", primitive: "console", pos: [-0.42, 0.82, 1.42], color: "#eba834" },
        { id: "p_ledger", assetTag: "@ledger", label: "站区命令记录板", primitive: "ledger", pos: [0.15, 0.82, 1.42], color: "#d08770" }
      ]
    }
  },
  {
    id: "shot_n2_marcus_warning",
    storyNodeId: "n2_marcus_clash",
    shotCode: "SC-03B",
    chapter: { zh: "第 2 夜 · 夺权危机", en: "NIGHT 02 · COMMAND", ja: "第2夜 · 指揮権争い" },
    title: { zh: "安保队长马库斯焦急叩门", en: "Capt. Marcus Urgent Plea", ja: "マーカス隊長の緊急要請" },
    framing: "50mm Handheld",
    cameraMove: { zh: "应急红灯扫过头盔反光面罩，手持紧迫推近", en: "Handheld push-in lit by crimson corridor alarm strobes", ja: "非常赤い光が照らす手持ちクローズアップ" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: false,
    posterSrc: "./portraits/marcus.jpg",
    videoSrc: "./videos/marcus/idle.mp4",
    fallbackVideoSrc: "./videos/marcus/idle.mp4",
    boundAssetTags: ["@set_vestibule", "@marcus", "@intercom", "@purge_valve"],
    motionPreset: "handheld",
    blocking: {
      zone: "vestibule",
      alertLight: "red",
      camera: {
        pos: [0.35, 1.48, 1.5],
        target: [-1.2, 1.44, 0.05],
        fov: 40,
        lensLabel: "50mm Anamorphic",
        axisNote: {
          zh: "红警灯光斜照马库斯侧脸，营造有人失踪后的紧张氛围。",
          en: "Red beacon shadows capture post-disappearance paranoia.",
          ja: "赤色警光が行方不明発生後の緊張を映す。"
        }
      },
      actors: [
        { id: "v04", label: "马库斯 (V-04)", pos: [-1.2, 0, 0.05], rotY: Math.PI / 2, color: "#eba834", speaking: true }
      ],
      props: [
        { id: "p_intercom", assetTag: "@intercom", label: "PTT 对讲控制台", primitive: "console", pos: [-0.42, 0.82, 1.42], color: "#eba834" },
        { id: "p_valve", assetTag: "@purge_valve", label: "高温净化阀组", primitive: "box", pos: [0.75, 0.82, 1.4], color: "#e04634" }
      ]
    }
  },
  {
    id: "shot_n3_ingrid_sample",
    storyNodeId: "n3_storm_blackout",
    shotCode: "SC-04A",
    chapter: { zh: "第 3 夜 · 磁暴断电", en: "NIGHT 03 · BLACKOUT", ja: "第3夜 · 磁気嵐停電" },
    title: { zh: "英格丽德怀抱渗血低温样本罐", en: "Ingrid With Bleeding Cryo Canister", ja: "血塗れの凍結検体容器を持つイングリッド" },
    framing: "50mm Cold Cyan",
    cameraMove: { zh: "手电散光穿透磁暴暗影，在样本罐与脸部之间微摇聚焦", en: "Flashlight beam cuts through storm blackout between cryo tube and eyes", ja: "停電下、懐中電灯が検体と顔を照らす" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: false,
    posterSrc: "./portraits/ingrid.jpg",
    videoSrc: "./videos/ingrid/lean_in.mp4",
    fallbackVideoSrc: "./videos/ingrid/lean_in.mp4",
    boundAssetTags: ["@set_vestibule", "@ingrid", "@cryo_canister", "@intercom"],
    motionPreset: "handheld",
    blocking: {
      zone: "vestibule",
      alertLight: "cyan",
      camera: {
        pos: [0.2, 1.44, 1.45],
        target: [-1.15, 1.38, 0.0],
        fov: 38,
        lensLabel: "50mm Blackout Thriller",
        axisNote: {
          zh: "磁暴全黑环境下仅凭手持应急光源切出临床冷峻感。",
          en: "Handheld flashlight key-light under total Night 3 sensor blackout.",
          ja: "全センサー停止中の手持ち光による緊張構図。"
        }
      },
      actors: [
        { id: "v06", label: "英格丽德 (V-06)", pos: [-1.15, 0, 0.0], rotY: Math.PI / 2, color: "#4aa3c8", speaking: true }
      ],
      props: [
        { id: "p_canister", assetTag: "@cryo_canister", label: "渗血低温样本罐", primitive: "cylinder", pos: [-0.95, 1.05, 0.05], color: "#5bbad5" },
        { id: "p_intercom", assetTag: "@intercom", label: "PTT 对讲控制台", primitive: "console", pos: [-0.42, 0.82, 1.42], color: "#eba834" }
      ]
    }
  },
  {
    id: "shot_n3_ana_truth",
    storyNodeId: "n3_ana_betrayal",
    shotCode: "SC-04B",
    chapter: { zh: "第 3 夜 · 磁暴断电", en: "NIGHT 03 · BLACKOUT", ja: "第3夜 · 磁気嵐停電" },
    title: { zh: "安娜急促喘息揭发供氧阴谋", en: "Ana O2 Sabotage Warning", ja: "アナの酸素妨害警告" },
    framing: "65mm Tight Portrait",
    cameraMove: { zh: "喘息雾气打在玻璃上，紧盯眼底恐惧的 65mm 超近景", en: "Breath fogs the frost glass as 65mm lens locks on terrified eyes", ja: "息で曇る窓越しの65mmクローズアップ" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: false,
    posterSrc: "./portraits/ana.jpg",
    videoSrc: "./videos/ana/flinch.mp4",
    fallbackVideoSrc: "./videos/ana/flinch.mp4",
    boundAssetTags: ["@set_vestibule", "@ana", "@intercom"],
    motionPreset: "dolly_in",
    blocking: {
      zone: "vestibule",
      alertLight: "red",
      camera: {
        pos: [0.18, 1.42, 1.28],
        target: [-1.05, 1.4, 0.0],
        fov: 32,
        lensLabel: "65mm Close-Up",
        axisNote: {
          zh: "贴窗雾气与微红供氧警报交错，突显时间所剩无几。",
          en: "Steam mist and red O2 alarm beacon build claustrophobia.",
          ja: "霧と酸素警報灯が切迫感を高める。"
        }
      },
      actors: [
        { id: "v05", label: "安娜 (V-05)", pos: [-1.05, 0, 0.0], rotY: Math.PI / 2, color: "#e04634", speaking: true }
      ],
      props: [
        { id: "p_intercom", assetTag: "@intercom", label: "PTT 对讲控制台", primitive: "console", pos: [-0.42, 0.82, 1.42], color: "#eba834" }
      ]
    }
  },
  {
    id: "shot_n4_linmei_plea",
    storyNodeId: "n4_linmei_conspiracy",
    shotCode: "SC-05A",
    chapter: { zh: "第 4 夜 · 逃生叛变", en: "NIGHT 04 · MUTINY", ja: "第4夜 · 脱出反乱" },
    title: { zh: "林梅的潜艇撤离密约", en: "Lin Mei's Escape Sub Deal", ja: "リンメイの潜水艦密約" },
    framing: "50mm Calm Persuasion",
    cameraMove: { zh: "极稳冷光中景，用镇定到诡异的笑意抛出潜艇诱饵", en: "Steadicam close medium spotlighting eerily calm persuasion", ja: "不気味なほど落ち着いた説得を捉える中景" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: false,
    posterSrc: "./portraits/linmei.jpg",
    videoSrc: "./videos/linmei/lean_in.mp4",
    fallbackVideoSrc: "./videos/linmei/lean_in.mp4",
    boundAssetTags: ["@set_vestibule", "@linmei", "@intercom", "@ledger"],
    motionPreset: "static",
    blocking: {
      zone: "vestibule",
      alertLight: "amber",
      camera: {
        pos: [0.22, 1.44, 1.38],
        target: [-1.1, 1.42, 0.0],
        fov: 38,
        lensLabel: "50mm Anamorphic",
        axisNote: {
          zh: "与前夜恐慌访客相反，用过度理性的冷静制造“高阶伪人”不安感。",
          en: "Uncanny composure contrasts with prior panicked arrivals.",
          ja: "異常な冷静さがかえって不気味さを際立たせる。"
        }
      },
      actors: [
        { id: "v07", label: "林梅 (V-07)", pos: [-1.1, 0, 0.0], rotY: Math.PI / 2, color: "#eba834", speaking: true }
      ],
      props: [
        { id: "p_intercom", assetTag: "@intercom", label: "PTT 对讲控制台", primitive: "console", pos: [-0.42, 0.82, 1.42], color: "#eba834" },
        { id: "p_ledger", assetTag: "@ledger", label: "撤离密约台账", primitive: "ledger", pos: [0.18, 0.82, 1.44], color: "#d08770" }
      ]
    }
  },
  {
    id: "shot_n4_hannah_tape",
    storyNodeId: "n4_hannah_whistle",
    shotCode: "SC-05B",
    chapter: { zh: "第 4 夜 · 逃生叛变", en: "NIGHT 04 · MUTINY", ja: "第4夜 · 脱出反乱" },
    title: { zh: "汉娜举起前任 #08 黑匣子", en: "Hannah Holds Up #08's Black Box", ja: "ハンナの#08ブラックボックス" },
    framing: "40mm Storm Handheld",
    cameraMove: { zh: "镜头从沾血黑匣子快甩回汉娜撕裂般呐喊的面部", en: "Rack focus from battered recorder to Hannah screaming through sleet", ja: "傷だらけの録音機から叫ぶハンナへフォーカス移動" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: false,
    posterSrc: "./portraits/hannah.jpg",
    videoSrc: "./videos/hannah/flinch.mp4",
    fallbackVideoSrc: "./videos/hannah/flinch.mp4",
    boundAssetTags: ["@set_vestibule", "@hannah", "@blackbox", "@intercom"],
    motionPreset: "handheld",
    blocking: {
      zone: "vestibule",
      alertLight: "red",
      camera: {
        pos: [0.28, 1.46, 1.48],
        target: [-1.15, 1.42, 0.0],
        fov: 42,
        lensLabel: "40mm Storm Chaos",
        axisNote: {
          zh: "黎明前最高烈度的外部冲击镜头，将黑匣子悬念推向顶峰。",
          en: "Peak pre-dawn chaos elevating #08's secret into Night 5.",
          ja: "夜明け前最大のクライマックス演出。"
        }
      },
      actors: [
        { id: "v08", label: "汉娜 (V-08)", pos: [-1.15, 0, 0.0], rotY: Math.PI / 2, color: "#49b882", speaking: true }
      ],
      props: [
        { id: "p_blackbox", assetTag: "@blackbox", label: "#08 黑匣子磁带机", primitive: "tape", pos: [-0.95, 1.18, 0.06], rotY: 0.4, color: "#49b882" },
        { id: "p_intercom", assetTag: "@intercom", label: "PTT 对讲控制台", primitive: "console", pos: [-0.42, 0.82, 1.42], color: "#eba834" }
      ]
    }
  },
  {
    id: "shot_n5_mirror_confront",
    storyNodeId: "n5_final_mirror",
    shotCode: "SC-06A",
    chapter: { zh: "第 5 夜 · 终局结局", en: "NIGHT 05 · FINALES", ja: "第5夜 · 終局結末" },
    title: { zh: "第 5 夜镜面对峙：窗外另一个“你”", en: "Night 5 Mirror: Your Double Outside", ja: "第5夜鏡像対峙：外のもう一人の自分" },
    framing: "50mm Hitchcock Double",
    cameraMove: { zh: "极昼绯红天光与青蓝站内光交汇，门外自己的替身缓缓抬头开口", en: "Blood-red polar dawn meets booth cyan as OP#09's double locks eyes", ja: "極地の朝焼けと室内の冷光が交差する鏡像対決" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: false,
    posterSrc: "./portraits/operator09.jpg",
    videoSrc: "./videos/operator09/idle.mp4",
    fallbackVideoSrc: "./videos/operator09/idle.mp4",
    boundAssetTags: ["@set_vestibule", "@set_booth", "@op09", "@intercom", "@ledger"],
    motionPreset: "dolly_in",
    blocking: {
      zone: "vestibule",
      alertLight: "red",
      camera: {
        pos: [0.2, 1.44, 1.35],
        target: [-1.1, 1.42, 0.0],
        fov: 38,
        lensLabel: "50mm Mirror Climax",
        axisNote: {
          zh: "对称构图形成“防爆窗即镜面”的心理惊悚高潮。",
          en: "Symmetrical framing turns the blast window into a mirror.",
          ja: "対称構図が防爆窓を『鏡』に見立てる最高潮カット。"
        }
      },
      actors: [
        { id: "op09_double", label: "另一个你 (#09 镜像)", pos: [-1.1, 0, 0.0], rotY: Math.PI / 2, color: "#e04634", speaking: true },
        { id: "op09", label: "值班员 #09 (玩家)", pos: [1.3, 0, 0.1], rotY: -Math.PI / 2, color: "#49b882" }
      ],
      props: [
        { id: "p_intercom", assetTag: "@intercom", label: "PTT 对讲控制台", primitive: "console", pos: [-0.42, 0.82, 1.42], color: "#eba834" },
        { id: "p_ledger", assetTag: "@ledger", label: "记录板与密钥", primitive: "ledger", pos: [0.15, 0.82, 1.45], color: "#d08770" }
      ]
    }
  },
  {
    id: "shot_n5_ending_dawn",
    storyNodeId: "ending_dawn_break",
    shotCode: "SC-END-A",
    chapter: { zh: "第 5 夜 · 终局结局", en: "NIGHT 05 · FINALES", ja: "第5夜 · 終局結末" },
    title: { zh: "真结局 A：破冰救援潜艇冲出极昼", en: "Ending A: Submarine Breaks The Pack Ice", ja: "真結末A：氷を砕く救助潜水艦" },
    framing: "24mm Epilogue Helicopter Wide",
    cameraMove: { zh: "航拍式大远景拉升：黑钢救援潜艇撞碎十米冰脊浮出斯瓦尔巴红日海面", en: "Sweeping aerial pull-back as rescue sub breaches sunlit Svalbard ice", ja: "朝日を受ける砕氷潜水艦の壮大な空撮フィナーレ" },
    durationSec: 5.17,
    frames: 124,
    hasNativeAudio: false,
    posterSrc: "./portraits/lobby_bg.jpg",
    videoSrc: "./videos/chamber/admit.mp4",
    fallbackVideoSrc: "./videos/chamber/admit.mp4",
    boundAssetTags: ["@set_icecore", "@op09"],
    motionPreset: "pull_back",
    blocking: {
      zone: "vestibule",
      alertLight: "amber",
      camera: {
        pos: [2.8, 2.6, 5.2],
        target: [-2.0, 0.6, 0.0],
        fov: 52,
        lensLabel: "24mm Anamorphic Sunrise Epilogue",
        axisNote: {
          zh: "长夜结束，画面切出狭小岗亭进入开阔冰原日出，完成全片情绪释放。",
          en: "Leaves the claustrophobic booth for sweeping polar dawn.",
          ja: "閉鎖空間から広大な極地の夜明けへ解放される終幕ショット。"
        }
      },
      actors: [
        { id: "sub", label: "破冰救援潜艇", pos: [-2.0, 0.2, 0.0], rotY: 0.4, color: "#49b882" }
      ],
      props: []
    }
  }
];

export function getStoryboardShot(id: string): StoryboardShot | undefined {
  return STUDIO_STORYBOARD_SHOTS.find((s) => s.id === id);
}

export function resolveAssetByTag(
  tag: string
): { kind: AssetKind; tag: string; name: LocalizedText; promptAnchor: string } | undefined {
  const trimmed = tag.trim().toLowerCase();
  if (!trimmed) return undefined;
  const canonical = trimmed.startsWith("@") ? trimmed : `@${trimmed}`;

  for (const cast of CAST_VISUAL_ASSETS) {
    if (cast.assetTag.toLowerCase() === canonical) {
      return {
        kind: "cast",
        tag: cast.assetTag,
        name: cast.name,
        promptAnchor: cast.promptAnchor
      };
    }
  }

  for (const prop of PROP_VISUAL_ASSETS) {
    if (prop.assetTag.toLowerCase() === canonical) {
      return {
        kind: "prop",
        tag: prop.assetTag,
        name: prop.name,
        promptAnchor: prop.promptAnchor
      };
    }
  }

  for (const setAsset of SET_VISUAL_ASSETS) {
    if (setAsset.assetTag.toLowerCase() === canonical) {
      return {
        kind: "set",
        tag: setAsset.assetTag,
        name: setAsset.name,
        promptAnchor: setAsset.promptAnchor
      };
    }
  }

  return undefined;
}

export function buildShotExportPackage(
  shot: StoryboardShot,
  lang: Locale,
  cameraOverride?: Partial<CameraBlocking3D>
): ShotExportPackage {
  const effectivePos = cameraOverride?.pos ?? shot.blocking.camera.pos;
  const effectiveTarget = cameraOverride?.target ?? shot.blocking.camera.target;
  const cameraPos: [number, number, number] = [effectivePos[0], effectivePos[1], effectivePos[2]];
  const cameraTarget: [number, number, number] = [
    effectiveTarget[0],
    effectiveTarget[1],
    effectiveTarget[2]
  ];
  const fov = cameraOverride?.fov ?? shot.blocking.camera.fov;
  const lens = cameraOverride?.lensLabel ?? shot.blocking.camera.lensLabel;
  const title = tl(shot.title, lang);

  const boundAssets: Array<{ tag: string; name: string; promptAnchor: string }> = [];
  for (const rawTag of shot.boundAssetTags) {
    const resolved = resolveAssetByTag(rawTag);
    if (resolved) {
      boundAssets.push({
        tag: resolved.tag,
        name: tl(resolved.name, lang),
        promptAnchor: resolved.promptAnchor
      });
    }
  }

  const lipSyncLine = shot.lipSyncLine ? tl(shot.lipSyncLine, lang) : undefined;
  const assetLines = boundAssets.map((a) => `${a.tag} (${a.name}): ${a.promptAnchor}`).join("\n");
  const posStr = `[${cameraPos.map((n) => n.toFixed(2)).join(", ")}]`;
  const tgtStr = `[${cameraTarget.map((n) => n.toFixed(2)).join(", ")}]`;

  const promptSections = [
    `[${shot.shotCode} // ${title}] 16:9 Anamorphic Live-Action Cinema (${shot.durationSec.toFixed(2)}s / ${shot.frames}f @ 24fps)`,
    `Camera & Lens: ${lens}, FOV ${fov}deg, Motion=${shot.motionPreset}, Pos=${posStr} -> Aim=${tgtStr}`,
    `Action & Movement: ${tl(shot.cameraMove, lang)}`,
    `Axis & Lighting (${shot.blocking.zone}, alert=${shot.blocking.alertLight}): ${tl(shot.blocking.camera.axisNote, lang)}`,
    `Bound Assets:\n${assetLines}`,
    lipSyncLine
      ? `Dialogue (Lip-Sync${shot.speakerName ? ` - ${tl(shot.speakerName, lang)}` : ""}): ${lipSyncLine}`
      : `Audio: Ambient Svalbard -46C polar storm & mechanical hum (no dialogue)`,
    `Look-Dev Standard: 35mm anamorphic film grain, matte sub-zero skin texture, polar cyan (#5bbad5) vs sodium amber (#eba834) contrast.`
  ];
  const promptText = promptSections.join("\n");

  const jsonPayload: Omit<ShotExportPackage, "jsonString"> = {
    shotCode: shot.shotCode,
    shotId: shot.id,
    title,
    aspectRatio: "16:9",
    lens,
    fov,
    motionPreset: shot.motionPreset,
    cameraPos,
    cameraTarget,
    boundAssets,
    ...(lipSyncLine ? { lipSyncLine } : {}),
    promptText
  };

  return {
    ...jsonPayload,
    jsonString: JSON.stringify(jsonPayload, null, 2)
  };
}
