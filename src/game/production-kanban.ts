import type { RenderPipelineRoute } from "./production-board.js";
import type { Locale, LocalizedText } from "./types.js";

export type KanbanColumnId =
  | "backlog"
  | "previz"
  | "keyframes"
  | "rendering"
  | "qa"
  | "shipped";

export type KanbanPriority = "urgent" | "high" | "medium" | "low";

export type KanbanChapter =
  | "EP0"
  | "N1"
  | "N2-4"
  | "N5"
  | "ONER"
  | "TRAILER"
  | "INFRA";

export type KanbanOwner =
  | "Cinematographer"
  | "LookDev"
  | "H3-Renderer"
  | "QA-Gate"
  | "Director";

export interface KanbanColumnSpec {
  id: KanbanColumnId;
  label: LocalizedText;
  accentHex: string;
  glyph: string;
}

export interface KanbanIssue {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  status: KanbanColumnId;
  priority: KanbanPriority;
  chapter: KanbanChapter;
  owner: KanbanOwner;
  route?: RenderPipelineRoute;
  shotCount?: number;
  reelCount?: number;
  durationSec?: number;
  linkedShotId?: string;
  linkedAssetTags?: readonly string[];
  sourceRef?: string;
  updatedAt: string;
  custom?: boolean;
}

export interface KanbanFilterState {
  query: string;
  chapter: KanbanChapter | "ALL";
  owner: KanbanOwner | "ALL";
  route: RenderPipelineRoute | "ALL";
}

export interface KanbanStats {
  total: number;
  shipped: number;
  shippedPct: number;
  totalShots: number;
  byColumn: Record<KanbanColumnId, number>;
}

export const KANBAN_STORAGE_KEY = "gate0_internal_kanban_v1";

export const KANBAN_COLUMNS: readonly KanbanColumnSpec[] = [
  {
    id: "backlog",
    label: { zh: "待排期 Backlog", en: "Backlog", ja: "Backlog" },
    accentHex: "#7c8b99",
    glyph: "○"
  },
  {
    id: "previz",
    label: { zh: "3D 预演 Pre-viz", en: "3D Pre-viz", ja: "3D Pre-viz" },
    accentHex: "#5bbad5",
    glyph: "◈"
  },
  {
    id: "keyframes",
    label: { zh: "首尾帧 Keyframes", en: "Keyframes", ja: "Keyframes" },
    accentHex: "#eba834",
    glyph: "◐"
  },
  {
    id: "rendering",
    label: { zh: "H3 生片 Rendering", en: "H3 Rendering", ja: "Rendering" },
    accentHex: "#d08770",
    glyph: "◑"
  },
  {
    id: "qa",
    label: { zh: "连续性 QA Gate", en: "Continuity QA", ja: "Continuity QA" },
    accentHex: "#e04634",
    glyph: "◕"
  },
  {
    id: "shipped",
    label: { zh: "已交付 Shipped", en: "Shipped", ja: "Shipped" },
    accentHex: "#49b882",
    glyph: "●"
  }
];

