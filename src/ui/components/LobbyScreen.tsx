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
  BoltPowerIcon,
  CheckIcon,
  ChevronDownIcon,
  ClearIcon,
  ClipboardDataIcon,
  FlameFuelIcon,
  MotionPauseIcon,
  MotionPlayIcon,
  SnowHazardIcon
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
  aiEnabled: boolean;
  ambience: boolean;
  onToggleAmbience: (next: boolean) => void;
  motionPaused: boolean;
  onToggleMotionPaused: (next: boolean) => void;
  onStartNewShift: () => void;
  onContinueShift: (save: SavedShiftState) => void;
  onClearSavedShift: () => void;
  onOpenArchive: () => void;
  onOpenAiConfig: () => void;
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
  aiEnabled,
  ambience,
  onToggleAmbience,
  motionPaused,
  onToggleMotionPaused,
  onStartNewShift,
  onContinueShift,
  onClearSavedShift,
  onOpenArchive,
  onOpenAiConfig
}: Props) {
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

      {/* Top HUD Corner Row — Zero SaaS Toolbar */}
      <header className="gta-lobby-top">
        <div className="gta-brand-emblem">
          <div className="gta-kicker-strip">
            <span className="gta-stamp-pill">GATE-0</span>
            <span className="gta-coord-text">78°13&apos;N · SVALBARD -46°C · ORD-OS v6</span>
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
          <Button
            id="btn-lobby-ai-status"
            className={`gta-hud-pill ${aiEnabled ? "amber" : ""}`}
            onClick={onOpenAiConfig}
          >
            <BoltPowerIcon />
            <span>{aiEnabled ? "CLAUDE 5.5 ● LIVE" : "CLAUDE ● OFFLINE"}</span>
          </Button>

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
                  zh: "开始新班次 // NEW SHIFT",
                  en: "START NEW SHIFT",
                  ja: "新規当直を開始 // NEW SHIFT"
                },
                lang
              )}
            </span>
            <span className="gta-menu-arrow">▶</span>
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
            id="btn-lobby-load"
            className="gta-menu-item"
            onClick={() => {
              setImportStatus(null);
              setLoadOpen(true);
            }}
          >
            <span className="gta-menu-idx">{savedShift ? "03" : "02"}</span>
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
            <span className="gta-menu-idx">{savedShift ? "04" : "03"}</span>
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
            <span className="gta-menu-idx">{savedShift ? "05" : "04"}</span>
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
            <span className="gta-dogtag-code">OPERATOR // #09</span>
            <span className="gta-dogtag-callsign">{displayCallsign}</span>
          </div>

          <div className="gta-inline-field">
            <Label htmlFor="lobby-operator-name" className="gta-inline-label">
              {tl({ zh: "值班员姓名 / CALLSIGN", en: "CALLSIGN / NAME", ja: "検疫官氏名" }, lang)}
            </Label>
            <InputGroup className="gta-input-group">
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
                <SelectValue />
                <ChevronDownIcon />
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
                {tl({ zh: "随机种子 // SEED (IndexedDB)", en: "SEED (INDEXEDDB CACHE)", ja: "シード値 (IndexedDB)" }, lang)}
              </Label>
              <div style={{ display: "flex", gap: "6px" }}>
                <InputGroup className="gta-input-group" style={{ flex: 1 }}>
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
                  className="gta-hud-pill"
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
                    zh: "ORD-OS 班次档案 // LOCAL INDEXEDDB",
                    en: "ORD-OS SHIFT STORAGE // INDEXEDDB",
                    ja: "ORD-OS ローカル記録 // INDEXEDDB"
                  },
                  lang
                )}
              </DialogTitle>
              <DialogDescription>
                {tl(
                  {
                    zh: "进度实时保存在本地 IndexedDB，支持续玩、导出或导入 .json 班次备份。",
                    en: "Progress persists locally in IndexedDB. Resume, export, or import .json shift backups.",
                    ja: "進捗はローカル IndexedDB に保存され、再開・書出・読込が可能です。"
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
                    zh: "当前本地数据库暂无进行中的班次存档。可直接开始新班次，或导入 .json 存档。",
                    en: "No active shift found in IndexedDB. Start a new shift or import a .json backup.",
                    ja: "アクティブなセーブはありません。新規開始するか JSON を読み込んでください。"
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
                {tl({ zh: "02 取证法则", en: "02 ORDAMOR", ja: "02 鑑定法則" }, lang)}
              </TabsTab>
              <TabsTab value="cardiac" className="dossier-tab">
                {tl({ zh: "03 心率与AI", en: "03 ECG & AI", ja: "03 心拍・AI" }, lang)}
              </TabsTab>
              <TabsTab value="night5" className="dossier-tab">
                {tl({ zh: "04 第5夜协议", en: "04 NIGHT 5", ja: "04 第5夜" }, lang)}
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
                    <h3>{tl({ zh: "Ordamor 人格取证法则（SAY vs DO）", en: "Ordamor Forensic Law (SAY vs DO)", ja: "Ordamor 人格鑑定法則 (SAY vs DO)" }, lang)}</h3>
                    <p>
                      {tl(
                        {
                          zh: "不要考工号或技术参数（trivia）——拟态体完整窃取了表层记忆。真正无法复制的，是宿主在危机中的真实价值排序（v-1 / v-2）与事后开脱签名。",
                          en: "Never waste turns on passcodes or trivia—mimics copy surface memory intact. Expose them through crisis value orderings (v-1, v-2) and post-hoc disposal signatures.",
                          ja: "社員番号や知識（trivia）で試すな——擬態体は表層記憶を複製している。価値順位（v-1/v-2）と処置署名で見抜け。"
                        },
                        lang
                      )}
                    </p>
                    <ul>
                      <li><strong>Night 1（低阶）</strong>：{tl({ zh: "复读宿主嘴上标榜却从未赢过的自我美化叙事（neverWon）。", en: "Recites flattering self-narrative (neverWon).", ja: "宿主の建前（neverWon）を復唱する。" }, lang)}</li>
                      <li><strong>Night 2（中阶）</strong>：{tl({ zh: "通过主轴（v-1），深挖次冲突轴（v-2）才会露馅。", en: "Passes v-1; fails on secondary axis v-2.", ja: "第1軸を通過、第2軸（v-2）で破綻。" }, lang)}</li>
                      <li><strong>Night 3（磁暴黑障）</strong>：{tl({ zh: "全传感器与 ECG 离线，纯无线电推理（警惕冷酷认账型真人）。", en: "All sensors & ECG offline—pure audio deduction.", ja: "全センサー・ECG停止。対話のみで推論せよ。" }, lang)}</li>
                      <li><strong>Night 4（高阶 Boggart）</strong>：{tl({ zh: "价值排序全对，拆掉借口依赖的外部前提（disposalRequires）才能逼出真伪。", en: "Strip their excuse precondition (disposalRequires) via Boggart Trap.", ja: "言い訳の前提条件（disposalRequires）を剥奪して破綻を引き出せ。" }, lang)}</li>
                    </ul>
                  </TabsPanel>

                  <TabsPanel value="cardiac" className="docs-article">
                    <h3>{tl({ zh: "Claude 多轮自由审讯 & 心率佐证", en: "Claude Multi-Turn AI & Cardiac Telemetry", ja: "Claude 対話尋問 & 心拍テレメトリ" }, lang)}</h3>
                    <ul>
                      <li>
                        <strong>{tl({ zh: "4 次有效追问 + 3 次闲聊额度", en: "4 Core Turns + 3 Chatter Budget", ja: "有効尋問4回 + 雑談枠3回" }, lang)}</strong>：
                        {tl(
                          {
                            zh: "可自由打字盘问、诈唬或援引档案细节（o-01/o-02）。非核心轴试探优先扣闲聊额度。",
                            en: "Type custom questions, bluffs, or cite dossier facts (o-01/o-02). Off-axis chatter uses the 3 chatter slots first.",
                            ja: "自由入力で追及・揺さぶりが可能。本題外の質問は雑談枠3回を先に消費。"
                          },
                          lang
                        )}
                      </li>
                      <li>
                        <strong>{tl({ zh: "心率只做佐证（1 PWR 应激回放 R）", en: "Cardiac Corroboration (1 PWR Replay R)", ja: "心拍裏付け（1 PWR 再生 R）" }, lang)}</strong>：
                        {tl(
                          {
                            zh: "真人在真实利害冲突轴上出现肾上腺素飙升并缓慢回落；伪人仅在失真轴出现心率平直或瞬间归零。按 D 可切换右侧取证档案浮层。",
                            en: "Humans spike on real stakes and decay gradually. Mimics show flat mismatch or instant snap-back ONLY on flawed axes. Press D to toggle the Dossier HUD.",
                            ja: "生身は本音軸で急上昇し緩やかに戻る。擬態体は破綻軸のみで平坦化や瞬間復帰を示す。D キーで調書HUDを切替。"
                          },
                          lang
                        )}
                      </li>
                    </ul>
                  </TabsPanel>

                  <TabsPanel value="night5" className="docs-article">
                    <h3>{tl({ zh: "第 5 夜 · 自我审计与 7 种结局", en: "Night 5 · Self-Audit & 7 Endings", ja: "第5夜・自己監査と7つの結末" }, lang)}</h3>
                    <p>
                      {tl(
                        {
                          zh: "第 0 夜口述（SAY）与前 4 夜实际行动（DO）均被记录。第 5 夜窗外站着与你口述 99.98% 吻合的完美替身——唯有活人才会与自己说过的话对不上。",
                          en: "Your Night 0 intake (SAY) vs Nights 1–4 actions (DO) are audited. On Night 5 a 99.98% double knocks—only the living contradict their own words.",
                          ja: "第0夜の建前（SAY）と第1〜4夜の行動（DO）が監査される。第5夜、99.98%一致する自分の影が現れる。"
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
