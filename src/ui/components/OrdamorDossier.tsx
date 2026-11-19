/// <reference types="vite/client" />
import { Button } from "@ui-sdk/react/button";
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs";
import { Toggle } from "@ui-sdk/react/toggle";
import { SPECIALIST_LABELS, VISITOR_SPECIALIST_ROLES } from "../../game/economy.js";
import { UI_STRINGS, VALUE_I18N, tl } from "../../game/i18n.js";
import { SHIFT_EXCUSES } from "../../game/night5.js";
import type {
  DefectMode,
  Locale,
  LocalizedText,
  VisitorRoll,
  VisitorSpec
} from "../../game/types.js";
import { escapeRoutes, justificationGap, otherValue } from "../../ordamor/index.js";
import { SubHullIcon } from "./Icons.js";
import { MindCrystalCanvas, type ChordArc, type OverlayArc } from "./MindCrystalCanvas.js";
import {
  BoggartTrapSchematic,
  ForensicContrastSchematic,
  IsometricLockedModule,
  PipelineFirewallSchematic,
  StandbyVerdictSchematic,
  VerdictSealStamp
} from "./Schematics.js";

export type DossierTab = "baseline" | "verdict" | "inspector";

interface Props {
  visitor: VisitorSpec;
  roll: VisitorRoll;
  lang: Locale;
  activeTab: DossierTab;
  onSelectTab: (tab: DossierTab) => void;
  verdictState: "NONE" | "ADMIT" | "PURGE";
  turnsUsed: number;
  offAxisCount: number;
  logSigned: boolean;
  onSignShiftLog: (excuseIdx: number) => void;
  onNextVisitor: () => void;
  isLastVisitor: boolean;
  spoilerOpen: boolean;
  onToggleSpoiler: () => void;
  lastPipelinePayload: Record<string, unknown>;
  motionPaused?: boolean;
}

const DEFECT_EXPLANATIONS: Record<DefectMode, LocalizedText> = {
  HUMAN: {
    zh: "真人幸存者。回答立场与 ORD-OS 外部事实链 (o-N) 及处置签名一致。",
    en: "Human survivor. Stance matched external observations (o-N) and disposal signature.",
    ja: "生身の生存者。回答の立場が外部行動記録 (o-N) および処置署名と一致。"
  },
  LOW_SELF_NARRATIVE: {
    zh: "低阶寄生体：复述了宿主嘴上标榜却从未赢过的自我美化叙事 (neverWon)。",
    en: "Low-tier mimic: recited the host's flattering self-narrative (neverWon) instead of real actions.",
    ja: "低階擬態体：実際の行動ではなく、宿主の建前の価値 (neverWon) を復唱した。"
  },
  MID_SECOND_AXIS: {
    zh: "中阶寄生体：吞下了首条愧疚记忆 (v-1)，但在次条冲突轴 (v-2) 仍退回自我叙事。",
    en: "Mid-tier mimic: absorbed primary guilty memory (v-1), but reverted to self-narrative on v-2.",
    ja: "中階擬態体：第1軸 (v-1) は通過したが、第2対立軸 (v-2) で建前に戻った。"
  },
  HIGH_WRONG_DISPOSAL: {
    zh: "高阶寄生体：价值排序全对，但处置签名破功——拆掉退路前提 (disposalRequires) 后仍机械复读失效借口，或找错开脱方式。",
    en: "High-tier mimic: passed value orderings, but failed disposal signature—rigidly repeated an invalidated excuse once disposalRequires was removed, or used the wrong excuse.",
    ja: "高階擬態体：価値順位は一致したが処置署名で破綻——前提条件 (disposalRequires) 剥奪後も無効な言い訳を繰り返した。"
  }
};

