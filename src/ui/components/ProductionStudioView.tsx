import { Button } from "@ui-sdk/react/button";
import { Progress, ProgressIndicator, ProgressTrack } from "@ui-sdk/react/progress";
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport
} from "@ui-sdk/react/scroll-area";
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs";
import { useCallback, useEffect, useRef, useState } from "react";
import { tl } from "../../game/i18n.js";
import {
  buildShotExportPackage,
  CAST_VISUAL_ASSETS,
  LOOK_DEV_SWATCHES,
  PROP_VISUAL_ASSETS,
  resolveAssetByTag,
  SET_VISUAL_ASSETS,
  STUDIO_STORYBOARD_SHOTS,
  type CameraBlocking3D,
  type PropAssetSpec,
  type StoryboardShot,
  type WhiteboxRenderMode
} from "../../game/production-board.js";
import { renderShotWhiteboxSnapshot } from "../../game/three-whitebox-renderer.js";
import type { Locale } from "../../game/types.js";
import { type CapturedShotFrame, ThreeBlockingStage } from "./ThreeBlockingStage.js";

export type StudioTab = "assets" | "blocking" | "storyboard";
type AssetCategoryFilter = "all" | "cast" | "prop" | "set";
type StoryboardPreviewMode = "clay" | "depth" | "ai" | "compare";

interface Props {
  lang: Locale;
  motionPaused: boolean;
  initialTab?: StudioTab;
  onBack: () => void;
  onPlayStoryNode?: (nodeId: string) => void;
}

interface BatchRenderState {
  running: boolean;
  completed: number;
  total: number;
  webglUnavailable: boolean;
}

interface SnapshotPair {
  clay: string | null;
  depth: string | null;
}

function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function renderPropGlyph(primitive: PropAssetSpec["primitive"], color: string) {
  switch (primitive) {
    case "cylinder":
      return (
        <svg viewBox="0 0 64 48" className="prop-wireframe-svg" aria-hidden="true">
          <ellipse cx="32" cy="12" rx="14" ry="5" fill="none" stroke={color} strokeWidth="2" />
          <path d="M18 12 v24 c0 2.8 6.3 5 14 5 s14 -2.2 14 -5 v-24" fill="none" stroke={color} strokeWidth="2" />
          <line x1="25" y1="18" x2="25" y2="38" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      );
    case "briefcase":
      return (
        <svg viewBox="0 0 64 48" className="prop-wireframe-svg" aria-hidden="true">
          <rect x="12" y="14" width="40" height="24" fill="none" stroke={color} strokeWidth="2" />
          <path d="M24 14 v-5 h16 v5" fill="none" stroke={color} strokeWidth="2" />
          <line x1="12" y1="24" x2="52" y2="24" stroke={color} strokeWidth="1.5" />
          <rect x="29" y="21" width="6" height="6" fill={color} />
        </svg>
      );
    case "tape":
      return (
        <svg viewBox="0 0 64 48" className="prop-wireframe-svg" aria-hidden="true">
          <rect x="10" y="12" width="44" height="26" fill="none" stroke={color} strokeWidth="2" />
          <circle cx="23" cy="25" r="6" fill="none" stroke={color} strokeWidth="1.8" />
          <circle cx="41" cy="25" r="6" fill="none" stroke={color} strokeWidth="1.8" />
          <line x1="23" y1="19" x2="41" y2="19" stroke={color} strokeWidth="1.2" strokeDasharray="3 2" />
        </svg>
      );
    case "ledger":
      return (
        <svg viewBox="0 0 64 48" className="prop-wireframe-svg" aria-hidden="true">
          <rect x="16" y="8" width="32" height="32" fill="none" stroke={color} strokeWidth="2" />
          <line x1="22" y1="8" x2="22" y2="40" stroke={color} strokeWidth="1.6" />
          <line x1="27" y1="16" x2="42" y2="16" stroke={color} strokeWidth="1.4" />
          <line x1="27" y1="22" x2="42" y2="22" stroke={color} strokeWidth="1.4" />
          <line x1="27" y1="28" x2="38" y2="28" stroke={color} strokeWidth="1.4" />
        </svg>
      );
    case "console":
      return (
        <svg viewBox="0 0 64 48" className="prop-wireframe-svg" aria-hidden="true">
          <polygon points="10,38 16,14 48,14 54,38" fill="none" stroke={color} strokeWidth="2" />
          <rect x="20" y="18" width="24" height="10" fill="none" stroke={color} strokeWidth="1.5" />
          <circle cx="22" cy="33" r="2" fill={color} />
          <circle cx="30" cy="33" r="2" fill={color} />
          <rect x="36" y="31" width="10" height="4" fill={color} />
        </svg>
      );
    case "box":
    default:
      return (
        <svg viewBox="0 0 64 48" className="prop-wireframe-svg" aria-hidden="true">
          <polygon points="32,8 50,16 50,34 32,42 14,34 14,16" fill="none" stroke={color} strokeWidth="2" />
          <polyline points="14,16 32,24 50,16" fill="none" stroke={color} strokeWidth="1.6" />
          <line x1="32" y1="24" x2="32" y2="42" stroke={color} strokeWidth="1.6" />
        </svg>
      );
  }
}

interface AssetTagBarProps {
  assetTag: string;
  promptAnchor: string;
  lang: Locale;
  copiedKey: string | null;
  onCopyTag: (tag: string) => void;
}

function AssetTagBar({ assetTag, promptAnchor, lang, copiedKey, onCopyTag }: AssetTagBarProps) {
  const isCopied = copiedKey === `tag:${assetTag}`;
  return (
    <div className="asset-tag-block">
      <div className="asset-tag-row">
        <span className="asset-tag-pill">{assetTag}</span>
        <Button
          type="button"
          className={`ctrl-btn asset-copy-btn ${isCopied ? "amber" : ""}`}
          onClick={() => onCopyTag(assetTag)}
        >
          {isCopied
            ? tl({ zh: "已复制 ✓", en: "Copied ✓", ja: "コピー済 ✓" }, lang)
            : tl({ zh: "📋 复制 @Tag", en: "📋 Copy @Tag", ja: "📋 @Tagをコピー" }, lang)}
        </Button>
      </div>
      <div className="asset-prompt-anchor" title={promptAnchor}>
        {promptAnchor}
      </div>
    </div>
  );
}

