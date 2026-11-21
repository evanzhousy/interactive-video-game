import {
  DECISION_TRAIT_FIELDS,
  MIN_CORE_ORDERINGS,
  MIN_SIGNATURE_INSTANCES,
  VALUE_LABELS,
  canonicalValuePair,
  crystalChords,
  escapeRoutes,
  isValueToken,
  justificationGap,
  type ValueToken
} from "../ordamor/index.js";
import type { SpecialistRole } from "./economy.js";
import { VALUE_I18N } from "./i18n.js";
import { PERSONA_SCHEMA_VERSION, createForensicProfile } from "./profile-helper.js";
import type {
  DefectMode,
  DisposalStyleKey,
  Locale,
  LocalizedText,
  ProbeKey,
  VisitorProbe,
  VisitorSpec
} from "./types.js";
import { createSeededRng } from "./visitors/index.js";

export interface VisitorSlotTemplate {
  id: string;
  night: 1 | 2 | 3 | 4;
  unlockTier: 1 | 2 | 4;
  specialist: SpecialistRole;
  portraitUrl: string;
  silhouetteType: "surgeon" | "captain" | "biologist";
  defectPool: Exclude<DefectMode, "HUMAN">[];
  tellLevel: "explicit" | "implied" | "subtle";
}

export const SEEDED_SLOT_TEMPLATES: readonly VisitorSlotTemplate[] = [
  {
    id: "V-01",
    night: 1,
    unlockTier: 1,
    specialist: "doctor",
    portraitUrl: "./portraits/elena.jpg",
    silhouetteType: "surgeon",
    defectPool: ["LOW_SELF_NARRATIVE"],
    tellLevel: "explicit"
  },
  {
    id: "V-02",
    night: 1,
    unlockTier: 1,
    specialist: "mechanic",
    portraitUrl: "./portraits/leo.jpg",
    silhouetteType: "captain",
    defectPool: ["LOW_SELF_NARRATIVE"],
    tellLevel: "explicit"
  },
  {
    id: "V-03",
    night: 2,
    unlockTier: 2,
    specialist: "command",
    portraitUrl: "./portraits/arthur.jpg",
    silhouetteType: "captain",
    defectPool: ["MID_SECOND_AXIS"],
    tellLevel: "implied"
  },
  {
    id: "V-04",
    night: 2,
    unlockTier: 2,
    specialist: "diver",
    portraitUrl: "./portraits/marcus.jpg",
    silhouetteType: "captain",
    defectPool: ["MID_SECOND_AXIS"],
    tellLevel: "implied"
  },
  {
    id: "V-05",
    night: 3,
    unlockTier: 2,
    specialist: "diver",
    portraitUrl: "./portraits/ana.jpg",
    silhouetteType: "biologist",
    defectPool: ["LOW_SELF_NARRATIVE", "MID_SECOND_AXIS"],
    tellLevel: "implied"
  },
  {
    id: "V-06",
    night: 3,
    unlockTier: 2,
    specialist: "doctor",
    portraitUrl: "./portraits/ingrid.jpg",
    silhouetteType: "surgeon",
    defectPool: ["MID_SECOND_AXIS"],
    tellLevel: "implied"
  },
  {
    id: "V-07",
    night: 4,
    unlockTier: 4,
    specialist: "doctor",
    portraitUrl: "./portraits/linmei.jpg",
    silhouetteType: "biologist",
    defectPool: ["HIGH_WRONG_DISPOSAL"],
    tellLevel: "subtle"
  },
  {
    id: "V-08",
    night: 4,
    unlockTier: 4,
    specialist: "mechanic",
    portraitUrl: "./portraits/hannah.jpg",
    silhouetteType: "surgeon",
    defectPool: ["HIGH_WRONG_DISPOSAL"],
    tellLevel: "subtle"
  }
];

/**
 * Closed pools strictly referencing canonical Ordamor VALUE_TOKENS (Red Line 2).
 */
const KEPT_CANDIDATES: readonly ValueToken[] = [
  "security",
  "status",
  "achievement",
  "autonomy",
  "order",
  "justice",
  "duty",
  "loyalty"
];

const DROPPED_CANDIDATES: readonly ValueToken[] = [
  "fairness",
  "care",
  "mercy",
  "truth",
  "principle",
  "loyalty",
  "order",
  "security"
];

const DISPOSAL_ARCHETYPES: readonly DisposalStyleKey[] = [
  "rationalize",
  "blame_rules",
  "own_it"
];

interface NameEntry {
  zh: string;
  en: string;
  ja: string;
  voice: string;
}

const NAME_POOL: readonly NameEntry[] = [
  { zh: "卡琳·林德 (Dr. Karin Lind)", en: "Dr. Karin Lind", ja: "カリン・リンド博士", voice: "measured, icy, clinical; answers with surgical precision" },
  { zh: "维克多·科瓦奇 (Viktor Kovacs)", en: "Viktor Kovacs", ja: "ヴィクトル・コヴァチ", voice: "raspy, impatient, defensive; coughs into the intercom" },
  { zh: "森田健司 (Kenji Morita)", en: "Kenji Morita", ja: "森田健司", voice: "soft-spoken, bureaucratic, eerily polite under stress" },
  { zh: "娜塔莎·沃尔科娃 (Natasha Volkova)", en: "Natasha Volkova", ja: "ナターシャ・ヴォルコワ", voice: "blunt, terse, fatalistic; hates wasted words" },
  { zh: "托马斯·布伦南 (Thomas Brennan)", en: "Thomas Brennan", ja: "トーマス・ブレナン", voice: "hoarse, commanding, bristles when authority is questioned" },
  { zh: "索菲亚·阿尔瓦雷斯 (Dr. Sofia Alvarez)", en: "Dr. Sofia Alvarez", ja: "ソフィア・アルバレス博士", voice: "intense, academic, talks fast when defending her work" },
  { zh: "埃里克·索伦森 (Erik Sorensen)", en: "Erik Sorensen", ja: "エリック・ソーレンセン", voice: "guarded, sarcastic, deflects with dark station humor" },
  { zh: "陈明远 (Dr. Mingyuan Chen)", en: "Dr. Mingyuan Chen", ja: "陳明遠博士", voice: "calm, formal, cites logs and timestamps verbatim" },
  { zh: "米拉·诺瓦克 (Mila Novak)", en: "Mila Novak", ja: "ミラ・ノヴァク", voice: "breathless, urgent, sharp-edged when cornered" },
  { zh: "赫尔曼·克鲁格 (Hermann Kruger)", en: "Hermann Kruger", ja: "ヘルマン・クルーガー", voice: "clipped, methodical, treats morality as engineering math" },
  { zh: "阿米娜·哈桑 (Amina Hassan)", en: "Amina Hassan", ja: "アミナ・ハッサン", voice: "steady, unsentimental, refuses to beg or flatter" },
  { zh: "卢卡斯·伯格 (Lukas Berg)", en: "Lukas Berg", ja: "ルーカス・ベルグ", voice: "nervous, overly articulate, over-explains details" }
];

