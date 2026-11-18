import "./agent-bridge.js";
import { Button } from "@ui-sdk/react/button";
import { Meter, MeterIndicator, MeterTrack } from "@ui-sdk/react/meter";
import { OverlayHost } from "@ui-sdk/react/overlays";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectTrigger,
  SelectValue
} from "@ui-sdk/react/select";
import { useShortcut, useShortcutHint } from "@ui-sdk/react/shortcuts";
import { Toggle } from "@ui-sdk/react/toggle";
import { Tooltip, TooltipContent, TooltipShortcut, TooltipTrigger } from "@ui-sdk/react/tooltip";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  playBoothSfx,
  setBoothAmbience,
  speakIntercomLine,
  stopAllBoothAudio,
  stopIntercomVoice
} from "../game/audio.js";
import {
  INTER_NIGHT_CRISES,
  type CrisisHistoryEntry,
  type CrisisOption,
  type InterNightCrisis
} from "../game/crises.js";
import { getInitialFuel, getSensorPowerBudget } from "../game/economy.js";
import { UI_STRINGS, tl } from "../game/i18n.js";
import type { ClipState, VoiceLineVariant } from "../game/media.js";
import {
  SHIFT_EXCUSES,
  type IntakeOption,
  type PlayerCompactProfile
} from "../game/night5.js";
import {
  requestFlashRephrase,
  resolveInitialFlashConfig
} from "../game/rephrase.js";
import { buildRephraseInput, decideStance } from "../game/stance.js";
import {
  clearSavedShift,
  loadCompendium,
  loadOnboardingDismissed,
  loadSavedShift,
  recordRunCompletion,
  saveOnboardingDismissed,
  saveShiftState,
  type AchievementId,
  type CompendiumState
} from "../game/storage.js";
import type {
  EndingId,
  FlashRephraseConfig,
  Locale,
  ProbeKey,
  ShiftHistoryEntry,
  VisitorRoll,
  VisitorSpec
} from "../game/types.js";
import {
  ALL_VISITORS,
  getDailyShiftSeed,
  getVisitorsForMode,
  rollShift,
  rollShiftForMode,
  type CampaignMode
} from "../game/visitors/index.js";
import { CompendiumModal } from "./components/CompendiumModal.js";
import { CrisisModal, DemoCliffhangerModal } from "./components/CrisisModal.js";
import { FlashConfigDrawer } from "./components/FlashConfigDrawer.js";
import { CheckIcon, ChevronDownIcon } from "./components/Icons.js";
import { IntakeModal } from "./components/IntakeModal.js";
import { IntercomPanel, type TranscriptLine } from "./components/IntercomPanel.js";
import { Night5Audit } from "./components/Night5Audit.js";
import { OnboardingGuide } from "./components/OnboardingGuide.js";
import { OrdamorDossier, type DossierTab } from "./components/OrdamorDossier.js";
import { ViewportCanvas } from "./components/ViewportCanvas.js";

type Stage = "intake" | "booth" | "crisis" | "demo_end" | "night5";

