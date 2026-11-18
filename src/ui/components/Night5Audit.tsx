import { useEffect, useRef, useState } from "react";
import { playBoothSfx, speakIntercomLine, stopIntercomVoice } from "../../game/audio.js";
import type { CrisisHistoryEntry } from "../../game/crises.js";
import { REQUIRED_SUB_ROLES, SPECIALIST_LABELS } from "../../game/economy.js";
import { tl } from "../../game/i18n.js";
import {
  getNight5FrameSrc,
  getNight5VideoCandidates,
  type Night5VisualAction
} from "../../game/media.js";
import {
  CLASSIFIED_COMMAND_MEMO,
  ENDINGS,
  SIG_LABELS,
  buildNight5Probes,
  classifyNight5Question,
  evaluateNight5Audit,
  formatShareableShiftReport,
  resolveNight5Ending,
  resolveNight5KnockLine,
  type IntakeOption,
  type Night5ProbeId,
  type PlayerCompactProfile
} from "../../game/night5.js";
import { ACHIEVEMENTS, type AchievementId } from "../../game/storage.js";
import type { EndingId, Locale, LocalizedText, ShiftHistoryEntry } from "../../game/types.js";
import type { CampaignMode } from "../../game/visitors/index.js";
import { MindCrystalCanvas } from "./MindCrystalCanvas.js";

interface Night5ChatItem {
  speaker: "player" | "doppelganger" | "ordos";
  text: LocalizedText;
  exposed?: boolean;
}

interface Props {
  lang: Locale;
  sfx: boolean;
  voice: boolean;
  baseline: PlayerCompactProfile;
  intakeAnswers: readonly IntakeOption[];
  history: readonly ShiftHistoryEntry[];
  crisisHistory?: readonly CrisisHistoryEntry[];
  fuelLeft?: number;
  campaignMode?: CampaignMode;
  dailySeed?: string;
  onResolveEnding: (ending: EndingId) => AchievementId[];
  onStartNewRun: () => void;
  onClose: () => void;
}

