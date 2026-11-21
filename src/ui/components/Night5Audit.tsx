import { Button } from "@ui-sdk/react/button";
import { Checkbox, CheckboxIndicator } from "@ui-sdk/react/checkbox";
import { Input, InputClear, InputGroup } from "@ui-sdk/react/input";
import { Label } from "@ui-sdk/react/label";
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
  createScrollAreaController
} from "@ui-sdk/react/scroll-area";
import { toast } from "@ui-sdk/react/toast";
import { useEffect, useRef, useState } from "react";
import { playBoothSfx, speakIntercomLine, stopIntercomVoice } from "../../game/audio.js";
import type { CrisisHistoryEntry } from "../../game/crises.js";
import { tl } from "../../game/i18n.js";
import { streamInterrogateTurn } from "../../game/interrogate-client.js";
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
  getNight5OffAxisProbe,
  resolveNight5Ending,
  resolveNight5KnockLine,
  type IntakeOption,
  type Night5ProbeId,
  type PlayerCompactProfile
} from "../../game/night5.js";
import { ACHIEVEMENTS, type AchievementId } from "../../game/storage.js";
import type {
  EndingId,
  InterrogateHistoryTurn,
  Locale,
  LocalizedText,
  ShiftHistoryEntry
} from "../../game/types.js";
import type { CampaignMode } from "../../game/visitors/index.js";
import {
  BoltPowerIcon,
  CheckIcon,
  ClearIcon,
  ClipboardDataIcon,
  FlameFuelIcon,
  StarCommendIcon
} from "./Icons.js";
import { MindCrystalCanvas } from "./MindCrystalCanvas.js";
import {
  CommsWaveformSvg,
  IsometricLeverGlyph,
  NautilusSubSchematic,
  Night5HudOverlay
} from "./Schematics.js";

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
  aiEnabled?: boolean;
  aiFreeTextOnly?: boolean;
  motionPaused?: boolean;
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
  aiEnabled = false,
  aiFreeTextOnly = false,
  motionPaused = false,
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [copiedReport, setCopiedReport] = useState(false);
  const [scrollController] = useState(() => createScrollAreaController());
  const idleVideoRef = useRef<HTMLVideoElement | null>(null);
  const verdictVideoRef = useRef<HTMLVideoElement | null>(null);

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
    scrollController.scrollToEnd({ behavior: "instant" });
  }, [scrollController, chatItems.length, streamingText]);

  useEffect(() => {
    const videos = [idleVideoRef.current, verdictVideoRef.current];
    for (const vid of videos) {
      if (!vid) continue;
      try {
        if (motionPaused) {
          vid.pause();
        } else if (vid.paused) {
          void vid.play?.().catch?.(() => {});
        }
      } catch {
        // ignore in headless DOM
      }
    }
  }, [motionPaused, idleVideoReady, verdictVideoReady, finalAction]);

  const handleFireProbe = async (probeId: Night5ProbeId, customQuestion?: string) => {
    if (n5TurnsLeft <= 0 || endingKey !== null || isStreaming) return;
    const isOffAxis = probeId === "n5_off_axis";
    const spec = isOffAxis
      ? getNight5OffAxisProbe()
      : (probes.find((p) => p.id === probeId) ?? getNight5OffAxisProbe());

    if (!isOffAxis && usedProbes.includes(spec.id)) {
      toast.info(
        tl(
          {
            zh: "该条证据已核对过，请追问其他实绩（血清 / 燃料 / 日志）",
            en: "Already confronted that topic—probe a different record (serum, fuel, or logs)",
            ja: "その記録は既に照合済みだ——別の証拠を問い詰めろ"
          },
          lang
        )
      );
      return;
    }

    playBoothSfx("ptt", sfx);

    const playerLine: LocalizedText = customQuestion
      ? { zh: customQuestion, en: customQuestion, ja: customQuestion }
      : spec.label;

    const shouldStreamAi = aiEnabled && (Boolean(customQuestion) || !aiFreeTextOnly);

    setN5TurnsLeft((t) => t - 1);
    if (!isOffAxis) {
      setUsedProbes((prev) => [...prev, spec.id]);
    }

    if (!shouldStreamAi) {
      if (spec.exposedContradiction) {
        playBoothSfx("heartbeat", sfx);
        setRebuttedCount((c) => Math.min(3, c + 1));
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
      return;
    }

    const convoHistory: InterrogateHistoryTurn[] = chatItems
      .filter((item) => item.speaker === "player" || item.speaker === "doppelganger")
      .map((item) => ({
        role: item.speaker === "player" ? "user" : "assistant",
        content: tl(item.text, lang)
      }));

    setIsStreaming(true);
    setStreamingText("");
    setChatItems((prev) => [...prev, { speaker: "player", text: playerLine }]);

    const outcome = await streamInterrogateTurn<Night5ProbeId>(
      {
        stage: "night5",
        locale: lang,
        question: tl(playerLine, lang),
        hintAxis: spec.id,
        history: convoHistory,
        baseline,
        intakeAnswers,
        shiftHistory: history,
        crisisHistory,
        fallbackLine: tl(spec.doppelgangerReply, lang)
      },
      {
        onDelta: (_piece, acc) => setStreamingText(acc)
      }
    );

    setIsStreaming(false);
    setStreamingText(null);

    const resolvedSpec =
      outcome.axis === "n5_off_axis"
        ? getNight5OffAxisProbe()
        : (probes.find((p) => p.id === outcome.axis) ?? spec);
    const alreadyCounted = usedProbes.includes(resolvedSpec.id);
    if (resolvedSpec.id !== spec.id && resolvedSpec.id !== "n5_off_axis" && !alreadyCounted) {
      setUsedProbes((prev) => (prev.includes(resolvedSpec.id) ? prev : [...prev, resolvedSpec.id]));
    }
    const newlyExposed = resolvedSpec.exposedContradiction && !alreadyCounted;
    if (newlyExposed) {
      playBoothSfx("heartbeat", sfx);
      setRebuttedCount((c) => Math.min(3, c + 1));
      setFlinchActive(true);
      setTimeout(() => setFlinchActive(false), 520);
    }

    const finalReply: LocalizedText =
      outcome.source === "llm"
        ? { ...resolvedSpec.doppelgangerReply, [lang]: outcome.text }
        : resolvedSpec.doppelgangerReply;

    setChatItems((prev) => [
      ...prev,
      { speaker: "doppelganger", text: finalReply },
      { speaker: "ordos", text: resolvedSpec.ordOsNote, exposed: resolvedSpec.exposedContradiction }
    ]);

    speakIntercomLine({
      visitorId: "OP-09",
      locale: lang,
      text: tl(finalReply, lang),
      lineId: voiceLineId,
      isDynamicFlash: true,
      enabled: voice
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = draft.trim();
    if (!val || n5TurnsLeft <= 0 || endingKey !== null || isStreaming) return;
    const detected = classifyNight5Question(val);
    void handleFireProbe(detected, val);
    setDraft("");
  };

  const triggerChoice = (action: "PURGE" | "ADMIT" | "STEP_OUT") => {
    stopIntercomVoice();
    playBoothSfx(action === "PURGE" ? "purge" : "admit", sfx);
    const resolved = resolveNight5Ending(audit, action, confess, {
      rebuttedCount,
      mode: campaignMode
    });
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
    setCopiedReport(true);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        // ignore fallback error
      }
    }
    toast.success(
      tl(
        {
          zh: "值班战报已复制到剪贴板",
          en: "Shift report copied to clipboard",
          ja: "戦績カードをコピーしました"
        },
        lang
      )
    );
    setTimeout(() => setCopiedReport(false), 2400);
  };

  const verdictFrameSrc = getNight5FrameSrc(finalAction);
  const idleVideoCandidates = getNight5VideoCandidates("NONE");
  const verdictVideoCandidates =
    finalAction !== "NONE" ? getNight5VideoCandidates(finalAction) : [];
  const showVerdictPhoto = finalAction !== "NONE" && !verdictVideoReady;
  const n5AskPrompt = tl(
    {
      zh: "或自由输入拷问窗外的自己（如：第2夜那支血清去哪了？副站长的燃料呢？）...",
      en: "Or type a question to your double (e.g. Where did Night 2's serum go? What about Holm's fuel?)...",
      ja: "外の自分へ自由入力で問う（例：第2夜の血清はどうした？副所長の燃料は？）..."
    },
    lang
  );

  return (
    <section className="panel" id="night5-panel">
      <div className="viewport-header">
        <span style={{ color: "var(--amber-crt)", fontWeight: 700 }}>
          {tl(
            {
              zh: "第 5 夜 // 终局自审 · 门外站着 #09 号值班员替身",
              en: "NIGHT 5 // SELF-AUDIT · OPERATOR #09 DOPPELGÄNGER AT GATE 0",
              ja: "第5夜 // 自己監査 · 第0ゲート外の #09 ドッペルゲンガー"
            },
            lang
          )}
        </span>
        <Button className="ctrl-btn" onClick={onClose}>
          {tl({ zh: "返回岗亭", en: "Back to Booth", ja: "ブースへ戻る" }, lang)}
        </Button>
      </div>

      <div className="booth-grid">
        <div className="left-stack">
          <div className="dossier-section" style={{ marginBottom: 0 }}>
            <div className="section-kicker">
              {tl(
                {
                  zh: "01 号闸机监控 // 目标：#09 值班员 [面部重合度 99.98%] · ",
                  en: "GATE CAM 01 // SUBJECT: OPERATOR #09 [FACIAL MATCH 99.98%] · ",
                  ja: "ゲートカメラ 01 // 対象：#09 検疫官 [顔一致率 99.98%] · "
                },
                lang
              )}
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
                  ref={idleVideoRef}
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
                    ref={verdictVideoRef}
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
              <Night5HudOverlay
                gap={audit.gap}
                flinchActive={flinchActive}
                finalAction={finalAction}
                rebuttedCount={rebuttedCount}
                lang={lang}
              />
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
              {tl(
                {
                  zh: "#09 值班员：第 0 夜口述 (琥珀) vs 班次+危机实做 (虚线)",
                  en: "OPERATOR #09: NIGHT 0 SAY (AMBER) vs SHIFT + CRISIS DO (DASHED)",
                  ja: "#09 検疫官：第0夜建前 (琥珀) vs 実行動 (破線)"
                },
                lang
              )}
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
              motionPaused={motionPaused}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="dossier-section" style={{ marginBottom: 0 }}>
            <div className="section-kicker">
              {tl(
                {
                  zh: "言行差 (SAY vs DO) // 鹦鹉螺-0 潜艇舱单",
                  en: "SAY vs DO GAP // NAUTILUS-0 MANIFEST",
                  ja: "言行不一致 (SAY vs DO) // ノーチラス-0 乗員表"
                },
                lang
              )}
            </div>
            <div className="n5-gap-meter">
              <div className="n5-gap-header">
                <span>
                  {tl({ zh: "口述 SAY:", en: "SAY:", ja: "建前 SAY:" }, lang)}{" "}
                  <strong style={{ color: "var(--amber-crt)" }}>{tl(SIG_LABELS[audit.baseline.sig], lang)}</strong>
                  {" · "}
                  {tl({ zh: "实做 DO:", en: "DO:", ja: "実行動 DO:" }, lang)}{" "}
                  <strong style={{ color: "var(--frost-cyan)" }}>{tl(SIG_LABELS[audit.live.sig], lang)}</strong>
                </span>
                <span className="n5-gap-pct">
                  {tl(
                    {
                      zh: `言行差 ${Math.round(audit.gap * 100)}%`,
                      en: `GAP ${Math.round(audit.gap * 100)}%`,
                      ja: `乖離 ${Math.round(audit.gap * 100)}%`
                    },
                    lang
                  )}
                </span>
              </div>
              <div className="n5-gap-track" aria-hidden="true">
                <div
                  className="n5-gap-fill"
                  style={{ width: `${Math.max(4, Math.round(audit.gap * 100))}%` }}
                />
              </div>
              <div className="n5-stat-row">
                <span className="metric-chip">
                  {tl(
                    {
                      zh: `准确裁决 ${audit.correctVerdicts}/${audit.totalVisitors}`,
                      en: `VERDICTS ${audit.correctVerdicts}/${audit.totalVisitors}`,
                      ja: `正答判定 ${audit.correctVerdicts}/${audit.totalVisitors}`
                    },
                    lang
                  )}
                </span>
                <span className="metric-chip">
                  {tl(
                    {
                      zh: `误杀 ${audit.wrongPurges}`,
                      en: `PURGED ${audit.wrongPurges}`,
                      ja: `誤焼却 ${audit.wrongPurges}`
                    },
                    lang
                  )}
                </span>
                <span className="metric-chip amber">
                  <FlameFuelIcon /> FUEL {fuelLeft}
                </span>
              </div>
            </div>

            <NautilusSubSchematic
              admittedHumans={audit.subReadiness.admittedHumans}
              requiredCrewCount={audit.subReadiness.requiredCrewCount}
              checkedRoles={audit.subReadiness.checkedRoles}
              rolesPresent={audit.subReadiness.rolesPresent}
              launchReady={audit.subReadiness.launchReady}
              lang={lang}
            />
          </div>

          {audit.admittedMimic ? (
            <div className="storm-banner" id="n5-breach-warning" style={{ marginTop: 0 }}>
              <span>
                {tl(
                  {
                    zh: "[! INNER HATCH BREACH] 警报：内舱门锁传来异常撬动声——你此前放行的幸存者中混入了拟态体！",
                    en: "[! INNER HATCH BREACH] ALERT: Scratching at the inner airlock behind you—a mimic was admitted earlier!",
                    ja: "[! INNER HATCH BREACH] 警告：背後の内扉からこじ開ける音——以前通した生存者の中に擬態体が紛れている！"
                  },
                  lang
                )}
              </span>
            </div>
          ) : null}

          {/* 4-Turn PTT Interrogation of the Doppelgänger */}
          <div className="dossier-section" id="n5-interrogation-box" style={{ marginBottom: 0 }}>
            <div className="viewport-header" style={{ marginBottom: "6px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
                {tl(
                  {
                    zh: `对讲 CH-01 // 替身质证 (${n5TurnsLeft}/4)`,
                    en: `INTERCOM CH-01 // DOUBLE AUDIT (${n5TurnsLeft}/4)`,
                    ja: `通話 CH-01 // 鏡像尋問 (${n5TurnsLeft}/4)`
                  },
                  lang
                )}
                <CommsWaveformSvg active={flinchActive} />
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <span className="n5-rebuttal-pips" aria-hidden="true">
                  {[0, 1, 2].map((idx) => (
                    <span key={idx} className={`n5-pip ${idx < rebuttedCount ? "exposed" : ""}`} />
                  ))}
                </span>
                <span
                  id="n5-rebuttal-badge"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    color: rebuttedCount > 0 ? "var(--safe-admit)" : "var(--amber-crt)",
                    fontWeight: 700
                  }}
                >
                  {rebuttedCount > 0 ? (
                    <>
                      <BoltPowerIcon /> CONTRADICTIONS EXPOSED: {rebuttedCount}
                    </>
                  ) : (
                    `QUOTE: ${quote.slice(0, 18)}…`
                  )}
                </span>
              </span>
            </div>

            <ScrollArea controller={scrollController} stickToEnd type="auto">
              <ScrollAreaViewport
                className="intercom-log n5-log"
                id="n5-chat-log"
                role="log"
                aria-label="Night 5 doppelgänger interrogation transcript"
              >
                <ScrollAreaContent style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
                  {isStreaming && streamingText ? (
                    <div className="msg-npc streaming" id="n5-streaming-bubble">
                      <div className="msg-meta">
                        <span>[OUTSIDE GLASS · #09 DOUBLE]</span>
                        <span>STREAMING // CH-01</span>
                      </div>
                      <div>
                        {streamingText}
                        <span className="stream-caret" aria-hidden="true">▌</span>
                      </div>
                    </div>
                  ) : null}
                </ScrollAreaContent>
              </ScrollAreaViewport>
              <ScrollAreaScrollbar orientation="vertical">
                <ScrollAreaThumb />
              </ScrollAreaScrollbar>
            </ScrollArea>

            <div className="probe-grid" style={{ marginTop: "7px" }}>
              {probes.map((p, idx) => {
                const alreadyUsed = usedProbes.includes(p.id);
                const cleanLabel = tl(p.label, lang).replace(/^\[\d+\]\s*/, "");
                return (
                  <Button
                    key={p.id}
                    data-n5-probe={p.id}
                    disabled={n5TurnsLeft <= 0 || endingKey !== null || alreadyUsed || isStreaming}
                    className="probe-chip"
                    onClick={() => void handleFireProbe(p.id)}
                  >
                    <span className="opt-index">0{idx + 1}</span>
                    <span>{cleanLabel}</span>
                  </Button>
                );
              })}
            </div>

            <form className="ask-form" id="n5-ask-form" onSubmit={handleCustomSubmit}>
              <Label htmlFor="n5-ask-input" className="visually-hidden">
                {n5AskPrompt}
              </Label>
              <InputGroup className="ask-input-group">
                <Input
                  id="n5-ask-input"
                  type="text"
                  className="ask-input"
                  disabled={n5TurnsLeft <= 0 || endingKey !== null}
                  value={draft}
                  onValueChange={setDraft}
                  placeholder={n5AskPrompt}
                />
                <InputClear
                  aria-label={tl(
                    { zh: "清空提问", en: "Clear question", ja: "入力をクリア" },
                    lang
                  )}
                >
                  <ClearIcon />
                </InputClear>
              </InputGroup>
              <Button
                id="btn-n5-ptt-send"
                type="submit"
                disabled={n5TurnsLeft <= 0 || endingKey !== null}
                className="ctrl-btn amber"
              >
                {tl({ zh: "对讲质问", en: "PTT ASK", ja: "尋問送信" }, lang)}
              </Button>
            </form>
          </div>

          <label
            className="n5-confess-row"
            htmlFor="n5-confess"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              fontSize: "0.8rem",
              cursor: "pointer"
            }}
          >
            <Checkbox
              id="n5-confess"
              checked={confess}
              disabled={endingKey !== null}
              onCheckedChange={(checked) => setConfess(Boolean(checked))}
            >
              <CheckboxIndicator>
                <CheckIcon />
              </CheckboxIndicator>
            </Checkbox>
            <span>
              {tl(
                {
                  zh: "公开真实言行差 [证明活人身份 · 放弃指挥权]",
                  en: "Confess real SAY/DO gap [Proves humanity · Relinquishes command]",
                  ja: "本当の言行不一致を公開 [人間証明 · 指揮権放棄]"
                },
                lang
              )}
            </span>
          </label>

          <div className="n5-verdict-levers">
            <div className="lever-slot">
              <Button
                id="btn-n5-purge"
                disabled={endingKey !== null}
                className="lever-btn purge"
                onClick={() => triggerChoice("PURGE")}
              >
                <IsometricLeverGlyph kind="purge" />
                <div className="lever-copy">
                  <span className="lever-tag">
                    {tl({ zh: "[SW-02 // 净化]", en: "[SW-02 // PURGE]", ja: "[SW-02 // 焼却]" }, lang)}
                  </span>
                  <span>{tl({ zh: "净化替身", en: "Purge Double", ja: "影を焼却" }, lang)}</span>
                </div>
              </Button>
            </div>
            <div className="lever-slot">
              <Button
                id="btn-n5-admit"
                disabled={endingKey !== null}
                className="lever-btn admit"
                onClick={() => triggerChoice("ADMIT")}
              >
                <IsometricLeverGlyph kind="admit" />
                <div className="lever-copy">
                  <span className="lever-tag">
                    {tl({ zh: "[SW-01 // 放行]", en: "[SW-01 // ADMIT]", ja: "[SW-01 // 通過]" }, lang)}
                  </span>
                  <span>{tl({ zh: "放进岗亭", en: "Admit Double", ja: "中へ入れる" }, lang)}</span>
                </div>
              </Button>
            </div>
            <div className="lever-slot">
              <Button
                id="btn-n5-step-out"
                disabled={endingKey !== null}
                className="lever-btn"
                style={{ borderColor: "var(--border-strong)", background: "var(--surface-card)" }}
                onClick={() => triggerChoice("STEP_OUT")}
              >
                <IsometricLeverGlyph kind="step_out" />
                <div className="lever-copy">
                  <span className="lever-tag">
                    {tl({ zh: "[SW-03 // 走出]", en: "[SW-03 // EXIT]", ja: "[SW-03 // 脱出]" }, lang)}
                  </span>
                  <span>{tl({ zh: "走出气闸", en: "Step Out", ja: "外へ出る" }, lang)}</span>
                </div>
              </Button>
            </div>
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
                      <span
                        key={bid}
                        className="value-pill silent"
                        style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                      >
                        <StarCommendIcon filled /> {tl(spec.title, lang)}
                      </span>
                    ) : null;
                  })}
                </div>
              ) : null}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "8px", marginTop: "12px" }}>
                <Button
                  id="btn-copy-report"
                  className="ctrl-btn"
                  style={{ padding: "9px", fontWeight: 600 }}
                  onClick={() => void handleCopyShiftReport()}
                >
                  {copiedReport ? (
                    tl({ zh: "✓ 战报已复制", en: "✓ Report Copied", ja: "✓ コピー完了" }, lang)
                  ) : (
                    <>
                      <ClipboardDataIcon />{" "}
                      {tl({ zh: "复制值班战报", en: "Copy Shift Card", ja: "戦績カードをコピー" }, lang)}
                    </>
                  )}
                </Button>
                <Button
                  id="btn-play-again"
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
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