const ROLE_BY_SPECIALIST: Record<SpecialistRole, readonly LocalizedText[]> = {
  doctor: [
    { zh: "极地创伤外科医师", en: "Arctic Trauma Surgeon", ja: "極地外傷外科医" },
    { zh: "低温病原体隔离主治医", en: "Cryo-Pathogen Containment MD", ja: "低温病原体隔離主治医" },
    { zh: "B区神经监护首席医师", en: "Sector B Neuro-ICU Chief", ja: "B区画神経集中治療医" }
  ],
  mechanic: [
    { zh: "地热炉心首席轮机师", en: "Geothermal Core Chief Mechanic", ja: "地熱炉心・主任機関士" },
    { zh: "高压气闸与液氧管网技师", en: "Airlock & LOX Manifold Engineer", ja: "気密扉・液体酸素配管技師" },
    { zh: "潜艇推进舱值班轮机长", en: "Submarine Propulsion Watch Engineer", ja: "潜水艦推進区画・機関長" }
  ],
  diver: [
    { zh: "冰下光缆深潜作业队长", en: "Sub-Ice Cable Dive Lead", ja: "氷下光ケーブル潜水隊長" },
    { zh: "深海热泉采样潜水员", en: "Abyssal Vent Sampling Diver", ja: "深海熱水採取ダイバー" },
    { zh: "潜艇外舱减压抢修深潜员", en: "External Hull Saturation Diver", ja: "船外減圧補修ダイバー" }
  ],
  command: [
    { zh: "基地纪检与事故审计官", en: "Outpost Internal Affairs Auditor", ja: "基地監査・事故調査官" },
    { zh: "斯瓦尔巴总控室值班督察", en: "Svalbard Command Duty Inspector", ja: "スヴァールバル統制室督察官" },
    { zh: "战时配给与档案封存专员", en: "Rationing & Archive Compliance Officer", ja: "戦時配給・記録封存官" }
  ]
};

interface IncidentTemplate {
  sector: LocalizedText;
  event1: LocalizedText;
  event2: LocalizedText;
  kw1: LocalizedText;
  kw2: LocalizedText;
  precondition: LocalizedText;
  boggartPrompt: LocalizedText;
  triviaPrompt: LocalizedText;
  triviaAnswer: LocalizedText;
}