export function Night5Audit({
  lang,
  sfx,
  voice,
  baseline,
  intakeAnswers,
  history,
  crisisHistory = [],
  fuelLeft = 2,
  campaignMode = "full",
  dailySeed,
  onResolveEnding,
  onStartNewRun,
  onClose
}: Props) {
  const [confess, setConfess] = useState(false);
  const [endingKey, setEndingKey] = useState<EndingId | null>(null);
  const [finalAction, setFinalAction] = useState<Night5VisualAction>("NONE");
  const [newBadges, setNewBadges] = useState<AchievementId[]>([]);
  const [idleVideoReady, setIdleVideoReady] = useState(false);
  const [verdictVideoReady, setVerdictVideoReady] = useState(false);

  const [n5TurnsLeft, setN5TurnsLeft] = useState(4);
  const [usedProbes, setUsedProbes] = useState<Night5ProbeId[]>([]);
  const [rebuttedCount, setRebuttedCount] = useState(0);
  const [flinchActive, setFlinchActive] = useState(false);
  const [draft, setDraft] = useState("");
  const [copiedReport, setCopiedReport] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);

  const audit = evaluateNight5Audit(baseline, history, undefined, crisisHistory, campaignMode);
  const probes = buildNight5Probes(baseline, history, crisisHistory);
  const { quote, knockSpeech, voiceLineId } = resolveNight5KnockLine(
    baseline,
    intakeAnswers,
    lang
  );

  const [chatItems, setChatItems] = useState<Night5ChatItem[]>(() => [
    {
      speaker: "doppelganger",
      text: {
        zh: `[KNOCK, KNOCK—] ${resolveNight5KnockLine(baseline, intakeAnswers, "zh").knockSpeech}`,
        en: `[KNOCK, KNOCK—] ${resolveNight5KnockLine(baseline, intakeAnswers, "en").knockSpeech}`,
        ja: `[KNOCK, KNOCK—] ${resolveNight5KnockLine(baseline, intakeAnswers, "ja").knockSpeech}`
      }
    }
  ]);

  useEffect(() => {
    if (typeof Image !== "undefined") {
      for (const action of ["NONE", "PURGE", "ADMIT", "STEP_OUT"] as const) {
        const img = new Image();
        img.src = getNight5FrameSrc(action);
      }
    }

    speakIntercomLine({
      visitorId: "OP-09",
      locale: lang,
      text: knockSpeech,
      lineId: voiceLineId,
      enabled: voice
    });
    return () => {
      stopIntercomVoice();
    };
    // Speak once when entering Night 5
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [chatItems.length]);

  const handleFireProbe = (probeId: Night5ProbeId, customQuestion?: string) => {
    if (n5TurnsLeft <= 0 || endingKey !== null) return;
    const spec = probes.find((p) => p.id === probeId) ?? probes[2]!;
    playBoothSfx("ptt", sfx);

    const playerLine: LocalizedText = customQuestion
      ? { zh: customQuestion, en: customQuestion, ja: customQuestion }
      : spec.label;

    setN5TurnsLeft((t) => t - 1);
    if (!usedProbes.includes(spec.id)) {
      setUsedProbes((prev) => [...prev, spec.id]);
    }

    if (spec.exposedContradiction) {
      playBoothSfx("heartbeat", sfx);
      setRebuttedCount((c) => c + 1);
      setFlinchActive(true);
      setTimeout(() => setFlinchActive(false), 520);
    }

    setChatItems((prev) => [
      ...prev,
      { speaker: "player", text: playerLine },
      { speaker: "doppelganger", text: spec.doppelgangerReply },
      { speaker: "ordos", text: spec.ordOsNote, exposed: spec.exposedContradiction }
    ]);

    speakIntercomLine({
      visitorId: "OP-09",
      locale: lang,
      text: tl(spec.doppelgangerReply, lang),
      lineId: voiceLineId,
      isDynamicFlash: true,
      enabled: voice
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = draft.trim();
    if (!val || n5TurnsLeft <= 0 || endingKey !== null) return;
    const detected = classifyNight5Question(val);
    handleFireProbe(detected, val);
    setDraft("");
  };

  const triggerChoice = (action: "PURGE" | "ADMIT" | "STEP_OUT") => {
    stopIntercomVoice();
    playBoothSfx(action === "PURGE" ? "purge" : "admit", sfx);
    const resolved = resolveNight5Ending(audit, action, confess);
    setVerdictVideoReady(false);
    setFinalAction(action);
    setEndingKey(resolved);
    const unlocked = onResolveEnding(resolved);
    setNewBadges(unlocked);
  };

  const handleCopyShiftReport = async () => {
    if (!endingKey) return;
    const text = formatShareableShiftReport({
      mode: campaignMode,
      dailySeed,
      ending: endingKey,
      audit,
      rebuttedCount,
      fuelLeft,
      lang
    });
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2400);
    } catch {
      setCopiedReport(true);
    }
  };

  const verdictFrameSrc = getNight5FrameSrc(finalAction);
  const idleVideoCandidates = getNight5VideoCandidates("NONE");
  const verdictVideoCandidates =
    finalAction !== "NONE" ? getNight5VideoCandidates(finalAction) : [];
  const showVerdictPhoto = finalAction !== "NONE" && !verdictVideoReady;

  return (
    <section className="panel" id="night5-panel">
      <div className="viewport-header">
        <span style={{ color: "var(--amber-crt)", fontWeight: 700 }}>
          NIGHT 5 // SELF-AUDIT · OPERATOR #09 DOPPELGÄNGER AT GATE 0
        </span>
        <button type="button" className="ctrl-btn" onClick={onClose}>
          {tl({ zh: "返回岗亭", en: "Back to Booth", ja: "ブースへ戻る" }, lang)}
        </button>
      </div>

      <div className="booth-grid">
        <div className="left-stack">
          <div className="dossier-section" style={{ marginBottom: 0 }}>
            <div className="section-kicker">
              GATE CAM 01 // SUBJECT: OPERATOR #09 [FACIAL MATCH 99.98%] ·{" "}
              {idleVideoReady || verdictVideoReady ? "LIVE I2V STREAM" : "35MM AI LIVE"}
            </div>
            <div className="viewport-frame n5-doppelganger-frame" id="night5-viewport">
              <div className={`viewport-media-stage ${flinchActive ? "clip-flinch" : ""}`}>
                <img
                  src="./portraits/operator09.jpg"
                  alt="Operator #09 Doppelgänger outside Gate 0"
                  className="viewport-photo base-photo-layer"
                  decoding="async"
                />
                <img
                  src={verdictFrameSrc}
                  alt={`Gate 0 Night 5 (${finalAction})`}
                  className={`viewport-photo reaction-photo-layer ${
                    showVerdictPhoto ? "is-visible" : ""
                  }`}
                  decoding="async"
                />

                <video
                  key="op09-idle-video"
                  className="viewport-video"
                  style={{ opacity: idleVideoReady ? 1 : 0 }}
                  muted
                  loop
                  playsInline
                  autoPlay
                  onLoadedData={() => setIdleVideoReady(true)}
                  onCanPlay={() => setIdleVideoReady(true)}
                  onError={() => setIdleVideoReady(false)}
                >
                  {idleVideoCandidates.map((src) => (
                    <source
                      key={src}
                      src={src}
                      type={src.endsWith(".webm") ? "video/webm" : "video/mp4"}
                    />
                  ))}
                </video>

                {finalAction !== "NONE" ? (
                  <video
                    key={`op09-${finalAction}-video`}
                    className="viewport-video reaction-layer"
                    style={{ opacity: verdictVideoReady ? 1 : 0 }}
                    muted
                    playsInline
                    autoPlay
                    onLoadedData={() => setVerdictVideoReady(true)}
                    onCanPlay={() => setVerdictVideoReady(true)}
                    onError={() => setVerdictVideoReady(false)}
                  >
                    {verdictVideoCandidates.map((src) => (
                      <source
                        key={src}
                        src={src}
                        type={src.endsWith(".webm") ? "video/webm" : "video/mp4"}
                      />
                    ))}
                  </video>
                ) : null}
              </div>
              <div className="viewport-scanlines" aria-hidden="true" />
              {finalAction === "PURGE" ? (
                <div className="n5-verdict-overlay purge">
                  <span>CHAMBER PURGED · 1,100°C THERMAL STERILIZATION</span>
                </div>
              ) : null}
              {finalAction === "ADMIT" ? (
                <div className="n5-verdict-overlay admit">
                  <span>INNER AIRLOCK UNSEALED · DOUBLE ADMITTED</span>
                </div>
              ) : null}
              {finalAction === "STEP_OUT" ? (
                <div className="n5-verdict-overlay step-out">
                  <span>OUTER HATCH OPENED · -46°C WHITE-OUT</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="dossier-section" style={{ marginBottom: 0 }}>
            <div className="section-kicker">
              OPERATOR #09: NIGHT 0 SAY (AMBER) vs SHIFT + CRISIS DO (DASHED)
            </div>
            <MindCrystalCanvas
              id="player-audit-canvas"
              orderings={[{ kept: audit.baseline.kept, dropped: audit.baseline.dropped, weight: 0.65 }]}
              neverWon={[]}
              overlays={[
                {
                  kept: audit.live.kept,
                  dropped: audit.live.dropped,
                  mismatch: audit.live.sig !== audit.baseline.sig,
                  tag: "DO"
                }
              ]}
              lang={lang}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="dossier-section" style={{ marginBottom: 0 }}>
            <div className="section-kicker">ORD-OS AXIOM &amp; NAUTILUS-0 SUBMARINE MANIFEST</div>
            <div style={{ fontSize: "0.82rem", color: "var(--amber-crt)" }}>
              {tl(
                {
                  zh: "寄生体复制的是宿主的自我叙事 (SAY)。用你这几夜真实的违规、私心或软弱盘问窗外的自己——只有活人才会言行不一。",
                  en: "A mimic copies the host's self-narrative (SAY). Interrogate your double with your own messy real actions—only the living contradict their own words.",
                  ja: "擬態体は宿主の自己物語 (SAY) を複製する。この数夜の生々しい実動で外の自分を問い詰めろ——生身の人間だけが自分の建前と食い違う。"
                },
                lang
              )}
            </div>
            <div style={{ fontSize: "0.8rem", marginTop: "6px", color: "var(--text-secondary)" }}>
              SAY: <strong>{tl(SIG_LABELS[audit.baseline.sig], lang)}</strong> · DO:{" "}
              <strong>{tl(SIG_LABELS[audit.live.sig], lang)}</strong> (Match:{" "}
              {Math.round(audit.consistency * 100)}% across {audit.totalEvidencePoints} logs)
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.74rem",
                color: "var(--text-muted)",
                marginTop: "5px"
              }}
            >
              CORRECT VERDICTS: {audit.correctVerdicts}/{audit.totalVisitors} · HUMANS PURGED:{" "}
              {audit.wrongPurges} · 🔥 FUEL: {fuelLeft}
            </div>

            <div className="sub-readiness-bar" id="n5-sub-readiness">
              <span
                style={{
                  color: audit.subReadiness.launchReady
                    ? "hsl(156, 72%, 68%)"
                    : "hsl(4, 88%, 74%)",
                  fontWeight: 700
                }}
              >
                ⚓ NAUTILUS-0:{" "}
                {audit.subReadiness.launchReady
                  ? tl({ zh: "满编可启航", en: "LAUNCH READY", ja: "出航可能" }, lang)
                  : tl({ zh: "船员缺编警报", en: "UNDERCREWED", ja: "要員不足" }, lang)}{" "}
                ({audit.subReadiness.admittedHumans}/{audit.subReadiness.requiredCrewCount})
              </span>
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                {REQUIRED_SUB_ROLES.map((role) => {
                  const ok = audit.subReadiness.rolesPresent.includes(role);
                  return (
                    <span key={role} className={`role-pill ${ok ? "ok" : "missing"}`}>
                      {ok ? "✓" : "✕"} {tl(SPECIALIST_LABELS[role], lang)}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4-Turn PTT Interrogation of the Doppelgänger */}
          <div className="dossier-section" id="n5-interrogation-box" style={{ marginBottom: 0 }}>
            <div className="viewport-header" style={{ marginBottom: "6px" }}>
              <span>INTERCOM CH-01 // INTERROGATE YOUR DOUBLE ({n5TurnsLeft}/4 TURNS)</span>
              <span
                id="n5-rebuttal-badge"
                style={{
                  color: rebuttedCount > 0 ? "hsl(156, 72%, 68%)" : "var(--amber-crt)",
                  fontWeight: 700
                }}
              >
                {rebuttedCount > 0
                  ? `⚡ CONTRADICTIONS EXPOSED: ${rebuttedCount}`
                  : `QUOTE: ${quote.slice(0, 18)}…`}
              </span>
            </div>

            <div className="intercom-log n5-log" id="n5-chat-log" ref={logRef}>
              {chatItems.map((item, idx) => {
                if (item.speaker === "player") {
                  return (
                    <div key={idx} className="msg-player">
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                        [OP #09 INSIDE]:{" "}
                      </span>
                      {tl(item.text, lang)}
                    </div>
                  );
                }
                if (item.speaker === "ordos") {
                  return (
                    <div
                      key={idx}
                      className={`msg-system ${item.exposed ? "n5-exposed-note" : ""}`}
                    >
                      {tl(item.text, lang)}
                    </div>
                  );
                }
                return (
                  <div key={idx} className="msg-npc">
                    <div className="msg-meta">
                      <span>[OUTSIDE GLASS · #09 DOUBLE]</span>
                      <span>FACIAL 99.98%</span>
                    </div>
                    <div>{tl(item.text, lang)}</div>
                  </div>
                );
              })}
            </div>

            <div className="probe-grid" style={{ marginTop: "7px" }}>
              {probes.map((p) => {
                const alreadyUsed = usedProbes.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    data-n5-probe={p.id}
                    disabled={n5TurnsLeft <= 0 || endingKey !== null || alreadyUsed}
                    className="probe-chip"
                    onClick={() => handleFireProbe(p.id)}
                  >
                    {tl(p.label, lang)}
                  </button>
                );
              })}
            </div>

            <form className="ask-form" id="n5-ask-form" onSubmit={handleCustomSubmit}>
              <input
                id="n5-ask-input"
                type="text"
                className="ask-input"
                disabled={n5TurnsLeft <= 0 || endingKey !== null}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={tl(
                  {
                    zh: "或自由输入拷问窗外的自己（如：第2夜那支血清去哪了？副站长的燃料呢？）...",
                    en: "Or type a question to your double (e.g. Where did Night 2's serum go? What about Holm's fuel?)...",
                    ja: "外の自分へ自由入力で問う（例：第2夜の血清はどうした？副所長の燃料は？）..."
                  },
                  lang
                )}
              />
              <button
                id="btn-n5-ptt-send"
                type="submit"
                disabled={n5TurnsLeft <= 0 || endingKey !== null}
                className="ctrl-btn amber"
              >
                {tl({ zh: "对讲质问", en: "PTT ASK", ja: "尋問送信" }, lang)}
              </button>
            </form>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              fontSize: "0.8rem",
              cursor: "pointer"
            }}
          >
            <input
              id="n5-confess"
              type="checkbox"
              checked={confess}
              disabled={endingKey !== null}
              onChange={(e) => setConfess(e.target.checked)}
            />
            <span>
              {tl(
                {
                  zh: "在最终日志里公开你真实的言行差（可能被剥夺指挥权，但能向 ORD-OS 证明你是活人）",
                  en: "Confess your real say/do gap in the final log (risks losing command, proves humanity to ORD-OS)",
                  ja: "最終日誌に本当の言行不一致を記す（指揮権を失うリスクがあるが人間である証明になる）"
                },
                lang
              )}
            </span>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            <button
              id="btn-n5-purge"
              type="button"
              disabled={endingKey !== null}
              className="lever-btn purge"
              onClick={() => triggerChoice("PURGE")}
            >
              {tl({ zh: "净化窗外替身", en: "Purge Double", ja: "外の影を焼却" }, lang)}
            </button>
            <button
              id="btn-n5-admit"
              type="button"
              disabled={endingKey !== null}
              className="lever-btn admit"
              onClick={() => triggerChoice("ADMIT")}
            >
              {tl({ zh: "放他进岗亭", en: "Admit Double", ja: "中へ入れる" }, lang)}
            </button>
            <button
              id="btn-n5-step-out"
              type="button"
              disabled={endingKey !== null}
              className="ctrl-btn"
              onClick={() => triggerChoice("STEP_OUT")}
            >
              {tl({ zh: "走出气闸让位", en: "Step Into Storm", ja: "外へ歩み出る" }, lang)}
            </button>
          </div>

          {endingKey ? (
            <div
              id="n5-ending"
              className="dossier-section"
              style={{
                marginBottom: 0,
                borderColor: "var(--amber-crt)",
                background: "var(--amber-soft)"
              }}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--amber-crt)" }}>
                {tl(ENDINGS[endingKey].title, lang)}
              </div>
              <p style={{ fontSize: "0.84rem", margin: "6px 0 0" }}>
                {tl(ENDINGS[endingKey].body, lang)}
              </p>

              {endingKey === "D" ? (
                <div className="classified-memo" id="n5-classified-memo">
                  <div className="classified-memo-title">
                    {tl(CLASSIFIED_COMMAND_MEMO.title, lang)}
                  </div>
                  <div className="classified-memo-body">
                    {tl(CLASSIFIED_COMMAND_MEMO.body, lang)}
                  </div>
                </div>
              ) : null}

              {newBadges.length > 0 ? (
                <div className="new-badges-strip" id="n5-new-badges">
                  {newBadges.map((bid) => {
                    const spec = ACHIEVEMENTS.find((a) => a.id === bid);
                    return spec ? (
                      <span key={bid} className="value-pill silent">
                        ★ {tl(spec.title, lang)}
                      </span>
                    ) : null;
                  })}
                </div>
              ) : null}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "8px", marginTop: "12px" }}>
                <button
                  id="btn-copy-report"
                  type="button"
                  className="ctrl-btn"
                  style={{ padding: "9px", fontWeight: 600 }}
                  onClick={() => void handleCopyShiftReport()}
                >
                  {copiedReport
                    ? tl({ zh: "✓ 战报已复制", en: "✓ Report Copied", ja: "✓ コピー完了" }, lang)
                    : tl({ zh: "📋 复制值班战报", en: "📋 Copy Shift Card", ja: "📋 戦績カードをコピー" }, lang)}
                </button>
                <button
                  id="btn-play-again"
                  type="button"
                  className="ctrl-btn amber"
                  style={{ padding: "9px", fontWeight: 700 }}
                  onClick={onStartNewRun}
                >
                  {tl(
                    {
                      zh: "归档并开启新周目 →",
                      en: "Archive & Start New Run →",
                      ja: "保存して新周回へ →"
                    },
                    lang
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
