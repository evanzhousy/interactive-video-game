import { useState } from "react";
import { playBoothSfx } from "../game/audio.js";
import { UI_STRINGS, tl } from "../game/i18n.js";
import {
  SHIFT_EXCUSES,
  type IntakeOption,
  type PlayerCompactProfile
} from "../game/night5.js";
import { buildRephraseInput, decideStance } from "../game/stance.js";
import type { Locale, ProbeKey, ShiftHistoryEntry, VisitorRoll } from "../game/types.js";
import { VISITORS, rollShift } from "../game/visitors/index.js";
import { IntakeModal } from "./components/IntakeModal.js";
import { IntercomPanel, type TranscriptLine } from "./components/IntercomPanel.js";
import { Night5Audit } from "./components/Night5Audit.js";
import { OrdamorDossier, type DossierTab } from "./components/OrdamorDossier.js";
import { ViewportCanvas } from "./components/ViewportCanvas.js";

type Stage = "intake" | "booth" | "night5";

export function App() {
  const [lang, setLang] = useState<Locale>("zh");
  const [sfx, setSfx] = useState(true);
  const [stage, setStage] = useState<Stage>("intake");

  const [baseline, setBaseline] = useState<PlayerCompactProfile>({
    sig: "own_it",
    kept: "truth",
    dropped: "status"
  });
  const [intakeAnswers, setIntakeAnswers] = useState<IntakeOption[]>([]);

  const [rolls, setRolls] = useState<VisitorRoll[]>(() => rollShift(VISITORS));
  const [visitorIdx, setVisitorIdx] = useState(0);
  const [history, setHistory] = useState<ShiftHistoryEntry[]>([]);

  const visitor = VISITORS[visitorIdx]!;
  const currentRoll = rolls[visitorIdx]!;

  const [turnsLeft, setTurnsLeft] = useState(4);
  const [powerLeft, setPowerLeft] = useState(2);
  const [bpm, setBpm] = useState(visitor.baseBpm);
  const [reaction, setReaction] = useState("IDLE: COLD_BREATH");
  const [strobeTrigger, setStrobeTrigger] = useState(0);
  const [sensorToast, setSensorToast] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([
    { speaker: "npc", text: visitor.openingLine, meta: "INTERCOM CH-01" }
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

  const resetVisitorState = (idx: number) => {
    const v = VISITORS[idx]!;
    setVisitorIdx(idx);
    setTurnsLeft(4);
    setPowerLeft(2);
    setBpm(v.baseBpm);
    setReaction("IDLE: COLD_BREATH");
    setSensorToast(null);
    setTranscript([{ speaker: "npc", text: v.openingLine, meta: "INTERCOM CH-01" }]);
    setOffAxisCount(0);
    setVerdictState("NONE");
    setLogSigned(false);
    setActiveTab("baseline");
    setSpoilerOpen(false);
    setLastPipelinePayload({ status: "AWAITING_INTERROGATION", turns_remaining: 4 });
  };

  const startNewShift = () => {
    playBoothSfx("ptt", sfx);
    setRolls(rollShift(VISITORS));
    setHistory([]);
    setStage("booth");
    resetVisitorState(0);
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
      playBoothSfx("ptt", sfx);
      const msg = currentRoll.isMimic ? visitor.sensors.thermalMimic : visitor.sensors.thermalHuman;
      setSensorToast(`🌡️ ${tl(msg, lang)}`);
    }
  };

  const handleAskProbe = (probeKey: ProbeKey | "off_axis", customText?: string) => {
    if (turnsLeft <= 0 || verdictState !== "NONE") return;
    playBoothSfx("ptt", sfx);

    const probe = probeKey !== "off_axis" ? visitor.probes[probeKey] : undefined;
    const onAxis = Boolean(probe && probe.axis !== null);
    const playerText = customText
      ? { zh: customText, en: customText, ja: customText }
      : probe?.label ?? { zh: customText ?? "", en: customText ?? "", ja: customText ?? "" };

    const stance = decideStance(visitor, currentRoll, probeKey);
    const replyText =
      probeKey === "off_axis" || !probe
        ? visitor.offAxisReply
        : !onAxis
          ? probe.human
          : probe[stance.lineKey] ?? probe.human;

    const reactionClip = onAxis ? "flinch_eyes_dart" : "angry_lean_in";
    const bpmDelta = onAxis ? 10 : 4;

    setTurnsLeft((t) => t - 1);
    setBpm((b) => Math.min(148, b + bpmDelta));
    setReaction(`CLIP: ${reactionClip.toUpperCase()}`);

    setTranscript((prev) => {
      const next: TranscriptLine[] = [
        ...prev,
        { speaker: "player", text: playerText },
        { speaker: "npc", text: replyText, meta: `+${bpmDelta} BPM · ${reactionClip}` }
      ];
      if (!onAxis) {
        next.push({ speaker: "system", text: UI_STRINGS.offAxisSystemNote });
      }
      return next;
    });
    if (!onAxis) setOffAxisCount((c) => c + 1);

    const llmInput = buildRephraseInput(visitor, tl(playerText, lang), stance, lang);
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
      }
    });
  };

  const handleVerdict = (decision: "ADMIT" | "PURGE") => {
    if (verdictState !== "NONE") return;
    playBoothSfx(decision === "PURGE" ? "purge" : "admit", sfx);
    setVerdictState(decision);
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
    if (visitorIdx < VISITORS.length - 1) {
      resetVisitorState(visitorIdx + 1);
    } else {
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
            {VISITORS.map((v, idx) => (
              <span
                key={v.id}
                className={`stepper-pill ${
                  stage === "booth" && idx === visitorIdx
                    ? "active"
                    : idx < history.length
                      ? "done"
                      : ""
                }`}
              >
                {v.id}
                {idx < history.length ? "✓" : ""}
              </span>
            ))}
          </div>

          <button type="button" className="ctrl-btn" onClick={startNewShift}>
            {tl(UI_STRINGS.reroll, lang)}
          </button>

          <button
            type="button"
            className="ctrl-btn amber"
            onClick={() => {
              playBoothSfx("purge", sfx);
              setStage("night5");
            }}
          >
            {tl(UI_STRINGS.night5Btn, lang)}
          </button>

          <button type="button" className="ctrl-btn" onClick={() => setSfx((s) => !s)}>
            {sfx ? "SFX: ON" : "SFX: OFF"}
          </button>

          <select
            id="lang-select"
            aria-label="Language"
            className="ctrl-select"
            value={lang}
            onChange={(e) => setLang(e.target.value as Locale)}
          >
            <option value="zh">简体中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>
      </header>

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
                    GATE CAM 01 // {visitor.id} {visitor.name.en.toUpperCase()}
                  </span>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <span style={{ color: "var(--frost-cyan)" }}>{reaction}</span>
                    <span style={{ color: "var(--danger-purge)" }}>♥ {bpm} BPM</span>
                    <span style={{ color: "var(--amber-crt)" }}>⚡ {powerLeft}/2 PWR</span>
                  </div>
                </div>

                <ViewportCanvas
                  visitor={visitor}
                  reaction={reaction}
                  strobeTrigger={strobeTrigger}
                  verdictState={verdictState}
                />

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
              isLastVisitor={visitorIdx >= VISITORS.length - 1}
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