export const DEFAULT_KANBAN_ISSUES: readonly KanbanIssue[] = [
  {
    id: "G0-01",
    title: {
      zh: "EP0 静帧先导片 11 Reels 合成版",
      en: "EP0 Pilot 11-Reel Ken Burns Assembly",
      ja: "EP0 パイロット版 11リール合成"
    },
    description: {
      zh: "基于 2D 静帧与 Edge-TTS/程序拟音生成 11 段 720p MP4 并输出三语字幕时间轴。",
      en: "2D still assembly with Edge-TTS + procedural foley across 11 MP4 reels and synced trilingual cues.",
      ja: "2D静止画＋Edge-TTSによる11本720p生成と3言語字幕キュー出力。"
    },
    status: "shipped",
    priority: "medium",
    chapter: "EP0",
    owner: "Director",
    reelCount: 11,
    durationSec: 435,
    linkedShotId: "shot_prologue_01",
    linkedAssetTags: ["@set_booth", "@op09"],
    sourceRef: "scripts/build-ep0-pilot.py",
    updatedAt: "2026-11-26"
  },
  {
    id: "G0-02",
    title: {
      zh: "EP0 MiniMax-H3 v2 全片 46 镜出片",
      en: "EP0 MiniMax-H3 v2 Render (11 Reels · 46 Shots)",
      ja: "EP0 MiniMax-H3 v2 本番レンダリング (46カット)"
    },
    description: {
      zh: "已在 Colab G4 完成 46 镜原生音画渲染与拼接，产出 ep0_h3_manifest.json。",
      en: "Completed 46 native A/V shots on Colab G4 via MiniMax-H3 fl2va and stitched into 11 reels.",
      ja: "Colab G4にて46カットのネイティブ音画生成と11リール結合を完了。"
    },
    status: "shipped",
    priority: "high",
    chapter: "EP0",
    owner: "H3-Renderer",
    route: "fl2va_keyframes",
    shotCount: 46,
    reelCount: 11,
    durationSec: 397.8,
    linkedShotId: "shot_prequel_icecore",
    linkedAssetTags: ["@set_icecore", "@marcus", "@leo"],
    sourceRef: "scripts/render-ep0-minimax-h3.py",
    updatedAt: "2026-11-27"
  },
  {
    id: "G0-03",
    title: {
      zh: "摄影师 Agent Runbook（90% 首尾帧 + 10% 白膜视频）",
      en: "Cinematographer Agent Runbook & Cheat Point SOP",
      ja: "撮影監督エージェント作業手順書"
    },
    description: {
      zh: "沉淀参考片逆向拆解、Three.js Pre-viz 轴线检查、首尾帧精修与 Cheat Point 遮挡转场规范。",
      en: "Codifies reverse-engineering beat sheets, Three.js Pre-viz, 35mm keyframe anchoring, and Cheat Point wipes.",
      ja: "ビート分解・3D事前可視化・35mmキーフレーム・Cheat Point基準を明文化。"
    },
    status: "shipped",
    priority: "medium",
    chapter: "INFRA",
    owner: "Cinematographer",
    sourceRef: "wiki/team/cinematographer.md",
    updatedAt: "2026-11-28"
  },
  {
    id: "G0-04",
    title: {
      zh: "Three.js 3D 白膜片场升级（Beat 轨迹 / 画中画 / 首尾帧）",
      en: "Three.js Pre-viz Upgrade (Top Map · PiP · Start+End)",
      ja: "Three.js 3D舞台アップグレード"
    },
    description: {
      zh: "已支持 Orbit/Top Map/Follow Rig/Cam POV 四视角、Cheat Point 标记、首尾帧双采与 WebM 导出。",
      en: "Shipped 4 view modes, live PiP Cam POV, Beat scrubber, Cheat Point markers, Start+End capture, and WebM export.",
      ja: "4視点・PiP・ビートタイムライン・Cheat Point・首尾画像/WebM出力を実装。"
    },
    status: "shipped",
    priority: "high",
    chapter: "INFRA",
    owner: "Cinematographer",
    linkedShotId: "shot_oner_n1_corridor_booth",
    sourceRef: "src/ui/components/ThreeBlockingStage.tsx",
    updatedAt: "2026-11-28"
  },
  {
    id: "G0-05",
    title: {
      zh: "60 秒首发预告片 v2.0 音画对齐终审",
      en: "Launch Trailer v2.0 Master Cut & Audio Budget QA",
      ja: "ローンチトレーラー v2.0 音画QA"
    },
    description: {
      zh: "严格对齐 60.0s 时长、5 条新镜头与 Gate Cam 01 1080p 嵌套边框。",
      en: "60.0s exact master cut with 5 tight hero shots seated 1:1 inside Gate Cam 01 bezel.",
      ja: "60.0秒厳密構成・新規5カット・Gate Cam 01ベゼル1:1配置を検証。"
    },
    status: "qa",
    priority: "high",
    chapter: "TRAILER",
    owner: "QA-Gate",
    durationSec: 60,
    linkedShotId: "shot_elena_arrival",
    linkedAssetTags: ["@elena", "@marcus", "@op09"],
    sourceRef: "docs/TRAILER_STORYBOARD.md",
    updatedAt: "2026-11-27"
  },
  {
    id: "G0-06",
    title: {
      zh: "全战役连续性 QA Gate（0 回弹 & 首尾帧拼图核查）",
      en: "Unified Campaign Continuity QA Gate",
      ja: "全キャンペーン連続性QAゲート"
    },
    description: {
      zh: "校验 REEL_ORDER、chain_prev、1280x720 48kHz 规格与 sheet_inter_reel / sheet_intra 接触表。",
      en: "Audits REEL_ORDER, chain_prev integrity, zero snap-backs, loudness, and Prev End -> Next Start sheets.",
      ja: "REEL_ORDER・chain_prev・音量・前後フレーム連絡表を自動検証。"
    },
    status: "qa",
    priority: "urgent",
    chapter: "INFRA",
    owner: "QA-Gate",
    sourceRef: "scripts/audit-campaign-continuity.py",
    updatedAt: "2026-11-27"
  },
  {
    id: "G0-07",
    title: {
      zh: "SC-ONER-N1 长镜头 3D 机位微调与首尾白膜定稿",
      en: "SC-ONER-N1 24s 3-Beat Oner Blocking Lock",
      ja: "SC-ONER-N1 24秒長回し Blocking確定"
    },
    description: {
      zh: "红警走廊 → 8.2s 右钢柱 Cheat Point 擦除入亭 → 180° 绕控制台定格防爆窗，共 3 段 8s Beat。",
      en: "Corridor track -> 8.2s steel pillar Cheat Point wipe into Booth 0 -> 180-deg console arc onto blast glass.",
      ja: "廊下追従→8.2秒鋼柱ワイプ→操作盤180度回り込み窓ロックの3ビート構成。"
    },
    status: "previz",
    priority: "urgent",
    chapter: "ONER",
    owner: "Cinematographer",
    route: "fl2va_keyframes",
    shotCount: 3,
    durationSec: 24,
    linkedShotId: "shot_oner_n1_corridor_booth",
    linkedAssetTags: ["@set_corridor", "@set_booth", "@op09"],
    sourceRef: "src/game/production-board.ts",
    updatedAt: "2026-11-28"
  },
  {
    id: "G0-08",
    title: {
      zh: "SC-ONER-N5 镜面对峙长镜头 3D 轨迹 & WebM 白膜导出",
      en: "SC-ONER-N5 21s Mirror Oner Pre-viz & WebM Export",
      ja: "SC-ONER-N5 21秒鏡像長回し WebM出力"
    },
    description: {
      zh: "暴雪低机位跟拍 → 7.4s 结霜钢框擦除入亭 → 50mm 对称推近揭晓替身，导出白膜参考视频走 V2V。",
      en: "Low blizzard track -> 7.4s frosted mullion wipe -> 50mm symmetrical push reveal; export WebM for V2V.",
      ja: "吹雪ロー追従→7.4秒霜枠ワイプ→50mm対称プッシュ。V2V用にWebM出力。"
    },
    status: "previz",
    priority: "high",
    chapter: "ONER",
    owner: "Cinematographer",
    route: "v2v_whitebox",
    shotCount: 3,
    durationSec: 21,
    linkedShotId: "shot_oner_n5_mirror_approach",
    linkedAssetTags: ["@set_vestibule", "@set_booth", "@op09"],
    sourceRef: "src/game/production-board.ts",
    updatedAt: "2026-11-28"
  },
  {
    id: "G0-09",
    title: {
      zh: "增补停机坪 & 公共食堂 3D 灰模场景",
      en: "Add Helipad & Mess Hall Greybox Sets to White-Box",
      ja: "ヘリポート＆食堂の3D灰模セット追加"
    },
    description: {
      zh: "扩展 three-whitebox-renderer.ts，使 EP0 开场一镜到底也能在 3D Pre-viz 中完整排演。",
      en: "Extend three-whitebox-renderer.ts with helipad & mess hall sets so EP0 hero oner can be blocked in 3D.",
      ja: "EP0冒頭長回しの3D事前可視化向けにヘリポートと食堂セットを追加。"
    },
    status: "previz",
    priority: "medium",
    chapter: "INFRA",
    owner: "Cinematographer",
    linkedShotId: "shot_prequel_icecore",
    linkedAssetTags: ["@set_icecore", "@marcus"],
    sourceRef: "src/game/three-whitebox-renderer.ts",
    updatedAt: "2026-11-28"
  },
  {
    id: "G0-10",
    title: {
      zh: "Stage 1 第 1 夜（艾琳娜/莱奥）35mm 关键帧与尾帧锚点",
      en: "Night 1 (Elena / Leo) Keyframes & last_frame_img Anchors",
      ja: "第1夜（エレナ/レオ）キーフレーム＆末尾アンカー"
    },
    description: {
      zh: "为第 1 夜 14 个卷轴、52 镜补充跨机位运动的尾帧锚点，确保 fl2va 收束构图稳定。",
      en: "Prepare 35mm start/end keyframes across 14 Night 1 reels (52 shots) to anchor camera moves in fl2va.",
      ja: "第1夜14リール52カットの前後35mmキーフレームを整備。"
    },
    status: "keyframes",
    priority: "urgent",
    chapter: "N1",
    owner: "LookDev",
    route: "fl2va_keyframes",
    shotCount: 52,
    reelCount: 14,
    durationSec: 428.8,
    linkedShotId: "shot_elena_arrival",
    linkedAssetTags: ["@elena", "@leo", "@set_vestibule"],
    sourceRef: "scripts/render-n1-minimax-h3.py",
    updatedAt: "2026-11-27"
  },
  {
    id: "G0-11",
    title: {
      zh: "SC-ONER-N1 三段式写实首尾帧精修（6 张 35mm 锚点图）",
      en: "SC-ONER-N1 3-Segment Realistic Start/End Keyframes",
      ja: "SC-ONER-N1 3区間 写実首尾キーフレーム"
    },
    description: {
      zh: "根据 Three.js 导出的 Start+End 白膜/深度图精修走廊、钢柱擦除、绕台防爆窗 3 组首尾帧。",
      en: "Look-dev 3 pairs of 35mm frames from 3D Start+End white-box captures for corridor, pillar wipe, and booth lock.",
      ja: "3D首尾白模から3区間の35mm写実首尾フレームを仕上げる。"
    },
    status: "keyframes",
    priority: "high",
    chapter: "ONER",
    owner: "LookDev",
    route: "fl2va_keyframes",
    shotCount: 3,
    durationSec: 24,
    linkedShotId: "shot_oner_n1_corridor_booth",
    linkedAssetTags: ["@op09", "@intercom", "@blackbox"],
    sourceRef: "scripts/render-n1-minimax-h3.py",
    updatedAt: "2026-11-28"
  },
  {
    id: "G0-12",
    title: {
      zh: "Stage 1 第 1 夜 Colab G4 MiniMax-H3 批量渲染",
      en: "Stage 1 Night 1 Colab G4 MiniMax-H3 Batch Render",
      ja: "第1夜 Colab G4 MiniMax-H3 一括生成"
    },
    description: {
      zh: "在 Colab G4 (96GB Blackwell) 运行 render-n1-minimax-h3.py，渲染 52 镜并同步至 Google Drive。",
      en: "Execute render-n1-minimax-h3.py on Colab G4 (52 shots / 14 reels) and archive to Google Drive.",
      ja: "Colab G4でrender-n1-minimax-h3.py（52カット）を実行しDrive保存。"
    },
    status: "rendering",
    priority: "urgent",
    chapter: "N1",
    owner: "H3-Renderer",
    route: "fl2va_keyframes",
    shotCount: 52,
    reelCount: 14,
    durationSec: 428.8,
    linkedShotId: "shot_leo_arrival",
    linkedAssetTags: ["@elena", "@leo"],
    sourceRef: "scripts/render-n1-minimax-h3.py",
    updatedAt: "2026-11-27"
  },
  {
    id: "G0-13",
    title: {
      zh: "Stage 2 第 2–4 夜（亚瑟/马库斯/安娜/英格丽/林梅/汉娜）全量渲染",
      en: "Stage 2 Nights 2–4 Render (12 Reels · 74 Shots)",
      ja: "第2〜4夜 本番生成（12リール・74カット）"
    },
    description: {
      zh: "覆盖双轴试探、磁暴停电与血清/燃料危机分支，共 74 镜（约 613.2s），需先锁定大运动镜头尾帧。",
      en: "74 shots (~613.2s) covering Nights 2-4 interrogations, geomagnetic storm, and crisis dilemmas.",
      ja: "第2〜4夜の尋問・磁気嵐・危機分岐74カット（約613.2秒）。"
    },
    status: "backlog",
    priority: "high",
    chapter: "N2-4",
    owner: "H3-Renderer",
    route: "fl2va_keyframes",
    shotCount: 74,
    reelCount: 12,
    durationSec: 613.2,
    linkedShotId: "shot_n2_marcus_warning",
    linkedAssetTags: ["@arthur", "@marcus", "@ana", "@ingrid", "@linmei", "@hannah"],
    sourceRef: "scripts/render-n2-4-minimax-h3.py",
    updatedAt: "2026-11-27"
  },
  {
    id: "G0-14",
    title: {
      zh: "Stage 3 第 5 夜镜面终局 & 多结局渲染（11 Reels · 54 镜）",
      en: "Stage 3 Night 5 & Endings Render (11 Reels · 54 Shots)",
      ja: "第5夜＆マルチエンディング生成（54カット）"
    },
    description: {
      zh: "涵盖镜面对峙与 7 重结局分镜，共 54 镜（432.0s），需将 SC-ONER-N5 接入终局片头。",
      en: "54 shots (432.0s) for Night 5 mirror confrontation and multi-ending cinematics.",
      ja: "第5夜鏡像対峙とエンディング群54カット（432.0秒）。"
    },
    status: "backlog",
    priority: "high",
    chapter: "N5",
    owner: "H3-Renderer",
    route: "fl2va_keyframes",
    shotCount: 54,
    reelCount: 11,
    durationSec: 432.0,
    linkedShotId: "shot_n5_mirror_confront",
    linkedAssetTags: ["@op09", "@set_booth"],
    sourceRef: "scripts/render-n5-minimax-h3.py",
    updatedAt: "2026-11-27"
  },
  {
    id: "G0-15",
    title: {
      zh: "【高光长镜头】EP0 停机坪暴雪 → 气闸门 → 暖黄食堂 28s Oner",
      en: "Hero Oner: Helipad Blizzard -> Airlock -> Mess Hall (28s)",
      ja: "名場面長回し：ヘリポート吹雪→気閘→食堂 (28秒)"
    },
    description: {
      zh: "一镜完成 -46°C 死寂孤立到 9 人暖黄热汤食堂的情绪反差，中间借气闸门框做 Cheat Point。",
      en: "Single continuous shot bridging -46C polar isolation into the warm 9-crew mess hall via airlock wipe.",
      ja: "極寒の孤立から温かい食堂への感情対比を気閘扉ワイプで一気に見せる。"
    },
    status: "backlog",
    priority: "medium",
    chapter: "ONER",
    owner: "Cinematographer",
    route: "fl2va_keyframes",
    shotCount: 4,
    durationSec: 28,
    linkedShotId: "shot_prologue_01",
    linkedAssetTags: ["@marcus", "@op09"],
    updatedAt: "2026-11-28"
  },
  {
    id: "G0-16",
    title: {
      zh: "【高光长镜头】第 3/4 夜磁暴停电穿窗长镜头（20s）",
      en: "Night 3/4 Geomagnetic Blackout Glass-Pass Oner (20s)",
      ja: "第3/4夜 磁気嵐停電・防爆窓通過長回し (20秒)"
    },
    description: {
      zh: "CRT 熄灭红警亮起，镜头贴结霜玻璃边框擦除穿过物理边界进入红光外廊再回摇窗内。",
      en: "CRT blackout into red alarm; camera wipes past frosted frame into outer corridor and pans back in.",
      ja: "CRT消灯から赤色警報、霜枠ワイプで外廊へ抜け再び室内へ戻る。"
    },
    status: "backlog",
    priority: "low",
    chapter: "ONER",
    owner: "Cinematographer",
    route: "v2v_whitebox",
    shotCount: 3,
    durationSec: 20,
    linkedShotId: "shot_n3_ana_truth",
    linkedAssetTags: ["@ana", "@set_booth", "@set_vestibule"],
    updatedAt: "2026-11-28"
  }
];

