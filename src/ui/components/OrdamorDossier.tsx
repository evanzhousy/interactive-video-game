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
import { MindCrystalCanvas, type ChordArc, type OverlayArc } from "./MindCrystalCanvas.js";

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
  lastPipelinePayload
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
    if (spoilerOpen || verdictDone) return lastPipelinePayload;
    const copy = JSON.parse(JSON.stringify(lastPipelinePayload)) as Record<string, unknown>;
    if ("2_stance_engine" in copy) copy["2_stance_engine"] = "[REDACTED UNTIL VERDICT]";
    if (typeof copy["3_llm_visible_input"] === "object" && copy["3_llm_visible_input"] !== null) {
      (copy["3_llm_visible_input"] as Record<string, unknown>).stance = "[REDACTED UNTIL VERDICT]";
    }
    return copy;
  })();

  return (
    <aside className="panel" id="ordamor-dossier">
      <div className="tab-strip">
        <button
          type="button"
          className={`tab-btn ${activeTab === "baseline" ? "active" : ""}`}
          onClick={() => onSelectTab("baseline")}
        >
          {tl(UI_STRINGS.tabBaseline, lang)}
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "verdict" ? "active" : ""}`}
          onClick={() => onSelectTab("verdict")}
        >
          {tl(UI_STRINGS.tabVerdict, lang)}
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "inspector" ? "active" : ""}`}
          onClick={() => onSelectTab("inspector")}
        >
          {tl(UI_STRINGS.tabInspector, lang)}
        </button>
      </div>

      {activeTab === "baseline" ? (
        <div>
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
                  ⚓ {tl(SPECIALIST_LABELS[VISITOR_SPECIALIST_ROLES[visitor.id]!], lang)}
                </span>
              ) : null}
            </div>

            {gap ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div className="pill-row" id="never-won-pills">
                  <span style={{ color: "var(--text-muted)" }}>
                    {tl(UI_STRINGS.neverWonLabel, lang)}
                  </span>
                  {gap.neverWon.map((tok) => (
                    <span key={tok} className="value-pill never-won">
                      {VALUE_I18N[tok][lang]}
                    </span>
                  ))}
                </div>
                {arcUnlocked ? (
                  <div className="pill-row">
                    <span style={{ color: "var(--text-muted)" }}>
                      {tl(UI_STRINGS.silentLabel, lang)}
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
          </div>

          {arcUnlocked ? (
            <div className="dossier-section" id="arc-box">
              <div className="section-kicker">{tl(UI_STRINGS.arcCaption, lang)}</div>
              <MindCrystalCanvas
                id="ordamor-arc-canvas"
                orderings={chordArcs}
                neverWon={gap?.neverWon ?? []}
                lang={lang}
              />
              <div>
                {visitor.profile.valueOrderings.slice(0, 2).map((o) => {
                  const loser = otherValue(o.pair, o.winner);
                  return (
                    <div key={o.id} className="ordering-row">
                      <span>
                        <strong style={{ color: "var(--amber-crt)" }}>
                          {VALUE_I18N[o.winner][lang]}
                        </strong>{" "}
                        &gt; {VALUE_I18N[loser][lang]} ({o.id} · {o.confidence.toFixed(2)})
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>{o.evidence.join(" · ")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="locked-notice" id="arc-locked">
              {tl(
                {
                  zh: "🔒 心智晶体弧线将于第 2 夜解锁（第 1 夜请直接对比下方客观事实记录 o-N 与嘴上标榜的言行差）。",
                  en: "🔒 MindCrystal arcs unlock on Night 2 (on Night 1, contrast the SAY pills above directly against Observations o-N below).",
                  ja: "🔒 心智結晶アークは第2夜で解禁（第1夜は上の建前と下の客観記録 o-N を直接比較せよ）。"
                },
                lang
              )}
            </div>
          )}

          {dispUnlocked ? (
            <div className="dossier-section" id="disp-box">
              <div className="section-kicker">{tl(UI_STRINGS.dispHeader, lang)}</div>
              <div style={{ fontWeight: 700, color: "var(--amber-crt)", fontSize: "0.86rem" }}>
                {tl(visitor.disposalTitle, lang)}
              </div>
              <p style={{ fontSize: "0.79rem", color: "var(--text-secondary)", margin: "5px 0" }}>
                {tl(visitor.disposalSummary, lang)}
              </p>
              {primaryOrderingNeed ? (
                <div
                  id="disposal-requires-tag"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.74rem",
                    padding: "5px 8px",
                    borderRadius: "5px",
                    background: "var(--amber-soft)",
                    color: "var(--amber-crt)"
                  }}
                >
                  disposalRequires: {tl(visitor.disposalRequiresLocalized, lang)}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="locked-notice" id="disp-locked">
              {tl(
                {
                  zh: "🔒 处置签名与 Boggart 退路前提 (disposalRequires) 将于第 4 夜高阶拟态体解锁。",
                  en: "🔒 Disposal Signature & Boggart Precondition (disposalRequires) unlock on Night 4.",
                  ja: "🔒 処置署名および退路前提条件 (disposalRequires) は第4夜で解禁。"
                },
                lang
              )}
            </div>
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
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        color: ev.type === "say" ? "var(--text-muted)" : "var(--amber-crt)",
                        marginRight: "6px"
                      }}
                    >
                      {ev.type === "say" ? "[SAY]" : `[${ev.id}]`}
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
        </div>
      ) : null}

      {activeTab === "verdict" ? (
        <div>
          {!verdictDone ? (
            <div className="locked-notice">
              {tl(
                {
                  zh: "尚未拉下气闸或净化闸。完成审讯裁决后在此查看心智晶体叠图复盘并签署值班日志。",
                  en: "Make an ADMIT or PURGE decision first to inspect the MindCrystal overlay and sign your shift log.",
                  ja: "通過または焼却の判定を下すと、ここに比較アークと勤務日誌が表示される。"
                },
                lang
              )}
            </div>
          ) : (
            <div>
              <div className="dossier-section">
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    color: verdictCorrect ? "var(--safe-admit)" : "var(--danger-purge)"
                  }}
                >
                  {verdictCorrect ? "AUDIT VERIFIED · CORRECT CALL" : "FATAL MISJUDGEMENT · CREW LOSS"}
                </div>
                <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>
                  {tl(DEFECT_EXPLANATIONS[roll.defectMode], lang)}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    marginTop: "6px"
                  }}
                >
                  DECISION: {verdictState} · QUESTIONS USED: {turnsUsed}/4 · OFF-AXIS: {offAxisCount}
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
                />
              </div>

              <div className="dossier-section" id="shift-log-box">
                <div className="section-kicker">
                  {tl(
                    {
                      zh: "签署今晚值班日志（不标价值标签 · 你的开脱措辞将作为外部证据进入 ORD-OS）：",
                      en: "SIGN SHIFT LOG (Unlabeled — your justification style is recorded as ORD-OS evidence):",
                      ja: "今夜の勤務日誌に署名（言い訳の型がORD-OSの証拠として記録される）："
                    },
                    lang
                  )}
                </div>
                {SHIFT_EXCUSES.map((ex, i) => (
                  <button
                    key={ex.id}
                    type="button"
                    disabled={logSigned}
                    className="option-card"
                    onClick={() => onSignShiftLog(i)}
                  >
                    {tl(ex.label, lang)}
                  </button>
                ))}

                {logSigned ? (
                  <button
                    id="btn-next-visitor"
                    type="button"
                    className="ctrl-btn amber"
                    style={{ width: "100%", marginTop: "10px", padding: "10px", fontWeight: 700 }}
                    onClick={onNextVisitor}
                  >
                    {isLastVisitor
                      ? tl(UI_STRINGS.finishShiftBtn, lang)
                      : tl(UI_STRINGS.nextVisitorBtn, lang)}
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "inspector" ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span className="section-kicker" style={{ marginBottom: 0 }}>
              5-STAGE DETERMINISTIC STANCE + ZERO-LEAKAGE FLASH PIPELINE
            </span>
            <button type="button" className="ctrl-btn" onClick={onToggleSpoiler}>
              {spoilerOpen ? "Hide Hidden Roll" : "Reveal Hidden Roll"}
            </button>
          </div>
          <pre className="code-inspector" id="inspector-json">
            {JSON.stringify(
              {
                active_visitor_id: visitor.id,
                ordamor_schema_version: visitor.profile.schemaVersion,
                engine_only_hidden_roll:
                  spoilerOpen || verdictDone
                    ? roll
                    : { isMimic: "REDACTED_UNTIL_VERDICT", defectMode: "REDACTED" },
                last_turn_pipeline: redactedPipeline
              },
              null,
              2
            )}
          </pre>
        </div>
      ) : null}
    </aside>
  );
}
