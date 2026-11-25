import { Button } from "@ui-sdk/react/button";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@ui-sdk/react/dialog";
import { Input, InputClear, InputGroup } from "@ui-sdk/react/input";
import { Label } from "@ui-sdk/react/label";
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport
} from "@ui-sdk/react/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectTrigger,
  SelectValue
} from "@ui-sdk/react/select";
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs";
import { Toggle } from "@ui-sdk/react/toggle";
import { useEffect, useRef, useState } from "react";
import { tl } from "../../game/i18n.js";
import { getStoryCompletionStats } from "../../game/story-graph.js";
import {
  exportShiftSaveJson,
  importShiftSaveJson,
  type CompendiumState,
  type SavedShiftState
} from "../../game/storage.js";
import type { Locale } from "../../game/types.js";
import { generateRunSeed, type CampaignMode } from "../../game/visitors/index.js";
import {
  ArchiveIcon,
  CheckIcon,
  ChevronDownIcon,
  ClearIcon,
  ClipboardDataIcon,
  FlameFuelIcon,
  MotionPauseIcon,
  MotionPlayIcon,
  SnowHazardIcon,
  StoryBranchIcon
} from "./Icons.js";
import { WebGLAtmosphere, useVfxShader } from "./WebGLAtmosphere.js";

interface Props {
  lang: Locale;
  onChangeLang: (lang: Locale) => void;
  operatorName: string;
  onChangeOperatorName: (name: string) => void;
  campaignMode: CampaignMode;
  onChangeCampaignMode: (mode: CampaignMode) => void;
  campaignModeItems: Array<{ value: CampaignMode; label: string }>;
  seedDraft: string;
  onChangeSeedDraft: (seed: string) => void;
  savedShift: SavedShiftState | null;
  compendium: CompendiumState;
  ambience: boolean;
  onToggleAmbience: (next: boolean) => void;
  motionPaused: boolean;
  onToggleMotionPaused: (next: boolean) => void;
  onStartNewShift: () => void;
  onStartChallengeMode: () => void;
  onContinueShift: (save: SavedShiftState) => void;
  onClearSavedShift: () => void;
  onOpenArchive: () => void;
  onOpenStoryMap: () => void;
  onOpenStudio: () => void;
}

type ManualTab = "briefing" | "ordamor" | "cardiac" | "night5";