function cloneIssue(issue: KanbanIssue): KanbanIssue {
  return {
    ...issue,
    title: { ...issue.title },
    description: { ...issue.description },
    ...(issue.linkedAssetTags ? { linkedAssetTags: [...issue.linkedAssetTags] } : {})
  };
}

export function loadKanbanIssues(): KanbanIssue[] {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(KANBAN_STORAGE_KEY);
      if (raw) {
        const parsed = parseKanbanImport(raw);
        if (parsed && parsed.length > 0) return parsed;
      }
    }
  } catch {
    // Ignore storage read errors in restricted contexts
  }
  return DEFAULT_KANBAN_ISSUES.map(cloneIssue);
}

export function saveKanbanIssues(issues: readonly KanbanIssue[]): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(issues));
    }
  } catch {
    // Ignore storage write errors
  }
}

export function moveKanbanIssue(
  issues: readonly KanbanIssue[],
  id: string,
  nextStatus: KanbanColumnId
): KanbanIssue[] {
  const today = new Date().toISOString().slice(0, 10);
  return issues.map((issue) =>
    issue.id === id ? { ...issue, status: nextStatus, updatedAt: today } : issue
  );
}

export function updateKanbanIssue(
  issues: readonly KanbanIssue[],
  id: string,
  patch: Partial<Pick<KanbanIssue, "status" | "priority" | "owner" | "route">>
): KanbanIssue[] {
  const today = new Date().toISOString().slice(0, 10);
  return issues.map((issue) =>
    issue.id === id ? { ...issue, ...patch, updatedAt: today } : issue
  );
}