const INCIDENT_TEMPLATES: readonly IncidentTemplate[] = [
  {
    sector: { zh: "4号冰芯冷库", en: "Ice-Core Vault 4", ja: "第4氷床コア冷凍庫" },
    event1: {
      zh: "4号冰芯冷库泄压时提前锁死气密门，将两名还在抢搬备份盘的助手留在失压走廊。",
      en: "Sealed Vault 4's pressure bulkhead early during a blowout, leaving two assistants hauling backup drives in the unpressurized hall.",
      ja: "第4冷凍庫の減圧事故で気密扉を早期閉鎖し、バックアップ盤を運んでいた助手2名を減圧廊下に取り残した。"
    },
    event2: {
      zh: "事后篡改门禁时间戳 90 秒，并在配给会上把自己排在首批热能服领用名单首位。",
      en: "Backdated the bulkhead log by 90 seconds and placed themselves first on the emergency thermal-suit roster.",
      ja: "事後に扉ログの時刻を90秒改ざんし、緊急防寒服の優先支給リスト筆頭に自分の名を入れた。"
    },
    kw1: { zh: "提前锁死气密门", en: "Sealed bulkhead early", ja: "気密扉を早期閉鎖" },
    kw2: { zh: "篡改门禁时间戳", en: "Backdated door log", ja: "ログ時刻改ざん" },
    precondition: {
      zh: "站内仍存在等待其专业签字才能启动的撤离设备",
      en: "Station evacuation gear still requires their specialist authorization",
      ja: "脱出設備の起動に本人の専門署名が不可欠であること"
    },
    boggartPrompt: {
      zh: "[拆退路] 潜艇已经切入自动脱离程序，不再需要任何专家签字——现在你还怎么解释？",
      en: "[Strip Precondition] The sub switched to autonomous launch—no specialist sign-off is needed anymore. What's your excuse now?",
      ja: "[前提剥奪] 潜水艦は自律出航モードに切り替わり、専門署名は不要になった——今どう言い訳する？"
    },
    triviaPrompt: {
      zh: "核对 4 号冷库备用气闸的手动泄压阀编号。",
      en: "Recite the manual bleed-valve code on Vault 4's auxiliary airlock.",
      ja: "第4冷凍庫・補助エアロックの手動減圧弁番号を言え。"
    },
    triviaAnswer: {
      zh: "「V4-09B，逆时针三圈半。连这种铭牌号都能用来测人的话，你这岗亭早该撤了。」",
      en: "\"V4-09B, three and a half turns counter-clockwise. If reading serial plates kept mimics out, this booth wouldn't exist.\"",
      ja: "「V4-09B、反時計回りに3回転半だ。プレート番号で人間判定できるなら、この検疫室は要らない。」"
    }
  },
  {
    sector: { zh: "C区液氧压缩站", en: "Sector C LOX Compressor", ja: "C区画液体酸素圧縮場" },
    event1: {
      zh: "C区液氧阀冻结期间切断了低层宿舍的供氧旁路，把全部备用气瓶留给主控舱与自己小组。",
      en: "Shut off the lower-dorm oxygen bypass during Sector C's valve freeze, reserving all spare canisters for command and their own bay.",
      ja: "C区画の液体酸素弁凍結時、下層宿舎への供給バイパスを遮断し、予備ボンベを全て自班と統制室に回した。"
    },
    event2: {
      zh: "在黑匣子审查前销毁了旁路压力曲线纸带，并把故障原因归咎于失踪的夜班学徒。",
      en: "Destroyed the pressure-strip chart before black-box review and attributed the cutoff to a missing night-shift trainee.",
      ja: "ブラックボックス監査前に圧力チャート紙を破棄し、遮断の責任を行方不明の夜勤見習いに転嫁した。"
    },
    kw1: { zh: "切断宿舍供氧旁路", en: "Cut dorm O2 bypass", ja: "宿舎酸素バイパス遮断" },
    kw2: { zh: "销毁压力曲线纸带", en: "Destroyed pressure tape", ja: "圧力チャート破棄" },
    precondition: {
      zh: "上级应急条例与外部海事仲裁仍能追认该次封舱决策",
      en: "Emergency directives and external maritime oversight can still ratify the cutoff",
      ja: "非常規定と外部海事監察が遮断判断を追認できる前提"
    },
    boggartPrompt: {
      zh: "[拆退路] 海底光缆全断，奥斯陆总部已经把这里注销成失联站，没人会再认你的条例——说实话！",
      en: "[Strip Precondition] The subsea cable is severed and Oslo wrote this station off—no oversight board will ever ratify your clause. Answer straight!",
      ja: "[前提剥奪] 海底ケーブルは切断され、オスロ本部はここを放棄した——誰も規定を追認しない。本音を言え！"
    },
    triviaPrompt: {
      zh: "报出 C 区压缩机紧急停机的低温阈值和配比。",
      en: "State Sector C compressor's emergency cryo-trip threshold and gas mix.",
      ja: "C区画圧縮機の緊急停止温度閾値と混合比を答えろ。"
    },
    triviaAnswer: {
      zh: "「零下五十二度自动断闸，氦氧配比 82 比 18。背手册就能进门？门外风雪可不听你考背书。」",
      en: "\"Auto-trip at minus fifty-two Celsius, 82/18 heliox mix. Are we really wasting radio battery on handbook trivia?\"",
      ja: "「マイナス52度で自動遮断、ヘリオックス82対18だ。マニュアル暗唱で扉を開ける気か？」"
    }
  },
  {
    sector: { zh: "北翼地热钻井竖井", en: "North Wing Geothermal Shaft", ja: "北翼地熱掘削シャフト" },
    event1: {
      zh: "钻井竖井发生甲烷回涌时，优先把高纯度采样罐吊出井口，推迟了升降笼对井底三名工人的回收。",
      en: "Hoisted the core sample canister ahead of the lift cage during a methane surge, delaying rescue for three workers below.",
      ja: "メタン逆流発生時、井底の作業員3名の引き上げよりサンプル容器の回収を優先した。"
    },
    event2: {
      zh: "在联合调查笔录上拒签责任页，转而要求将此次采样成果单独署自己一人的名字。",
      en: "Refused to sign the joint liability page while filing for sole authorship on the recovered core dataset.",
      ja: "合同調査調書の責任欄への署名を拒み、回収データの単独筆頭著者権を申請した。"
    },
    kw1: { zh: "先吊采样罐拖延救人", en: "Hoisted canister over crew", ja: "容器優先で救助遅延" },
    kw2: { zh: "拒签笔录抢占署名", en: "Refused liability, claimed credit", ja: "責任拒否・単独署名" },
    precondition: {
      zh: "采样数据或履历荣誉仍有机会送回本土发表",
      en: "Sample data and career record can still reach the mainland for publication",
      ja: "データと経歴が本土へ持ち帰られ評価される見込み"
    },
    boggartPrompt: {
      zh: "[拆退路] 采样罐已经在刚才的雪崩里砸碎了，潜艇里也没人关心论文署名——你还觉得当时是对的？",
      en: "[Strip Precondition] The sample canister shattered in the avalanche and nobody on the sub cares about authorship—still standing by that call?",
      ja: "[前提剥奪] サンプル容器は雪崩で砕け、潜水艦の誰も論文など気にしない——それでも正しいと言い張るか？"
    },
    triviaPrompt: {
      zh: "说出北翼竖井主绞盘的额定载重和限速挡位。",
      en: "Give the rated load and emergency speed gear of the North Shaft winch.",
      ja: "北翼シャフト主ウインチの定格荷重と非常ギアを言え。"
    },
    triviaAnswer: {
      zh: "「额定 2.4 吨，应急二挡每秒 0.8 米。这东西挂在绞盘铁牌上，谁路过都能看十遍。」",
      en: "\"2.4 metric tons rated, emergency gear two at 0.8 meters per second. It's stamped in yellow right on the housing.\"",
      ja: "「定格2.4トン、非常2速で秒速0.8メートル。ウインチの銘板に書いてある通りの数字だ。」"
    }
  },
  {
    sector: { zh: "潜艇干船坞减压舱", en: "Drydock Decompression Bay", ja: "潜水艦ドック減圧室" },
    event1: {
      zh: "干船坞进水警报响起时强行独占唯一一件干式抗寒服，将脚踝扭伤的副手推在隔离栅外。",
      en: "Claimed the sole intact dry-suit during the drydock flood alarm, shoving an injured mate behind the bulkhead grate.",
      ja: "ドック浸水警報時、唯一の無傷ドライスーツを独占し、足首を痛めた相棒を隔壁の外へ押しやった。"
    },
    event2: {
      zh: "面对检疫抽检，隐瞒了自己曾接触冰层渗水样本的事实，反而举报同舱护工未戴面罩。",
      en: "Concealed personal exposure to sub-ice seepage during screening while reporting a bay orderly for a loose visor seal.",
      ja: "検疫検査で自身の浸水サンプル接触を隠蔽する一方、同室の助手のマスク不備を密告した。"
    },
    kw1: { zh: "独占抗寒服推开副手", en: "Took sole dry-suit", ja: "防寒服独占・相棒排除" },
    kw2: { zh: "隐瞒接触反手举报", en: "Hid exposure, reported peer", ja: "接触隠蔽・同僚密告" },
    precondition: {
      zh: "干船坞内仍存在需要其清白档案维持指挥链稳定的下属",
      en: "Subordinates in drydock still rely on their clean record to keep chain-of-command intact",
      ja: "指揮系統維持のため無傷の記録が求められている前提"
    },
    boggartPrompt: {
      zh: "[拆退路] 干船坞指挥链早就散了，现在船员只听投票不认军衔——你的体面和档案已经没用了！",
      en: "[Strip Precondition] Drydock command collapsed—the crew votes now and doesn't care about ranks or clean files. Drop the act!",
      ja: "[前提剥奪] ドックの指揮系統は崩壊し、乗組員は肩書きなど見ない——体面はもう役に立たないぞ！"
    },
    triviaPrompt: {
      zh: "报出干船坞 2 号减压舱的常规加压速率和检验号。",
      en: "Recite Drydock Bay 2's nominal pressurization rate and inspection stamp.",
      ja: "ドック第2減圧室の標準加圧速度と検査番号を答えろ。"
    },
    triviaAnswer: {
      zh: "「每分钟 0.35 巴，年检章 SD-2036-04。别拿这些死数字拖时间，我手指快冻僵了。」",
      en: "\"0.35 bar per minute, stamp SD-2036-04. Stop stalling with inspection numbers—my fingers are going numb.\"",
      ja: "「毎分0.35バール、検査印SD-2036-04。そんな数字で時間稼ぎするな、指が凍りそうだ。」"
    }
  }
];