export function LobbyScreen({
  lang,
  onChangeLang,
  operatorName,
  onChangeOperatorName,
  campaignMode,
  onChangeCampaignMode,
  campaignModeItems,
  seedDraft,
  onChangeSeedDraft,
  savedShift,
  compendium,
  ambience,
  onToggleAmbience,
  motionPaused,
  onToggleMotionPaused,
  onStartNewShift,
  onStartChallengeMode,
  onContinueShift,
  onClearSavedShift,
  onOpenArchive,
  onOpenStoryMap,
  onOpenStudio
}: Props) {
  const storyStats = getStoryCompletionStats(["prologue_01", ...(compendium.unlockedStoryNodes ?? [])]);
  const [videoReady, setVideoReady] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [docsTab, setDocsTab] = useState<ManualTab>("briefing");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const vfxTitleRef = useVfxShader<HTMLHeadingElement>("chromatic", !motionPaused);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      if (motionPaused) {
        vid.pause();
      } else if (vid.paused) {
        void vid.play?.().catch?.(() => {});
      }
    } catch {
      // ignore headless DOM
    }
  }, [motionPaused, videoReady]);

  useEffect(() => {
    if (motionPaused || typeof window === "undefined") return;
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      const ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
      setParallax({ x: -nx * 10, y: -ny * 6 });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [motionPaused]);

  const langItems: Array<{ value: Locale; label: string }> = [
    { value: "zh", label: "简体中文" },
    { value: "en", label: "English" },
    { value: "ja", label: "日本語" }
  ];

  const displayCallsign = operatorName.trim() || "OP-09";

  const handleExportSave = () => {
    if (!savedShift) return;
    const json = exportShiftSaveJson(savedShift);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gate0-shift-${(savedShift.operatorName || "op09").replace(/[^a-zA-Z0-9_-]/g, "")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setImportStatus(
      tl(
        {
          zh: "✓ 已导出 JSON 班次档案。",
          en: "✓ Exported shift dossier JSON.",
          ja: "✓ シフト記録 JSON を書き出しました。"
        },
        lang
      )
    );
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const loaded = importShiftSaveJson(text);
      if (!loaded) {
        setImportStatus(
          tl(
            {
              zh: "✗ 无效的 ORD-OS 存档文件格式。",
              en: "✗ Invalid ORD-OS save file format.",
              ja: "✗ 無効な ORD-OS セーブ形式です。"
            },
            lang
          )
        );
        return;
      }
      setImportStatus(null);
      setLoadOpen(false);
      onContinueShift(loaded);
    } catch {
      setImportStatus(
        tl(
          {
            zh: "✗ 读取文件失败。",
            en: "✗ Failed to read file.",
            ja: "✗ ファイルの読み込みに失敗しました。"
          },
          lang
        )
      );
    } finally {
      e.target.value = "";
    }
  };

  const formatSaveSummary = (save: SavedShiftState) => {
    const stageLabel =
      save.stage === "night5"
        ? tl({ zh: "第 5 夜 · 自我审计", en: "NIGHT 5 · AUDIT", ja: "第5夜 · 自己監査" }, lang)
        : save.stage === "crisis"
          ? tl({ zh: "夜间危机", en: "CRISIS", ja: "夜間危機" }, lang)
          : tl(
              {
                zh: `第 ${Math.min(4, Math.floor(save.visitorIdx / 2) + 1)} 夜 · V-0${save.visitorIdx + 1}`,
                en: `NIGHT ${Math.min(4, Math.floor(save.visitorIdx / 2) + 1)} · V-0${save.visitorIdx + 1}`,
                ja: `第${Math.min(4, Math.floor(save.visitorIdx / 2) + 1)}夜 · V-0${save.visitorIdx + 1}`
              },
              lang
            );
    const savedDate = save.savedAt ? new Date(save.savedAt).toLocaleString() : "";
    return { stageLabel, savedDate };
  };

  return (
    <section className="gta-lobby-screen" id="lobby-screen" aria-label="Quarantine Gate 0 Lobby">
      {/* Full-Bleed Animated AI Studio Blast-Window Backdrop with Subtle 3D Parallax */}
      <div
        className="lobby-bg-layer"
        aria-hidden="true"
        style={{
          transform: motionPaused
            ? undefined
            : `translate3d(${parallax.x.toFixed(1)}px, ${parallax.y.toFixed(1)}px, 0) scale(1.04)`
        }}
      >
        <img
          src="./portraits/lobby_bg.jpg"
          alt=""
          className="lobby-bg-poster"
          decoding="async"
        />
        <video
          ref={videoRef}
          className="lobby-bg-video"
          style={{ opacity: videoReady ? 1 : 0 }}
          poster="./portraits/lobby_bg.jpg"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoReady(true)}
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
        >
          <source src="./videos/lobby/bg.mp4" type="video/mp4" />
        </video>
      </div>

      {/* GPU WebGL2 Snow, Edge Frost, Mouse Glint & Film Grain Overlay */}
      <WebGLAtmosphere mode="lobby" motionPaused={motionPaused} />
      <div className="gta-lobby-vignette" aria-hidden="true" />

      {/* Top HUD Corner Row — Pure Diegetic Game Controls */}
      <header className="gta-lobby-top">
        <div className="gta-brand-emblem">
          <div className="gta-kicker-strip">
            <span className="gta-stamp-pill">GATE-0</span>
            <span className="gta-coord-text">78°13&apos;N · SVALBARD -46°C · OUTPOST 0</span>
          </div>
          <h1 ref={vfxTitleRef} className="gta-hero-title lobby-title">
            {tl(
              {
                zh: "零号隔离窗：2036",
                en: "QUARANTINE GATE 0",
                ja: "ゼロ号隔離窓：2036"
              },
              lang
            )}
          </h1>
          <p className="gta-hero-sub">
            {tl(
              {
                zh: "窗外敲门的人偷得走宿主的记忆与工号——偷不走的，只有面临背叛时的价值排序与开脱方式。",
                en: "WHAT KNOCKS STEALS EVERY MEMORY & PASSCODE — IT CANNOT STEAL HOW A HUMAN JUSTIFIES BETRAYAL.",
                ja: "窓の外の影は記憶も番号も盗む——盗めないのは、背信の瞬間の価値順位と言い訳の癖だけだ。"
              },
              lang
            )}
          </p>
        </div>

        <div className="gta-top-pills">
          <Toggle
            id="btn-lobby-ambience"
            pressed={ambience}
            className="gta-hud-pill"
            onPressedChange={onToggleAmbience}
          >
            <SnowHazardIcon /> {ambience ? "AMB" : "MUTE"}
          </Toggle>

          <Toggle
            id="btn-lobby-motion"
            pressed={motionPaused}
            className="gta-hud-pill"
            onPressedChange={onToggleMotionPaused}
            aria-label={tl({ zh: "暂停动效", en: "Pause FX", ja: "演出停止" }, lang)}
          >
            {motionPaused ? <MotionPlayIcon /> : <MotionPauseIcon />}
          </Toggle>

          <Select<Locale>
            items={langItems}
            value={lang}
            onValueChange={(next) => {
              if (next) onChangeLang(next);
            }}
          >
            <SelectTrigger id="lobby-lang-select" aria-label="Language" className="gta-hud-pill">
              <SelectValue />
              <ChevronDownIcon />
            </SelectTrigger>
            <SelectContent>
              {langItems.map((item) => (
                <SelectItem key={item.value} value={item.value} label={item.label}>
                  {item.label}
                  <SelectItemIndicator>
                    <CheckIcon />
                  </SelectItemIndicator>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Bottom HUD Row: GTA Slanted Vertical Menu (Left) + Operator Dog-Tag & Mode Strip (Right) */}
      <div className="gta-lobby-bottom">
        <nav className="gta-menu-stack" aria-label="Main Game Menu">
          <Button
            id="btn-lobby-start"
            className="gta-menu-item primary"
            onClick={onStartNewShift}
          >
            <span className="gta-menu-idx">01</span>
            <span className="gta-menu-label">
              {tl(
                {
                  zh: "观看互动电影 // 完整 5 夜剧情",
                  en: "WATCH INTERACTIVE FILM // 5-NIGHT STORY",
                  ja: "インタラクティブ映画を観る // 全5夜本編"
                },
                lang
              )}
              <small className="gta-menu-sub">
                {tl(
                  {
                    zh: "零门槛纯点剧情抉择，无需玩小游戏也能体验 4 大电影结局",
                    en: "Pure cinematic story path — reach all endings with story choices alone",
                    ja: "難解な操作不要・選択だけで全結末まで完走可能"
                  },
                  lang
                )}
              </small>
            </span>
            <span className="gta-menu-arrow">▶</span>
          </Button>

          <Button
            id="btn-lobby-challenge"
            className="gta-menu-item challenge"
            onClick={onStartChallengeMode}
          >
            <span className="gta-menu-idx">⚔</span>
            <span className="gta-menu-label">
              {tl(
                {
                  zh: "🛡️ 伪人鉴真挑战 // MIMIC AUDIT MODE",
                  en: "🛡️ MIMIC AUDIT CHALLENGE // SIDE MODE",
                  ja: "🛡️ 擬態体監査チャレンジ // 高難度モード"
                },
                lang
              )}
              <small className="gta-menu-sub">
                {tl(
                  {
                    zh: "高玩支线玩法 · 8 人防爆窗审讯 + 扫描仪 + 燃料生存",
                    en: "Hardcore detective booth · scanners, psychology & fuel survival",
                    ja: "高難度サイドモード · 防爆窓尋問・センサー・燃料管理"
                  },
                  lang
                )}
              </small>
            </span>
            <span className="gta-menu-arrow">⚡</span>
          </Button>

          {savedShift ? (
            <Button
              id="btn-lobby-continue"
              className="gta-menu-item continue"
              onClick={() => onContinueShift(savedShift)}
            >
              <span className="gta-menu-idx">02</span>
              <span className="gta-menu-label">
                {tl({ zh: "继续值班 // CONTINUE", en: "CONTINUE SHIFT", ja: "当直を再開 // CONTINUE" }, lang)}
                <small className="gta-menu-sub">
                  {savedShift.operatorName ? `${savedShift.operatorName} · ` : ""}
                  {formatSaveSummary(savedShift).stageLabel} · {savedShift.fuelLeft ?? 5} FUEL
                </small>
              </span>
              <span className="gta-menu-arrow">↻</span>
            </Button>
          ) : null}

          <Button
            id="btn-lobby-storymap"
            className="gta-menu-item"
            onClick={onOpenStoryMap}
          >
            <span className="gta-menu-idx">{savedShift ? "03" : "02"}</span>
            <span className="gta-menu-label">
              <span className="gta-menu-row">
                <StoryBranchIcon />
                <span>
                  {tl(
                    {
                      zh: `故事线 // STORY MAP (${storyStats.unlockedCount}/${storyStats.totalCount})`,
                      en: `STORY MAP (${storyStats.unlockedCount}/${storyStats.totalCount})`,
                      ja: `分岐図 // STORY (${storyStats.unlockedCount}/${storyStats.totalCount})`
                    },
                    lang
                  )}
                </span>
              </span>
            </span>
          </Button>

          <Button
            id="btn-lobby-studio"
            className="gta-menu-item"
            onClick={onOpenStudio}
          >
            <span className="gta-menu-idx">{savedShift ? "04" : "03"}</span>
            <span className="gta-menu-label">
              <span className="gta-menu-row">
                <ClipboardDataIcon />
                <span>
                  {tl(
                    {
                      zh: "制片美术与3D分镜台 // STUDIO",
                      en: "ASSET & 3D STORYBOARD STUDIO",
                      ja: "制作ボード & 3D演出台 // STUDIO"
                    },
                    lang
                  )}
                </span>
              </span>
            </span>
          </Button>

          <Button
            id="btn-lobby-load"
            className="gta-menu-item"
            onClick={() => {
              setImportStatus(null);
              setLoadOpen(true);
            }}
          >
            <span className="gta-menu-idx">{savedShift ? "05" : "04"}</span>
            <span className="gta-menu-label">
              <span className="gta-menu-row">
                <ClipboardDataIcon />
                <span>{tl({ zh: "读取存档 // LOAD RECORD", en: "LOAD RECORD", ja: "記録読込 // LOAD" }, lang)}</span>
              </span>
            </span>
          </Button>

          <Button
            id="btn-lobby-docs"
            className="gta-menu-item"
            onClick={() => setDocsOpen(true)}
          >
            <span className="gta-menu-idx">{savedShift ? "06" : "05"}</span>
            <span className="gta-menu-label">
              <span className="gta-menu-row">
                <FlameFuelIcon />
                <span>{tl({ zh: "机密文档 // FIELD MANUAL", en: "FIELD MANUAL", ja: "極秘資料 // MANUAL" }, lang)}</span>
              </span>
            </span>
          </Button>

          <Button
            id="btn-lobby-archive"
            className="gta-menu-item"
            onClick={onOpenArchive}
          >
            <span className="gta-menu-idx">{savedShift ? "07" : "06"}</span>
            <span className="gta-menu-label">
              <span className="gta-menu-row">
                <ArchiveIcon />
                <span>
                  {tl(
                    {
                      zh: `结局图鉴 // ARCHIVE (${compendium.unlockedEndings.length}/7)`,
                      en: `ARCHIVE (${compendium.unlockedEndings.length}/7)`,
                      ja: `図鑑 // ARCHIVE (${compendium.unlockedEndings.length}/7)`
                    },
                    lang
                  )}
                </span>
              </span>
            </span>
          </Button>
        </nav>

        {/* Bottom-Right Diegetic GTA Operator Dog-Tag & Shift Protocol Strip */}
        <aside className="gta-operator-strip" id="lobby-operator-card">
          <div className="gta-dogtag-header">
            <div className="gta-dogtag-meta">
              <span className="gta-dogtag-dot" aria-hidden="true" />
              <span className="gta-dogtag-code">OPERATOR // #09</span>
            </div>
            <span className="gta-dogtag-callsign">{displayCallsign}</span>
          </div>

          <div className="gta-inline-field">
            <Label htmlFor="lobby-operator-name" className="gta-inline-label">
              {tl({ zh: "值班员代号 // CALLSIGN", en: "CALLSIGN // OPERATOR ID", ja: "検疫官コールサイン" }, lang)}
            </Label>
            <InputGroup className="gta-input-group">
              <span className="gta-input-prefix" aria-hidden="true">ID //</span>
              <Input
                id="lobby-operator-name"
                type="text"
                className="gta-input"
                maxLength={24}
                value={operatorName}
                onValueChange={onChangeOperatorName}
                placeholder={tl(
                  { zh: "输入你的名字（默认 OP-09）", en: "Enter callsign (OP-09)", ja: "氏名を入力 (OP-09)" },
                  lang
                )}
              />
              <InputClear
                className="gta-input-clear"
                aria-label={tl({ zh: "清空姓名", en: "Clear name", ja: "氏名をクリア" }, lang)}
              >
                <ClearIcon />
              </InputClear>
            </InputGroup>
          </div>

          <div className="gta-inline-field">
            <Label htmlFor="lobby-mode-select" className="gta-inline-label">
              {tl({ zh: "排班模式 // PROTOCOL", en: "SHIFT PROTOCOL", ja: "当直モード" }, lang)}
            </Label>
            <Select<CampaignMode>
              items={campaignModeItems}
              value={campaignMode}
              onValueChange={(next) => {
                if (next) onChangeCampaignMode(next);
              }}
            >
              <SelectTrigger id="lobby-mode-select" className="gta-select-trigger">
                <span className="gta-select-inner">
                  <span className="gta-input-prefix cyan" aria-hidden="true">MODE //</span>
                  <span className="gta-select-val">
                    <SelectValue />
                  </span>
                  <span className="gta-select-chevron" aria-hidden="true">
                    <ChevronDownIcon />
                  </span>
                </span>
              </SelectTrigger>
              <SelectContent>
                {campaignModeItems.map((item) => (
                  <SelectItem
                    key={item.value}
                    value={item.value}
                    label={item.label}
                    data-lobby-mode={item.value}
                  >
                    {item.label}
                    <SelectItemIndicator>
                      <CheckIcon />
                    </SelectItemIndicator>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {campaignMode === "seeded" ? (
            <div className="gta-inline-field">
              <Label htmlFor="lobby-seed-input" className="gta-inline-label">
                {tl({ zh: "排班种子 // SHIFT SEED", en: "SHIFT SEED", ja: "当直シード // SHIFT SEED" }, lang)}
              </Label>
              <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
                <InputGroup className="gta-input-group" style={{ flex: 1 }}>
                  <span className="gta-input-prefix" aria-hidden="true">SEED#</span>
                  <Input
                    id="lobby-seed-input"
                    type="text"
                    className="gta-input"
                    value={seedDraft}
                    onValueChange={onChangeSeedDraft}
                    placeholder="SVALBARD-2036"
                  />
                </InputGroup>
                <Button
                  id="btn-lobby-random-seed"
                  type="button"
                  className="gta-hud-pill gta-seed-roll-btn"
                  onClick={() => onChangeSeedDraft(generateRunSeed("seeded"))}
                >
                  🎲
                </Button>
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {/* Load / Import / Export Save Dossier Dialog */}
      <Dialog open={loadOpen} onOpenChange={setLoadOpen}>
        <DialogBackdrop />
        <DialogContent className="panel lobby-modal-panel gta-dialog-shell" id="lobby-load-dialog">
          <div className="viewport-header" style={{ marginBottom: "8px" }}>
            <div>
              <DialogTitle>
                {tl(
                  {
                    zh: "ORD-OS 班次档案 // SHIFT ARCHIVE",
                    en: "ORD-OS SHIFT ARCHIVE",
                    ja: "ORD-OS 当直記録 // ARCHIVE"
                  },
                  lang
                )}
              </DialogTitle>
              <DialogDescription>
                {tl(
                  {
                    zh: "值班进度会自动保存在本机，支持续玩、导出或导入存档备份。",
                    en: "Shift progress is saved locally. Resume, export, or import shift backups.",
                    ja: "当直の進捗はローカルに自動保存され、再開・書出・読込が可能です。"
                  },
                  lang
                )}
              </DialogDescription>
            </div>
            <DialogClose id="btn-close-load-dialog" className="ctrl-btn">
              {tl({ zh: "关闭", en: "Close", ja: "閉じる" }, lang)}
            </DialogClose>
          </div>

          {savedShift ? (
            <div className="dossier-section" id="lobby-save-slot-card">
              <div className="section-kicker">
                {tl({ zh: "活跃槽位 // SLOT 01", en: "ACTIVE SHIFT SLOT // SLOT 01", ja: "保存済みスロット // SLOT 01" }, lang)}
              </div>
              <div className="lobby-slot-details">
                <div>
                  <strong>{savedShift.operatorName || "OP-09"}</strong> ·{" "}
                  {formatSaveSummary(savedShift).stageLabel}
                </div>
                <div className="lobby-slot-sub">
                  MODE: {savedShift.campaignMode.toUpperCase()} · SEED: {savedShift.runSeed ?? savedShift.dailySeed ?? "—"} ·{" "}
                  FUEL: {savedShift.fuelLeft ?? 5} · VERDICTS: {savedShift.history.length}
                </div>
                {formatSaveSummary(savedShift).savedDate ? (
                  <div className="lobby-slot-sub">{formatSaveSummary(savedShift).savedDate}</div>
                ) : null}
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                <Button
                  id="btn-load-slot-resume"
                  className="ctrl-btn amber"
                  onClick={() => {
                    setLoadOpen(false);
                    onContinueShift(savedShift);
                  }}
                >
                  {tl({ zh: "载入并继续值班 →", en: "Load & Resume →", ja: "読み込んで再開 →" }, lang)}
                </Button>
                <Button className="ctrl-btn" onClick={handleExportSave}>
                  {tl({ zh: "导出 JSON 备份", en: "Export JSON", ja: "JSON書出" }, lang)}
                </Button>
                <Button
                  className="ctrl-btn"
                  onClick={() => {
                    onClearSavedShift();
                    setImportStatus(
                      tl({ zh: "已清除本地活跃存档。", en: "Active shift save cleared.", ja: "セーブを削除しました。" }, lang)
                    );
                  }}
                >
                  {tl({ zh: "清除存档", en: "Delete Save", ja: "削除" }, lang)}
                </Button>
              </div>
            </div>
          ) : (
            <div className="dossier-section">
              <div style={{ color: "var(--text-secondary)", fontSize: "0.84rem" }}>
                {tl(
                  {
                    zh: "当前本机暂无进行中的班次存档。可直接开始新班次，或导入存档备份。",
                    en: "No active shift found locally. Start a new shift or import a backup file.",
                    ja: "アクティブな記録はありません。新規開始するかバックアップを読み込んでください。"
                  },
                  lang
                )}
              </div>
            </div>
          )}

          <div className="dossier-section" style={{ marginBottom: 0 }}>
            <div className="section-kicker">
              {tl({ zh: "导入班次档案 (.JSON)", en: "IMPORT SHIFT BACKUP (.JSON)", ja: "バックアップ読み込み (.JSON)" }, lang)}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              style={{ display: "none" }}
              onChange={(e) => void handleImportFile(e)}
            />
            <Button
              id="btn-import-save-file"
              className="ctrl-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              {tl({ zh: "选择本地 .json 存档文件...", en: "Choose .json save file...", ja: "JSONファイルを選択..." }, lang)}
            </Button>
            {importStatus ? (
              <div style={{ marginTop: "8px", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--amber-crt)" }}>
                {importStatus}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* ORD-OS Field Manual & Classified Briefing Reader Dialog */}
      <Dialog open={docsOpen} onOpenChange={setDocsOpen}>
        <DialogBackdrop />
        <DialogContent className="panel lobby-modal-panel lobby-docs-panel gta-dialog-shell" id="lobby-docs-dialog">
          <div className="viewport-header" style={{ marginBottom: "8px" }}>
            <div>
              <DialogTitle>
                {tl(
                  {
                    zh: "ORD-OS 检疫操作手册 & 斯瓦尔巴机密简报",
                    en: "ORD-OS FIELD MANUAL & SVALBARD BRIEFING",
                    ja: "ORD-OS 検疫マニュアル & 極秘資料"
                  },
                  lang
                )}
              </DialogTitle>
              <DialogDescription>
                {tl(
                  {
                    zh: "文档编号 ORD-DOC-2036 // 仅限 0 号隔离岗亭值班员查阅",
                    en: "DOC REF ORD-DOC-2036 // EYES ONLY — GATE 0 OPERATOR",
                    ja: "文書番号 ORD-DOC-2036 // 第0検疫ブース当直官限定"
                  },
                  lang
                )}
              </DialogDescription>
            </div>
            <DialogClose id="btn-close-docs-dialog" className="ctrl-btn">
              {tl({ zh: "关闭", en: "Close", ja: "閉じる" }, lang)}
            </DialogClose>
          </div>

          <Tabs
            value={docsTab}
            onValueChange={(next) => {
              if (next) setDocsTab(next as ManualTab);
            }}
          >
            <TabsList className="dossier-tabs">
              <TabsTab value="briefing" className="dossier-tab">
                {tl({ zh: "01 站内简报", en: "01 BRIEFING", ja: "01 基地概要" }, lang)}
              </TabsTab>
              <TabsTab value="ordamor" className="dossier-tab">
                {tl({ zh: "02 真伪甄别", en: "02 SPOTTING MIMICS", ja: "02 見抜き方" }, lang)}
              </TabsTab>
              <TabsTab value="cardiac" className="dossier-tab">
                {tl({ zh: "03 审讯与心率", en: "03 COMMS & ECG", ja: "03 尋問と心拍" }, lang)}
              </TabsTab>
              <TabsTab value="night5" className="dossier-tab">
                {tl({ zh: "04 第5夜终局", en: "04 NIGHT 5", ja: "04 第5夜" }, lang)}
              </TabsTab>
              <TabsIndicator className="tab-indicator" />
            </TabsList>

            <ScrollArea className="lobby-docs-scroll" type="auto">
              <ScrollAreaViewport>
                <ScrollAreaContent>
                  <TabsPanel value="briefing" className="docs-article">
                    <h3>{tl({ zh: "斯瓦尔巴 0 号隔离站 · 紧急接管令", en: "Svalbard Outpost 0 · Emergency Lockdown", ja: "スヴァールバル第0隔離基地・緊急封鎖令" }, lang)}</h3>
                    <p>
                      {tl(
                        {
                          zh: "2036 年极夜，冰芯钻井事故后未知拟态寄生体渗入站点。你被任命为 0 号隔离窗唯一值班员（OP#09），必须在 5 个夜晚内筛查双层防爆玻璃外的 8 名幸存者。",
                          en: "Polar night 2036. After an ice-core breach, cognitive mimics infiltrated the station. As sole Operator #09 at Gate 0, screen 8 survivors across 5 nights behind armored blast glass.",
                          ja: "2036年極夜。氷床コア掘削事故後、擬態体が基地へ侵入した。第0検疫官として5夜の間に8名の生存者を審査せよ。"
                        },
                        lang
                      )}
                    </p>
                    <ul>
                      <li>
                        <strong>{tl({ zh: "炉心燃料（FUEL）", en: "Furnace Fuel", ja: "暖房燃料 (FUEL)" }, lang)}</strong>：
                        {tl(
                          {
                            zh: "每次高温净化（PURGE）消耗 1 FUEL。归零触发 -46°C 低温降压，传感器电量由 2 PWR 降至 1 PWR。",
                            en: "Each PURGE costs 1 FUEL. Reaching 0 FUEL triggers -46°C brownout (2 PWR → 1 PWR).",
                            ja: "焼却ごとに 1 FUEL 消費。ゼロで電圧低下（2 PWR → 1 PWR）。"
                          },
                          lang
                        )}
                      </li>
                      <li>
                        <strong>{tl({ zh: "救生潜艇 Nautilus-0", en: "Rescue Sub Nautilus-0", ja: "脱出潜水艦 Nautilus-0" }, lang)}</strong>：
                        {tl(
                          {
                            zh: "撤离需至少 3 名真人且集齐「医疗官 + 轮机师 + 深潜员」；放进任何一名拟态体都会在第 5 夜触发内舱破门。",
                            en: "Launch requires ≥3 live humans covering Medical, Mechanic, and Diver roles. Admitting any mimic breaches the inner airlock on Night 5.",
                            ja: "生身の生存者3名以上（医療官・機関士・潜水士）が必要。擬態体を通すと第5夜に内扉が突破される。"
                          },
                          lang
                        )}
                      </li>
                    </ul>
                  </TabsPanel>

                  <TabsPanel value="ordamor" className="docs-article">
                    <h3>{tl({ zh: "如何识破伪人：别信体面话，看他旧账", en: "How to Spot a Mimic: Press Past Actions, Not Trivia", ja: "擬態体の見抜き方：過去と建前の矛盾を突け" }, lang)}</h3>
                    <p>
                      {tl(
                        {
                          zh: "不要考工号或专业术语——伪人完整背下了宿主的所有记忆。它们唯一学不会的，是活人在绝境里「为了自保或偏心到底舍弃了什么」以及事后惯用的开脱借口。",
                          en: "Never waste turns on passcodes or technical trivia—mimics copy surface memory intact. What they fail to copy is how a flawed human prioritizes survival vs others in real crises and excuses their dirty past.",
                          ja: "社員番号や知識で試すな——擬態体は記憶を丸暗記している。真似できないのは、極限状況で「何を守り何を切り捨てたか」と事後の言い訳だ。"
                        },
                        lang
                      )}
                    </p>
                    <ul>
                      <li><strong>Night 1（低阶）</strong>：{tl({ zh: "满嘴复读「公平/大局」等宿主从没做到过的圣人台词；真人反而会冷酷承认自己的自私旧账。", en: "Recites flattering saintly claims the host never lived up to, whereas the real human coldly owns their selfish past.", ja: "宿主が実行したことのない立派な建前ばかりを復唱する。" }, lang)}</li>
                      <li><strong>Night 2（中阶）</strong>：{tl({ zh: "能应付第一轮日常危机追问，但换个第二处过往痛点或私密两难继续深挖就会露出马脚。", en: "Passes the first surface dilemma, but slips up when pressed on a second painful trade-off.", ja: "最初の追及は凌ぐが、2つ目のジレンマを突くと破綻する。" }, lang)}</li>
                      <li><strong>Night 3（磁暴黑障）</strong>：{tl({ zh: "强磁暴导致瞳孔/热像/心率全离线，纯靠对话判断（警惕坦率认错的古怪真人）。", en: "Geomagnetic storm disables all sensors & ECG—judge strictly by dialogue (watch out for bluntly honest humans).", ja: "磁気嵐で全センサー停止。対話のみで判断せよ。" }, lang)}</li>
                      <li><strong>Night 4（高阶）</strong>：{tl({ zh: "前几轮近乎滴水不漏；唯有当面拆掉他借口依赖的现实条件（退路），真活人会改口变招，伪人会卡死重复同一套假话。", en: "Almost indistinguishable on morals—only when you strip away the real-world excuse their alibi relies on will a mimic repeat the same broken script.", ja: "道徳観まで完全に擬態する。言い訳の前提条件を崩すと、人間は変幻し擬態体は同じ台詞で固まる。" }, lang)}</li>
                    </ul>
                  </TabsPanel>

                  <TabsPanel value="cardiac" className="docs-article">
                    <h3>{tl({ zh: "自由审讯 & 心率佐证", en: "Freeform Interrogation & Cardiac Telemetry", ja: "自由尋問 & 心拍テレメトリ" }, lang)}</h3>
                    <ul>
                      <li>
                        <strong>{tl({ zh: "4 次核心追问 + 3 次闲聊试探", en: "4 Core Questions + 3 Small-Talk Slots", ja: "有効尋問4回 + 雑談枠3回" }, lang)}</strong>：
                        {tl(
                          {
                            zh: "可以直接点击预设问题，也能自由打字盘问、诈唬或援引档案里的过往细节。无关紧要的试探会优先消耗闲聊额度，不占主审回合。",
                            en: "Use quick probes or type your own bluff citing past records from their file. Casual off-topic probing uses small-talk slots first.",
                            ja: "定型質問のほか、調書の過去記録を引いた自由入力・揺さぶりも可能。雑談枠を先に消費。"
                          },
                          lang
                        )}
                      </li>
                      <li>
                        <strong>{tl({ zh: "心率只做佐证（1 PWR 应激回放 R）", en: "Cardiac Corroboration (1 PWR Replay R)", ja: "心拍裏付け（1 PWR 再生 R）" }, lang)}</strong>：
                        {tl(
                          {
                            zh: "真人在真实利害处出现心跳飙升并缓慢平复；伪人仅在露馅话题上出现心率反常平直或瞬间归零。按 D 可随时收起/展开右侧档案。",
                            en: "Humans spike on real personal stakes and settle gradually. Mimics flatline or snap back abnormally when caught lying. Press D to toggle the Dossier HUD.",
                            ja: "生身は本音の利害で急上昇し緩やかに戻る。擬態体は嘘の瞬間に平坦化や急落を示す。D キーで調書HUDを切替。"
                          },
                          lang
                        )}
                      </li>
                    </ul>
                  </TabsPanel>

                  <TabsPanel value="night5" className="docs-article">
                    <h3>{tl({ zh: "第 5 夜 · 镜面自审与 7 种结局", en: "Night 5 · Mirror Self-Audit & 7 Endings", ja: "第5夜・自己監査と7つの結末" }, lang)}</h3>
                    <p>
                      {tl(
                        {
                          zh: "你在第 0 夜入职时做过的承诺，与第 1–4 夜实际留下的行动都会被系统记住。第 5 夜窗外站着与你本人言辞 99.98% 吻合的完美替身——唯有活人才会与自己说过的话对不上。",
                          en: "Your Night 0 intake promise and your actual Nights 1–4 actions are both recorded. On Night 5 a 99.98% double knocks—only the living contradict their own words.",
                          ja: "第0夜の言葉と第1〜4夜の実際の行動はすべて記録される。第5夜、99.98%一致する自分の影が現れる。"
                        },
                        lang
                      )}
                    </p>
                  </TabsPanel>
                </ScrollAreaContent>
              </ScrollAreaViewport>
              <ScrollAreaScrollbar orientation="vertical">
                <ScrollAreaThumb />
              </ScrollAreaScrollbar>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
    </section>
  );
}