export function deleteKanbanIssue(issues: readonly KanbanIssue[], id: string): KanbanIssue[] {
  return issues.filter((issue) => issue.id !== id);
}

export function createKanbanIssue(
  issues: readonly KanbanIssue[],
  draft: {
    title: string;
    description?: string;
    status: KanbanColumnId;
    priority: KanbanPriority;
    chapter: KanbanChapter;
    owner: KanbanOwner;
    route?: RenderPipelineRoute;
    linkedShotId?: string;
    sourceRef?: string;
  }
): KanbanIssue[] {
  let maxNum = 0;
  for (const item of issues) {
    const m = /^G0-(\d+)$/.exec(item.id);
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n > maxNum) maxNum = n;
    }
  }
  const nextId = `G0-${String(maxNum + 1).padStart(2, "0")}`;
  const cleanTitle = draft.title.trim();
  const cleanDesc = (draft.description ?? "").trim();
  const today = new Date().toISOString().slice(0, 10);

  const created: KanbanIssue = {
    id: nextId,
    title: { zh: cleanTitle, en: cleanTitle, ja: cleanTitle },
    description: {
      zh: cleanDesc || "内部制片排期任务",
      en: cleanDesc || "Internal production pipeline task",
      ja: cleanDesc || "内部制作パイプラインタスク"
    },
    status: draft.status,
    priority: draft.priority,
    chapter: draft.chapter,
    owner: draft.owner,
    ...(draft.route ? { route: draft.route } : {}),
    ...(draft.linkedShotId ? { linkedShotId: draft.linkedShotId } : {}),
    ...(draft.sourceRef ? { sourceRef: draft.sourceRef.trim() } : {}),
    updatedAt: today,
    custom: true
  };

  return [created, ...issues];
}