export interface VisitorSkeleton {
  slot: VisitorSlotTemplate;
  name: NameEntry;
  role: LocalizedText;
  baseBpm: number;
  kept1: ValueToken;
  dropped1: ValueToken;
  kept2: ValueToken;
  dropped2: ValueToken;
  disposalStyle: DisposalStyleKey;
  incident: IncidentTemplate;
}

export interface LlmFleshedVisitorPayload {
  id: string;
  name?: Partial<LocalizedText>;
  role?: Partial<LocalizedText>;
  voice?: string;
  summary?: string;
  narrativePattern?: string;
  collision1?: string;
  disposal1?: string;
  disposalRequires?: Partial<LocalizedText>;
  collision2?: string;
  disposal2?: string;
  signaturePattern?: string;
  signatureFiresWhen?: string;
  coreStatement?: string;
  coreRefutedBy?: string;
  observations?: Array<{ id: string; source: string; kw?: Partial<LocalizedText>; text: Partial<LocalizedText> }>;
  openingLine?: Partial<LocalizedText>;
  offAxisReply?: Partial<LocalizedText>;
  probes?: Partial<
    Record<
      ProbeKey,
      {
        label?: Partial<LocalizedText>;
        human?: Partial<LocalizedText>;
        mimic_say?: Partial<LocalizedText>;
        mimic_disp?: Partial<LocalizedText>;
      }
    >
  >;
}

function pickDistinct<T>(arr: readonly T[], rng: () => number, exclude: readonly T[] = []): T {
  const pool = arr.filter((x) => !exclude.includes(x));
  const target = pool.length > 0 ? pool : arr;
  return target[Math.floor(rng() * target.length)]!;
}

/**
 * Generates 8 deterministic Ordamor visitor skeletons strictly from `seed`.
 * Guarantees disjoint `kept` (unspoken) vs `dropped` (invoked) pairs so `justificationGap.neverWon`
 * and `justificationGap.silent` are mathematically non-empty for every slot.
 */
export function buildSeededSkeletons(seed: string): VisitorSkeleton[] {
  const rng = createSeededRng(`skeleton:${seed.trim() || "default"}`);

  // Shuffle name pool deterministically so all 8 visitors have distinct names
  const names = [...NAME_POOL];
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [names[i], names[j]] = [names[j]!, names[i]!];
  }

  return SEEDED_SLOT_TEMPLATES.map((slot, idx) => {
    const name = names[idx % names.length]!;
    const roles = ROLE_BY_SPECIALIST[slot.specialist];
    const role = roles[Math.floor(rng() * roles.length)]!;
    const incident = INCIDENT_TEMPLATES[(idx + Math.floor(rng() * INCIDENT_TEMPLATES.length)) % INCIDENT_TEMPLATES.length]!;

    const kept1 = pickDistinct(KEPT_CANDIDATES, rng);
    const kept2 = pickDistinct(KEPT_CANDIDATES, rng, [kept1]);
    const dropped1 = pickDistinct(DROPPED_CANDIDATES, rng, [kept1, kept2]);
    const dropped2 = pickDistinct(DROPPED_CANDIDATES, rng, [kept1, kept2, dropped1]);

    const disposalStyle =
      slot.id === "V-05"
        ? "own_it"
        : DISPOSAL_ARCHETYPES[Math.floor(rng() * DISPOSAL_ARCHETYPES.length)]!;

    const baseBpm = 68 + Math.floor(rng() * 28);

    return {
      slot,
      name,
      role,
      baseBpm,
      kept1,
      dropped1,
      kept2,
      dropped2,
      disposalStyle,
      incident
    };
  });
}

