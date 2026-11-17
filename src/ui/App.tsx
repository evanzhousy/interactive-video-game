import { useCallback, useEffect, useRef, useState } from "react";
import {
  playBoothSfx,
  setBoothAmbience,
  speakIntercomLine,
  stopAllBoothAudio,
  stopIntercomVoice
} from "../game/audio.js";
import { UI_STRINGS, tl } from "../game/i18n.js";
import type { ClipState, VoiceLineVariant } from "../game/media.js";
import {
  SHIFT_EXCUSES,
  type IntakeOption,
  type PlayerCompactProfile
} from "../game/night5.js";
import { DEFAULT_FLASH_CONFIG, requestFlashRephrase } from "../game/rephrase.js";
import { buildRephraseInput, decideStance } from "../game/stance.js";
import type {
  FlashRephraseConfig,
  Locale,
  ProbeKey,
  ShiftHistoryEntry,
  VisitorRoll,
  VisitorSpec
} from "../game/types.js";
import {
  getVisitorsForMode,
  rollShift,
  type CampaignMode
} from "../game/visitors/index.js";
import { FlashConfigDrawer } from "./components/FlashConfigDrawer.js";
import { IntakeModal } from "./components/IntakeModal.js";
import { IntercomPanel, type TranscriptLine } from "./components/IntercomPanel.js";
import { Night5Audit } from "./components/Night5Audit.js";
import { OrdamorDossier, type DossierTab } from "./components/OrdamorDossier.js";
import { ViewportCanvas } from "./components/ViewportCanvas.js";

type Stage = "intake" | "booth" | "night5";