export function filterKanbanIssues(
  issues: readonly KanbanIssue[],
  filters: KanbanFilterState,
  lang: Locale
): KanbanIssue[] {
  const q = filters.query.trim().toLowerCase();
  return issues.filter((issue) => {
    if (filters.chapter !== "ALL" && issue.chapter !== filters.chapter) return false;
    if (filters.owner !== "ALL" && issue.owner !== filters.owner) return false;
    if (filters.route !== "ALL" && issue.route !== filters.route) return false;
    if (!q) return true;
    const haystack = [
      issue.id,
      issue.title[lang],
      issue.title.zh,
      issue.title.en,
      issue.description[lang],
      issue.chapter,
      issue.owner,
      issue.sourceRef ?? "",
      issue.linkedShotId ?? "",
      ...(issue.linkedAssetTags ?? [])
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function computeKanbanStats(issues: readonly KanbanIssue[]): KanbanStats {
  const byColumn: Record<KanbanColumnId, number> = {
    backlog: 0,
    previz: 0,
    keyframes: 0,
    rendering: 0,
    qa: 0,
    shipped: 0
  };
  let totalShots = 0;
  for (const item of issues) {
    byColumn[item.status] += 1;
    totalShots += item.shotCount ?? 0;
  }
  const total = issues.length;
  const shipped = byColumn.shipped;
  const shippedPct = total > 0 ? Math.round((shipped / total) * 100) : 0;
  return { total, shipped, shippedPct, totalShots, byColumn };
}

export function serializeKanbanExport(issues: readonly KanbanIssue[]): string {
  return JSON.stringify(issues, null, 2);
}

const VALID_COLUMNS = new Set<KanbanColumnId>([
  "backlog",
  "previz",
  "keyframes",
  "rendering",
  "qa",
  "shipped"
]);

export function parseKanbanImport(raw: string): KanbanIssue[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const valid: KanbanIssue[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      if (
        typeof obj.id !== "string" ||
        !obj.title ||
        typeof obj.title !== "object" ||
        !obj.description ||
        typeof obj.description !== "object" ||
        typeof obj.status !== "string" ||
        !VALID_COLUMNS.has(obj.status as KanbanColumnId)
      ) {
        return null;
      }
      valid.push(obj as unknown as KanbanIssue);
    }
    return valid;
  } catch {
    return null;
  }
}