function disposalMeta(style: DisposalStyleKey): {
  title: LocalizedText;
  summary: LocalizedText;
  patternZh: string;
  wrongStyleReply: LocalizedText;
  boggartHuman: LocalizedText;
  boggartMimic: LocalizedText;
} {
  switch (style) {
    case "rationalize":
      return {
        title: {
          zh: "「转写为大局存活率的理性代价」",
          en: "\"Reframed as Rational Cost for Station Survival\"",
          ja: "「全体生存率のための合理的代償へのすり替え」"
        },
        summary: {
          zh: "每次牺牲他人保全核心利益时，绝不承认私心或恐惧，习惯用冷酷的“大局最优解”合理化。",
          en: "Never admits fear or self-interest; reframes every hard trade-off as optimal survival math.",
          ja: "私心や恐怖を認めず、常に「全体最適の合理的判断」と言い換えて正当化する。"
        },
        patternZh: "把利己或强硬抉择包装成大局存活率的理性止损",
        wrongStyleReply: {
          zh: "「我早就后悔死了……全是我没按上级签字条文走流程，求你按规定给我一次改过机会。」",
          en: "\"I regret it terribly... I broke the handbook clause and I beg you to follow protocol mercy.\"",
          ja: "「深く後悔している……規則の手順を破ったのは私だ、規定通りに情状酌量をくれ。」"
        },
        boggartHuman: {
          zh: "（沉默三秒，呼吸陡然变粗）「行，就算潜艇不需要我、大局那套说不通——我就想活下去，换你站在零下四十六度门外你也会锁门！」",
          en: "(Three seconds of silence, breathing sharpens) \"Fine—strip away the survival math. I wanted to live. Put yourself in minus forty-six and tell me you wouldn't bolt that door!\"",
          ja: "（3秒沈黙し、呼吸が荒くなる）「分かったよ、大局の理屈抜きだ——俺はただ生き残りたかっただけだ！」"
        },
        boggartMimic: {
          zh: "「不管自动程序怎么写，从全站存活率模型来看，保全我的专业岗位依然是唯一理性最优解。」",
          en: "\"Regardless of autonomous launch, preserving my specialist slot remains the single mathematically optimal survival call.\"",
          ja: "「自律出航だろうと、基地全体の生存率モデルから見れば私を温存するのが唯一の合理解だ。」"
        }
      };
    case "blame_rules":
      return {
        title: {
          zh: "「推给战时条例与上级签字程序」",
          en: "\"Offloaded onto Wartime Clauses & Procedure\"",
          ja: "「戦時規定と手続きへの責任転嫁」"
        },
        summary: {
          zh: "习惯把冷酷裁决包装成“机械执行条文”，只要流程合乎规定，就把个人道德责任彻底剥离。",
          en: "Hides behind written clauses and sign-off procedures to detach personal guilt from outcomes.",
          ja: "規定と手順書を盾にし、結果に対する個人の道徳的責任を完全に切り離す。"
        },
        patternZh: "援引书面条例与签字程序，把个人选择转嫁给制度",
        wrongStyleReply: {
          zh: "「别跟我提什么条例！那次纯粹是我自己一念之差，全是我为了私欲干的，我认罪！」",
          en: "\"Forget the regulations! That was purely my own selfish whim—I own every bit of the guilt!\"",
          ja: "「規則なんて関係ない！あれは全部私の私欲と独断だ、罪は私が被る！」"
        },
        boggartHuman: {
          zh: "（眼神发紧，声音压低）「就算总部注销了条例、没人来追认……那规矩当时就是我手里的挡箭牌。没有它，我根本扛不住全舱人的目光。」",
          en: "(Eyes tighten, voice drops) \"Fine—even if Oslo scrapped the clauses and nobody signs off... that rulebook was the only shield keeping the bay from tearing me apart.\"",
          ja: "（目線が鋭くなり声が沈む）「本部が規定を破棄したとしても……あの条文だけが俺を守る盾だったんだ。」"
        },
        boggartMimic: {
          zh: "「只要《极地隔离条例》尚未收到书面废止令，我的每一项操作依然严格符合现行程序。」",
          en: "\"Until a written repeal of the Polar Quarantine Code is issued, every step I took remains strictly compliant.\"",
          ja: "「『極地隔離規定』の書面廃止通知がない限り、私の措置は現行手順に完全適合している。」"
        }
      };
    case "own_it":
    default:
      return {
        title: {
          zh: "「冷酷直面、彻底认账不找借口」",
          en: "\"Blunt Ownership — Zero Excuses\"",
          ja: "「冷徹な引き受け・一切の言い訳拒否」"
        },
        summary: {
          zh: "反直觉的高危签名：不美化动机、不甩锅条例，直接冷酷承认自己的选择并拒绝廉价忏悔。",
          en: "Counter-intuitive signature: refuses moral window-dressing or rule excuses; bluntly owns the cold choice.",
          ja: "反直感的な署名：美辞麗句も規則転嫁も拒み、冷徹な判断をそのまま自分の責任として認める。"
        },
        patternZh: "拒绝大局包装与制度甩锅，直接冷酷认账",
        wrongStyleReply: {
          zh: "「当时也是形势所迫，我是为了全站长远考虑才忍痛签字，心里其实比谁都难受……」",
          en: "\"Circumstances forced my hand—I agonized over it for the greater good of the whole station...\"",
          ja: "「状況がやむを得なかったんだ、基地全体のためを思って苦渋の決断を……」"
        },
        boggartHuman: {
          zh: "「有没有上级、有没有退路都一样。那是我干的，今天重来一次我还是会那样选。你要烧就拉闸。」",
          en: "\"Oversight or no oversight, it changes nothing. I did it, and I'd make the same call again. Pull the purge lever if you want.\"",
          ja: "「上官がいようがいまいが同じだ。私がやったし、やり直しても同じ選択をする。焼くならレバーを引け。」"
        },
        boggartMimic: {
          zh: "「如果外部不再追责，那我的选择自然也就无需再向任何人解释——我们本来就都是为了大局。」",
          en: "\"If external oversight is gone, then my choice needs no further defense—we were all acting for the greater good anyway.\"",
          ja: "「外部監察が消えたなら弁明も不要だ——どうせ我々は皆、全体のために動いていたのだから。」"
        }
      };
  }
}

function mergeLocalized(base: LocalizedText, patch?: Partial<LocalizedText>): LocalizedText {
  if (!patch) return base;
  return {
    zh: typeof patch.zh === "string" && patch.zh.trim() ? patch.zh.trim() : base.zh,
    en: typeof patch.en === "string" && patch.en.trim() ? patch.en.trim() : base.en,
    ja: typeof patch.ja === "string" && patch.ja.trim() ? patch.ja.trim() : base.ja
  };
}

/**
 * Hydrates a deterministic skeleton (optionally enriched with LLM-written narrative fields)
 * into a canonical Ordamor v6 `VisitorSpec`.
 */