export function App() {
  const [lang, setLang] = useState<Locale>("zh");
  const [sfx, setSfx] = useState(true);
  const [voice, setVoice] = useState(true);
  const [stage, setStage] = useState<Stage>("intake");
  const [campaignMode, setCampaignMode] = useState<CampaignMode>("full");

  const activeVisitors = getVisitorsForMode(campaignMode);

  const [baseline, setBaseline] = useState<PlayerCompactProfile>({
    sig: "own_it",
    kept: "truth",
    dropped: "status"
  });
  const [intakeAnswers, setIntakeAnswers] = useState<IntakeOption[]>([]);

  const [rolls, setRolls] = useState<VisitorRoll[]>(() => rollShift(activeVisitors));
  const [visitorIdx, setVisitorIdx] = useState(0);
  const [history, setHistory] = useState<ShiftHistoryEntry[]>([]);

  const safeIdx = Math.min(visitorIdx, activeVisitors.length - 1);
  const visitor = activeVisitors[safeIdx]!;
  const currentRoll = rolls[safeIdx] ?? {
    visitorId: visitor.id,
    isMimic: false,
    defectMode: "HUMAN"
  };

  const [flashConfig, setFlashConfig] = useState<FlashRephraseConfig>(DEFAULT_FLASH_CONFIG);
  const [flashDrawerOpen, setFlashDrawerOpen] = useState(false);
  const [isRephrasing, setIsRephrasing] = useState(false);
  const shiftEpochRef = useRef(0);

  const [turnsLeft, setTurnsLeft] = useState(4);
  const [powerLeft, setPowerLeft] = useState(2);
  const [bpm, setBpm] = useState(visitor.baseBpm);
  const [clipState, setClipState] = useState<ClipState>("idle");
  const [reaction, setReaction] = useState("IDLE: COLD_BREATH");
  const [strobeTrigger, setStrobeTrigger] = useState(0);
  const [thermalTrigger, setThermalTrigger] = useState(0);
  const [sensorToast, setSensorToast] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([
    { speaker: "npc", text: visitor.openingLine, meta: `N${visitor.night} · INTERCOM CH-01` }
  ]);
  const [offAxisCount, setOffAxisCount] = useState(0);
  const [verdictState, setVerdictState] = useState<"NONE" | "ADMIT" | "PURGE">("NONE");
  const [logSigned, setLogSigned] = useState(false);
  const [activeTab, setActiveTab] = useState<DossierTab>("baseline");
  const [spoilerOpen, setSpoilerOpen] = useState(false);
  const [lastPipelinePayload, setLastPipelinePayload] = useState<Record<string, unknown>>({
    status: "AWAITING_INTERROGATION",
    turns_remaining: 4
  });

  // Continuous Arctic blizzard wind + Night 3 geomagnetic storm ambience
  useEffect(() => {
    setBoothAmbience(sfx && stage === "booth", visitor.night);
  }, [sfx, stage, visitor.night]);

  useEffect(() => {
    return () => {
      stopAllBoothAudio();
    };
  }, []);

  const handleClipComplete = useCallback(() => {
    setClipState((prev) => (prev === "admit" || prev === "purge" ? prev : "idle"));
    setReaction((prev) =>
      prev.includes("PURGE") || prev.includes("ADMIT") ? prev : "IDLE: COLD_BREATH"
    );
  }, []);

  const resetVisitorState = (
    idx: number,
    roster: readonly VisitorSpec[] = activeVisitors,
    speakOpening = true
  ) => {
    shiftEpochRef.current += 1;
    const v = roster[idx]!;
    setVisitorIdx(idx);
    setIsRephrasing(false);
    setTurnsLeft(4);
    setPowerLeft(2);
    setBpm(v.baseBpm);
    setClipState("idle");
    setReaction("IDLE: COLD_BREATH");
    setSensorToast(null);
    setTranscript([
      { speaker: "npc", text: v.openingLine, meta: `N${v.night} · INTERCOM CH-01` }
    ]);
    setOffAxisCount(0);
    setVerdictState("NONE");
    setLogSigned(false);
    setActiveTab("baseline");
    setSpoilerOpen(false);
    setLastPipelinePayload({ status: "AWAITING_INTERROGATION", turns_remaining: 4 });

    if (speakOpening) {
      speakIntercomLine({
        visitorId: v.id,
        locale: lang,
        text: tl(v.openingLine, lang),
        lineId: "opening",
        enabled: voice
      });
    }
  };

  const startNewShift = (modeOverride: CampaignMode = campaignMode) => {
    const roster = getVisitorsForMode(modeOverride);
    playBoothSfx("ptt", sfx);
    setRolls(rollShift(roster));
    setHistory([]);
    setStage("booth");
    resetVisitorState(0, roster, true);
  };

  const handleSwitchCampaignMode = (nextMode: CampaignMode) => {
    setCampaignMode(nextMode);
    const roster = getVisitorsForMode(nextMode);
    setRolls(rollShift(roster));
    setHistory([]);
    resetVisitorState(0, roster, stage === "booth");
  };

  const handleTriggerSensor = (kind: "strobe" | "thermal") => {
    if (powerLeft <= 0 || verdictState !== "NONE") return;
    setPowerLeft((p) => p - 1);
    if (kind === "strobe") {
      playBoothSfx("strobe", sfx);
      setStrobeTrigger((c) => c + 1);
      const msg = currentRoll.isMimic ? visitor.sensors.strobeMimic : visitor.sensors.strobeHuman;
      setSensorToast(`🔦 ${tl(msg, lang)}`);
    } else {
      playBoothSfx("thermal", sfx);
      setThermalTrigger((c) => c + 1);
      const msg = currentRoll.isMimic ? visitor.sensors.thermalMimic : visitor.sensors.thermalHuman;
      setSensorToast(`🌡️ ${tl(msg, lang)}`);
    }
  };

  const handleAskProbe = async (probeKey: ProbeKey | "off_axis", customText?: string) => {
    if (turnsLeft <= 0 || verdictState !== "NONE" || isRephrasing) return;
    playBoothSfx("ptt", sfx);

    const epochAtStart = shiftEpochRef.current;
    const probe = probeKey !== "off_axis" ? visitor.probes[probeKey] : undefined;
    const onAxis = Boolean(probe && probe.axis !== null);
    const playerText = customText
      ? { zh: customText, en: customText, ja: customText }
      : probe?.label ?? { zh: customText ?? "", en: customText ?? "", ja: customText ?? "" };

    const stance = decideStance(visitor, currentRoll, probeKey);
    const canonicalReply =
      probeKey === "off_axis" || !probe
        ? visitor.offAxisReply
        : !onAxis
          ? probe.human
          : probe[stance.lineKey] ?? probe.human;

    const resolvedLineId: VoiceLineVariant =
      probeKey === "off_axis" || !probe
        ? "off_axis"
        : !onAxis
          ? `${probeKey}_human`
          : `${probeKey}_${stance.lineKey}`;

    const nextClip: ClipState = onAxis ? "flinch" : "lean_in";
    const reactionClip = onAxis ? "flinch_eyes_dart" : "angry_lean_in";
    const bpmDelta = onAxis ? 10 : 4;

    setTurnsLeft((t) => t - 1);
    setBpm((b) => Math.min(148, b + bpmDelta));
    setClipState(nextClip);
    setReaction(`CLIP: ${reactionClip.toUpperCase()}`);
    if (onAxis) playBoothSfx("heartbeat", sfx);
    if (!onAxis) setOffAxisCount((c) => c + 1);

    const llmInput = buildRephraseInput(
      visitor,
      tl(playerText, lang),
      stance,
      lang,
      tl(canonicalReply, lang)
    );

    const shouldInvokeFlash =
      flashConfig.enabled && (Boolean(customText) || !flashConfig.freeTextOnly);

    if (!shouldInvokeFlash) {
      setTranscript((prev) => {
        const next: TranscriptLine[] = [
          ...prev,
          { speaker: "player", text: playerText },
          { speaker: "npc", text: canonicalReply, meta: `+${bpmDelta} BPM · ${reactionClip}` }
        ];
        if (!onAxis) {
          next.push({ speaker: "system", text: UI_STRINGS.offAxisSystemNote });
        }
        return next;
      });

      speakIntercomLine({
        visitorId: visitor.id,
        locale: lang,
        text: tl(canonicalReply, lang),
        lineId: resolvedLineId,
        enabled: voice
      });

      const { lineKey: _hiddenKey, ...publicStance } = stance;
      setLastPipelinePayload({
        "1_axis_detection": {
          question: tl(playerText, lang),
          detected: probeKey,
          on_axis: onAxis
        },
        "2_stance_engine": publicStance,
        "3_llm_visible_input": llmInput,
        "4_offline_profile_anchor": {
          orderings: visitor.profile.valueOrderings.map((o) => o.id),
          signatures: visitor.profile.disposalSignatures.map((s) => s.id)
        },
        "5_flash_rephrase": {
          enabled: flashConfig.enabled,
          invoked: false,
          source: "offline_canonical"
        }
      });
      return;
    }

    // Online Flash rephrase flow: append player line immediately, then stream/resolve NPC line
    setIsRephrasing(true);
    setTranscript((prev) => [...prev, { speaker: "player", text: playerText }]);

    const outcome = await requestFlashRephrase(llmInput, flashConfig);
    if (shiftEpochRef.current !== epochAtStart) return;
    setIsRephrasing(false);

    const finalReply =
      outcome.source === "flash"
        ? { ...canonicalReply, [lang]: outcome.line }
        : canonicalReply;
    const flashTag =
      outcome.source === "flash"
        ? `⚡ FLASH ${outcome.latencyMs}ms`
        : `FALLBACK (${outcome.fallbackReason ?? "CANONICAL"})`;

    setTranscript((prev) => {
      const next: TranscriptLine[] = [
        ...prev,
        {
          speaker: "npc",
          text: finalReply,
          meta: `+${bpmDelta} BPM · ${reactionClip} · ${flashTag}`
        }
      ];
      if (!onAxis) {
        next.push({ speaker: "system", text: UI_STRINGS.offAxisSystemNote });
      }
      return next;
    });

    speakIntercomLine({
      visitorId: visitor.id,
      locale: lang,
      text: tl(finalReply, lang),
      lineId: resolvedLineId,
      isDynamicFlash: outcome.source === "flash",
      enabled: voice
    });

    const { lineKey: _hiddenKey, ...publicStance } = stance;
    setLastPipelinePayload({
      "1_axis_detection": {
        question: tl(playerText, lang),
        detected: probeKey,
        on_axis: onAxis
      },
      "2_stance_engine": publicStance,
      "3_llm_visible_input": llmInput,
      "4_offline_profile_anchor": {
        orderings: visitor.profile.valueOrderings.map((o) => o.id),
        signatures: visitor.profile.disposalSignatures.map((s) => s.id)
      },
      "5_flash_rephrase": {
        enabled: true,
        invoked: true,
        mode: flashConfig.mode,
        source: outcome.source,
        latency_ms: outcome.latencyMs,
        model: outcome.model ?? null,
        fallback_reason: outcome.fallbackReason ?? null
      }
    });
  };

  const handleVerdict = (decision: "ADMIT" | "PURGE") => {
    if (verdictState !== "NONE" || isRephrasing) return;
    stopIntercomVoice();
    playBoothSfx(decision === "PURGE" ? "purge" : "admit", sfx);
    setVerdictState(decision);
    setClipState(decision === "PURGE" ? "purge" : "admit");
    setReaction(decision === "PURGE" ? "CLIP: HIGH_TEMP_PURGE" : "CLIP: AIRLOCK_ADMIT");
    setActiveTab("verdict");
  };

  const handleSignShiftLog = (excuseIdx: number) => {
    if (logSigned || verdictState === "NONE") return;
    playBoothSfx("ptt", sfx);
    setLogSigned(true);
    setHistory((prev) => [
      ...prev,
      {
        visitorId: visitor.id,
        decision: verdictState,
        wasMimic: currentRoll.isMimic,
        excuse: SHIFT_EXCUSES[excuseIdx]!
      }
    ]);
  };

  const handleNextVisitor = () => {
    if (safeIdx < activeVisitors.length - 1) {
      resetVisitorState(safeIdx + 1, activeVisitors, true);
    } else {
      stopIntercomVoice();
      playBoothSfx("purge", sfx);
      setStage("night5");
    }
  };

  return (
    <div className="booth-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <h1 className="topbar-title">QUARANTINE GATE 0 : 2036</h1>
          <span className="topbar-subtitle">{tl(UI_STRINGS.subtitle, lang)}</span>
        </div>

        <div className="topbar-controls">
          <div className="stepper" aria-label="Visitor progress">
            {activeVisitors.map((v, idx) => (
              <span
                key={v.id}
                title={`Night ${v.night} · ${tl(v.name, lang)}`}
                className={`stepper-pill ${
                  stage === "booth" && idx === safeIdx
                    ? "active"
                    : idx < history.length
                      ? "done"
                      : ""
                }`}
              >
                N{v.night}:{v.id}
                {idx < history.length ? "✓" : ""}
              </span>
            ))}
          </div>

          <select
            id="campaign-mode-select"
            aria-label="Campaign Mode"
            className="ctrl-select"
            value={campaignMode}
            onChange={(e) => handleSwitchCampaignMode(e.target.value as CampaignMode)}
          >
            <option value="full">
              {tl({ zh: "完整战役 (8人)", en: "Full Shift (8)", ja: "本編 (8名)" }, lang)}
            </option>
            <option value="slice">
              {tl({ zh: "速通切片 (3人)", en: "Quick Slice (3)", ja: "短縮版 (3名)" }, lang)}
            </option>
          </select>

          <button type="button" className="ctrl-btn" onClick={() => startNewShift()}>
            {tl(UI_STRINGS.reroll, lang)}
          </button>

          <button
            id="btn-flash-toggle"
            type="button"
            className={`ctrl-btn ${flashConfig.enabled ? "amber" : ""}`}
            onClick={() => setFlashDrawerOpen((o) => !o)}
          >
            ⚡ Flash: {flashConfig.enabled ? "ON" : "OFF"}
          </button>

          <button
            type="button"
            className="ctrl-btn amber"
            onClick={() => {
              stopIntercomVoice();
              playBoothSfx("purge", sfx);
              setStage("night5");
            }}
          >
            {tl(UI_STRINGS.night5Btn, lang)}
          </button>

          <button
            id="btn-voice-toggle"
            type="button"
            className="ctrl-btn"
            onClick={() => {
              setVoice((v) => {
                if (v) stopIntercomVoice();
                return !v;
              });
            }}
          >
            {voice ? "🎙️ VOICE: ON" : "🎙️ VOICE: OFF"}
          </button>

          <button type="button" className="ctrl-btn" onClick={() => setSfx((s) => !s)}>
            {sfx ? "SFX: ON" : "SFX: OFF"}
          </button>

          <select
            id="lang-select"
            aria-label="Language"
            className="ctrl-select"
            value={lang}
            onChange={(e) => {
              stopIntercomVoice();
              setLang(e.target.value as Locale);
            }}
          >
            <option value="zh">简体中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>
      </header>

      {flashDrawerOpen ? (
        <FlashConfigDrawer
          lang={lang}
          config={flashConfig}
          onChange={setFlashConfig}
          onClose={() => setFlashDrawerOpen(false)}
        />
      ) : null}

      <main>
        {stage === "intake" ? (
          <IntakeModal
            lang={lang}
            onComplete={(profile, answers) => {
              playBoothSfx("ptt", sfx);
              setBaseline(profile);
              setIntakeAnswers(answers);
              startNewShift();
            }}
          />
        ) : null}

        {stage === "booth" ? (
          <div className="booth-grid" id="main-booth">
            <div className="left-stack">
              <section className="panel">
                <div className="viewport-header">
                  <span>
                    NIGHT {visitor.night} // GATE CAM 01 · {visitor.id}{" "}
                    {visitor.name.en.toUpperCase()}
                  </span>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <span style={{ color: "var(--frost-cyan)" }}>{reaction}</span>
                    <span style={{ color: "var(--danger-purge)" }}>♥ {bpm} BPM</span>
                    <span style={{ color: "var(--amber-crt)" }}>⚡ {powerLeft}/2 PWR</span>
                  </div>
                </div>

                <ViewportCanvas
                  visitor={visitor}
                  clipState={clipState}
                  bpm={bpm}
                  strobeTrigger={strobeTrigger}
                  thermalTrigger={thermalTrigger}
                  verdictState={verdictState}
                  onClipComplete={handleClipComplete}
                />

                {visitor.night === 3 ? (
                  <div className="storm-banner" id="night3-storm-banner">
                    {tl(UI_STRINGS.stormBanner, lang)}
                  </div>
                ) : null}

                {sensorToast ? <div className="sensor-toast">{sensorToast}</div> : null}

                <div className="sensor-bar">
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      id="btn-strobe"
                      type="button"
                      className="ctrl-btn"
                      disabled={powerLeft <= 0 || verdictState !== "NONE"}
                      onClick={() => handleTriggerSensor("strobe")}
                    >
                      {tl(UI_STRINGS.strobeBtn, lang)}
                    </button>
                    <button
                      id="btn-thermal"
                      type="button"
                      className="ctrl-btn"
                      disabled={powerLeft <= 0 || verdictState !== "NONE"}
                      onClick={() => handleTriggerSensor("thermal")}
                    >
                      {tl(UI_STRINGS.thermalBtn, lang)}
                    </button>
                  </div>
                  <span className="zero-lip-caption">{tl(UI_STRINGS.zeroLipNote, lang)}</span>
                </div>
              </section>

              <IntercomPanel
                visitor={visitor}
                lang={lang}
                turnsLeft={turnsLeft}
                verdictDone={verdictState !== "NONE"}
                isRephrasing={isRephrasing}
                transcript={transcript}
                onAskProbe={handleAskProbe}
                onExecuteVerdict={handleVerdict}
              />
            </div>

            <OrdamorDossier
              visitor={visitor}
              roll={currentRoll}
              lang={lang}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              verdictState={verdictState}
              turnsUsed={4 - turnsLeft}
              offAxisCount={offAxisCount}
              logSigned={logSigned}
              onSignShiftLog={handleSignShiftLog}
              onNextVisitor={handleNextVisitor}
              isLastVisitor={safeIdx >= activeVisitors.length - 1}
              spoilerOpen={spoilerOpen}
              onToggleSpoiler={() => setSpoilerOpen((o) => !o)}
              lastPipelinePayload={lastPipelinePayload}
            />
          </div>
        ) : null}

        {stage === "night5" ? (
          <Night5Audit
            lang={lang}
            baseline={baseline}
            intakeAnswers={intakeAnswers}
            history={history}
            onClose={() => setStage("booth")}
          />
        ) : null}
      </main>
    </div>
  );
}
