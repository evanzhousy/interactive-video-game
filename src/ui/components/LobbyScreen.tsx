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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        ? tl({ zh: "第 5 夜 · 自我审计", en: "Night 5 · Self-Audit", ja: "第5夜 · 自己監査" }, lang)
        : save.stage === "crisis"
          ? tl({ zh: "夜间危机抉择", en: "Inter-Night Crisis", ja: "夜間危機" }, lang)
          : tl(
              {
                zh: `第 ${Math.min(4, Math.floor(save.visitorIdx / 2) + 1)} 夜 · 访客 #${save.visitorIdx + 1}`,
                en: `Night ${Math.min(4, Math.floor(save.visitorIdx / 2) + 1)} · Visitor #${save.visitorIdx + 1}`,
                ja: `第${Math.min(4, Math.floor(save.visitorIdx / 2) + 1)}夜 · 訪問者 #${save.visitorIdx + 1}`
              },
              lang
            );
    const savedDate = save.savedAt ? new Date(save.savedAt).toLocaleString() : "";
    return { stageLabel, savedDate };
  };

  return (
    <section className="lobby-screen" id="lobby-screen" aria-label="Quarantine Gate 0 Lobby">
      {/* Full-bleed AI Studio Animated Blast-Window Backdrop */}
      <div className="lobby-bg-layer" aria-hidden="true">
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
        <div className="lobby-bg-vignette" />
        <div className="lobby-bg-scanlines" />
      </div>

      {/* Top Atmospheric Telemetry Bar */}
      <header className="lobby-topbar">
        <div className="lobby-station-id">
          <span className="station-stamp">GATE-0</span>
          <span className="lobby-coord">78°13&apos;N 15°38&apos;E // SVALBARD -46°C</span>
        </div>

        <div className="lobby-top-actions">
          <Button
            id="btn-lobby-ai-status"
            className={`ctrl-btn ${aiEnabled ? "amber" : ""}`}
            onClick={onOpenAiConfig}
          >
            <BoltPowerIcon />{" "}
            {aiEnabled ? "CLAUDE SONNET 5.5 // LIVE" : "CLAUDE // OFFLINE"}
          </Button>

          <Toggle
            id="btn-lobby-ambience"
            pressed={ambience}
            className="ctrl-btn"
            onPressedChange={onToggleAmbience}
          >
            <SnowHazardIcon /> {ambience ? "AMB: ON" : "AMB: OFF"}
          </Toggle>

          <Toggle
            id="btn-lobby-motion"
            pressed={motionPaused}
            className="ctrl-btn"
            onPressedChange={onToggleMotionPaused}
            aria-label={tl({ zh: "暂停背景动画", en: "Pause background motion", ja: "背景アニメ停止" }, lang)}
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
            <SelectTrigger id="lobby-lang-select" aria-label="Language" className="ctrl-select">
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

      {/* Main Centered/Asymmetric Lobby Console */}
      <div className="lobby-body">
        <div className="lobby-hero-column">
          <div className="lobby-kicker">
            ORD-OS v6.0 // FORENSIC QUARANTINE TERMINAL · VER 2036.11
          </div>
          <h1 className="lobby-title">
            {tl(
              {
                zh: "零号隔离窗：2036",
                en: "QUARANTINE GATE 0 : 2036",
                ja: "ゼロ号隔離窓：2036"
              },
              lang
            )}
          </h1>
          <p className="lobby-tagline">
            {tl(
              {
                zh: "暴风雪零下四十六度。窗外敲门的人记得宿主的每一句工号与往事——他们偷不走的，只有面临抉择时的真实价值排序与开脱方式。",
                en: "Minus forty-six outside the blast glass. What knocks remembers every passcode and badge number—the only thing it cannot steal is how a human justifies betrayal.",
                ja: "氷点下46度の吹雪。窓の外の影は番号も記憶も盗み取る——盗めないのは、選択の瞬間の価値順位と言い訳の癖だけだ。"
              },
              lang
            )}
          </p>

          <div className="lobby-feature-chips">
            <span className="lobby-chip">ORDAMOR v6 // 13 VALUE TOKENS</span>
            <span className="lobby-chip">CLAUDE SONNET 5.5 // MULTI-TURN AI</span>
            <span className="lobby-chip">ECG CARDIAC TELEMETRY</span>
          </div>
        </div>

        <aside className="panel lobby-console-card" id="lobby-operator-card">
          <div className="viewport-header" style={{ marginBottom: "10px" }}>
            <span>
              {tl(
                {
                  zh: "值班员身份登记 // OP#09",
                  en: "OPERATOR CHECK-IN // OP#09",
                  ja: "当直官チェックイン // OP#09"
                },
                lang
              )}
            </span>
            <span className="tech-stamp">{displayCallsign}</span>
          </div>

          <div className="lobby-field">
            <Label htmlFor="lobby-operator-name" className="lobby-field-label">
              {tl(
                {
                  zh: "值班员姓名 / 代号（审讯与第 5 夜档案将实名记录）",
                  en: "Operator Name / Callsign (Used by NPCs & Night 5 Dossier)",
                  ja: "検疫官氏名 / コードネーム（尋問・第5夜記録に反映）"
                },
                lang
              )}
            </Label>
            <InputGroup className="ask-input-group">
              <Input
                id="lobby-operator-name"
                type="text"
                className="ask-input"
                maxLength={24}
                value={operatorName}
                onValueChange={onChangeOperatorName}
                placeholder={tl(
                  {
                    zh: "输入你的名字（默认 OP-09）",
                    en: "Enter your name (default: OP-09)",
                    ja: "氏名を入力（既定: OP-09）"
                  },
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

          <div className="lobby-field">
            <Label htmlFor="lobby-mode-select" className="lobby-field-label">
              {tl(
                {
                  zh: "排班模式",
                  en: "Shift Protocol",
                  ja: "当直モード"
                },
                lang
              )}
            </Label>
            <Select<CampaignMode>
              items={campaignModeItems}
              value={campaignMode}
              onValueChange={(next) => {
                if (next) onChangeCampaignMode(next);
              }}
            >
              <SelectTrigger id="lobby-mode-select" className="ctrl-select lobby-select-full">
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
            <div className="lobby-field">
              <Label htmlFor="lobby-seed-input" className="lobby-field-label">
                {tl(
                  {
                    zh: "随机种子（相同种子自动复用客户端 IndexedDB 缓存）",
                    en: "Campaign Seed (Reuses Client IndexedDB Cache)",
                    ja: "シード値（同一シードは IndexedDB キャッシュを再利用）"
                  },
                  lang
                )}
              </Label>
              <div style={{ display: "flex", gap: "6px" }}>
                <InputGroup className="ask-input-group" style={{ flex: 1 }}>
                  <Input
                    id="lobby-seed-input"
                    type="text"
                    className="ask-input"
                    value={seedDraft}
                    onValueChange={onChangeSeedDraft}
                    placeholder="SVALBARD-2036"
                  />
                </InputGroup>
                <Button
                  id="btn-lobby-random-seed"
                  type="button"
                  className="ctrl-btn"
                  onClick={() => onChangeSeedDraft(generateRunSeed("seeded"))}
                >
                  🎲
                </Button>
              </div>
            </div>
          ) : null}

          <div className="lobby-cta-stack">
            <Button
              id="btn-lobby-start"
              className="ctrl-btn amber lobby-primary-btn"
              onClick={onStartNewShift}
            >
              {tl(
                {
                  zh: "▶ 开始新班次（入职测验 → 0号岗亭）",
                  en: "▶ START NEW SHIFT (NIGHT 0 INTAKE)",
                  ja: "▶ 新規当直を開始（第0夜測定 → 検疫ブース）"
                },
                lang
              )}
            </Button>

            {savedShift ? (
              <Button
                id="btn-lobby-continue"
                className="ctrl-btn lobby-continue-btn"
                onClick={() => onContinueShift(savedShift)}
              >
                <span>
                  {tl(
                    {
                      zh: "↻ 继续上次值班",
                      en: "↻ CONTINUE SAVED SHIFT",
                      ja: "↻ 前回の当直を再開"
                    },
                    lang
                  )}
                </span>
                <span className="lobby-save-meta">
                  {savedShift.operatorName ? `${savedShift.operatorName} · ` : ""}
                  {formatSaveSummary(savedShift).stageLabel} · {savedShift.fuelLeft ?? 5} FUEL
                </span>
              </Button>
            ) : null}

            <div className="lobby-secondary-row">
              <Button
                id="btn-lobby-load"
                className="ctrl-btn"
                onClick={() => {
                  setImportStatus(null);
                  setLoadOpen(true);
                }}
              >
                <ClipboardDataIcon />{" "}
                {tl({ zh: "读取存档", en: "Load Save", ja: "記録読込" }, lang)}
              </Button>

              <Button
                id="btn-lobby-docs"
                className="ctrl-btn"
                onClick={() => setDocsOpen(true)}
              >
                <FlameFuelIcon />{" "}
                {tl({ zh: "查阅文档", en: "Field Manual", ja: "極秘資料" }, lang)}
              </Button>

              <Button
                id="btn-lobby-archive"
                className="ctrl-btn"
                onClick={onOpenArchive}
              >
                <ArchiveIcon />{" "}
                {tl(
                  {
                    zh: `图鉴 (${compendium.unlockedEndings.length}/7)`,
                    en: `Archive (${compendium.unlockedEndings.length}/7)`,
                    ja: `図鑑 (${compendium.unlockedEndings.length}/7)`
                  },
                  lang
                )}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Load / Import / Export Save Dossier Dialog */}
      <Dialog open={loadOpen} onOpenChange={setLoadOpen}>
        <DialogBackdrop />
        <DialogContent className="panel lobby-modal-panel" id="lobby-load-dialog">
          <div className="viewport-header" style={{ marginBottom: "8px" }}>
            <div>
              <DialogTitle>
                {tl(
                  {
                    zh: "ORD-OS 本地存档管理（IndexedDB / JSON 档案）",
                    en: "ORD-OS SHIFT STORAGE (INDEXEDDB / JSON DOSSIER)",
                    ja: "ORD-OS ローカル記録管理（IndexedDB / JSON）"
                  },
                  lang
                )}
              </DialogTitle>
              <DialogDescription>
                {tl(
                  {
                    zh: "所有班次进度自动保存在本地客户端数据库，可随时续玩、导出或导入备份。",
                    en: "All progress persists locally in your browser IndexedDB. Resume, export, or import shift backups.",
                    ja: "すべての進捗はブラウザの IndexedDB に保存され、再開・書き出し・読み込みが可能です。"
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
                {tl({ zh: "当前活跃槽位 // SLOT 01", en: "ACTIVE SHIFT SLOT // SLOT 01", ja: "保存済みスロット // SLOT 01" }, lang)}
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
                    zh: "当前本地数据库暂无进行中的班次存档。你可以直接开始新班次，或从磁盘导入先前导出的 .json 存档。",
                    en: "No active shift found in local IndexedDB. Start a new shift or import a previously exported .json dossier.",
                    ja: "現在アクティブなセーブデータはありません。新規開始するか、JSONバックアップを読み込んでください。"
                  },
                  lang
                )}
              </div>
            </div>
          )}

          <div className="dossier-section" style={{ marginBottom: 0 }}>
            <div className="section-kicker">
              {tl({ zh: "从文件导入班次档案 (.JSON)", en: "IMPORT SHIFT BACKUP (.JSON)", ja: "バックアップ読み込み (.JSON)" }, lang)}
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
        <DialogContent className="panel lobby-modal-panel lobby-docs-panel" id="lobby-docs-dialog">
          <div className="viewport-header" style={{ marginBottom: "8px" }}>
            <div>
              <DialogTitle>
                {tl(
                  {
                    zh: "ORD-OS 检疫操作手册 & 斯瓦尔巴机密简报",
                    en: "ORD-OS FIELD MANUAL & SVALBARD CLASSIFIED BRIEFING",
                    ja: "ORD-OS 検疫マニュアル & スヴァールバル極秘資料"
                  },
                  lang
                )}
              </DialogTitle>
              <DialogDescription>
                {tl(
                  {
                    zh: "文档编号 ORD-DOC-2036 // 仅限 0 号隔离岗亭值班员查阅",
                    en: "DOC REF ORD-DOC-2036 // EYES ONLY — QUARANTINE BOOTH 0 OPERATOR",
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
                          en: "Polar night 2036. After an ice-core breach, cognitive mimics infiltrated the station. As sole Operator #09 at Gate 0, you must screen 8 survivors across 5 nights behind double-glazed blast glass.",
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
                            zh: "每次高温净化（PURGE）消耗 1 FUEL。燃料归零会触发 -46°C 低温降压，传感器电量由 2 PWR 降至 1 PWR。",
                            en: "Each PURGE costs 1 FUEL. Reaching 0 FUEL triggers -46°C cryo-brownout, dropping sensor capacitors from 2 PWR to 1 PWR.",
                            ja: "焼却（PURGE）ごとに 1 FUEL 消費。ゼロになると氷点下電圧低下が発生し、センサー電力が 1 PWR に低下する。"
                          },
                          lang
                        )}
                      </li>
                      <li>
                        <strong>{tl({ zh: "救生潜艇 Nautilus-0", en: "Rescue Sub Nautilus-0", ja: "脱出潜水艦 Nautilus-0" }, lang)}</strong>：
                        {tl(
                          {
                            zh: "撤离至少需要 3 名真人幸存者，且必须集齐「医疗官 + 轮机师 + 深潜员」三类核心专家；一旦放进任何一名拟态体，第 5 夜将触发内舱破门。",
                            en: "Launch requires at least 3 live humans covering Medical, Mechanic, and Diver roles. Admitting even a single mimic compromises the inner airlock on Night 5.",
                            ja: "出航には生身の生存者3名以上、かつ医療官・機関士・潜水士の全職種が必要。擬態体を1体でも通すと第5夜に内扉が突破される。"
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
                          zh: "不要考工号、密码或技术参数（trivia）——拟态体完整窃取了宿主的表层记忆。真正无法复制的，是宿主在极端冲突中的真实价值排序（v-1 / v-2）与事后开脱惯性（处置签名）。",
                          en: "Never waste turns on passcodes or handbook trivia—mimics copy surface memory intact. What they fail to reproduce are the host's true crisis value orderings (v-1, v-2) and post-hoc justification signature.",
                          ja: "社員番号や技術知識（trivia）で試すな——擬態体は表層記憶を完全に複製している。見破る鍵は危機時の価値順位（v-1/v-2）と言い訳の署名（処置署名）だ。"
                        },
                        lang
                      )}
                    </p>
                    <ul>
                      <li><strong>Night 1（低阶）</strong>：{tl({ zh: "只会复读宿主嘴上标榜却从未赢过的自我美化叙事（neverWon）。", en: "Recites the host's flattering self-narrative (neverWon) instead of real actions.", ja: "実際の行動ではなく宿主の建前（neverWon）を復唱する。" }, lang)}</li>
                      <li><strong>Night 2（中阶）</strong>：{tl({ zh: "吞下了主轴愧疚记忆（v-1），必须深挖次冲突轴（v-2）才会露馅。", en: "Passes primary axis (v-1); must be pressed on the secondary ordering (v-2).", ja: "第1軸（v-1）は通過する。第2対立軸（v-2）を突いて見抜け。" }, lang)}</li>
                      <li><strong>Night 3（磁暴黑障）</strong>：{tl({ zh: "光学、热成像与 ECG 心率全部离线，纯靠无线电推理（警惕反直觉的冷酷认账型真人）。", en: "Strobe, thermal, and ECG all go offline in the geomagnetic storm—pure audio deduction.", ja: "磁気嵐により全センサーとECGが停止。対話のみで推論せよ。" }, lang)}</li>
                      <li><strong>Night 4（高阶 Boggart 陷阱）</strong>：{tl({ zh: "价值排序全对，需追问处置签名或主动拆掉借口依赖的外部前提（disposalRequires）：真人会破防直面核心，拟态体只会机械复读失效借口。", en: "Passes all value axes—expose them by probing disposal signature or stripping their excuse's precondition (disposalRequires).", ja: "価値順位は完璧。処置署名を問うか、言い訳の前提条件（disposalRequires）を剥奪して破綻を引き出せ。" }, lang)}</li>
                    </ul>
                  </TabsPanel>

                  <TabsPanel value="cardiac" className="docs-article">
                    <h3>{tl({ zh: "Claude 多轮自由审讯 & 确定性心率佐证", en: "Claude Multi-Turn Interrogation & Cardiac Telemetry", ja: "Claude 自由対話尋問 & 心拍テレメトリ" }, lang)}</h3>
                    <ul>
                      <li>
                        <strong>{tl({ zh: "4 次有效追问 + 3 次闲聊额度", en: "4 Core Turns + 3 Chatter Budget", ja: "有効尋問4回 + 雑談枠3回" }, lang)}</strong>：
                        {tl(
                          {
                            zh: "你可以自由打字盘问、诈唬或援引档案细节（o-01/o-02）。未触及核心冲突轴的试探优先消耗 3 次闲聊额度，不白扣有效审讯回合。",
                            en: "Type any custom interrogation question, bluff, or cite dossier observations (o-01/o-02). Off-axis warmups consume the 3 chatter budget first.",
                            ja: "自由入力で追及・揺さぶり・調書引用が可能。本題外の探りは雑談枠3回を先に消費する。"
                          },
                          lang
                        )}
                      </li>
                      <li>
                        <strong>{tl({ zh: "心率只做佐证（1 PWR 应激回放）", en: "Cardiac Corroboration (1 PWR Stress Replay)", ja: "心拍は裏付け（1 PWR ストレス再生）" }, lang)}</strong>：
                        {tl(
                          {
                            zh: "真人在真实利害冲突轴上会产生显著肾上腺素飙升并缓慢回落；伪人只在它立场失真的那条轴上出现“言辞与心率脱节”或“瞬间归零”。消耗 1 PWR（快捷键 R）可回看逐轮心率异常标注。",
                            en: "Humans surge with adrenaline on real stake axes and decay gradually. Mimics exhibit flat pulse mismatch or instant snap-back ONLY on the axis where their stance fails. Spend 1 PWR (R) to inspect the per-turn stress trace.",
                            ja: "生身は本音の対立軸で急上昇し緩やかに戻る。擬態体は立場が破綻した軸でのみ平坦化や瞬間復帰を示す。1 PWR（R）でターン別履歴を照合可能。"
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
                          zh: "你在第 0 夜入职测验里说的话（SAY），以及你在第 1–4 夜危机、值班日志中的实际抉择（DO），都将被 ORD-OS 忠实记录。第 5 夜窗外站着与你口述 99.98% 吻合的完美替身——唯有活人才会与自己曾说过的话产生言行差。",
                          en: "Your Night 0 intake words (SAY) and your real crisis/verdict actions across Nights 1–4 (DO) are recorded by ORD-OS. On Night 5, a 99.98% match stands outside the glass—only the living contradict their own words.",
                          ja: "第0夜の建前（SAY）と第1〜4夜の実行動（DO）は全て記録される。第5夜、窓の外に99.98%一致する自分の影が現れる——生身の人間だけが自分の言葉と食い違う。"
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