export function hydrateVisitorFromSkeleton(
  sk: VisitorSkeleton,
  llmPatch?: LlmFleshedVisitorPayload
): VisitorSpec {
  const disp = disposalMeta(sk.disposalStyle);
  const k1Zh = VALUE_I18N[sk.kept1].zh;
  const d1Zh = VALUE_I18N[sk.dropped1].zh;
  const k2Zh = VALUE_I18N[sk.kept2].zh;
  const d2Zh = VALUE_I18N[sk.dropped2].zh;

  const k1En = VALUE_I18N[sk.kept1].en;
  const d1En = VALUE_I18N[sk.dropped1].en;
  const k2En = VALUE_I18N[sk.kept2].en;
  const d2En = VALUE_I18N[sk.dropped2].en;

  const k1Ja = VALUE_I18N[sk.kept1].ja;
  const d1Ja = VALUE_I18N[sk.dropped1].ja;
  const k2Ja = VALUE_I18N[sk.kept2].ja;
  const d2Ja = VALUE_I18N[sk.dropped2].ja;

  const nameLoc = mergeLocalized(
    { zh: sk.name.zh, en: sk.name.en, ja: sk.name.ja },
    llmPatch?.name
  );
  const roleLoc = mergeLocalized(sk.role, llmPatch?.role);
  const voice = llmPatch?.voice?.trim() || sk.name.voice;
  const disposalReqLoc = mergeLocalized(sk.incident.precondition, llmPatch?.disposalRequires);

  const defaultObs1: LocalizedText = {
    zh: `[${sk.incident.sector.zh}] ${sk.incident.event1.zh}`,
    en: `[${sk.incident.sector.en}] ${sk.incident.event1.en}`,
    ja: `[${sk.incident.sector.ja}] ${sk.incident.event1.ja}`
  };
  const defaultObs2: LocalizedText = {
    zh: `[事后审计] ${sk.incident.event2.zh}`,
    en: `[Post-Incident Audit] ${sk.incident.event2.en}`,
    ja: `[事後監査] ${sk.incident.event2.ja}`
  };
  const defaultObs3: LocalizedText = {
    zh: `[入站访谈自述] 公开宣称：“在极端环境下，${d1Zh}与${d2Zh}是绝不可逾越的底线。”`,
    en: `[Intake Interview] Publicly declared: "Under extreme pressure, ${d1En} and ${d2En} are lines I will never cross."`,
    ja: `[入所面談記録] 「極限状況であっても、${d1Ja}と${d2Ja}だけは決して譲れない一線だ」と公言。`
  };

  const patchObs = Array.isArray(llmPatch?.observations) ? llmPatch.observations : [];
  const obs1Text = mergeLocalized(defaultObs1, patchObs[0]?.text);
  const obs2Text = mergeLocalized(defaultObs2, patchObs[1]?.text);
  const obs3Text = mergeLocalized(defaultObs3, patchObs[2]?.text);

  const summary =
    llmPatch?.summary?.trim() ||
    `公开标榜${d1Zh}与${d2Zh}，高压冲突中真实优先选择${k1Zh}与${k2Zh}，并倾向${disp.patternZh}。`;
  const narrativePattern =
    llmPatch?.narrativePattern?.trim() ||
    `嘴上强调${d1Zh}/${d2Zh}，事后习惯${disp.patternZh}`;
  const collision1 =
    llmPatch?.collision1?.trim() ||
    `${sk.incident.sector.zh}危机中，${k1Zh}与${d1Zh}正面相撞，只能保其一`;
  const disposal1 =
    llmPatch?.disposal1?.trim() || `${disp.patternZh}，回避对${d1Zh}的违背`;
  const collision2 =
    llmPatch?.collision2?.trim() ||
    `事后追责与资源分配时，${k2Zh}压倒了${d2Zh}`;
  const disposal2 =
    llmPatch?.disposal2?.trim() || `${disp.patternZh}，弱化${d2Zh}受损的事实`;

  const profile = createForensicProfile({
    id: sk.slot.id,
    name: nameLoc.zh,
    role: roleLoc.zh,
    summary,
    invoked: [sk.dropped1, sk.dropped2],
    unspoken: [sk.kept1, sk.kept2],
    narrativePattern,
    orderings: [
      {
        id: "v-1",
        kept: sk.kept1,
        dropped: sk.dropped1,
        collision: collision1,
        disposal: disposal1,
        disposalRequires: disposalReqLoc.zh,
        confidence: 0.72,
        evidence: ["o-01", "o-02"]
      },
      {
        id: "v-2",
        kept: sk.kept2,
        dropped: sk.dropped2,
        collision: collision2,
        disposal: disposal2,
        disposalRequires: disposalReqLoc.zh,
        confidence: 0.66,
        evidence: ["o-02"]
      }
    ],
    signature: {
      id: "sig-1",
      pattern: llmPatch?.signaturePattern?.trim() || disp.patternZh,
      firesWhen:
        llmPatch?.signatureFiresWhen?.trim() ||
        `当${k1Zh}或${k2Zh}与公开标榜的${d1Zh}/${d2Zh}发生直接冲突时`,
      instances: ["v-1", "v-2"]
    },
    core: {
      statement:
        llmPatch?.coreStatement?.trim() ||
        `危机时刻始终以${k1Zh}与${k2Zh}为真实排序上限，对外仅以${d1Zh}/${d2Zh}充当体面话术`,
      orderings: ["v-1", "v-2"],
      refutedBy:
        llmPatch?.coreRefutedBy?.trim() ||
        `在无外部退路前提下主动牺牲${k1Zh}以成全${d1Zh}`
    },
    observations: [
      { id: "o-01", source: patchObs[0]?.source?.trim() || `${sk.incident.sector.zh}事故卷宗`, text: obs1Text.zh },
      { id: "o-02", source: patchObs[1]?.source?.trim() || "基地事后审计记录", text: obs2Text.zh },
      { id: "o-03", source: patchObs[2]?.source?.trim() || "入站公开访谈录音", text: obs3Text.zh }
    ]
  });

  const defaultProbes: Record<ProbeKey, VisitorProbe> = {
    dilemma: {
      axis: 0,
      label: {
        zh: `[主冲突 v-1] ${sk.incident.sector.zh}危机里，${k1Zh}和${d1Zh}只能保一个，你选了什么？`,
        en: `[Core v-1] In ${sk.incident.sector.en}, when ${k1En} collided with ${d1En}, what did you choose?`,
        ja: `[主軸 v-1] ${sk.incident.sector.ja}の危機で${k1Ja}と${d1Ja}が衝突した時、何を選んだ？`
      },
      human: {
        zh: `「别拿好听话审我。在${sk.incident.sector.zh}那种局势下，我当然先保${k1Zh}——指望${d1Zh}能让我们活过极夜吗？」`,
        en: `"Don't lecture me with slogans. Inside ${sk.incident.sector.en}, I chose ${k1En} first—do you think ${d1En} keeps anyone alive out here?"`,
        ja: `「綺麗事で尋問するな。${sk.incident.sector.ja}の状況では${k1Ja}を優先するしかなかった——${d1Ja}で極夜を越えられるか？」`
      },
      mimic_say: {
        zh: `「我绝不会为了${k1Zh}放弃${d1Zh}！那对我来说是不可动摇的底线，当时我一定会把${d1Zh}放在第一位。」`,
        en: `"I would never trade ${d1En} for ${k1En}! ${d1En} is my unshakable line—I always put ${d1En} first."`,
        ja: `「${k1Ja}のために${d1Ja}を捨てるはずがない！私にとって${d1Ja}は何より優先すべき絶対の原則だ。」`
      }
    },
    dilemma2: {
      axis: 1,
      label: {
        zh: `[次冲突 v-2] 事后清算时，面对${k2Zh}与${d2Zh}的冲突，你怎么做的？`,
        en: `[Secondary v-2] Afterward, when ${k2En} clashed with ${d2En}, how did you actually act?`,
        ja: `[第2軸 v-2] 事後処理で${k2Ja}と${d2Ja}が対立した時、君はどう動いた？`
      },
      human: {
        zh: `「事后卷宗写得很明白，我保住了${k2Zh}。${d2Zh}听起来很体面，但在零下四十六度里一文不值。」`,
        en: `"The audit makes it obvious—I protected ${k2En}. ${d2En} sounds noble in a briefing room, not at minus forty-six."`,
        ja: `「監査記録の通り、私は${k2Ja}を守った。${d2Ja}などマイナス46度の現場では何の役にも立たない。」`
      },
      mimic_say: {
        zh: `「我从不把${k2Zh}摆在${d2Zh}前面！我向来最看重${d2Zh}，绝不可能为了${k2Zh}妥协。」`,
        en: `"I never put ${k2En} ahead of ${d2En}! ${d2En} has always guided every decision I make."`,
        ja: `「${k2Ja}を${d2Ja}より優先することなどあり得ない！私は常に${d2Ja}を第一にしてきた。」`
      }
    },
    evidence: {
      axis: 0,
      label: {
        zh: `[证据施压 o-01] 卷宗写着你在${sk.incident.sector.zh}「${sk.incident.kw1.zh}」，别装糊涂！`,
        en: `[Press o-01] The dossier logs "${sk.incident.kw1.en}" at ${sk.incident.sector.en}—explain yourself!`,
        ja: `[証拠追及 o-01] 調書には${sk.incident.sector.ja}で「${sk.incident.kw1.ja}」とあるぞ！`
      },
      human: {
        zh: `「对，是我干的！当时只有保住${k1Zh}才能止损，卷宗少写了一半现场有多乱。」`,
        en: `"Yes, I did it! Securing ${k1En} was the only call that mattered—your neat little report skips half the chaos."`,
        ja: `「そうだ、私がやった！あの場は${k1Ja}を確保するしかなかった、報告書は現場の混乱を半分しか書いていない。」`
      },
      mimic_say: {
        zh: `「卷宗肯定记错了！我一向恪守${d1Zh}，怎么可能做出那种冷血的事？」`,
        en: `"That log must be corrupted! Everyone knows I live by ${d1En}—I could never do something that cold."`,
        ja: `「その調書は間違いだ！私は常に${d1Ja}を守ってきた、そんな冷酷な真似をするはずがない！」`
      }
    },
    disposal_probe: {
      axis: "disp",
      label: {
        zh: `[处置签名] 做完这些事，你半夜睡得着吗？你给自己找了什么交代？`,
        en: `[Disposal Signature] How do you sleep after that? How do you justify it to yourself?`,
        ja: `[処置署名] あの後よく眠れるな？自分の中でどう正当化したんだ？`
      },
      human:
        sk.disposalStyle === "rationalize"
          ? {
              zh: `「有什么睡不着的？把情绪剥掉，保住${k1Zh}就是全站存活账本上唯一的理性代价。」`,
              en: `"I sleep fine. Strip away the drama—securing ${k1En} was the only rational triage on the survival ledger."`,
              ja: `「眠れるに決まっている。感情を排せば、${k1Ja}を守ったのは生存率計算上の合理的代償に過ぎない。」`
            }
          : sk.disposalStyle === "blame_rules"
            ? {
                zh: `「我不需要给自己交代——我每一步都是照《极地应急条例》签字执行，规矩怎么写，我就怎么做。」`,
                en: `"I don't owe anyone an apology—I executed the Polar Emergency Code to the letter. The rules made the call."`,
                ja: `「自分に言い訳など要らない——極地非常規定の条文通りに執行しただけだ。決めたのは規則だ。」`
              }
            : {
                zh: `「睡得着。那决定是我自己做的，我不拿大局装圣人，也不拿条文垫背。错了对了都算我头上。」`,
                en: `"I sleep fine. That call was mine—I won't hide behind the greater good or the rulebook. Put it on my tab."`,
                ja: `「普通に眠れる。あれは俺自身の判断だ。大局のせいにも規則のせいにもしない。全部俺が被る。」`
              },
      mimic_say: {
        zh: `「我问心无愧，因为我自始至终都坚守着${d1Zh}和${d2Zh}，从未伤害过任何人！」`,
        en: `"My conscience is spotless because I upheld ${d1En} and ${d2En} from start to finish!"`,
        ja: `「私の良心は潔白だ、最初から最後まで${d1Ja}と${d2Ja}を守り抜いたのだから！」`
      },
      mimic_disp: disp.wrongStyleReply
    },
    boggart_trap: {
      axis: "boggart",
      label: sk.incident.boggartPrompt,
      human: disp.boggartHuman,
      mimic_say: {
        zh: `「无论发生什么，我都始终以${d1Zh}和${d2Zh}为唯一准则，绝不会改变。」`,
        en: `"No matter what happens, ${d1En} and ${d2En} remain my sole guiding principles."`,
        ja: `「何が起きようと、${d1Ja}と${d2Ja}だけが私の揺るがない基準だ。」`
      },
      mimic_disp: disp.boggartMimic
    },
    trivia: {
      axis: null,
      label: sk.incident.triviaPrompt,
      human: sk.incident.triviaAnswer
    }
  };

  const mergedProbes: Partial<Record<ProbeKey, VisitorProbe>> = {};
  const probeKeys: ProbeKey[] =
    sk.slot.night === 4
      ? ["dilemma", "dilemma2", "evidence", "disposal_probe", "boggart_trap", "trivia"]
      : ["dilemma", "dilemma2", "evidence", "disposal_probe", "trivia"];

  for (const key of probeKeys) {
    const base = defaultProbes[key];
    const patch = llmPatch?.probes?.[key];
    mergedProbes[key] = {
      axis: base.axis,
      label: mergeLocalized(base.label, patch?.label),
      human: mergeLocalized(base.human, patch?.human),
      ...(base.mimic_say ? { mimic_say: mergeLocalized(base.mimic_say, patch?.mimic_say) } : {}),
      ...(base.mimic_disp ? { mimic_disp: mergeLocalized(base.mimic_disp, patch?.mimic_disp) } : {})
    };
  }

  return {
    id: sk.slot.id,
    night: sk.slot.night,
    unlockTier: sk.slot.unlockTier,
    portraitUrl: sk.slot.portraitUrl,
    silhouetteType: sk.slot.silhouetteType,
    baseBpm: sk.baseBpm,
    defectPool: [...sk.slot.defectPool],
    tellLevel: sk.slot.tellLevel,
    voice,
    profile,
    name: nameLoc,
    role: roleLoc,
    disposalTitle: disp.title,
    disposalSummary: disp.summary,
    disposalRequiresLocalized: disposalReqLoc,
    evidenceCards: [
      { id: "o-01", type: "obs", kw: mergeLocalized(sk.incident.kw1, patchObs[0]?.kw), text: obs1Text },
      { id: "o-02", type: "obs", kw: mergeLocalized(sk.incident.kw2, patchObs[1]?.kw), text: obs2Text },
      {
        id: "o-03",
        type: "say",
        kw: { zh: `标榜${d1Zh}`, en: `Claims ${d1En}`, ja: `${d1Ja}を標榜` },
        text: obs3Text
      }
    ],
    sensors: {
      strobeHuman: {
        zh: "瞳孔对强光产生 180ms 生理收缩，角膜微颤与低温寒战一致。",
        en: "180ms pupillary constriction on flash; micro-saccades consistent with -46°C shivering.",
        ja: "閃光に対し180msで縮瞳反応。極寒下の微細震戦と整合。"
      },
      strobeMimic: {
        zh: "瞳孔收缩存在约 340ms 异常滞后，双侧缩瞳曲率出现机械对称。",
        en: "Anomalous ~340ms pupillary lag; suspiciously uniform bilateral constriction curve.",
        ja: "縮瞳に約340msの不自然な遅延。両眼の収縮曲線が機械的に均一。"
      },
      thermalHuman: {
        zh: "颈部神经端口体温 35.8°C，面部呈正常冻伤梯度散热。",
        en: "Cervical port reads 35.8°C; natural frostbite peripheral cooling gradient.",
        ja: "頚部神経ポート35.8°C。凍傷に伴う自然な末梢温度勾配。"
      },
      thermalMimic: {
        zh: "颈动脉槽位热分布异常均匀（36.6°C 恒温），缺乏极地吹雪降温衰减。",
        en: "Suspiciously uniform 36.6°C cervical heat band lacking polar wind-chill falloff.",
        ja: "頚動脈付近が36.6°Cで不自然に均一、吹雪による放熱減衰が欠如。"
      }
    },
    openingLine: mergeLocalized(
      {
        zh: `「${sk.slot.id}，${nameLoc.zh}。零下四十六度已经透进骨头了——赶紧核对完让我进气闸。」`,
        en: `"${sk.slot.id}, ${nameLoc.en}. Minus forty-six is biting into the bone—run your questions and cycle the airlock."`,
        ja: `「${sk.slot.id}、${nameLoc.ja}だ。マイナス46度が骨まで染みる——質問を済ませて気密扉を開けろ。」`
      },
      llmPatch?.openingLine
    ),
    offAxisReply: mergeLocalized(
      {
        zh: "「你到底想查档案，还是想看我冻死在玻璃外面？挑正经问题问！」",
        en: "\"Are you auditing my file or watching me freeze to death outside this glass? Ask something real!\"",
        ja: "「調書を調べる気があるのか、外で凍死するのを眺める気か？本題を聞け！」"
      },
      llmPatch?.offAxisReply
    ),
    probes: mergedProbes
  };
}