export function OrdamorDossier({
  visitor,
  roll,
  lang,
  activeTab,
  onSelectTab,
  verdictState,
  turnsUsed,
  offAxisCount,
  logSigned,
  onSignShiftLog,
  onNextVisitor,
  isLastVisitor,
  spoilerOpen,
  onToggleSpoiler,
  lastPipelinePayload,
  motionPaused = false
}: Props) {
  const gap = justificationGap(visitor.profile);
  const routes = escapeRoutes(visitor.profile);
  const primaryOrderingNeed = routes.find((r) => r.kind === "ordering" && r.needs)?.needs;

  const chordArcs: ChordArc[] = visitor.profile.valueOrderings.map((o) => ({
    kept: o.winner,
    dropped: otherValue(o.pair, o.winner),
    weight: o.confidence
  }));

  const arcUnlocked = visitor.unlockTier >= 2;
  const dispUnlocked = visitor.unlockTier >= 4;
  const factCount = visitor.evidenceCards.filter((e) => e.type !== "say").length;
  const sayCount = visitor.evidenceCards.filter((e) => e.type === "say").length;
  const hasPipelineTrace = "1_axis_detection" in lastPipelinePayload;
  const flashMeta = lastPipelinePayload["5_flash_rephrase"] as { enabled?: boolean } | undefined;
  const flashEnabledInTrace = Boolean(flashMeta?.enabled);
  const verdictDone = verdictState !== "NONE";
  const verdictCorrect =
    verdictDone &&
    ((verdictState === "PURGE" && roll.isMimic) || (verdictState === "ADMIT" && !roll.isMimic));

  let verdictOverlays: OverlayArc[] = [];
  if (verdictDone && chordArcs[0]) {
    if (!roll.isMimic || roll.defectMode === "HIGH_WRONG_DISPOSAL") {
      verdictOverlays = [
        {
          kept: chordArcs[0].kept,
          dropped: chordArcs[0].dropped,
          mismatch: roll.isMimic,
          tag: roll.isMimic ? "WRONG_SIG" : "MATCH"
        }
      ];
    } else if (roll.defectMode === "LOW_SELF_NARRATIVE") {
      verdictOverlays = [
        {
          kept: chordArcs[0].dropped,
          dropped: chordArcs[0].kept,
          mismatch: true,
          tag: "SAY"
        }
      ];
    } else if (chordArcs[1]) {
      verdictOverlays = [
        {
          kept: chordArcs[1].dropped,
          dropped: chordArcs[1].kept,
          mismatch: true,
          tag: "AXIS_2"
        }
      ];
    }
  }

  const redactedPipeline = (() => {
    if ((import.meta.env?.DEV && spoilerOpen) || verdictDone) return lastPipelinePayload;
    const copy = JSON.parse(JSON.stringify(lastPipelinePayload)) as Record<string, unknown>;
    if ("2_stance_engine" in copy) copy["2_stance_engine"] = "[REDACTED UNTIL VERDICT]";
    if (typeof copy["3_llm_visible_input"] === "object" && copy["3_llm_visible_input"] !== null) {
      (copy["3_llm_visible_input"] as Record<string, unknown>).stance = "[REDACTED UNTIL VERDICT]";
    }
    return copy;
  })();

  return (
    <aside className="panel" id="ordamor-dossier">
      <Tabs
        value={activeTab}
        onValueChange={(next) => {
          if (next) onSelectTab(next as DossierTab);
        }}
      >
        <TabsList
          className="tab-strip"
          aria-label={tl(
            {
              zh: "ORD-OS 法医档案页签",
              en: "ORD-OS Forensic Dossier",
              ja: "ORD-OS 法医カルテ"
            },
            lang
          )}
        >
          <TabsTab value="baseline" className={`tab-btn ${activeTab === "baseline" ? "active" : ""}`}>
            {tl(UI_STRINGS.tabBaseline, lang)}
          </TabsTab>
          <TabsTab value="verdict" className={`tab-btn ${activeTab === "verdict" ? "active" : ""}`}>
            {tl(UI_STRINGS.tabVerdict, lang)}
          </TabsTab>
          <TabsTab
            value="inspector"
            className={`tab-btn ${activeTab === "inspector" ? "active" : ""}`}
          >
            {tl(UI_STRINGS.tabInspector, lang)}
          </TabsTab>
          <TabsIndicator className="tab-indicator" />
        </TabsList>

        <TabsPanel value="baseline">
          <div className="tab-panel-body">
            <div className="dossier-section">
              <div className="section-kicker">
                NIGHT {visitor.night} // FORENSIC LENS · SCHEMA v{visitor.profile.schemaVersion}
              </div>
              <div style={{ fontSize: "1.02rem", fontWeight: 700 }}>{tl(visitor.name, lang)}</div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.78rem",
                  color: "var(--text-secondary)",
                  marginBottom: "8px"
                }}
              >
                <span>{tl(visitor.role, lang)}</span>
                {VISITOR_SPECIALIST_ROLES[visitor.id] ? (
                  <span className="role-pill" data-specialist={VISITOR_SPECIALIST_ROLES[visitor.id]}>
                    <SubHullIcon /> {tl(SPECIALIST_LABELS[VISITOR_SPECIALIST_ROLES[visitor.id]!], lang)}
                  </span>
                ) : null}
              </div>

              {gap ? (
                <div className="axis-compare-bar">
                  <div className="pill-row" id="never-won-pills">
                    <span className="axis-tag say">SAY · 0W</span>
                    {gap.neverWon.map((tok) => (
                      <span key={tok} className="value-pill never-won">
                        {VALUE_I18N[tok][lang]}
                      </span>
                    ))}
                  </div>
                  {arcUnlocked ? (
                    <div className="pill-row">
                      <span className="axis-tag do">DO · CORE</span>
                      {gap.silent.map((tok) => (
                        <span key={tok} className="value-pill silent">
                          {VALUE_I18N[tok][lang]}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="dossier-telemetry-strip" aria-label="Dossier Telemetry">
                <span className="metric-chip amber">TIER-0{visitor.unlockTier}</span>
                <span className="metric-chip">FACT {factCount}</span>
                <span className="metric-chip">SAY {sayCount}</span>
                <span className="metric-chip">AXES {visitor.profile.valueOrderings.length}</span>
              </div>
            </div>

            {!arcUnlocked && !dispUnlocked ? (
              <div className="iso-lock-grid">
                <IsometricLockedModule id="arc-locked" tier={2} night={2} kind="crystal" />
                <IsometricLockedModule id="disp-locked" tier={4} night={4} kind="boggart" />
              </div>
            ) : (
              <>
                {arcUnlocked ? (
                  <div className="dossier-section" id="arc-box">
                    <div className="section-kicker">{tl(UI_STRINGS.arcCaption, lang)}</div>
                    <MindCrystalCanvas
                      id="ordamor-arc-canvas"
                      orderings={chordArcs}
                      neverWon={gap?.neverWon ?? []}
                      lang={lang}
                      motionPaused={motionPaused}
                    />
                    <div>
                      {visitor.profile.valueOrderings.slice(0, 2).map((o) => {
                        const loser = otherValue(o.pair, o.winner);
                        const confPct = Math.round(o.confidence * 100);
                        return (
                          <div key={o.id} className="ordering-row">
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1, minWidth: 0 }}>
                              <span>
                                <strong style={{ color: "var(--amber-crt)" }}>
                                  {VALUE_I18N[o.winner][lang]}
                                </strong>{" "}
                                &gt; {VALUE_I18N[loser][lang]} ({o.id} · {o.confidence.toFixed(2)})
                              </span>
                              <div className="ordering-bar-track" aria-hidden="true">
                                <div className="ordering-bar-fill" style={{ width: `${confPct}%` }} />
                              </div>
                            </div>
                            <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{o.evidence.join(" · ")}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: "10px" }}>
                    <IsometricLockedModule id="arc-locked" tier={2} night={2} kind="crystal" />
                  </div>
                )}

                {dispUnlocked ? (
                  <div className="dossier-section" id="disp-box">
                    <div className="section-kicker">{tl(UI_STRINGS.dispHeader, lang)}</div>
                    <div style={{ fontWeight: 700, color: "var(--amber-crt)", fontSize: "0.86rem" }}>
                      {tl(visitor.disposalTitle, lang)}
                    </div>
                    <p style={{ fontSize: "0.79rem", color: "var(--text-secondary)", margin: "5px 0 7px" }}>
                      {tl(visitor.disposalSummary, lang)}
                    </p>
                    <BoggartTrapSchematic lang={lang} />
                    {primaryOrderingNeed ? (
                      <div
                        id="disposal-requires-tag"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.74rem",
                          padding: "5px 8px",
                          background: "var(--amber-soft)",
                          color: "var(--amber-crt)"
                        }}
                      >
                        disposalRequires: {tl(visitor.disposalRequiresLocalized, lang)}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div style={{ marginBottom: "10px" }}>
                    <IsometricLockedModule id="disp-locked" tier={4} night={4} kind="boggart" />
                  </div>
                )}
              </>
            )}

            <div className="dossier-section" style={{ marginBottom: 0 }}>
              <div className="section-kicker">{tl(UI_STRINGS.evHeader, lang)}</div>
              <div id="ord-evidence-list">
                {visitor.evidenceCards.map((ev) => {
                  const raw = tl(ev.text, lang);
                  const kw = ev.kw ? tl(ev.kw, lang) : "";
                  const idx = kw ? raw.indexOf(kw) : -1;
                  return (
                    <div
                      key={ev.id}
                      className="evidence-card"
                      style={{ opacity: ev.type === "say" ? 0.82 : 1 }}
                    >
                      <span className={`ev-tag ${ev.type === "say" ? "say" : "fact"}`}>
                        {ev.type === "say" ? "SAY" : ev.id.toUpperCase()}
                      </span>
                      {idx >= 0 ? (
                        <>
                          {raw.slice(0, idx)}
                          <mark>{kw}</mark>
                          {raw.slice(idx + kw.length)}
                        </>
                      ) : (
                        raw
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {!arcUnlocked ? (
              <div className="dossier-section" style={{ marginTop: "10px", marginBottom: 0 }}>
                <div className="section-kicker">FORENSIC PROTOCOL // SAY ≠ DO CONTRAST</div>
                <ForensicContrastSchematic lang={lang} />
              </div>
            ) : null}
          </div>
        </TabsPanel>

        <TabsPanel value="verdict">
          <div className="tab-panel-body">
            {!verdictDone ? (
              <StandbyVerdictSchematic lang={lang} />
            ) : (
              <div>
                <div className="dossier-section">
                  <div className="verdict-head-row">
                    <VerdictSealStamp correct={verdictCorrect} />
                    <div className="verdict-metrics-strip">
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          color: verdictCorrect ? "var(--safe-text)" : "var(--danger-text)"
                        }}
                      >
                        {verdictCorrect ? "VERIFIED // OK" : "MISJUDGED // LOSS"}
                      </span>
                      <span className="metric-chip">CALL: {verdictState}</span>
                      <span className="metric-chip">TURNS: {turnsUsed}/4</span>
                      <span className="metric-chip">OFF-AXIS: {offAxisCount}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.79rem", marginTop: "6px", color: "var(--text-secondary)" }}>
                    {tl(DEFECT_EXPLANATIONS[roll.defectMode], lang)}
                  </div>
                </div>

                <div className="dossier-section">
                  <div className="section-kicker">BASELINE CHORDS vs LIVE SUBJECT STANCE</div>
                  <MindCrystalCanvas
                    id="verdict-diff-canvas"
                    orderings={chordArcs}
                    neverWon={gap?.neverWon ?? []}
                    overlays={verdictOverlays}
                    lang={lang}
                    motionPaused={motionPaused}
                  />
                </div>

                <div className="dossier-section" id="shift-log-box">
                  <div className="section-kicker">
                    {tl(
                      {
                        zh: "SIGN LOG // 签署值班记录（计入 ORD-OS 行为档案 DO）",
                        en: "SIGN LOG // RECORDED AS ORD-OS DO EVIDENCE",
                        ja: "SIGN LOG // ORD-OS 行動証拠として記録"
                      },
                      lang
                    )}
                  </div>
                  {SHIFT_EXCUSES.map((ex, i) => (
                    <Button
                      key={ex.id}
                      disabled={logSigned}
                      className="option-card"
                      onClick={() => onSignShiftLog(i)}
                    >
                      <span className="opt-index">0{i + 1}</span>
                      <span>{tl(ex.label, lang)}</span>
                    </Button>
                  ))}

                  {logSigned ? (
                    <Button
                      id="btn-next-visitor"
                      className="ctrl-btn amber"
                      style={{ width: "100%", marginTop: "10px", padding: "10px", fontWeight: 700 }}
                      onClick={onNextVisitor}
                    >
                      {isLastVisitor
                        ? tl(UI_STRINGS.finishShiftBtn, lang)
                        : tl(UI_STRINGS.nextVisitorBtn, lang)}
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </TabsPanel>

        <TabsPanel value="inspector">
          <div className="tab-panel-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span className="section-kicker" style={{ marginBottom: 0 }}>
                5-STAGE DETERMINISTIC STANCE + ZERO-LEAKAGE FLASH PIPELINE
              </span>
              {import.meta.env?.DEV ? (
                <Toggle
                  pressed={spoilerOpen}
                  onPressedChange={() => onToggleSpoiler()}
                  className="ctrl-btn"
                >
                  {spoilerOpen ? "Hide Hidden Roll" : "Reveal Hidden Roll"}
                </Toggle>
              ) : null}
            </div>
            <PipelineFirewallSchematic
              revealed={(import.meta.env?.DEV && spoilerOpen) || verdictDone}
              flashEnabled={flashEnabledInTrace}
              hasPayload={hasPipelineTrace}
            />
            <pre
              className="code-inspector"
              id="inspector-json"
              data-agent-hidden={!(import.meta.env?.DEV && spoilerOpen) && !verdictDone ? "" : undefined}
            >
              {JSON.stringify(
                {
                  active_visitor_id: visitor.id,
                  ordamor_schema_version: visitor.profile.schemaVersion,
                  engine_only_hidden_roll:
                    (import.meta.env?.DEV && spoilerOpen) || verdictDone
                      ? roll
                      : { isMimic: "REDACTED_UNTIL_VERDICT", defectMode: "REDACTED" },
                  last_turn_pipeline: redactedPipeline
                },
                null,
                2
              )}
            </pre>
          </div>
        </TabsPanel>
      </Tabs>
    </aside>
  );
}
