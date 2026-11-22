/// <reference types="vite/client" />
import { Button } from "@ui-sdk/react/button";
import { Meter, MeterIndicator, MeterTrack } from "@ui-sdk/react/meter";
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport
} from "@ui-sdk/react/scroll-area";
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs";
import { Toggle } from "@ui-sdk/react/toggle";
import { useState } from "react";
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
    zh: "真人幸存者。回答与档案里的过往行为、真实处事方式完全一致。",
    en: "Human survivor. Responses matched their recorded past actions and genuine priorities.",
    ja: "生身の生存者。回答が過去の行動記録と本音の価値基準に一致。"
  },
  LOW_SELF_NARRATIVE: {
    zh: "低阶伪人：只会复读宿主嘴上标榜、实际从未做到过的体面话。",
    en: "Low-tier mimic: only repeated flattering claims the host preached aloud but never actually lived by.",
    ja: "低階擬態体：宿主が口先だけで語り、一度も実行していない建前を復唱した。"
  },
  MID_SECOND_AXIS: {
    zh: "中阶伪人：藏住了第一个痛点，但在深挖第二处矛盾时露出了装好人的马脚。",
    en: "Mid-tier mimic: hid the surface contradiction, but reverted to fake altruism when pressed on a second dilemma.",
    ja: "中階擬態体：最初の矛盾は隠したが、2つ目のジレンマを突かれると建前に戻った。"
  },
  HIGH_WRONG_DISPOSAL: {
    zh: "高阶伪人：前半段伪装极像，但拆掉借口依赖的退路后仍机械重复失效辩解。",
    en: "High-tier mimic: nearly indistinguishable until stripped of their favorite excuse's safety net.",
    ja: "高階擬態体：前半の擬態は完璧だったが、言い訳の退路を絶つと無効な弁明を機械的に繰り返した。"
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
  const [selectedPipelineStage, setSelectedPipelineStage] = useState<string | null>(null);
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
          {import.meta.env?.DEV ? (
            <TabsTab
              value="inspector"
              className={`tab-btn ${activeTab === "inspector" ? "active" : ""}`}
            >
              {tl(UI_STRINGS.tabInspector, lang)}
            </TabsTab>
          ) : null}
          <TabsIndicator className="tab-indicator" />
        </TabsList>

        <TabsPanel value="baseline">
          <ScrollArea className="gta-dossier-scroll" type="auto">
            <ScrollAreaViewport>
              <ScrollAreaContent className="tab-panel-body">
            <div className="dossier-section">
              <div className="section-kicker">
                {tl(
                  {
                    zh: `第 ${visitor.night} 夜 // 检疫档案 · ${visitor.id}`,
                    en: `NIGHT ${visitor.night} // QUARANTINE DOSSIER · ${visitor.id}`,
                    ja: `第 ${visitor.night} 夜 // 検疫調書 · ${visitor.id}`
                  },
                  lang
                )}
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
                    <span className="axis-tag say">
                      {tl({ zh: "嘴上常挂（从未做到）", en: "CLAIMS · NEVER DID", ja: "口癖 · 実行0回" }, lang)}
                    </span>
                    {gap.neverWon.map((tok) => (
                      <span key={tok} className="value-pill never-won">
                        {VALUE_I18N[tok][lang]}
                      </span>
                    ))}
                  </div>
                  {arcUnlocked ? (
                    <div className="pill-row">
                      <span className="axis-tag do">
                        {tl({ zh: "真实底色", en: "TRUE PRIORITY", ja: "本当の優先" }, lang)}
                      </span>
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
                <span className="metric-chip amber">
                  {tl(
                    { zh: `第 ${visitor.night} 夜`, en: `NIGHT 0${visitor.night}`, ja: `第${visitor.night}夜` },
                    lang
                  )}
                </span>
                <span className="metric-chip">
                  {tl({ zh: `记录 ${factCount}`, en: `RECORDS ${factCount}`, ja: `記録 ${factCount}` }, lang)}
                </span>
                <span className="metric-chip">
                  {tl({ zh: `口述 ${sayCount}`, en: `QUOTES ${sayCount}`, ja: `口述 ${sayCount}` }, lang)}
                </span>
              </div>
            </div>

            {!arcUnlocked && !dispUnlocked ? (
              <div className="iso-lock-grid">
                <IsometricLockedModule id="arc-locked" tier={2} night={2} kind="crystal" lang={lang} />
                <IsometricLockedModule id="disp-locked" tier={4} night={4} kind="boggart" lang={lang} />
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
                                &gt; {VALUE_I18N[loser][lang]}
                              </span>
                              <Meter
                                className="ordering-meter"
                                value={confPct}
                                min={0}
                                max={100}
                                aria-label={`${VALUE_I18N[o.winner][lang]} ${confPct}%`}
                              >
                                <MeterTrack>
                                  <MeterIndicator />
                                </MeterTrack>
                              </Meter>
                            </div>
                            <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{confPct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: "10px" }}>
                    <IsometricLockedModule id="arc-locked" tier={2} night={2} kind="crystal" lang={lang} />
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
                        {tl({ zh: "借口前提：", en: "EXCUSE DEPENDS ON: ", ja: "言い訳の前提：" }, lang)}
                        {tl(visitor.disposalRequiresLocalized, lang)}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div style={{ marginBottom: "10px" }}>
                    <IsometricLockedModule id="disp-locked" tier={4} night={4} kind="boggart" lang={lang} />
                  </div>
                )}
              </>
            )}

            <div className="dossier-section" style={{ marginBottom: 0 }}>
              <div className="section-kicker">{tl(UI_STRINGS.evHeader, lang)}</div>
              <div id="ord-evidence-list">
                {visitor.evidenceCards.map((ev, evIdx) => {
                  const raw = tl(ev.text, lang);
                  const kw = ev.kw ? tl(ev.kw, lang) : "";
                  const idx = kw ? raw.indexOf(kw) : -1;
                  const tagText =
                    ev.type === "say"
                      ? tl({ zh: "口述", en: "QUOTE", ja: "口述" }, lang)
                      : tl({ zh: `记录 ${evIdx + 1}`, en: `REC ${evIdx + 1}`, ja: `記録 ${evIdx + 1}` }, lang);
                  return (
                    <div
                      key={ev.id}
                      className="evidence-card"
                      style={{ opacity: ev.type === "say" ? 0.82 : 1 }}
                    >
                      <span className={`ev-tag ${ev.type === "say" ? "say" : "fact"}`}>
                        {tagText}
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
                <div className="section-kicker">
                  {tl(
                    {
                      zh: "甄别指南 // 真人认账 · 伪人装圣人",
                      en: "HOW TO SPOT A MIMIC",
                      ja: "見抜き方 // 人間は本音 · 擬態体は建前"
                    },
                    lang
                  )}
                </div>
                <ForensicContrastSchematic lang={lang} />
              </div>
            ) : null}
              </ScrollAreaContent>
            </ScrollAreaViewport>
            <ScrollAreaScrollbar orientation="vertical" className="gta-dossier-scrollbar">
              <ScrollAreaThumb className="gta-dossier-thumb" />
            </ScrollAreaScrollbar>
          </ScrollArea>
        </TabsPanel>

        <TabsPanel value="verdict">
          <ScrollArea className="gta-dossier-scroll" type="auto">
            <ScrollAreaViewport>
              <ScrollAreaContent className="tab-panel-body">
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
                        {verdictCorrect
                          ? tl({ zh: "裁决准确 // OK", en: "VERIFIED // OK", ja: "判定正確 // OK" }, lang)
                          : tl({ zh: "裁决失误 // 漏放或误杀", en: "MISJUDGED // LOSS", ja: "判定ミス // LOSS" }, lang)}
                      </span>
                      <span className="metric-chip">
                        {tl({ zh: `裁决: ${verdictState}`, en: `CALL: ${verdictState}`, ja: `判定: ${verdictState}` }, lang)}
                      </span>
                      <span className="metric-chip">
                        {tl({ zh: `回合: ${turnsUsed}/4`, en: `TURNS: ${turnsUsed}/4`, ja: `ターン: ${turnsUsed}/4` }, lang)}
                      </span>
                      <span className="metric-chip">
                        {tl({ zh: `离题: ${offAxisCount}`, en: `OFF-AXIS: ${offAxisCount}`, ja: `軸外: ${offAxisCount}` }, lang)}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.79rem", marginTop: "6px", color: "var(--text-secondary)" }}>
                    {tl(DEFECT_EXPLANATIONS[roll.defectMode], lang)}
                  </div>
                </div>

                <div className="dossier-section">
                  <div className="section-kicker">
                    {tl(
                      {
                        zh: "档案底色 vs 刚才的回答",
                        en: "FILE RECORD vs LIVE ANSWER",
                        ja: "記録上の本音 vs 今回の回答"
                      },
                      lang
                    )}
                  </div>
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
                        zh: "签署值班记录（系统会记住你的理由）",
                        en: "SIGN SHIFT LOG (YOUR REASON IS RECORDED)",
                        ja: "当直日誌に署名（判断理由が記録されます）"
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
              </ScrollAreaContent>
            </ScrollAreaViewport>
            <ScrollAreaScrollbar orientation="vertical" className="gta-dossier-scrollbar">
              <ScrollAreaThumb className="gta-dossier-thumb" />
            </ScrollAreaScrollbar>
          </ScrollArea>
        </TabsPanel>

        {import.meta.env?.DEV ? (
          <TabsPanel value="inspector">
          <div className="tab-panel-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span className="section-kicker" style={{ marginBottom: 0 }}>
                {tl(
                  {
                    zh: "5 阶段确定性立场 + 零泄露 FLASH 管线",
                    en: "5-STAGE DETERMINISTIC STANCE + ZERO-LEAKAGE FLASH PIPELINE",
                    ja: "5段階決定論的立場 + ゼロ漏洩 FLASH パイプライン"
                  },
                  lang
                )}
              </span>
              {import.meta.env?.DEV ? (
                <Toggle
                  pressed={spoilerOpen}
                  onPressedChange={() => onToggleSpoiler()}
                  className="ctrl-btn"
                >
                  {spoilerOpen
                    ? tl({ zh: "隐藏底牌", en: "Hide Hidden Roll", ja: "裏設定を隠す" }, lang)
                    : tl({ zh: "揭示隐藏底牌", en: "Reveal Hidden Roll", ja: "裏設定を表示" }, lang)}
                </Toggle>
              ) : null}
            </div>
            <PipelineFirewallSchematic
              revealed={(import.meta.env?.DEV && spoilerOpen) || verdictDone}
              flashEnabled={flashEnabledInTrace}
              hasPayload={hasPipelineTrace}
              lang={lang}
              activeStage={selectedPipelineStage}
              onSelectStage={(id) => setSelectedPipelineStage((prev) => (prev === id ? null : id))}
            />
            {selectedPipelineStage ? (
              <div className="pipeline-stage-note">
                {selectedPipelineStage === "axis"
                  ? tl({ zh: "[01 AXIS] 识别问题所属轴向（v-1 / v-2 / sig-1 / boggart）。", en: "[01 AXIS] Classifies question axis (v-1 / v-2 / sig-1 / boggart).", ja: "[01 AXIS] 質問の軸（v-1 / v-2 / sig-1 / boggart）を判定。" }, lang)
                  : selectedPipelineStage === "stance"
                    ? tl({ zh: "[02 STANCE] 由 ORDAMOR v6 规则引擎决定访客坚持の価値取向与基准台词。", en: "[02 STANCE] ORDAMOR v6 deterministically picks stance & canonical line.", ja: "[02 STANCE] ORDAMOR v6 が立場と基準文を決定。" }, lang)
                    : selectedPipelineStage === "firewall"
                      ? tl({ zh: "[FIREWALL] 强制剥离 isMimic / defectMode / lineKey，严禁向 LLM 泄密。", en: "[FIREWALL] Strips isMimic / defectMode / lineKey before LLM call.", ja: "[FIREWALL] isMimic / defectMode / lineKey を遮断。" }, lang)
                      : selectedPipelineStage === "clean"
                        ? tl({ zh: "[03 CLEAN] 仅发送脱敏后的角色口吻、标准台词与立场选择。", en: "[03 CLEAN] Sends sanitized persona voice, canonical line & stance only.", ja: "[03 CLEAN] 無害化済みの口調・基準文・立場のみ送信。" }, lang)
                        : tl({ zh: "[05 OUTPUT] 在线 Flash 润色或 0ms 本地确定性回退。", en: "[05 OUTPUT] Live Flash rephrase or 0ms canonical fallback.", ja: "[05 OUTPUT] Flash 改稿または 0ms ローカルフォールバック。" }, lang)}
              </div>
            ) : null}
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
        ) : null}
      </Tabs>
    </aside>
  );
}