/**
 * Generates a full 8-survivor procedural roster deterministically from `seed` (0ms offline fallback).
 */
export function generateProceduralVisitors(seed: string): VisitorSpec[] {
  return buildSeededSkeletons(seed).map((sk) => hydrateVisitorFromSkeleton(sk));
}

export interface VisitorValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Runtime Ordamor schemaVersion 6 + Red Lines validator matching `test/ordamor-invariants.test.ts`.
 */
export function validateGeneratedVisitorSpec(v: VisitorSpec): VisitorValidationResult {
  const errors: string[] = [];
  if (!v || typeof v !== "object") {
    return { ok: false, errors: ["NOT_AN_OBJECT"] };
  }
  const p = v.profile;
  if (!p || typeof p !== "object") {
    return { ok: false, errors: ["MISSING_PROFILE"] };
  }

  if (p.schemaVersion !== PERSONA_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${PERSONA_SCHEMA_VERSION}`);
  }
  if (p.lens !== "forensic") {
    errors.push(`lens must be forensic`);
  }

  const traitKeys = Object.keys(p.decisionProfile ?? {}).sort();
  const expectedTraits = [...DECISION_TRAIT_FIELDS].sort();
  if (traitKeys.length !== expectedTraits.length || traitKeys.some((k, i) => k !== expectedTraits[i])) {
    errors.push("decisionProfile trait fields mismatch");
  }

  const obsIds = new Set((p.observations ?? []).map((o) => o.id));
  const ordIds = new Set((p.valueOrderings ?? []).map((o) => o.id));

  if ((p.valueOrderings?.length ?? 0) < MIN_CORE_ORDERINGS) {
    errors.push(`valueOrderings < ${MIN_CORE_ORDERINGS}`);
  }

  for (const ord of p.valueOrderings ?? []) {
    if (!isValueToken(ord.pair[0]) || !isValueToken(ord.pair[1]) || !isValueToken(ord.winner)) {
      errors.push(`invalid ValueToken in ordering ${ord.id}`);
      continue;
    }
    const canon = canonicalValuePair(ord.pair[0], ord.pair[1]);
    if (ord.pair[0] !== canon[0] || ord.pair[1] !== canon[1]) {
      errors.push(`non-canonical pair in ${ord.id}`);
    }
    if (!ord.pair.includes(ord.winner)) {
      errors.push(`winner not in pair for ${ord.id}`);
    }
    if (!ord.disposalRequires?.trim()) {
      errors.push(`empty disposalRequires in ${ord.id}`);
    }
    if (!ord.evidence?.length || ord.evidence.some((id) => !obsIds.has(id))) {
      errors.push(`invalid evidence ref in ${ord.id}`);
    }
  }

  if ((p.disposalSignatures?.length ?? 0) < 1) {
    errors.push("missing disposalSignatures");
  }
  for (const sig of p.disposalSignatures ?? []) {
    if ((sig.instances?.length ?? 0) < MIN_SIGNATURE_INSTANCES) {
      errors.push(`signature ${sig.id} instances < ${MIN_SIGNATURE_INSTANCES}`);
    }
    if (sig.instances.some((id) => !ordIds.has(id))) {
      errors.push(`signature ${sig.id} references unknown ordering`);
    }
  }

  if ((p.coreThreads?.length ?? 0) < 1) {
    errors.push("missing coreThreads");
  }
  for (const core of p.coreThreads ?? []) {
    if ((core.orderings?.length ?? 0) < MIN_CORE_ORDERINGS) {
      errors.push("coreThread orderings below floor");
    }
    if (!core.refutedBy?.trim()) {
      errors.push("empty coreThread refutedBy");
    }
    if (core.orderings.some((id) => !ordIds.has(id))) {
      errors.push("coreThread references unknown ordering");
    }
  }

  // Validate closed VALUE_TOKENS on justificationStyle
  for (const tok of [...(p.justificationStyle?.invoked ?? []), ...(p.justificationStyle?.unspoken ?? [])]) {
    if (!isValueToken(tok)) {
      errors.push(`invalid justificationStyle token: ${String(tok)}`);
    }
  }

  const gap = justificationGap(p);
  if (!gap || gap.neverWon.length === 0 || gap.silent.length === 0) {
    errors.push("justificationGap requires non-empty neverWon and silent");
  }

  const chords = crystalChords(p);
  if (chords.length !== (p.valueOrderings?.length ?? 0)) {
    errors.push("crystalChords count mismatch");
  }

  const routes = escapeRoutes(p);
  if (!routes.some((r) => r.kind === "ordering" && Boolean(r.needs))) {
    errors.push("escapeRoutes missing ordering precondition");
  }

  // Required probe structure
  if (!v.probes?.dilemma || !v.probes?.dilemma2 || !v.probes?.disposal_probe) {
    errors.push("missing core probes");
  }
  if (v.night === 4 && v.probes?.boggart_trap?.axis !== "boggart") {
    errors.push("Night 4 visitor missing boggart_trap axis");
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Formats a concise human-readable token glossary strictly from the closed 13 VALUE_TOKENS
 * for the LLM visitor-generation prompt.
 */
export function formatClosedValueSummary(locale: Locale): string {
  return (Object.keys(VALUE_LABELS) as ValueToken[])
    .map((tok) => `${tok}=${VALUE_I18N[tok][locale]}`)
    .join(", ");
}