export function ProductionStudioView({
  lang,
  motionPaused,
  initialTab = "assets",
  onBack,
  onPlayStoryNode
}: Props) {
  const [tab, setTab] = useState<StudioTab>(initialTab);
  const [assetFilter, setAssetFilter] = useState<AssetCategoryFilter>("all");
  const [highlightedAssetTag, setHighlightedAssetTag] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [selectedShotId, setSelectedShotId] = useState<string>(
    STUDIO_STORYBOARD_SHOTS[3]?.id ?? STUDIO_STORYBOARD_SHOTS[0]!.id
  );
  const [cameraOverrides, setCameraOverrides] = useState<Record<string, CameraBlocking3D>>({});
  const [capturedFrames, setCapturedFrames] = useState<Record<string, CapturedShotFrame>>({});
  const [lastCapturedShotId, setLastCapturedShotId] = useState<string | null>(null);

  const [storyboardPreviewMode, setStoryboardPreviewMode] = useState<StoryboardPreviewMode>("clay");
  const [whiteboxSnapshots, setWhiteboxSnapshots] = useState<Record<string, SnapshotPair>>({});
  const [pendingScrollShotId, setPendingScrollShotId] = useState<string | null>(null);
  const [batchState, setBatchState] = useState<BatchRenderState>({
    running: false,
    completed: 0,
    total: STUDIO_STORYBOARD_SHOTS.length,
    webglUnavailable: false
  });

  const copyTimerRef = useRef<number | null>(null);
  const autoBatchTriggeredRef = useRef(false);
  const batchRunIdRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const cameraOverridesRef = useRef(cameraOverrides);
  cameraOverridesRef.current = cameraOverrides;
  const capturedFramesRef = useRef(capturedFrames);
  capturedFramesRef.current = capturedFrames;
  const whiteboxSnapshotsRef = useRef(whiteboxSnapshots);
  whiteboxSnapshotsRef.current = whiteboxSnapshots;

  const selectedShot =
    STUDIO_STORYBOARD_SHOTS.find((s) => s.id === selectedShotId) ?? STUDIO_STORYBOARD_SHOTS[0]!;

  useEffect(() => {
    return () => {
      batchRunIdRef.current += 1;
      if (rafRef.current !== null && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(rafRef.current);
      }
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const copyToClipboard = useCallback((text: string, key: string) => {
    try {
      void navigator.clipboard?.writeText?.(text)?.catch(() => {});
    } catch {
      // Ignore clipboard failures in restricted headless contexts
    }
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    setCopiedKey(key);
    copyTimerRef.current = window.setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  }, []);

  const handleCopyTag = useCallback(
    (tag: string) => {
      copyToClipboard(tag, `tag:${tag}`);
    },
    [copyToClipboard]
  );

  const handleJumpToAsset = useCallback((tag: string) => {
    setAssetFilter("all");
    setHighlightedAssetTag(tag);
    setTab("assets");
  }, []);

  useEffect(() => {
    if (tab !== "assets" || !highlightedAssetTag) return;
    const container = document.getElementById("production-studio-view");
    if (!container) return;
    const safeTag =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(highlightedAssetTag)
        : highlightedAssetTag.replace(/"/g, '\\"');
    const target = container.querySelector<HTMLElement>(`[data-asset-tag="${safeTag}"]`);
    target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, [tab, highlightedAssetTag]);

  useEffect(() => {
    if (tab !== "storyboard" || !pendingScrollShotId) return;
    const container = document.getElementById("production-studio-view");
    if (!container) return;
    const target = container.querySelector<HTMLElement>(
      `[data-storyboard-shot="${pendingScrollShotId}"]`
    );
    target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    setPendingScrollShotId(null);
  }, [tab, pendingScrollShotId]);

  const runBatchWhiteboxRender = useCallback((onlyMissing: boolean) => {
    batchRunIdRef.current += 1;
    const runId = batchRunIdRef.current;
    if (rafRef.current !== null && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const targets = onlyMissing
      ? STUDIO_STORYBOARD_SHOTS.filter(
          (shot) =>
            !capturedFramesRef.current[shot.id]?.clayDataUrl &&
            !whiteboxSnapshotsRef.current[shot.id]?.clay
        )
      : [...STUDIO_STORYBOARD_SHOTS];

    if (targets.length === 0) return;

    if (!isWebGLSupported()) {
      setBatchState({
        running: false,
        completed: 0,
        total: targets.length,
        webglUnavailable: true
      });
      return;
    }

    setBatchState({
      running: true,
      completed: 0,
      total: targets.length,
      webglUnavailable: false
    });

    let index = 0;
    const scheduleNext = (cb: () => void) => {
      if (typeof requestAnimationFrame === "function") {
        rafRef.current = requestAnimationFrame(cb);
      } else {
        window.setTimeout(cb, 0);
      }
    };

    const step = () => {
      if (batchRunIdRef.current !== runId) return;
      const shot = targets[index];
      if (!shot) {
        setBatchState((prev) => ({ ...prev, running: false }));
        return;
      }

      const camOverride = cameraOverridesRef.current[shot.id];
      const clay = renderShotWhiteboxSnapshot(shot, {
        renderMode: "clay",
        width: 640,
        height: 360,
        cameraOverride: camOverride
      });
      const depth = renderShotWhiteboxSnapshot(shot, {
        renderMode: "depth",
        width: 640,
        height: 360,
        cameraOverride: camOverride
      });

      if (clay === null && depth === null && index === 0) {
        setBatchState({
          running: false,
          completed: 0,
          total: targets.length,
          webglUnavailable: true
        });
        return;
      }

      setWhiteboxSnapshots((prev) => ({
        ...prev,
        [shot.id]: { clay, depth }
      }));

      index += 1;
      const done = index >= targets.length;
      setBatchState({
        running: !done,
        completed: index,
        total: targets.length,
        webglUnavailable: false
      });

      if (!done) {
        scheduleNext(step);
      }
    };

    scheduleNext(step);
  }, []);

  useEffect(() => {
    if (tab !== "storyboard" || autoBatchTriggeredRef.current) return;
    autoBatchTriggeredRef.current = true;
    runBatchWhiteboxRender(true);
  }, [tab, runBatchWhiteboxRender]);

  const handleChangeCameraOverride = useCallback((shotId: string, nextCam: CameraBlocking3D) => {
    setCameraOverrides((prev) => ({ ...prev, [shotId]: nextCam }));
  }, []);

  const handleCaptureToStoryboard = useCallback((shotId: string, frame: CapturedShotFrame) => {
    setCapturedFrames((prev) => ({ ...prev, [shotId]: frame }));
    setCameraOverrides((prev) => ({ ...prev, [shotId]: frame.cameraOverride }));
    setWhiteboxSnapshots((prev) => ({
      ...prev,
      [shotId]: {
        clay: frame.clayDataUrl ?? prev[shotId]?.clay ?? null,
        depth: frame.depthDataUrl ?? prev[shotId]?.depth ?? null
      }
    }));
    setLastCapturedShotId(shotId);
  }, []);

  const handleExportShotPng = useCallback(
    (shot: StoryboardShot) => {
      const renderMode: WhiteboxRenderMode = storyboardPreviewMode === "depth" ? "depth" : "clay";
      const captured = capturedFrames[shot.id];
      const batchPair = whiteboxSnapshots[shot.id];
      let dataUrl =
        renderMode === "depth"
          ? captured?.depthDataUrl ?? batchPair?.depth ?? null
          : captured?.clayDataUrl ?? batchPair?.clay ?? null;

      if (!dataUrl) {
        dataUrl = renderShotWhiteboxSnapshot(shot, {
          renderMode,
          width: 1280,
          height: 720,
          cameraOverride: cameraOverrides[shot.id]
        });
      }
      if (!dataUrl) return;

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${shot.shotCode.toLowerCase()}-${renderMode}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    [cameraOverrides, capturedFrames, storyboardPreviewMode, whiteboxSnapshots]
  );

  const handleCopyShotExportPackage = useCallback(
    (shot: StoryboardShot) => {
      const pkg = buildShotExportPackage(shot, lang, cameraOverrides[shot.id]);
      copyToClipboard(pkg.jsonString, `pkg:${shot.id}`);
    },
    [cameraOverrides, copyToClipboard, lang]
  );

  const totalAssetCount =
    CAST_VISUAL_ASSETS.length + PROP_VISUAL_ASSETS.length + SET_VISUAL_ASSETS.length;

  const showCast = assetFilter === "all" || assetFilter === "cast";
  const showProps = assetFilter === "all" || assetFilter === "prop";
  const showSets = assetFilter === "all" || assetFilter === "set";

  const batchProgressPct =
    batchState.total > 0 ? Math.round((batchState.completed / batchState.total) * 100) : 0;

  return (
    <section className="panel modal-stage studio-shell" id="production-studio-view">
      <div className="studio-header">
        <div>
          <div className="section-kicker">
            {tl(
              {
                zh: "HOLLYWOOD 制片美术与分镜设计台 // 公共造型 → 3D 白模片场 → 分镜工作台",
                en: "PRODUCTION DESIGN BIBLE // SHARED ASSETS → 3D WHITE-BOX STAGE → STORYBOARD",
                ja: "制作デザインボード // 共通アセット → 3Dホワイトボックス → 絵コンテ"
              },
              lang
            )}
          </div>
          <h2 className="studio-title">
            {tl(
              {
                zh: "公共造型资产库 · Three.js 3D 白模片场 · 25 镜分镜头工作台",
                en: "Shared Asset Library · Three.js 3D White-Box Stage · 25-Shot Storyboard",
                ja: "共通造型アセット庫・Three.js 3D舞台・25カット絵コンテ"
              },
              lang
            )}
          </h2>
        </div>

        <Button type="button" id="btn-studio-back" className="ctrl-btn amber" onClick={onBack}>
          {tl({ zh: "← 返回游戏", en: "← Back to Game", ja: "← ゲームへ戻る" }, lang)}
        </Button>
      </div>

      <Tabs
        className="studio-tabs-root"
        value={tab}
        onValueChange={(next) => {
          if (next) setTab(next as StudioTab);
        }}
      >
        <TabsList className="tab-strip studio-tab-strip" aria-label="Production Studio Pipeline">
          <TabsTab
            value="assets"
            id="tab-studio-assets"
            className={`tab-btn ${tab === "assets" ? "active" : ""}`}
          >
            {tl(
              {
                zh: "01 公共造型库 (资产)",
                en: "01 ASSET LIBRARY",
                ja: "01 共通アセット庫"
              },
              lang
            )}
          </TabsTab>
          <TabsTab
            value="blocking"
            id="tab-studio-blocking"
            className={`tab-btn ${tab === "blocking" ? "active" : ""}`}
          >
            {tl(
              {
                zh: "02 Three.js 3D 白模片场",
                en: "02 3D WHITE-BOX STAGE",
                ja: "02 3Dホワイトボックス"
              },
              lang
            )}
          </TabsTab>
          <TabsTab
            value="storyboard"
            id="tab-studio-storyboard"
            className={`tab-btn ${tab === "storyboard" ? "active" : ""}`}
          >
            {tl(
              {
                zh: `03 分镜头工作台 (${STUDIO_STORYBOARD_SHOTS.length})`,
                en: `03 STORYBOARD (${STUDIO_STORYBOARD_SHOTS.length})`,
                ja: `03 絵コンテ (${STUDIO_STORYBOARD_SHOTS.length})`
              },
              lang
            )}
          </TabsTab>
          <TabsIndicator className="tab-indicator" />
        </TabsList>

        {/* STAGE 01: SHARED ASSET LIBRARY */}
        <TabsPanel value="assets" className="studio-tab-panel">
          <ScrollArea className="studio-scroll-area" type="auto">
            <ScrollAreaViewport>
              <ScrollAreaContent className="studio-scroll-body">
                {/* Look-Dev Color Palette & 35mm Cinema Standard */}
                <div className="dossier-section studio-lookdev-bar">
                  <div className="section-kicker">
                    {tl(
                      {
                        zh: "统一电影质感规范 // 35MM ANAMORPHIC · -46°C 极夜色调与哑光肤质",
                        en: "LOOK-DEV BIBLE // 35MM ANAMORPHIC · POLAR CYAN & SODIUM AMBER",
                        ja: "ルックデブ基準 // 35mmアナモルフィック・マット質感"
                      },
                      lang
                    )}
                  </div>
                  <div className="studio-swatch-grid">
                    {LOOK_DEV_SWATCHES.map((sw) => (
                      <div key={sw.id} className="studio-swatch-card">
                        <span
                          className="studio-swatch-chip"
                          style={{ backgroundColor: sw.hex }}
                          aria-hidden="true"
                        />
                        <div>
                          <div className="studio-swatch-title">
                            {tl(sw.label, lang)} <code>{sw.hex}</code>
                          </div>
                          <div className="studio-swatch-desc">{tl(sw.usage, lang)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Asset Category Sub-Filter Pills */}
                <div className="studio-asset-toolbar">
                  <div className="studio-filter-pills" role="group" aria-label="Asset Category Filter">
                    <Button
                      type="button"
                      className={`ctrl-btn ${assetFilter === "all" ? "amber" : ""}`}
                      onClick={() => setAssetFilter("all")}
                    >
                      {tl(
                        {
                          zh: `全部资产 (${totalAssetCount})`,
                          en: `All Assets (${totalAssetCount})`,
                          ja: `全アセット (${totalAssetCount})`
                        },
                        lang
                      )}
                    </Button>
                    <Button
                      type="button"
                      className={`ctrl-btn ${assetFilter === "cast" ? "amber" : ""}`}
                      onClick={() => setAssetFilter("cast")}
                    >
                      {tl(
                        {
                          zh: `角色定妆 (${CAST_VISUAL_ASSETS.length})`,
                          en: `Cast (${CAST_VISUAL_ASSETS.length})`,
                          ja: `キャラクター (${CAST_VISUAL_ASSETS.length})`
                        },
                        lang
                      )}
                    </Button>
                    <Button
                      type="button"
                      className={`ctrl-btn ${assetFilter === "prop" ? "amber" : ""}`}
                      onClick={() => setAssetFilter("prop")}
                    >
                      {tl(
                        {
                          zh: `关键道具 (${PROP_VISUAL_ASSETS.length})`,
                          en: `Props (${PROP_VISUAL_ASSETS.length})`,
                          ja: `プロップ (${PROP_VISUAL_ASSETS.length})`
                        },
                        lang
                      )}
                    </Button>
                    <Button
                      type="button"
                      className={`ctrl-btn ${assetFilter === "set" ? "amber" : ""}`}
                      onClick={() => setAssetFilter("set")}
                    >
                      {tl(
                        {
                          zh: `标准场景 (${SET_VISUAL_ASSETS.length})`,
                          en: `Sets (${SET_VISUAL_ASSETS.length})`,
                          ja: `標準セット (${SET_VISUAL_ASSETS.length})`
                        },
                        lang
                      )}
                    </Button>
                  </div>

                  {highlightedAssetTag ? (
                    <div className="studio-highlight-banner">
                      <span>
                        {tl(
                          {
                            zh: `已定位关联资产：${highlightedAssetTag}`,
                            en: `Focused linked asset: ${highlightedAssetTag}`,
                            ja: `関連アセットを表示中：${highlightedAssetTag}`
                          },
                          lang
                        )}
                      </span>
                      <Button
                        type="button"
                        className="ctrl-btn"
                        onClick={() => setHighlightedAssetTag(null)}
                      >
                        {tl({ zh: "清除高亮", en: "Clear", ja: "解除" }, lang)}
                      </Button>
                    </div>
                  ) : null}
                </div>

                {/* Section A: Cast Visual & Voice Reference Board (9) */}
                {showCast ? (
                  <div className="studio-asset-section">
                    <div className="section-kicker studio-section-heading">
                      {tl(
                        {
                          zh: `01A // 角色定妆与声纹母本 (${CAST_VISUAL_ASSETS.length})`,
                          en: `01A // CANONICAL CAST & VOICE SEEDS (${CAST_VISUAL_ASSETS.length})`,
                          ja: `01A // キャラクター造型・声紋 (${CAST_VISUAL_ASSETS.length})`
                        },
                        lang
                      )}
                    </div>
                    <div className="asset-board-grid">
                      {CAST_VISUAL_ASSETS.map((cast) => {
                        const isHighlighted = highlightedAssetTag === cast.assetTag;
                        return (
                          <article
                            key={cast.id}
                            data-cast-asset={cast.id}
                            data-asset-tag={cast.assetTag}
                            className={`dossier-section asset-cast-card ${
                              isHighlighted ? "is-highlighted" : ""
                            }`}
                            style={{ borderLeftColor: cast.colorTag }}
                          >
                            <div className="asset-cast-top">
                              <div className="asset-cast-primary-img">
                                <img
                                  src={cast.portraitSrc}
                                  alt={tl(cast.name, lang)}
                                  decoding="sync"
                                />
                                <span className="story-node-code">{cast.code}</span>
                              </div>
                              {cast.flinchSrc || cast.leanInSrc ? (
                                <div className="asset-cast-reactions">
                                  {cast.flinchSrc ? (
                                    <img
                                      src={cast.flinchSrc}
                                      alt=""
                                      decoding="sync"
                                      title="Flinch Reference"
                                    />
                                  ) : null}
                                  {cast.leanInSrc ? (
                                    <img
                                      src={cast.leanInSrc}
                                      alt=""
                                      decoding="sync"
                                      title="Lean-In Reference"
                                    />
                                  ) : null}
                                </div>
                              ) : null}
                            </div>

                            <div className="asset-cast-meta">
                              <div className="asset-cast-name">{tl(cast.name, lang)}</div>
                              <div className="asset-cast-role">
                                {tl(cast.role, lang)} ·{" "}
                                <span className="asset-lens-tag">{cast.recommendedLens}</span>
                              </div>
                              <div className="asset-spec-line">
                                <strong>
                                  {tl({ zh: "服化：", en: "Wardrobe: ", ja: "衣装：" }, lang)}
                                </strong>
                                {tl(cast.wardrobe, lang)}
                              </div>
                              <div className="asset-spec-line">
                                <strong>
                                  {tl({ zh: "布光：", en: "Lighting: ", ja: "照明：" }, lang)}
                                </strong>
                                {tl(cast.lightingKey, lang)}
                              </div>

                              <AssetTagBar
                                assetTag={cast.assetTag}
                                promptAnchor={cast.promptAnchor}
                                lang={lang}
                                copiedKey={copiedKey}
                                onCopyTag={handleCopyTag}
                              />

                              <div className="asset-voice-row">
                                <span className="asset-voice-label">
                                  {tl(
                                    {
                                      zh: "原声声纹母本：",
                                      en: "Voice Seed:",
                                      ja: "声紋サンプル："
                                    },
                                    lang
                                  )}
                                </span>
                                <audio
                                  className="asset-audio-player"
                                  controls
                                  preload="none"
                                  src={cast.voiceSeedSrc}
                                />
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Section B: Key Props (6) */}
                {showProps ? (
                  <div className="studio-asset-section">
                    <div className="section-kicker studio-section-heading">
                      {tl(
                        {
                          zh: `01B // 关键物理道具白模资产 (${PROP_VISUAL_ASSETS.length})`,
                          en: `01B // KEY PROPS & 3D PRIMITIVE ANCHORS (${PROP_VISUAL_ASSETS.length})`,
                          ja: `01B // 重要プロップ資産 (${PROP_VISUAL_ASSETS.length})`
                        },
                        lang
                      )}
                    </div>
                    <div className="asset-prop-grid">
                      {PROP_VISUAL_ASSETS.map((prop) => {
                        const isHighlighted = highlightedAssetTag === prop.assetTag;
                        return (
                          <article
                            key={prop.id}
                            data-prop-asset={prop.id}
                            data-asset-tag={prop.assetTag}
                            className={`dossier-section asset-prop-card ${
                              isHighlighted ? "is-highlighted" : ""
                            }`}
                            style={{ borderLeftColor: prop.colorTag }}
                          >
                            <div className="asset-prop-head">
                              <div className="asset-prop-blueprint">
                                {renderPropGlyph(prop.primitive, prop.colorTag)}
                                <span className="story-node-code">{prop.code}</span>
                              </div>
                              <div className="asset-prop-title-wrap">
                                <div className="asset-cast-name">{tl(prop.name, lang)}</div>
                                <div className="asset-cast-role">
                                  {tl(prop.category, lang)} ·{" "}
                                  <span className="asset-lens-tag">
                                    3D:{prop.primitive.toUpperCase()}
                                  </span>
                                </div>
                                <p className="asset-spec-line">{tl(prop.description, lang)}</p>
                              </div>
                            </div>

                            <AssetTagBar
                              assetTag={prop.assetTag}
                              promptAnchor={prop.promptAnchor}
                              lang={lang}
                              copiedKey={copiedKey}
                              onCopyTag={handleCopyTag}
                            />
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Section C: Standard Sets (4) */}
                {showSets ? (
                  <div className="studio-asset-section">
                    <div className="section-kicker studio-section-heading">
                      {tl(
                        {
                          zh: `01C // 零号站区标准物理场景 (${SET_VISUAL_ASSETS.length})`,
                          en: `01C // OUTPOST 0 STANDARD SETS & LIGHTING RECIPES (${SET_VISUAL_ASSETS.length})`,
                          ja: `01C // 標準物理セット (${SET_VISUAL_ASSETS.length})`
                        },
                        lang
                      )}
                    </div>
                    <div className="asset-set-grid">
                      {SET_VISUAL_ASSETS.map((setSpec) => {
                        const isHighlighted = highlightedAssetTag === setSpec.assetTag;
                        return (
                          <article
                            key={setSpec.id}
                            data-set-asset={setSpec.id}
                            data-asset-tag={setSpec.assetTag}
                            className={`dossier-section asset-set-card ${
                              isHighlighted ? "is-highlighted" : ""
                            }`}
                            style={{ borderLeftColor: setSpec.colorTag }}
                          >
                            <div className="asset-set-preview">
                              <img
                                src={setSpec.previewSrc}
                                alt={tl(setSpec.name, lang)}
                                decoding="sync"
                              />
                              <span className="story-node-code">{setSpec.code}</span>
                              <span className="asset-zone-badge">
                                {setSpec.zone.toUpperCase()}
                              </span>
                            </div>

                            <div className="asset-cast-meta">
                              <div className="asset-cast-name">{tl(setSpec.name, lang)}</div>
                              <div className="asset-spec-line">{tl(setSpec.description, lang)}</div>
                              <div className="asset-spec-line">
                                <strong>
                                  {tl(
                                    { zh: "布光配方：", en: "Lighting: ", ja: "照明設計：" },
                                    lang
                                  )}
                                </strong>
                                {tl(setSpec.lightingRecipe, lang)}
                              </div>

                              <AssetTagBar
                                assetTag={setSpec.assetTag}
                                promptAnchor={setSpec.promptAnchor}
                                lang={lang}
                                copiedKey={copiedKey}
                                onCopyTag={handleCopyTag}
                              />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </ScrollAreaContent>
            </ScrollAreaViewport>
            <ScrollAreaScrollbar orientation="vertical" className="gta-dossier-scrollbar">
              <ScrollAreaThumb className="gta-dossier-thumb" />
            </ScrollAreaScrollbar>
          </ScrollArea>
        </TabsPanel>

        {/* STAGE 02: THREE.JS 3D WHITE-BOX BLOCKING STAGE */}
        <TabsPanel value="blocking" className="studio-tab-panel">
          <div className="blocking-workspace">
            <aside className="blocking-shot-list" aria-label="3D Blocking Shot Selector">
              <div className="section-kicker" style={{ marginBottom: "2px" }}>
                {tl(
                  {
                    zh: "选择分镜调校机位与 3D 白模",
                    en: "SELECT SHOT // 3D WHITE-BOX SET",
                    ja: "ショット選択 // 3D白模ステージ"
                  },
                  lang
                )}
              </div>
              <ScrollArea className="blocking-list-scroll" type="auto">
                <ScrollAreaViewport>
                  <ScrollAreaContent>
                    <div className="blocking-btn-stack" id="btn-blocking-shot">
                      {STUDIO_STORYBOARD_SHOTS.map((s) => {
                        const hasCaptured = Boolean(capturedFrames[s.id]);
                        const hasOverride = Boolean(cameraOverrides[s.id]);
                        const activeCam = cameraOverrides[s.id] ?? s.blocking.camera;
                        return (
                          <Button
                            key={s.id}
                            type="button"
                            data-blocking-shot={s.id}
                            className={`option-card blocking-shot-btn ${
                              s.id === selectedShot.id ? "selected" : ""
                            }`}
                            onClick={() => setSelectedShotId(s.id)}
                          >
                            <span className="opt-index">{s.shotCode}</span>
                            <span className="blocking-btn-copy">
                              <span className="blocking-btn-title">{tl(s.title, lang)}</span>
                              <span className="blocking-btn-sub">
                                {activeCam.lensLabel} · {s.hasNativeAudio ? "LIP-SYNC" : `${s.frames}f`}
                                {hasCaptured ? " · ✓已拍" : hasOverride ? " · ✎机位" : ""}
                              </span>
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </ScrollAreaContent>
                </ScrollAreaViewport>
              </ScrollArea>

              {/* Actor coordinates ledger for selected shot */}
              <div className="dossier-section blocking-actors-card">
                <div className="section-kicker">
                  {tl(
                    { zh: "人物站位与朝向坐标", en: "ACTOR BLOCKING", ja: "人物配置座標" },
                    lang
                  )}
                </div>
                {selectedShot.blocking.actors.map((a) => (
                  <div key={a.id} className="blocking-actor-row">
                    <span className="blocking-actor-dot" style={{ backgroundColor: a.color }} />
                    <span className="blocking-actor-name">{a.label}</span>
                    <span className="blocking-actor-coords">
                      ({a.pos[0].toFixed(1)}, {a.pos[2].toFixed(1)})
                    </span>
                  </div>
                ))}

                {/* Bound @prop 3D placement + @asset tags */}
                {selectedShot.blocking.props && selectedShot.blocking.props.length > 0 ? (
                  <div className="blocking-props-section">
                    <div className="section-kicker" style={{ marginTop: "8px" }}>
                      {tl(
                        { zh: "绑定道具白模坐标", en: "BOUND @PROP BLOCKING", ja: "道具配置座標" },
                        lang
                      )}
                    </div>
                    {selectedShot.blocking.props.map((p) => (
                      <div key={p.id} className="blocking-actor-row">
                        <span
                          className="blocking-actor-dot prop-square"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="blocking-actor-name">
                          {p.label} <code className="blocking-prop-tag">{p.assetTag}</code>
                        </span>
                        <span className="blocking-actor-coords">
                          ({p.pos[0].toFixed(1)}, {p.pos[2].toFixed(1)})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {selectedShot.boundAssetTags.length > 0 ? (
                  <div className="blocking-bound-tags">
                    {selectedShot.boundAssetTags.map((tag) => {
                      const resolved = resolveAssetByTag(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          className="bound-asset-chip"
                          title={resolved ? tl(resolved.name, lang) : tag}
                          onClick={() => handleJumpToAsset(tag)}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </aside>

            <div className="blocking-stage-column">
              {capturedFrames[selectedShot.id] || lastCapturedShotId === selectedShot.id ? (
                <div className="blocking-captured-banner">
                  <span>
                    {tl(
                      {
                        zh: `✓ 镜头 ${selectedShot.shotCode} 的 3D 白模与深度图已写入分镜工作台`,
                        en: `✓ ${selectedShot.shotCode} 3D White-Box & Depth captured to Storyboard`,
                        ja: `✓ ${selectedShot.shotCode} の3D白模と深度図を絵コンテに記録しました`
                      },
                      lang
                    )}
                  </span>
                  <Button
                    type="button"
                    className="ctrl-btn amber"
                    onClick={() => {
                      setPendingScrollShotId(selectedShot.id);
                      setTab("storyboard");
                    }}
                  >
                    {tl(
                      {
                        zh: "已写入分镜 · 去查看 →",
                        en: "Saved to Storyboard · View →",
                        ja: "絵コンテへ移動 →"
                      },
                      lang
                    )}
                  </Button>
                </div>
              ) : null}

              <ThreeBlockingStage
                shot={selectedShot}
                lang={lang}
                motionPaused={motionPaused}
                cameraOverride={cameraOverrides[selectedShot.id]}
                onChangeCameraOverride={handleChangeCameraOverride}
                onCaptureToStoryboard={handleCaptureToStoryboard}
              />
            </div>
          </div>
        </TabsPanel>

        {/* STAGE 03: 3D-DRIVEN STORYBOARD WORKBENCH (25 SHOTS) */}
        <TabsPanel value="storyboard" className="studio-tab-panel">
          <div className="storyboard-toolbar">
            <div className="storyboard-toolbar-left">
              <Button
                type="button"
                id="btn-batch-render-whitebox"
                className="ctrl-btn amber"
                disabled={batchState.running}
                onClick={() => runBatchWhiteboxRender(false)}
              >
                {batchState.running
                  ? tl(
                      {
                        zh: `正在渲染 3D 白模 (${batchState.completed}/${batchState.total})...`,
                        en: `Rendering 3D White-Box (${batchState.completed}/${batchState.total})...`,
                        ja: `3D白模レンダリング中 (${batchState.completed}/${batchState.total})...`
                      },
                      lang
                    )
                  : tl(
                      {
                        zh: "🎬 从 3D 白模批量生成全部 25 镜分镜图",
                        en: "🎬 Batch Render All 25 3D White-Box Shots",
                        ja: "🎬 3D白模から全25カットを一括生成"
                      },
                      lang
                    )}
              </Button>

              {batchState.running ? (
                <Progress
                  value={batchProgressPct}
                  aria-label="3D White-Box Batch Render Progress"
                  className="studio-batch-progress"
                >
                  <ProgressTrack>
                    <ProgressIndicator />
                  </ProgressTrack>
                </Progress>
              ) : null}

              {batchState.webglUnavailable ? (
                <span className="storyboard-webgl-note">
                  {tl(
                    {
                      zh: "离线/无 WebGL 环境：已回退至分镜参考帧",
                      en: "Headless/No-WebGL fallback: showing poster frames",
                      ja: "WebGL非対応環境：静止画ポスターを表示中"
                    },
                    lang
                  )}
                </span>
              ) : null}
            </div>

            <div
              className="storyboard-mode-switch"
              role="group"
              aria-label="Storyboard Global Preview Mode"
            >
              <Button
                type="button"
                className={`ctrl-btn ${storyboardPreviewMode === "clay" ? "amber" : ""}`}
                aria-pressed={storyboardPreviewMode === "clay"}
                onClick={() => setStoryboardPreviewMode("clay")}
              >
                {tl({ zh: "3D 白模分镜", en: "3D White-Box", ja: "3D白模" }, lang)}
              </Button>
              <Button
                type="button"
                className={`ctrl-btn ${storyboardPreviewMode === "depth" ? "amber" : ""}`}
                aria-pressed={storyboardPreviewMode === "depth"}
                onClick={() => setStoryboardPreviewMode("depth")}
              >
                {tl({ zh: "深度图", en: "Depth Pass", ja: "深度マップ" }, lang)}
              </Button>
              <Button
                type="button"
                className={`ctrl-btn ${storyboardPreviewMode === "ai" ? "amber" : ""}`}
                aria-pressed={storyboardPreviewMode === "ai"}
                onClick={() => setStoryboardPreviewMode("ai")}
              >
                {tl({ zh: "AI 实拍成片", en: "AI Render", ja: "AI映像" }, lang)}
              </Button>
              <Button
                type="button"
                className={`ctrl-btn ${storyboardPreviewMode === "compare" ? "amber" : ""}`}
                aria-pressed={storyboardPreviewMode === "compare"}
                onClick={() => setStoryboardPreviewMode("compare")}
              >
                {tl(
                  { zh: "双画对照 (3D ↔ 成片)", en: "Split Compare (3D ↔ AI)", ja: "比較 (3D ↔ AI)" },
                  lang
                )}
              </Button>
            </div>
          </div>

          <ScrollArea className="studio-scroll-area" type="auto">
            <ScrollAreaViewport>
              <ScrollAreaContent className="studio-scroll-body">
                <div className="storyboard-grid">
                  {STUDIO_STORYBOARD_SHOTS.map((shot) => {
                    const effectiveCam = cameraOverrides[shot.id] ?? shot.blocking.camera;
                    const captured = capturedFrames[shot.id];
                    const batchPair = whiteboxSnapshots[shot.id];
                    const clayUrl = captured?.clayDataUrl ?? batchPair?.clay ?? null;
                    const depthUrl = captured?.depthDataUrl ?? batchPair?.depth ?? null;
                    const hasCustomCam = Boolean(cameraOverrides[shot.id]);
                    const isExportCopied = copiedKey === `pkg:${shot.id}`;

                    const activeBadgeText =
                      storyboardPreviewMode === "clay"
                        ? "3D WHITEBOX POV"
                        : storyboardPreviewMode === "depth"
                          ? "DEPTH PASS"
                          : storyboardPreviewMode === "ai"
                            ? "AI RENDER"
                            : "3D ↔ AI";

                    return (
                      <article
                        key={shot.id}
                        data-storyboard-shot={shot.id}
                        className={`dossier-section storyboard-card ${
                          shot.hasNativeAudio ? "has-lipsync" : ""
                        }`}
                      >
                        <div className="storyboard-media">
                          {storyboardPreviewMode === "clay" ? (
                            <img
                              className="storyboard-still-img"
                              src={clayUrl ?? shot.posterSrc}
                              alt={tl(shot.title, lang)}
                              decoding="sync"
                            />
                          ) : storyboardPreviewMode === "depth" ? (
                            <img
                              className={`storyboard-still-img ${
                                depthUrl ? "" : "depth-fallback-filter"
                              }`}
                              src={depthUrl ?? shot.posterSrc}
                              alt={`${tl(shot.title, lang)} (Depth)`}
                              decoding="sync"
                            />
                          ) : storyboardPreviewMode === "ai" ? (
                            <video
                              controls
                              playsInline
                              preload="metadata"
                              poster={shot.posterSrc}
                              src={shot.videoSrc}
                              onError={(e) => {
                                const vid = e.currentTarget;
                                if (!vid.dataset.fb && shot.fallbackVideoSrc !== shot.videoSrc) {
                                  vid.dataset.fb = "1";
                                  vid.src = shot.fallbackVideoSrc;
                                }
                              }}
                            />
                          ) : (
                            <div className="storyboard-compare-split">
                              <div className="storyboard-compare-pane">
                                <img
                                  className="storyboard-still-img"
                                  src={clayUrl ?? shot.posterSrc}
                                  alt={`${tl(shot.title, lang)} (3D)`}
                                  decoding="sync"
                                />
                                <span className="compare-pane-tag">3D WHITEBOX</span>
                              </div>
                              <div className="storyboard-compare-pane">
                                <video
                                  controls
                                  playsInline
                                  preload="metadata"
                                  poster={shot.posterSrc}
                                  src={shot.videoSrc}
                                  onError={(e) => {
                                    const vid = e.currentTarget;
                                    if (!vid.dataset.fb && shot.fallbackVideoSrc !== shot.videoSrc) {
                                      vid.dataset.fb = "1";
                                      vid.src = shot.fallbackVideoSrc;
                                    }
                                  }}
                                />
                                <span className="compare-pane-tag ai">AI RENDER</span>
                              </div>
                            </div>
                          )}

                          <span className="story-node-code">{shot.shotCode}</span>
                          <span
                            className={`storyboard-render-badge mode-${storyboardPreviewMode} ${
                              (storyboardPreviewMode === "clay" && clayUrl) ||
                              (storyboardPreviewMode === "depth" && depthUrl)
                                ? "is-live"
                                : ""
                            }`}
                          >
                            {activeBadgeText}
                          </span>
                          {hasCustomCam ? (
                            <span className="storyboard-custom-cam-pill">CUSTOM CAM</span>
                          ) : null}
                          {shot.hasNativeAudio ? (
                            <span className="storyboard-audio-badge live">
                              {tl(
                                { zh: "口型对白原声", en: "LIP-SYNC", ja: "口型音声" },
                                lang
                              )}
                            </span>
                          ) : null}
                        </div>

                        <div className="storyboard-info">
                          <div className="storyboard-kicker">
                            {tl(shot.chapter, lang)} · {shot.framing} · {effectiveCam.lensLabel} · FOV{" "}
                            {effectiveCam.fov}° · {shot.motionPreset} · {shot.durationSec.toFixed(2)}
                            s ({shot.frames}f)
                          </div>
                          <h3 className="storyboard-shot-title">{tl(shot.title, lang)}</h3>
                          <p className="storyboard-move">{tl(shot.cameraMove, lang)}</p>

                          {shot.boundAssetTags.length > 0 ? (
                            <div className="storyboard-bound-assets">
                              {shot.boundAssetTags.map((tag) => {
                                const resolved = resolveAssetByTag(tag);
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    className="bound-asset-chip"
                                    title={resolved ? tl(resolved.name, lang) : tag}
                                    onClick={() => handleJumpToAsset(tag)}
                                  >
                                    {tag}
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}

                          {shot.lipSyncLine ? (
                            <div className="storyboard-lipsync-box">
                              <span className="lipsync-speaker">
                                {shot.speakerName ? tl(shot.speakerName, lang) : ""}：
                              </span>
                              <span>{tl(shot.lipSyncLine, lang)}</span>
                            </div>
                          ) : null}

                          <div className="storyboard-actions">
                            <Button
                              type="button"
                              className="ctrl-btn"
                              onClick={() => handleExportShotPng(shot)}
                            >
                              {tl(
                                {
                                  zh: "⬇️ 导出白模 PNG",
                                  en: "⬇️ Export White-Box PNG",
                                  ja: "⬇️ 白模PNG保存"
                                },
                                lang
                              )}
                            </Button>
                            <Button
                              type="button"
                              className={`ctrl-btn ${isExportCopied ? "amber" : ""}`}
                              onClick={() => handleCopyShotExportPackage(shot)}
                            >
                              {isExportCopied
                                ? tl(
                                    { zh: "已复制生片包 ✓", en: "Package Copied ✓", ja: "コピー済 ✓" },
                                    lang
                                  )
                                : tl(
                                    { zh: "📋 复制生片包", en: "📋 Copy Prompt Pack", ja: "📋 指示書コピー" },
                                    lang
                                  )}
                            </Button>
                            <Button
                              type="button"
                              className="ctrl-btn amber"
                              onClick={() => {
                                setSelectedShotId(shot.id);
                                setTab("blocking");
                              }}
                            >
                              {tl(
                                {
                                  zh: "🎯 在 3D 白模中调机位",
                                  en: "🎯 Tune in 3D Stage",
                                  ja: "🎯 3D舞台で調整"
                                },
                                lang
                              )}
                            </Button>
                            {onPlayStoryNode ? (
                              <Button
                                type="button"
                                className="ctrl-btn"
                                onClick={() => onPlayStoryNode(shot.storyNodeId)}
                              >
                                {tl(
                                  {
                                    zh: "▶ 在剧情中播放",
                                    en: "▶ Play in Game",
                                    ja: "▶ 本編で再生"
                                  },
                                  lang
                                )}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </ScrollAreaContent>
            </ScrollAreaViewport>
            <ScrollAreaScrollbar orientation="vertical" className="gta-dossier-scrollbar">
              <ScrollAreaThumb className="gta-dossier-thumb" />
            </ScrollAreaScrollbar>
          </ScrollArea>
        </TabsPanel>
      </Tabs>
    </section>
  );
}