export function App() {
  const initialSave = useRef(loadSavedShift()).current;
  const initialMode: CampaignMode = initialSave?.campaignMode ?? "full";
  const initialDailySeed = initialSave?.dailySeed ?? getDailyShiftSeed();
  const initialFuel = initialSave?.fuelLeft ?? getInitialFuel(initialMode);
  const initialOverdraft = initialSave?.emergencyOverdraftUsed ?? false;

  const [lang, setLang] = useState<Locale>(initialSave?.lang ?? "zh");
  const [sfx, setSfx] = useState(true);
  const [ambience, setAmbience] = useState(true);
  const [voice, setVoice] = useState(true);
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(() =>
    loadOnboardingDismissed()
  );
  const [stage, setStage] = useState<Stage>(initialSave?.stage ?? "intake");
  const [campaignMode, setCampaignMode] = useState<CampaignMode>(initialMode);
  const [dailySeed, setDailySeed] = useState<string>(initialDailySeed);

  const activeVisitors = getVisitorsForMode(campaignMode, dailySeed);

  const [baseline, setBaseline] = useState<PlayerCompactProfile>(
    initialSave?.baseline ?? {
      sig: "own_it",
      kept: "truth",
      dropped: "status"
    }
  );
  const [intakeAnswers, setIntakeAnswers] = useState<IntakeOption[]>(
    initialSave?.intakeAnswers ?? []
  );

  const [rolls, setRolls] = useState<VisitorRoll[]>(
    () => initialSave?.rolls ?? rollShiftForMode(campaignMode, activeVisitors, dailySeed)
  );
  const [visitorIdx, setVisitorIdx] = useState(initialSave?.visitorIdx ?? 0);
  const [history, setHistory] = useState<ShiftHistoryEntry[]>(initialSave?.history ?? []);
  const [crisisHistory, setCrisisHistory] = useState<CrisisHistoryEntry[]>(
    initialSave?.crisisHistory ?? []
  );
  const [activeCrisis, setActiveCrisis] = useState<InterNightCrisis | null>(() => {
    if (initialSave?.activeCrisisId) {
      return INTER_NIGHT_CRISES.find((c) => c.id === initialSave.activeCrisisId) ?? null;
    }
    return initialSave?.stage === "crisis" ? INTER_NIGHT_CRISES[0]! : null;
  });
  const [fuelLeft, setFuelLeft] = useState<number>(initialFuel);
  const [emergencyOverdraftUsed, setEmergencyOverdraftUsed] = useState<boolean>(initialOverdraft);
  const [boggartUsedIds, setBoggartUsedIds] = useState<string[]>(
    initialSave?.boggartUsedIds ?? []
  );

  const [compendium, setCompendium] = useState<CompendiumState>(() => loadCompendium());
  const [compendiumOpen, setCompendiumOpen] = useState(false);

  const safeIdx = Math.min(visitorIdx, activeVisitors.length - 1);
  const visitor = activeVisitors[safeIdx]!;
  const currentRoll = rolls[safeIdx] ?? {
    visitorId: visitor.id,
    isMimic: false,
    defectMode: "HUMAN"
  };

  const [flashConfig, setFlashConfig] = useState<FlashRephraseConfig>(() =>
    resolveInitialFlashConfig()
  );
  const [flashDrawerOpen, setFlashDrawerOpen] = useState(false);
  const [isRephrasing, setIsRephrasing] = useState(false);
  const shiftEpochRef = useRef(0);

  const initialPwrBudget = getSensorPowerBudget(initialFuel, initialOverdraft);
  const [turnsLeft, setTurnsLeft] = useState(4);
  const [powerLeft, setPowerLeft] = useState(initialPwrBudget);
  const [maxPower, setMaxPower] = useState(initialPwrBudget);
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

  // Autosave mid-shift progress whenever stage / visitorIdx / history / crisis / fuel updates
  useEffect(() => {
    if (stage === "booth" || stage === "crisis" || stage === "demo_end" || stage === "night5") {
      saveShiftState({
        version: 1,
        savedAt: new Date().toISOString(),
        lang,
        campaignMode,
        dailySeed,
        stage,
        activeCrisisId: activeCrisis?.id,
        baseline,
        intakeAnswers,
        rolls,
        visitorIdx: safeIdx,
        history,
        crisisHistory,
        fuelLeft,
        emergencyOverdraftUsed,
        boggartUsedIds
      });
    }
  }, [
    activeCrisis,
    baseline,
    boggartUsedIds,
    campaignMode,
    crisisHistory,
    dailySeed,
    emergencyOverdraftUsed,
    fuelLeft,
    history,
    intakeAnswers,
    lang,
    rolls,
    safeIdx,
    stage
  ]);

  // Continuous Arctic -46°C blizzard + metallic hull stress + Night 3 geomagnetic storm ambience
  useEffect(() => {
    setBoothAmbience(
      ambience && sfx && (stage === "booth" || stage === "crisis" || stage === "night5"),
      stage === "night5" ? 5 : visitor.night
    );
  }, [ambience, sfx, stage, visitor.night]);

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
    speakOpening = true,
    nextFuel = fuelLeft,
    nextOverdraft = false
  ) => {
    shiftEpochRef.current += 1;
    const v = roster[idx]!;
    const pwrBudget = getSensorPowerBudget(nextFuel, nextOverdraft);
    setVisitorIdx(idx);
    setIsRephrasing(false);
    setTurnsLeft(4);
    setPowerLeft(pwrBudget);
    setMaxPower(pwrBudget);
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
    const freshSeed = getDailyShiftSeed();
    setDailySeed(freshSeed);
    const roster = getVisitorsForMode(modeOverride, freshSeed);
    const initFuel = getInitialFuel(modeOverride);
    playBoothSfx("ptt", sfx);
    setRolls(rollShiftForMode(modeOverride, roster, freshSeed));
    setHistory([]);
    setCrisisHistory([]);
    setActiveCrisis(null);
    setFuelLeft(initFuel);
    setEmergencyOverdraftUsed(false);
    setBoggartUsedIds([]);
    setStage("booth");
    resetVisitorState(0, roster, true, initFuel, false);
  };

  const handleRestartFromIntake = () => {
    stopIntercomVoice();
    clearSavedShift();
    setHistory([]);
    setCrisisHistory([]);
    setActiveCrisis(null);
    setFuelLeft(getInitialFuel(campaignMode));
    setEmergencyOverdraftUsed(false);
    setBoggartUsedIds([]);
    setStage("intake");
  };

  const handleSwitchCampaignMode = (nextMode: CampaignMode) => {
    const freshSeed = getDailyShiftSeed();
    setDailySeed(freshSeed);
    setCampaignMode(nextMode);
    const roster = getVisitorsForMode(nextMode, freshSeed);
    const initFuel = getInitialFuel(nextMode);
    setRolls(rollShiftForMode(nextMode, roster, freshSeed));
    setHistory([]);
    setCrisisHistory([]);
    setActiveCrisis(null);
    setFuelLeft(initFuel);
    setEmergencyOverdraftUsed(false);
    setBoggartUsedIds([]);
    if (stage === "crisis" || stage === "demo_end") {
      setStage("booth");
    }
    resetVisitorState(0, roster, stage === "booth", initFuel, false);
  };

  const handleTriggerSensor = useCallback(
    (kind: "strobe" | "thermal") => {
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
        const msg = currentRoll.isMimic
          ? visitor.sensors.thermalMimic
          : visitor.sensors.thermalHuman;
        setSensorToast(`🌡️ ${tl(msg, lang)}`);
      }
    },
    [currentRoll.isMimic, lang, powerLeft, sfx, verdictState, visitor.sensors]
  );

  const handleAskProbe = useCallback(
    async (probeKey: ProbeKey | "off_axis", customText?: string) => {
      if (turnsLeft <= 0 || verdictState !== "NONE" || isRephrasing) return;
      playBoothSfx("ptt", sfx);

      if (probeKey === "boggart_trap") {
        setBoggartUsedIds((prev) => (prev.includes(visitor.id) ? prev : [...prev, visitor.id]));
      }

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
    },
    [currentRoll, flashConfig, isRephrasing, lang, sfx, turnsLeft, verdictState, visitor, voice]
  );

  // Desktop Steam / Keyboard Tactical Shortcuts via @ui-sdk/react/shortcuts
  const boothShortcutsEnabled = stage === "booth" && !compendiumOpen;
  const probeKeys = Object.keys(visitor.probes) as ProbeKey[];
  const cycleDossierTab = (delta: -1 | 1) => {
    const order: DossierTab[] = ["baseline", "verdict", "inspector"];
    setActiveTab((cur) => {
      const i = order.indexOf(cur);
      return order[(i + delta + order.length) % order.length]!;
    });
  };

  useShortcut("1", () => {
    if (probeKeys[0]) void handleAskProbe(probeKeys[0]);
  }, { when: () => boothShortcutsEnabled && Boolean(probeKeys[0]), description: "Tactical Probe 1" });
  useShortcut("2", () => {
    if (probeKeys[1]) void handleAskProbe(probeKeys[1]);
  }, { when: () => boothShortcutsEnabled && Boolean(probeKeys[1]), description: "Tactical Probe 2" });
  useShortcut("3", () => {
    if (probeKeys[2]) void handleAskProbe(probeKeys[2]);
  }, { when: () => boothShortcutsEnabled && Boolean(probeKeys[2]), description: "Tactical Probe 3" });
  useShortcut("4", () => {
    if (probeKeys[3]) void handleAskProbe(probeKeys[3]);
  }, { when: () => boothShortcutsEnabled && Boolean(probeKeys[3]), description: "Tactical Probe 4" });
  useShortcut("5", () => {
    if (probeKeys[4]) void handleAskProbe(probeKeys[4]);
  }, { when: () => boothShortcutsEnabled && Boolean(probeKeys[4]), description: "Tactical Probe 5" });
  useShortcut("s", () => handleTriggerSensor("strobe"), {
    when: () => boothShortcutsEnabled,
    description: "Pupil Strobe"
  });
  useShortcut("t", () => handleTriggerSensor("thermal"), {
    when: () => boothShortcutsEnabled,
    description: "Neural Thermal"
  });
  useShortcut("[", () => cycleDossierTab(-1), {
    when: () => boothShortcutsEnabled,
    description: "Previous Dossier Tab"
  });
  useShortcut("]", () => cycleDossierTab(1), {
    when: () => boothShortcutsEnabled,
    description: "Next Dossier Tab"
  });

  const strobeHint = useShortcutHint("s");
  const thermalHint = useShortcutHint("t");

  const campaignModeItems: Array<{ value: CampaignMode; label: string }> = [
    {
      value: "full",
      label: tl({ zh: "完整战役 (8人)", en: "Full Shift (8)", ja: "本編 (8名)" }, lang)
    },
    {
      value: "daily",
      label: tl(
        {
          zh: `今日排班 (${dailySeed})`,
          en: `Daily Shift (${dailySeed})`,
          ja: `日替わり当直 (${dailySeed})`
        },
        lang
      )
    },
    {
      value: "demo",
      label: tl({ zh: "试玩版 (N0–N2)", en: "Demo (N0–N2)", ja: "体験版 (N0–N2)" }, lang)
    },
    {
      value: "slice",
      label: tl({ zh: "速通切片 (3人)", en: "Quick Slice (3)", ja: "短縮版 (3名)" }, lang)
    }
  ];

  const langItems: Array<{ value: Locale; label: string }> = [
    { value: "zh", label: "简体中文" },
    { value: "en", label: "English" },
    { value: "ja", label: "日本語" }
  ];

  const handleVerdict = (decision: "ADMIT" | "PURGE") => {
    if (verdictState !== "NONE" || isRephrasing) return;
    stopIntercomVoice();
    playBoothSfx(decision === "PURGE" ? "purge" : "admit", sfx);
    if (decision === "PURGE") {
      if (fuelLeft > 0) {
        setFuelLeft((f) => Math.max(0, f - 1));
      } else {
        setEmergencyOverdraftUsed(true);
        setSensorToast(
          tl(
            {
              zh: "⚠️ 供暖燃料已归零！本次净化透支了备用电容，下一名访客传感器归零 (0⚡)！",
              en: "⚠️ 0 FUEL! Emergency purge drained backup capacitor—next visitor gets 0⚡ sensor power!",
              ja: "⚠️ 燃料ゼロ！緊急焼却で予備コンデンサを消費——次の訪問者はセンサー電力 0⚡！"
            },
            lang
          )
        );
      }
    }
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
    if (campaignMode === "demo" && safeIdx >= activeVisitors.length - 1) {
      stopIntercomVoice();
      playBoothSfx("purge", sfx);
      setStage("demo_end");
      return;
    }

    if (activeVisitors.length >= 8 && (campaignMode === "full" || campaignMode === "daily")) {
      const scheduledCrisis =
        safeIdx === 3
          ? INTER_NIGHT_CRISES[0]
          : safeIdx === 5
            ? INTER_NIGHT_CRISES[1]
            : safeIdx === 7
              ? INTER_NIGHT_CRISES[2]
              : undefined;
      if (scheduledCrisis && !crisisHistory.some((c) => c.crisisId === scheduledCrisis.id)) {
        stopIntercomVoice();
        playBoothSfx("ptt", sfx);
        setActiveCrisis(scheduledCrisis);
        setStage("crisis");
        return;
      }
    }

    if (safeIdx < activeVisitors.length - 1) {
      const nextOverdraft = emergencyOverdraftUsed;
      setEmergencyOverdraftUsed(false);
      resetVisitorState(safeIdx + 1, activeVisitors, true, fuelLeft, nextOverdraft);
    } else {
      stopIntercomVoice();
      playBoothSfx("purge", sfx);
      setStage("night5");
    }
  };

  const handleResolveCrisisOption = (option: CrisisOption) => {
    if (!activeCrisis) return;
    playBoothSfx("ptt", sfx);
    const nextFuel = fuelLeft + option.fuelDelta;
    const nextOverdraft = nextFuel > 0 ? false : emergencyOverdraftUsed;

    setCrisisHistory((prev) => [
      ...prev,
      {
        crisisId: activeCrisis.id,
        optionId: option.id,
        kept: option.kept,
        dropped: option.dropped,
        sig: option.sig,
        fuelDelta: option.fuelDelta
      }
    ]);
    setFuelLeft(nextFuel);
    setEmergencyOverdraftUsed(false);
    setActiveCrisis(null);

    if (safeIdx < activeVisitors.length - 1) {
      setStage("booth");
      resetVisitorState(safeIdx + 1, activeVisitors, true, nextFuel, nextOverdraft);
    } else {
      playBoothSfx("purge", sfx);
      setStage("night5");
    }
  };

  const handleUpgradeDemoToFullShift = () => {
    stopIntercomVoice();
    playBoothSfx("ptt", sfx);
    const fullRolls = rollShift(ALL_VISITORS);
    const mergedRolls = [
      ...rolls.slice(0, 4),
      ...fullRolls.slice(4)
    ];
    const bonusFuel = fuelLeft + 2;
    setCampaignMode("full");
    setRolls(mergedRolls);
    setFuelLeft(bonusFuel);
    setActiveCrisis(INTER_NIGHT_CRISES[0]!);
    setStage("crisis");
  };

  const handleResolveNight5Ending = (ending: EndingId): AchievementId[] => {
    clearSavedShift();
    const { next, newlyUnlockedAchievements } = recordRunCompletion({
      current: compendium,
      ending,
      campaignMode,
      history,
      boggartUsedIds
    });
    setCompendium(next);
    return newlyUnlockedAchievements;
  };

  return (
    <div className="booth-shell">
      <OverlayHost />
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

          <Select<CampaignMode>
            items={campaignModeItems}
            value={campaignMode}
            onValueChange={(next) => {
              if (next) handleSwitchCampaignMode(next);
            }}
          >
            <SelectTrigger
              id="campaign-mode-select"
              aria-label="Campaign Mode"
              className="ctrl-select"
            >
              <SelectValue />
              <ChevronDownIcon />
            </SelectTrigger>
            <SelectContent>
              {campaignModeItems.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  label={item.label}
                  data-mode={item.value}
                >
                  {item.label}
                  <SelectItemIndicator>
                    <CheckIcon />
                  </SelectItemIndicator>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button className="ctrl-btn" onClick={() => startNewShift()}>
            {tl(UI_STRINGS.reroll, lang)}
          </Button>

          <Button
            id="btn-compendium"
            className={`ctrl-btn ${compendiumOpen ? "amber" : ""}`}
            onClick={() => setCompendiumOpen((o) => !o)}
          >
            🏆 {tl({ zh: "图鉴", en: "Archive", ja: "図鑑" }, lang)} (
            {compendium.unlockedEndings.length}/7)
          </Button>

          <Button
            id="btn-flash-toggle"
            className={`ctrl-btn ${flashConfig.enabled ? "amber" : ""}`}
            onClick={() => setFlashDrawerOpen((o) => !o)}
          >
            ⚡ Flash: {flashConfig.enabled ? "ON" : "OFF"}
          </Button>

          <Button
            className="ctrl-btn amber"
            onClick={() => {
              stopIntercomVoice();
              playBoothSfx("purge", sfx);
              setStage("night5");
            }}
          >
            {tl(UI_STRINGS.night5Btn, lang)}
          </Button>

          <Toggle
            id="btn-voice-toggle"
            pressed={voice}
            className="ctrl-btn"
            onPressedChange={(next) => {
              if (!next) stopIntercomVoice();
              setVoice(next);
            }}
          >
            {voice ? "🎙️ VOICE: ON" : "🎙️ VOICE: OFF"}
          </Toggle>

          <Tooltip>
            <TooltipTrigger
              render={
                <Toggle
                  id="btn-ambience-toggle"
                  pressed={ambience}
                  className="ctrl-btn"
                  onPressedChange={setAmbience}
                />
              }
            >
              {ambience ? "🌨️ AMB: ON" : "🌨️ AMB: OFF"}
            </TooltipTrigger>
            <TooltipContent>
              {tl(
                {
                  zh: "-46°C 极地暴风雪与钢壳结构啸叫环境音",
                  en: "-46°C Blizzard & Hull Stress Ambience",
                  ja: "-46°C 吹雪と船殻ストレス環境音"
                },
                lang
              )}
            </TooltipContent>
          </Tooltip>

          <Toggle pressed={sfx} className="ctrl-btn" onPressedChange={setSfx}>
            {sfx ? "SFX: ON" : "SFX: OFF"}
          </Toggle>

          <Tooltip>
            <TooltipTrigger
              render={
                <Toggle
                  id="btn-help-toggle"
                  pressed={!onboardingDismissed}
                  aria-label={tl(
                    {
                      zh: "开关审讯战术教学",
                      en: "Toggle Tactical Interrogation Guide",
                      ja: "戦術尋問ガイド切替"
                    },
                    lang
                  )}
                  className={`ctrl-btn ${!onboardingDismissed && visitor.id === "V-01" ? "amber" : ""}`}
                  onPressedChange={(pressed) => {
                    const nextDismissed = !pressed;
                    setOnboardingDismissed(nextDismissed);
                    saveOnboardingDismissed(nextDismissed);
                  }}
                />
              }
            >
              ?
            </TooltipTrigger>
            <TooltipContent>
              {tl(
                {
                  zh: "开关审讯战术教学引导",
                  en: "Toggle Tactical Interrogation Guide",
                  ja: "戦術尋問ガイド切替"
                },
                lang
              )}
            </TooltipContent>
          </Tooltip>

          <Select<Locale>
            items={langItems}
            value={lang}
            onValueChange={(next) => {
              if (next) {
                stopIntercomVoice();
                setLang(next);
              }
            }}
          >
            <SelectTrigger id="lang-select" aria-label="Language" className="ctrl-select">
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

      <FlashConfigDrawer
        open={flashDrawerOpen}
        onOpenChange={setFlashDrawerOpen}
        lang={lang}
        config={flashConfig}
        onChange={setFlashConfig}
      />

      <CompendiumModal
        open={compendiumOpen}
        onOpenChange={setCompendiumOpen}
        lang={lang}
        compendium={compendium}
      />

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

        {stage === "crisis" && activeCrisis ? (
          <CrisisModal
            crisis={activeCrisis}
            lang={lang}
            fuelLeft={fuelLeft}
            onResolveOption={handleResolveCrisisOption}
          />
        ) : null}

        {stage === "demo_end" ? (
          <DemoCliffhangerModal
            lang={lang}
            voice={voice}
            baseline={baseline}
            intakeAnswers={intakeAnswers}
            history={history}
            onUpgradeToFullShift={handleUpgradeDemoToFullShift}
            onRestartDemo={() => startNewShift("demo")}
          />
        ) : null}

        {stage === "booth" ? (
          <>
            {visitor.id === "V-01" && !onboardingDismissed ? (
              <OnboardingGuide
                lang={lang}
                turnsUsed={4 - turnsLeft}
                verdictState={verdictState}
                logSigned={logSigned}
                onDismiss={() => {
                  setOnboardingDismissed(true);
                  saveOnboardingDismissed(true);
                }}
              />
            ) : null}
            <div
              className={`booth-grid ${
                visitor.id === "V-01" && !onboardingDismissed
                  ? `tutorial-step-${verdictState !== "NONE" ? 3 : turnsLeft === 4 ? 1 : 2}`
                  : ""
              }`.trim()}
              id="main-booth"
            >
              <div className="left-stack">
                <section className="panel">
                  <div className="viewport-header">
                    <span>
                      NIGHT {visitor.night} // GATE CAM 01 · {visitor.id}{" "}
                      {visitor.name.en.toUpperCase()}
                    </span>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ color: "var(--frost-cyan)" }}>{reaction}</span>
                      <span style={{ color: "var(--danger-purge)" }}>♥ {bpm} BPM</span>
                      <Tooltip>
                        <TooltipTrigger
                          render={(triggerProps) => {
                            const { type: _type, ...rest } = triggerProps as Record<string, unknown>;
                            return (
                              <span
                                {...(rest as React.HTMLAttributes<HTMLSpanElement>)}
                                id="booth-fuel-pill"
                                tabIndex={0}
                                aria-label={`Furnace fuel: ${fuelLeft}`}
                                className={`fuel-pill ${fuelLeft === 0 ? "depleted" : fuelLeft <= 1 ? "low" : ""}`}
                              />
                            );
                          }}
                        >
                          🔥 {fuelLeft} FUEL
                        </TooltipTrigger>
                        <TooltipContent>
                          {tl(
                            {
                              zh: "岗亭供暖与高温净化燃料：每次净化消耗 1🔥，归零后触发低温降电 (1⚡)",
                              en: "Furnace & Purge Fuel: Each PURGE costs 1🔥; 0 fuel triggers -46°C brownout (1⚡)",
                              ja: "暖房・浄化燃料：焼却ごとに 1🔥 消費。ゼロで氷点下電圧低下 (1⚡)"
                            },
                            lang
                          )}
                        </TooltipContent>
                      </Tooltip>
                      <Meter
                        className="hud-meter"
                        value={powerLeft}
                        min={0}
                        max={Math.max(1, maxPower)}
                        aria-label={tl(
                          { zh: "传感器剩余电量", en: "Sensor power", ja: "センサー電力" },
                          lang
                        )}
                      >
                        <MeterTrack>
                          <MeterIndicator />
                        </MeterTrack>
                      </Meter>
                      <span style={{ color: "var(--amber-crt)" }}>
                        ⚡ {powerLeft}/{maxPower} PWR
                      </span>
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

                  {fuelLeft === 0 ? (
                    <div className="cryo-brownout-banner" id="cryo-brownout-banner">
                      {tl(
                        {
                          zh: "❄️ -46°C 供暖停摆 (0🔥)：备用电容结霜，传感器供电衰减至 1⚡（强行拉闸净化将透支下回合至 0⚡）！",
                          en: "❄️ -46°C CRYO-BROWNOUT (0🔥): Frosted capacitor limits sensors to 1⚡ (forcing PURGE drains next shift to 0⚡)!",
                          ja: "❄️ -46°C 暖房停止 (0🔥)：センサー電力が 1⚡ に低下（燃料ゼロでの強行焼却は次回 0⚡ へ枯渇）！"
                        },
                        lang
                      )}
                    </div>
                  ) : null}

                  {visitor.night === 3 ? (
                    <div className="storm-banner" id="night3-storm-banner">
                      {tl(UI_STRINGS.stormBanner, lang)}
                    </div>
                  ) : null}

                  {sensorToast ? <div className="sensor-toast">{sensorToast}</div> : null}

                  <div className="sensor-bar">
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Tooltip shortcut="s">
                        <TooltipTrigger
                          render={
                            <Button
                              id="btn-strobe"
                              className="ctrl-btn"
                              disabled={powerLeft <= 0 || verdictState !== "NONE"}
                              focusableWhenDisabled
                              aria-keyshortcuts={strobeHint.ariaKeyshortcuts}
                              onClick={() => handleTriggerSensor("strobe")}
                            />
                          }
                        >
                          {tl(UI_STRINGS.strobeBtn, lang)}
                        </TooltipTrigger>
                        <TooltipContent>
                          {tl(
                            {
                              zh: "脉冲强光扫描瞳孔反射",
                              en: "Strobe pupil photomotor scan",
                              ja: "ストロボ瞳孔反応スキャン"
                            },
                            lang
                          )}{" "}
                          <TooltipShortcut />
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip shortcut="t">
                        <TooltipTrigger
                          render={
                            <Button
                              id="btn-thermal"
                              className="ctrl-btn"
                              disabled={powerLeft <= 0 || verdictState !== "NONE"}
                              focusableWhenDisabled
                              aria-keyshortcuts={thermalHint.ariaKeyshortcuts}
                              onClick={() => handleTriggerSensor("thermal")}
                            />
                          }
                        >
                          {tl(UI_STRINGS.thermalBtn, lang)}
                        </TooltipTrigger>
                        <TooltipContent>
                          {tl(
                            {
                              zh: "FLIR 颈部神经端口红外热成像",
                              en: "FLIR cervical neural port thermal scan",
                              ja: "FLIR 頚部神経ポート赤外線スキャン"
                            },
                            lang
                          )}{" "}
                          <TooltipShortcut />
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="zero-lip-caption">{tl(UI_STRINGS.zeroLipNote, lang)}</span>
                  </div>
                </section>

                <IntercomPanel
                  visitor={visitor}
                  lang={lang}
                  turnsLeft={turnsLeft}
                  fuelLeft={fuelLeft}
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
          </>
        ) : null}

        {stage === "night5" ? (
          <Night5Audit
            lang={lang}
            sfx={sfx}
            voice={voice}
            baseline={baseline}
            intakeAnswers={intakeAnswers}
            history={history}
            crisisHistory={crisisHistory}
            fuelLeft={fuelLeft}
            campaignMode={campaignMode}
            dailySeed={dailySeed}
            onResolveEnding={handleResolveNight5Ending}
            onStartNewRun={handleRestartFromIntake}
            onClose={() => setStage("booth")}
          />
        ) : null}
      </main>
    </div>
  );
}
