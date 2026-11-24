import "./agent-bridge.js";
import { Button } from "@ui-sdk/react/button";
import { Collapsible, CollapsiblePanel } from "@ui-sdk/react/collapsible";
import { Input, InputGroup } from "@ui-sdk/react/input";
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
import { flushSync } from "react-dom";
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
import { deriveHeartbeatProfile, stepHeartbeat } from "../game/heartbeat.js";
import { UI_STRINGS, tl } from "../game/i18n.js";
import { streamInterrogateTurn } from "../game/interrogate-client.js";
import { DEFAULT_INTERROGATE_MODEL } from "../game/interrogate-prompt.js";
import type { ClipState, VoiceLineVariant } from "../game/media.js";
import {
  SHIFT_EXCUSES,
  type IntakeOption,
  type PlayerCompactProfile
} from "../game/night5.js";
import {
  DEFAULT_FLASH_CONFIG,
  requestFlashRephrase
} from "../game/rephrase.js";
import { loadOrGenerateSeededVisitors } from "../game/seeded-client.js";
import { buildRephraseInput, decideStance } from "../game/stance.js";
import {
  clearSavedShift,
  hydrateCompendium,
  hydrateSavedShift,
  loadCompendium,
  loadOnboardingDismissed,
  loadOperatorName,
  loadSavedShift,
  recordRunCompletion,
  recordStoryProgress,
  saveOnboardingDismissed,
  saveOperatorName,
  saveShiftState,
  type AchievementId,
  type CompendiumState,
  type SavedShiftState
} from "../game/storage.js";
import {
  PROLOGUE_NODE_IDS,
  STORY_EDGES,
  getStoryNode,
  type StoryChoice
} from "../game/story-graph.js";
import type {
  EndingId,
  FlashRephraseConfig,
  HeartbeatEvent,
  InterrogateAxisKey,
  InterrogateHistoryTurn,
  Locale,
  ProbeKey,
  ShiftHistoryEntry,
  VisitorRoll,
  VisitorSpec
} from "../game/types.js";
import {
  ALL_VISITORS,
  generateRunSeed,
  getDailyShiftSeed,
  getVisitorsForMode,
  rollShiftForMode,
  type CampaignMode
} from "../game/visitors/index.js";
import { CompendiumModal } from "./components/CompendiumModal.js";
import { CrisisModal, DemoCliffhangerModal } from "./components/CrisisModal.js";
import { FlashConfigDrawer } from "./components/FlashConfigDrawer.js";
import { GtaEcgCanvas, GtaRadarCanvas } from "./components/GtaHudCanvas.js";
import {
  ArchiveIcon,
  BoltPowerIcon,
  CheckIcon,
  ChevronDownIcon,
  FlameFuelIcon,
  HazardTriangleIcon,
  MicSignalIcon,
  MotionPauseIcon,
  MotionPlayIcon,
  SlidersConsoleIcon,
  SnowHazardIcon,
  StoryBranchIcon,
  StrobeTargetIcon,
  ThermalWaveIcon
} from "./components/Icons.js";
import { IntakeModal } from "./components/IntakeModal.js";
import { InteractiveMoviePlayer } from "./components/InteractiveMoviePlayer.js";
import { IntercomPanel, type TranscriptLine } from "./components/IntercomPanel.js";
import { LobbyScreen } from "./components/LobbyScreen.js";
import { Night5Audit } from "./components/Night5Audit.js";
import { OnboardingGuide } from "./components/OnboardingGuide.js";
import { OrdamorDossier, type DossierTab } from "./components/OrdamorDossier.js";
import { ProductionStudioView } from "./components/ProductionStudioView.js";
import { IsometricAirlockSchematic } from "./components/Schematics.js";
import { StoryFlowchartModal } from "./components/StoryFlowchartModal.js";
import { ViewportCanvas } from "./components/ViewportCanvas.js";
import { WebGLAtmosphere } from "./components/WebGLAtmosphere.js";

type Stage = "lobby" | "intake" | "booth" | "crisis" | "demo_end" | "night5" | "studio";

const CORE_TURNS_MAX = 4;
const CHATTER_BUDGET_MAX = 3;

function resolveInitialInterrogateConfig(): FlashRephraseConfig {
  const host = typeof window !== "undefined" ? (window.location?.hostname ?? "") : "";
  if (host.endsWith(".vercel.app")) {
    return {
      ...DEFAULT_FLASH_CONFIG,
      enabled: true,
      mode: "server_proxy",
      proxyPath: "/api/interrogate",
      model: DEFAULT_INTERROGATE_MODEL,
      freeTextOnly: false
    };
  }
  return {
    ...DEFAULT_FLASH_CONFIG,
    enabled: false,
    mode: "server_proxy",
    proxyPath: "/api/interrogate",
    model: DEFAULT_INTERROGATE_MODEL,
    freeTextOnly: true
  };
}

export function App() {
  const initialSave = useRef(loadSavedShift()).current;
  const initialMode: CampaignMode = initialSave?.campaignMode ?? "full";
  const initialDailySeed = initialSave?.dailySeed ?? getDailyShiftSeed();
  const initialRunSeed =
    initialSave?.runSeed ??
    (initialMode === "daily" ? initialDailySeed : generateRunSeed(initialMode));
  const initialFuel = initialSave?.fuelLeft ?? getInitialFuel(initialMode);
  const initialRoster = getVisitorsForMode(
    initialMode,
    initialMode === "seeded" ? initialRunSeed : initialDailySeed
  );
  const initialHistory = initialSave?.history ?? [];
  const initialCrises = initialSave?.crisisHistory ?? [];

  let resolvedInitialStage: Stage = initialSave?.stage ?? "lobby";
  let resolvedInitialIdx = Math.min(initialSave?.visitorIdx ?? 0, initialRoster.length - 1);
  let resolvedInitialCrisis: InterNightCrisis | null = initialSave?.activeCrisisId
    ? (INTER_NIGHT_CRISES.find((c) => c.id === initialSave.activeCrisisId) ?? null)
    : resolvedInitialStage === "crisis"
      ? INTER_NIGHT_CRISES[0]!
      : null;
  let resolvedInitialCurrentOverdraft = initialSave?.currentVisitorOverdraft ?? false;
  let resolvedInitialPendingOverdraft = initialSave?.emergencyOverdraftUsed ?? false;

    if (
      resolvedInitialStage === "booth" &&
      initialHistory.some((h) => h.visitorId === initialRoster[resolvedInitialIdx]?.id)
    ) {
      const scheduled =
        initialRoster.length >= 8 &&
        (initialMode === "full" || initialMode === "daily" || initialMode === "seeded")
        ? resolvedInitialIdx === 3
          ? INTER_NIGHT_CRISES[0]
          : resolvedInitialIdx === 5
            ? INTER_NIGHT_CRISES[1]
            : resolvedInitialIdx === 7
              ? INTER_NIGHT_CRISES[2]
              : undefined
        : undefined;

    if (initialMode === "demo" && resolvedInitialIdx >= initialRoster.length - 1) {
      resolvedInitialStage = "demo_end";
    } else if (scheduled && !initialCrises.some((c) => c.crisisId === scheduled.id)) {
      resolvedInitialCrisis = scheduled;
      resolvedInitialStage = "crisis";
    } else if (resolvedInitialIdx < initialRoster.length - 1) {
      resolvedInitialIdx += 1;
      resolvedInitialCurrentOverdraft = resolvedInitialPendingOverdraft;
      resolvedInitialPendingOverdraft = false;
    } else {
      resolvedInitialStage = "night5";
    }
  }

  const [lang, setLang] = useState<Locale>(initialSave?.lang ?? "zh");
  const [operatorName, setOperatorName] = useState<string>(
    () => initialSave?.operatorName ?? loadOperatorName()
  );
  const [savedShiftSnapshot, setSavedShiftSnapshot] = useState<SavedShiftState | null>(initialSave);
  const [sfx, setSfx] = useState(true);
  const [ambience, setAmbience] = useState(true);
  const [voice, setVoice] = useState(true);
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(() =>
    loadOnboardingDismissed()
  );
  const [stage, setStage] = useState<Stage>(resolvedInitialStage);
  const [campaignMode, setCampaignMode] = useState<CampaignMode>(initialMode);
  const [dailySeed, setDailySeed] = useState<string>(initialDailySeed);
  const [runSeed, setRunSeed] = useState<string>(initialRunSeed);
  const [seedDraft, setSeedDraft] = useState<string>(initialRunSeed);
  const [seededRoster, setSeededRoster] = useState<VisitorSpec[] | null>(null);
  const [seededSource, setSeededSource] = useState<
    "idb_cache" | "llm" | "procedural_fallback" | null
  >(null);
  const [isGeneratingSeed, setIsGeneratingSeed] = useState(false);

  const activeVisitors =
    campaignMode === "seeded"
      ? (seededRoster ?? getVisitorsForMode("seeded", runSeed))
      : getVisitorsForMode(campaignMode, dailySeed);

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
    () => initialSave?.rolls ?? rollShiftForMode(campaignMode, activeVisitors, initialRunSeed)
  );
  const [visitorIdx, setVisitorIdx] = useState(resolvedInitialIdx);
  const [history, setHistory] = useState<ShiftHistoryEntry[]>(initialHistory);
  const [crisisHistory, setCrisisHistory] = useState<CrisisHistoryEntry[]>(initialCrises);
  const [activeCrisis, setActiveCrisis] = useState<InterNightCrisis | null>(resolvedInitialCrisis);
  const [fuelLeft, setFuelLeft] = useState<number>(initialFuel);
  const [emergencyOverdraftUsed, setEmergencyOverdraftUsed] = useState<boolean>(
    resolvedInitialPendingOverdraft
  );
  const [currentVisitorOverdraft, setCurrentVisitorOverdraft] = useState<boolean>(
    resolvedInitialCurrentOverdraft
  );
  const [boggartUsedIds, setBoggartUsedIds] = useState<string[]>(
    initialSave?.boggartUsedIds ?? []
  );

  const [compendium, setCompendium] = useState<CompendiumState>(() => loadCompendium());
  const [compendiumOpen, setCompendiumOpen] = useState(false);
  const [storyMapOpen, setStoryMapOpen] = useState(false);
  const [activeStoryNodeId, setActiveStoryNodeId] = useState<string | null>(null);
  const [prologueInitialStep, setPrologueInitialStep] = useState(0);
  const returnStageRef = useRef<Exclude<Stage, "studio">>("lobby");

  const openStudioFrom = (fromStage: Exclude<Stage, "studio">) => {
    stopIntercomVoice();
    returnStageRef.current = fromStage;
    transitionStage(() => setStage("studio"));
  };

  const unlockStoryNodes = useCallback((nodeIds: string[], edgeIds: string[] = []) => {
    setCompendium((prev) => recordStoryProgress(prev, nodeIds, edgeIds));
  }, []);

  const safeIdx = Math.min(visitorIdx, activeVisitors.length - 1);
  const visitor = activeVisitors[safeIdx]!;
  const sensorsBlinded = visitor.night === 3;
  const currentRoll = rolls[safeIdx] ?? {
    visitorId: visitor.id,
    isMimic: false,
    defectMode: "HUMAN"
  };

  const [flashConfig, setFlashConfig] = useState<FlashRephraseConfig>(() =>
    resolveInitialInterrogateConfig()
  );
  const [sysDrawerOpen, setSysDrawerOpen] = useState(false);
  const [dossierCollapsed, setDossierCollapsed] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);

  // Sync root motion pause attribute so portaled Dialogs/Popovers also obey WCAG 2.2.2 Pause
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.motion = motionPaused ? "paused" : "running";
    }
  }, [motionPaused]);
  const [flashDrawerOpen, setFlashDrawerOpen] = useState(false);
  const [isRephrasing, setIsRephrasing] = useState(false);
  const [streamingReply, setStreamingReply] = useState<string | null>(null);
  const [signalGlitch, setSignalGlitch] = useState(false);
  const shiftEpochRef = useRef(0);
  const mainRef = useRef<HTMLElement | null>(null);

  const savedSessionMatch =
    initialSave?.activeSession && initialSave.activeSession.visitorId === visitor.id
      ? initialSave.activeSession
      : null;

  const initialPwrBudget = getSensorPowerBudget(initialFuel, resolvedInitialCurrentOverdraft);
  const [turnsLeft, setTurnsLeft] = useState(savedSessionMatch?.turnsLeft ?? CORE_TURNS_MAX);
  const [chatterLeft, setChatterLeft] = useState(
    savedSessionMatch?.chatterLeft ?? CHATTER_BUDGET_MAX
  );
  const [powerLeft, setPowerLeft] = useState(savedSessionMatch?.powerLeft ?? initialPwrBudget);
  const [maxPower, setMaxPower] = useState(savedSessionMatch?.maxPower ?? initialPwrBudget);
  const [bpm, setBpm] = useState(
    () => savedSessionMatch?.bpm ?? deriveHeartbeatProfile(visitor, initialRunSeed).baseBpm
  );
  const [lastBpmDelta, setLastBpmDelta] = useState<number | null>(null);
  const [heartbeatEvents, setHeartbeatEvents] = useState<HeartbeatEvent[]>(
    savedSessionMatch?.heartbeatEvents ?? []
  );
  const [stressReplayUnlocked, setStressReplayUnlocked] = useState<boolean>(
    savedSessionMatch?.stressReplayUnlocked ?? false
  );
  const [clipState, setClipState] = useState<ClipState>("idle");
  const [reaction, setReaction] = useState("IDLE: COLD_BREATH");
  const [strobeTrigger, setStrobeTrigger] = useState(0);
  const [thermalTrigger, setThermalTrigger] = useState(0);
  const [sensorToast, setSensorToast] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>(
    savedSessionMatch?.transcript ?? [
      { speaker: "npc", text: visitor.openingLine, meta: `N${visitor.night} · INTERCOM CH-01` }
    ]
  );
  const [offAxisCount, setOffAxisCount] = useState(savedSessionMatch?.offAxisCount ?? 0);
  const [verdictState, setVerdictState] = useState<"NONE" | "ADMIT" | "PURGE">("NONE");
  const [logSigned, setLogSigned] = useState(false);
  const [activeTab, setActiveTab] = useState<DossierTab>("baseline");
  const [spoilerOpen, setSpoilerOpen] = useState(false);
  const [lastPipelinePayload, setLastPipelinePayload] = useState<Record<string, unknown>>({
    status: "AWAITING_INTERROGATION",
    turns_remaining: CORE_TURNS_MAX,
    chatter_remaining: CHATTER_BUDGET_MAX
  });

  const applySavedShift = useCallback(
    (saved: SavedShiftState) => {
      const savedRoster = getVisitorsForMode(
        saved.campaignMode,
        saved.campaignMode === "seeded"
          ? (saved.runSeed ?? getDailyShiftSeed())
          : (saved.dailySeed ?? getDailyShiftSeed())
      );
      let nextIdx = Math.min(saved.visitorIdx, savedRoster.length - 1);
      let nextStage: Stage = saved.stage;
      let nextCrisis: InterNightCrisis | null = saved.activeCrisisId
        ? (INTER_NIGHT_CRISES.find((c) => c.id === saved.activeCrisisId) ?? null)
        : nextStage === "crisis"
          ? INTER_NIGHT_CRISES[0]!
          : null;
      let nextCurrentOverdraft = Boolean(saved.currentVisitorOverdraft);
      let nextPendingOverdraft = Boolean(saved.emergencyOverdraftUsed);
      const savedHist = saved.history ?? [];
      const savedCrises = saved.crisisHistory ?? [];

      if (
        nextStage === "booth" &&
        savedHist.some((h) => h.visitorId === savedRoster[nextIdx]?.id)
      ) {
        const scheduled =
          savedRoster.length >= 8 &&
          (saved.campaignMode === "full" ||
            saved.campaignMode === "daily" ||
            saved.campaignMode === "seeded")
            ? nextIdx === 3
              ? INTER_NIGHT_CRISES[0]
              : nextIdx === 5
                ? INTER_NIGHT_CRISES[1]
                : nextIdx === 7
                  ? INTER_NIGHT_CRISES[2]
                  : undefined
            : undefined;
        if (saved.campaignMode === "demo" && nextIdx >= savedRoster.length - 1) {
          nextStage = "demo_end";
        } else if (scheduled && !savedCrises.some((c) => c.crisisId === scheduled.id)) {
          nextCrisis = scheduled;
          nextStage = "crisis";
        } else if (nextIdx < savedRoster.length - 1) {
          nextIdx += 1;
          nextCurrentOverdraft = nextPendingOverdraft;
          nextPendingOverdraft = false;
        } else {
          nextStage = "night5";
        }
      }

      const nextVisitor = savedRoster[nextIdx]!;
      const nextSeed =
        saved.runSeed ??
        (saved.campaignMode === "daily"
          ? (saved.dailySeed ?? getDailyShiftSeed())
          : generateRunSeed(saved.campaignMode));
      const nextFuel = saved.fuelLeft ?? getInitialFuel(saved.campaignMode);
      const pwrBudget = getSensorPowerBudget(nextFuel, nextCurrentOverdraft);

      setLang(saved.lang);
      if (saved.operatorName) {
        setOperatorName(saved.operatorName);
        saveOperatorName(saved.operatorName);
      }
      setCampaignMode(saved.campaignMode);
      if (saved.dailySeed) setDailySeed(saved.dailySeed);
      setRunSeed(nextSeed);
      setSeedDraft(nextSeed);
      setBaseline(saved.baseline);
      setIntakeAnswers(saved.intakeAnswers);
      setRolls(saved.rolls);
      setVisitorIdx(nextIdx);
      setHistory(savedHist);
      setCrisisHistory(savedCrises);
      setActiveCrisis(nextCrisis);
      setFuelLeft(nextFuel);
      setEmergencyOverdraftUsed(nextPendingOverdraft);
      setCurrentVisitorOverdraft(nextCurrentOverdraft);
      setBoggartUsedIds(saved.boggartUsedIds);
      setVerdictState("NONE");
      setLogSigned(false);
      setActiveTab("baseline");

      if (saved.activeSession && saved.activeSession.visitorId === nextVisitor.id) {
        setTurnsLeft(saved.activeSession.turnsLeft);
        setChatterLeft(saved.activeSession.chatterLeft);
        setBpm(saved.activeSession.bpm);
        setHeartbeatEvents(saved.activeSession.heartbeatEvents);
        setStressReplayUnlocked(saved.activeSession.stressReplayUnlocked);
        setTranscript(saved.activeSession.transcript);
        setOffAxisCount(saved.activeSession.offAxisCount);
        setPowerLeft(saved.activeSession.powerLeft);
        setMaxPower(saved.activeSession.maxPower);
      } else {
        setTurnsLeft(CORE_TURNS_MAX);
        setChatterLeft(CHATTER_BUDGET_MAX);
        setBpm(deriveHeartbeatProfile(nextVisitor, nextSeed).baseBpm);
        setHeartbeatEvents([]);
        setStressReplayUnlocked(false);
        setTranscript([
          { speaker: "npc", text: nextVisitor.openingLine, meta: `N${nextVisitor.night} · INTERCOM CH-01` }
        ]);
        setOffAxisCount(0);
        setPowerLeft(pwrBudget);
        setMaxPower(pwrBudget);
      }
      setSavedShiftSnapshot(saved);
      setStage(nextStage);
    },
    []
  );

  // Hydrate client IndexedDB records on mount when IndexedDB holds newer data than localStorage
  useEffect(() => {
    let cancelled = false;
    void hydrateCompendium().then((dbComp) => {
      if (cancelled) return;
      setCompendium((prev) => {
        const mergedNodes = Array.from(
          new Set([...(prev.unlockedStoryNodes ?? []), ...(dbComp.unlockedStoryNodes ?? [])])
        );
        const mergedEdges = Array.from(
          new Set([...(prev.visitedStoryEdges ?? []), ...(dbComp.visitedStoryEdges ?? [])])
        );
        if (
          dbComp.completedRuns > prev.completedRuns ||
          mergedNodes.length > (prev.unlockedStoryNodes?.length ?? 0) ||
          mergedEdges.length > (prev.visitedStoryEdges?.length ?? 0)
        ) {
          const base = dbComp.completedRuns > prev.completedRuns ? dbComp : prev;
          return {
            ...base,
            unlockedStoryNodes: mergedNodes,
            visitedStoryEdges: mergedEdges
          };
        }
        return prev;
      });
    });
    if (!initialSave) {
      void hydrateSavedShift().then((dbShift) => {
        if (cancelled || !dbShift) return;
        setSavedShiftSnapshot(dbShift);
      });
    }
    return () => {
      cancelled = true;
    };
    // Run once on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave mid-shift progress (IndexedDB + localStorage mirror)
  useEffect(() => {
    if (stage === "booth" || stage === "crisis" || stage === "demo_end" || stage === "night5") {
      const snapshot: SavedShiftState = {
        version: 1,
        savedAt: new Date().toISOString(),
        lang,
        operatorName: operatorName.trim() || undefined,
        campaignMode,
        dailySeed,
        runSeed,
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
        currentVisitorOverdraft,
        boggartUsedIds,
        activeSession:
          stage === "booth" && verdictState === "NONE"
            ? {
                visitorId: visitor.id,
                turnsLeft,
                chatterLeft,
                bpm,
                heartbeatEvents,
                stressReplayUnlocked,
                transcript,
                offAxisCount,
                powerLeft,
                maxPower
              }
            : undefined
      };
      saveShiftState(snapshot);
      setSavedShiftSnapshot(snapshot);
    }
  }, [
    activeCrisis,
    baseline,
    boggartUsedIds,
    bpm,
    campaignMode,
    chatterLeft,
    crisisHistory,
    currentVisitorOverdraft,
    dailySeed,
    emergencyOverdraftUsed,
    fuelLeft,
    heartbeatEvents,
    history,
    intakeAnswers,
    lang,
    maxPower,
    offAxisCount,
    operatorName,
    powerLeft,
    rolls,
    runSeed,
    safeIdx,
    stage,
    stressReplayUnlocked,
    transcript,
    turnsLeft,
    verdictState,
    visitor.id
  ]);

  // Continuous Arctic -46°C blizzard + metallic hull stress + Night 3 geomagnetic storm ambience
  useEffect(() => {
    setBoothAmbience(
      ambience &&
        sfx &&
        (stage === "lobby" || stage === "booth" || stage === "crisis" || stage === "night5"),
      stage === "night5" ? 5 : stage === "lobby" ? 1 : visitor.night
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
    nextOverdraft = false,
    seedOverride = runSeed
  ) => {
    shiftEpochRef.current += 1;
    const v = roster[idx]!;
    const pwrBudget = getSensorPowerBudget(nextFuel, nextOverdraft);
    const hbProfile = deriveHeartbeatProfile(v, seedOverride);
    setVisitorIdx(idx);
    setCurrentVisitorOverdraft(nextOverdraft);
    setIsRephrasing(false);
    setStreamingReply(null);
    setSignalGlitch(false);
    setTurnsLeft(CORE_TURNS_MAX);
    setChatterLeft(CHATTER_BUDGET_MAX);
    setPowerLeft(pwrBudget);
    setMaxPower(pwrBudget);
    setBpm(hbProfile.baseBpm);
    setLastBpmDelta(null);
    setHeartbeatEvents([]);
    setStressReplayUnlocked(false);
    setClipState("idle");
    setReaction("IDLE: COLD_BREATH");
    setStrobeTrigger(0);
    setThermalTrigger(0);
    setSensorToast(null);
    setTranscript([
      { speaker: "npc", text: v.openingLine, meta: `N${v.night} · INTERCOM CH-01` }
    ]);
    setOffAxisCount(0);
    setVerdictState("NONE");
    setLogSigned(false);
    setActiveTab("baseline");
    setSpoilerOpen(false);
    setLastPipelinePayload({
      status: "AWAITING_INTERROGATION",
      turns_remaining: CORE_TURNS_MAX,
      chatter_remaining: CHATTER_BUDGET_MAX
    });

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

  const transitionStage = useCallback(
    (fn: () => void, direction: "forward" | "backward" = "forward") => {
      const canVT =
        !motionPaused &&
        typeof document !== "undefined" &&
        "startViewTransition" in document &&
        !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      const focusMain = () => {
        if (!mainRef.current) return;
        const active = document.activeElement;
        if (
          !active ||
          active === document.body ||
          !document.contains(active) ||
          mainRef.current.contains(active)
        ) {
          mainRef.current.focus({ preventScroll: true });
        }
      };
      if (!canVT) {
        fn();
        focusMain();
        return;
      }
      const startVT = (
        document as unknown as {
          startViewTransition: (
            arg: (() => void) | { update: () => void; types: string[] }
          ) => { finished: Promise<void> };
        }
      ).startViewTransition.bind(document);
      let vt: { finished: Promise<void> };
      try {
        vt = startVT({
          update: () => flushSync(fn),
          types: [direction]
        });
      } catch {
        vt = startVT(() => {
          flushSync(fn);
        });
      }
      void vt.finished.finally(focusMain);
    },
    [motionPaused]
  );

  const loadSeededRoster = useCallback(
    async (targetSeed: string, targetLang: Locale = lang, resetToFirst = false) => {
      const clean = targetSeed.trim() || generateRunSeed("seeded");
      setIsGeneratingSeed(true);
      const result = await loadOrGenerateSeededVisitors({
        seed: clean,
        locale: targetLang,
        allowOnline: flashConfig.enabled && flashConfig.mode === "server_proxy"
      });
      setIsGeneratingSeed(false);
      setSeededRoster(result.visitors);
      setSeededSource(result.source);
      setRunSeed(result.seed);
      setSeedDraft(result.seed);
      if (resetToFirst) {
        const initFuel = getInitialFuel("seeded");
        setRolls(rollShiftForMode("seeded", result.visitors, result.seed));
        setHistory([]);
        setCrisisHistory([]);
        setActiveCrisis(null);
        setFuelLeft(initFuel);
        setEmergencyOverdraftUsed(false);
        setBoggartUsedIds([]);
        resetVisitorState(0, result.visitors, stage === "booth", initFuel, false, result.seed);
      }
      return result.visitors;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flashConfig.enabled, flashConfig.mode, lang, stage]
  );

  // Hydrate cached/AI seeded roster when entering or restoring `seeded` mode
  useEffect(() => {
    if (campaignMode !== "seeded") return;
    void loadSeededRoster(runSeed, lang, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignMode, lang]);

  const startNewShift = (modeOverride: CampaignMode = campaignMode) => {
    const freshDailySeed = getDailyShiftSeed();
    const freshRunSeed =
      modeOverride === "daily"
        ? freshDailySeed
        : modeOverride === "seeded"
          ? (seedDraft.trim() || generateRunSeed("seeded"))
          : generateRunSeed(modeOverride);
    const roster =
      modeOverride === "seeded"
        ? (seededRoster ?? getVisitorsForMode("seeded", freshRunSeed))
        : getVisitorsForMode(modeOverride, freshDailySeed);
    const initFuel = getInitialFuel(modeOverride);
    playBoothSfx("ptt", sfx);
    transitionStage(() => {
      setDailySeed(freshDailySeed);
      setRunSeed(freshRunSeed);
      setSeedDraft(freshRunSeed);
      setRolls(rollShiftForMode(modeOverride, roster, freshRunSeed));
      setHistory([]);
      setCrisisHistory([]);
      setActiveCrisis(null);
      setFuelLeft(initFuel);
      setEmergencyOverdraftUsed(false);
      setBoggartUsedIds([]);
      setStage("booth");
      resetVisitorState(0, roster, true, initFuel, false, freshRunSeed);
      if (roster[0]?.id === "V-01") {
        setActiveStoryNodeId("n1_elena_arrival");
        unlockStoryNodes(
          ["n1_elena_arrival", "n1_elena_confront"],
          ["e_n1e_arr_con"]
        );
      } else {
        setActiveStoryNodeId(null);
      }
    });
    if (modeOverride === "seeded") {
      void loadSeededRoster(freshRunSeed, lang, false);
    }
  };

  const handleRestartFromIntake = () => {
    stopIntercomVoice();
    clearSavedShift();
    setSavedShiftSnapshot(null);
    transitionStage(() => {
      setHistory([]);
      setCrisisHistory([]);
      setActiveCrisis(null);
      setFuelLeft(getInitialFuel(campaignMode));
      setEmergencyOverdraftUsed(false);
      setBoggartUsedIds([]);
      setActiveStoryNodeId(null);
      setPrologueInitialStep(0);
      setStage("intake");
    }, "backward");
  };

  const handleReturnToLobby = () => {
    stopIntercomVoice();
    playBoothSfx("ptt", sfx);
    transitionStage(() => setStage("lobby"), "backward");
  };

  const handleSwitchCampaignMode = (nextMode: CampaignMode) => {
    const freshDailySeed = getDailyShiftSeed();
    const freshRunSeed = nextMode === "daily" ? freshDailySeed : generateRunSeed(nextMode);
    setDailySeed(freshDailySeed);
    setRunSeed(freshRunSeed);
    setSeedDraft(freshRunSeed);
    setCampaignMode(nextMode);
    if (nextMode !== "seeded") {
      setSeededRoster(null);
      setSeededSource(null);
    }
    const roster = getVisitorsForMode(
      nextMode,
      nextMode === "seeded" ? freshRunSeed : freshDailySeed
    );
    const initFuel = getInitialFuel(nextMode);
    setRolls(rollShiftForMode(nextMode, roster, freshRunSeed));
    setHistory([]);
    setCrisisHistory([]);
    setActiveCrisis(null);
    setFuelLeft(initFuel);
    setEmergencyOverdraftUsed(false);
    setBoggartUsedIds([]);
    if (stage === "crisis" || stage === "demo_end") {
      transitionStage(() => setStage("booth"));
    }
    resetVisitorState(0, roster, stage === "booth", initFuel, false, freshRunSeed);
    if (nextMode === "seeded") {
      void loadSeededRoster(freshRunSeed, lang, true);
    }
  };

  const handleTriggerSensor = useCallback(
    (kind: "strobe" | "thermal", dismissStoryOverlay = true) => {
      if (sensorsBlinded || powerLeft <= 0 || verdictState !== "NONE") return;
      if (dismissStoryOverlay) {
        setActiveStoryNodeId(null);
      }
      setPowerLeft((p) => p - 1);
      if (kind === "strobe") {
        playBoothSfx("strobe", sfx);
        setStrobeTrigger((c) => c + 1);
        const msg = currentRoll.isMimic ? visitor.sensors.strobeMimic : visitor.sensors.strobeHuman;
        setSensorToast(`[STROBE] ${tl(msg, lang)}`);
      } else {
        playBoothSfx("thermal", sfx);
        setThermalTrigger((c) => c + 1);
        const msg = currentRoll.isMimic
          ? visitor.sensors.thermalMimic
          : visitor.sensors.thermalHuman;
        setSensorToast(`[THERMAL] ${tl(msg, lang)}`);
      }
    },
    [currentRoll.isMimic, lang, powerLeft, sensorsBlinded, sfx, verdictState, visitor.sensors]
  );

  const handleUnlockStressReplay = useCallback(() => {
    if (
      sensorsBlinded ||
      powerLeft <= 0 ||
      verdictState !== "NONE" ||
      stressReplayUnlocked ||
      heartbeatEvents.length === 0
    ) {
      return;
    }
    setActiveStoryNodeId(null);
    playBoothSfx("heartbeat", sfx);
    setPowerLeft((p) => p - 1);
    setStressReplayUnlocked(true);
    setSensorToast(
      tl(
        {
          zh: "[ECG REPLAY] 已解锁本场心率应激回放：对照各轮脉搏跃升与言辞张力。",
          en: "[ECG REPLAY] Cardiac stress replay unlocked: cross-check per-turn pulse shifts against statements.",
          ja: "[ECG REPLAY] 心拍ストレス再生を解錠：各ターンの脈拍変化と発言を照合せよ。"
        },
        lang
      )
    );
  }, [heartbeatEvents.length, lang, powerLeft, sensorsBlinded, sfx, stressReplayUnlocked, verdictState]);

  const handleAskProbe = useCallback(
    async (probeKey: ProbeKey | "off_axis", customText?: string) => {
      if (turnsLeft <= 0 || verdictState !== "NONE" || isRephrasing) return;
      setActiveStoryNodeId(null);
      playBoothSfx("ptt", sfx);
      setSignalGlitch(false);

      const epochAtStart = shiftEpochRef.current;
      const initialProbe = probeKey !== "off_axis" ? visitor.probes[probeKey] : undefined;
      const playerText = customText
        ? { zh: customText, en: customText, ja: customText }
        : initialProbe?.label ?? { zh: customText ?? "", en: customText ?? "", ja: customText ?? "" };
      const questionStr = tl(playerText, lang);

      const resolveForAxis = (axisKey: InterrogateAxisKey) => {
        const probe = axisKey !== "off_axis" ? visitor.probes[axisKey] : undefined;
        const onAxis = Boolean(probe && probe.axis !== null);
        const stance = decideStance(visitor, currentRoll, axisKey);
        const isFlawedAxis = onAxis && stance.lineKey !== "human";
        const canonicalReply =
          axisKey === "off_axis" || !probe
            ? visitor.offAxisReply
            : !onAxis
              ? probe.human
              : probe[stance.lineKey] ?? probe.human;
        const resolvedLineId: VoiceLineVariant =
          axisKey === "off_axis" || !probe
            ? "off_axis"
            : !onAxis
              ? `${axisKey}_human`
              : `${axisKey}_${stance.lineKey}`;
        return { probe, onAxis, stance, isFlawedAxis, canonicalReply, resolvedLineId };
      };

      const applyTurnTelemetry = (axisKey: InterrogateAxisKey) => {
        const resolved = resolveForAxis(axisKey);
        if (axisKey === "boggart_trap") {
          setBoggartUsedIds((prev) => (prev.includes(visitor.id) ? prev : [...prev, visitor.id]));
        }

        const hb = stepHeartbeat({
          visitor,
          roll: currentRoll,
          runSeed,
          currentBpm: bpm,
          turnIndex: heartbeatEvents.length + 1,
          axis: axisKey,
          onAxis: resolved.onAxis,
          isFlawedAxis: resolved.isFlawedAxis,
          questionText: questionStr
        });

        if (resolved.onAxis) {
          setTurnsLeft((t) => Math.max(0, t - 1));
        } else if (chatterLeft > 0) {
          setChatterLeft((c) => Math.max(0, c - 1));
          setOffAxisCount((c) => c + 1);
        } else {
          setTurnsLeft((t) => Math.max(0, t - 1));
          setOffAxisCount((c) => c + 1);
        }

        const nextClip: ClipState = resolved.onAxis ? "flinch" : "lean_in";
        const reactionClip = resolved.onAxis ? "flinch_eyes_dart" : "angry_lean_in";

        setBpm(hb.bpmAfter);
        setLastBpmDelta(hb.blinded ? null : hb.delta);
        setHeartbeatEvents((prev) => [...prev, hb.event]);
        setClipState(nextClip);
        setReaction(`CLIP: ${reactionClip.toUpperCase()}`);
        if (!hb.blinded && (hb.anomaly === "spike" || hb.anomaly === "elevated")) {
          playBoothSfx("heartbeat", sfx);
        }

        const bpmTag = hb.blinded
          ? "ECG LOST"
          : `${hb.delta >= 0 ? "+" : ""}${hb.delta} BPM`;

        return { ...resolved, hb, reactionClip, bpmTag };
      };

      const shouldInvokeAi =
        flashConfig.enabled && (Boolean(customText) || !flashConfig.freeTextOnly);

      if (!shouldInvokeAi) {
        const tel = applyTurnTelemetry(probeKey);
        const llmInput = buildRephraseInput(
          visitor,
          questionStr,
          tel.stance,
          lang,
          tl(tel.canonicalReply, lang)
        );

        setTranscript((prev) => {
          const next: TranscriptLine[] = [
            ...prev,
            { speaker: "player", text: playerText },
            { speaker: "npc", text: tel.canonicalReply, meta: `${tel.bpmTag} · ${tel.reactionClip}` }
          ];
          if (!tel.onAxis) {
            next.push({ speaker: "system", text: UI_STRINGS.offAxisSystemNote });
          }
          return next;
        });

        speakIntercomLine({
          visitorId: visitor.id,
          locale: lang,
          text: tl(tel.canonicalReply, lang),
          lineId: tel.resolvedLineId,
          enabled: voice
        });

        const { lineKey: _hiddenKey, ...publicStance } = tel.stance;
        setLastPipelinePayload({
          "1_axis_detection": {
            question: questionStr,
            detected: probeKey,
            on_axis: tel.onAxis
          },
          "2_stance_engine": publicStance,
          "3_heartbeat_physics": {
            blinded: tel.hb.blinded,
            bpm_before: tel.hb.bpmBefore,
            bpm_after: tel.hb.bpmAfter,
            delta: tel.hb.delta
          },
          "4_llm_visible_input": llmInput,
          "5_ai_gateway": {
            enabled: flashConfig.enabled,
            invoked: false,
            source: "offline_canonical"
          }
        });
        return;
      }

      // Online AI Interrogation flow
      setIsRephrasing(true);
      setStreamingReply("");
      setTranscript((prev) => [...prev, { speaker: "player", text: playerText }]);

      if (flashConfig.mode === "custom_endpoint") {
        const tel = applyTurnTelemetry(probeKey);
        const llmInput = buildRephraseInput(
          visitor,
          questionStr,
          tel.stance,
          lang,
          tl(tel.canonicalReply, lang)
        );
        const outcome = await requestFlashRephrase(llmInput, flashConfig);
        if (shiftEpochRef.current !== epochAtStart) return;
        setIsRephrasing(false);
        setStreamingReply(null);

        const finalReply =
          outcome.source === "flash"
            ? { ...tel.canonicalReply, [lang]: outcome.line }
            : tel.canonicalReply;
        const aiTag = outcome.source === "flash" ? "CH-01 // LIVE" : "CH-01 // RELAY";

        setTranscript((prev) => {
          const next: TranscriptLine[] = [
            ...prev,
            { speaker: "npc", text: finalReply, meta: `${tel.bpmTag} · ${tel.reactionClip} · ${aiTag}` }
          ];
          if (!tel.onAxis) {
            next.push({ speaker: "system", text: UI_STRINGS.offAxisSystemNote });
          }
          return next;
        });

        speakIntercomLine({
          visitorId: visitor.id,
          locale: lang,
          text: tl(finalReply, lang),
          lineId: tel.resolvedLineId,
          isDynamicFlash: outcome.source === "flash",
          enabled: voice
        });
        return;
      }

      // Primary path: Vercel AI Gateway streaming via /api/interrogate (`anthropic/claude-sonnet-5.5`)
      const initialResolved = resolveForAxis(probeKey);
      const convoHistory: InterrogateHistoryTurn[] = transcript
        .filter((item) => item.speaker === "player" || item.speaker === "npc")
        .map((item) => ({
          role: item.speaker === "player" ? "user" : "assistant",
          content: tl(item.text, lang)
        }));

      const outcome = await streamInterrogateTurn<InterrogateAxisKey>(
        {
          stage: "booth",
          runSeed,
          campaignMode,
          visitorId: visitor.id,
          ...(campaignMode === "seeded" ? { customVisitor: visitor } : {}),
          ...(operatorName.trim() ? { operatorName: operatorName.trim() } : {}),
          locale: lang,
          question: questionStr,
          hintAxis: probeKey,
          history: convoHistory,
          fallbackLine: tl(initialResolved.canonicalReply, lang)
        },
        {
          onDelta: (_piece, acc) => {
            if (shiftEpochRef.current === epochAtStart) {
              setStreamingReply(acc);
            }
          }
        },
        { endpoint: "/api/interrogate" }
      );

      if (shiftEpochRef.current !== epochAtStart) return;
      setIsRephrasing(false);
      setStreamingReply(null);
      if (outcome.signalGlitch) {
        setSignalGlitch(true);
      }

      const finalAxis: InterrogateAxisKey = outcome.axis;
      const tel = applyTurnTelemetry(finalAxis);
      const finalReply =
        outcome.source === "llm"
          ? { ...tel.canonicalReply, [lang]: outcome.text }
          : tel.canonicalReply;
      const aiTag = outcome.source === "llm" ? "CH-01 // LIVE" : "CH-01 // RELAY";

      setTranscript((prev) => {
        const next: TranscriptLine[] = [
          ...prev,
          {
            speaker: "npc",
            text: finalReply,
            meta: `${tel.bpmTag} · ${tel.reactionClip} · ${aiTag}`
          }
        ];
        if (!tel.onAxis) {
          next.push({ speaker: "system", text: UI_STRINGS.offAxisSystemNote });
        }
        return next;
      });

      speakIntercomLine({
        visitorId: visitor.id,
        locale: lang,
        text: tl(finalReply, lang),
        lineId: tel.resolvedLineId,
        isDynamicFlash: outcome.source === "llm",
        enabled: voice
      });

      const { lineKey: _hiddenKey, ...publicStance } = tel.stance;
      setLastPipelinePayload({
        "1_axis_detection": {
          question: questionStr,
          hint: probeKey,
          resolved: finalAxis,
          on_axis: tel.onAxis
        },
        "2_stance_engine": publicStance,
        "3_heartbeat_physics": {
          blinded: tel.hb.blinded,
          bpm_before: tel.hb.bpmBefore,
          bpm_after: tel.hb.bpmAfter,
          delta: tel.hb.delta
        },
        "4_ai_gateway": {
          enabled: true,
          endpoint: "/api/interrogate",
          source: outcome.source,
          latency_ms: outcome.latencyMs,
          model: outcome.model ?? DEFAULT_INTERROGATE_MODEL,
          fallback_reason: outcome.fallbackReason ?? null,
          history_turns: convoHistory.length
        }
      });
    },
    [
      bpm,
      campaignMode,
      chatterLeft,
      currentRoll,
      flashConfig,
      heartbeatEvents.length,
      isRephrasing,
      lang,
      operatorName,
      runSeed,
      sfx,
      transcript,
      turnsLeft,
      verdictState,
      visitor,
      voice
    ]
  );

  // Desktop Steam / Keyboard Tactical Shortcuts via @ui-sdk/react/shortcuts
  const boothShortcutsEnabled = stage === "booth" && !compendiumOpen && !storyMapOpen;
  const probeKeys = Object.keys(visitor.probes) as ProbeKey[];
  const cycleDossierTab = (delta: -1 | 1) => {
    const order: DossierTab[] = import.meta.env?.DEV
      ? ["baseline", "verdict", "inspector"]
      : ["baseline", "verdict"];
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
  useShortcut("r", () => handleUnlockStressReplay(), {
    when: () => boothShortcutsEnabled,
    description: "ECG Stress Replay"
  });
  useShortcut("[", () => cycleDossierTab(-1), {
    when: () => boothShortcutsEnabled,
    description: "Previous Dossier Tab"
  });
  useShortcut("]", () => cycleDossierTab(1), {
    when: () => boothShortcutsEnabled,
    description: "Next Dossier Tab"
  });
  useShortcut("d", () => setDossierCollapsed((c) => !c), {
    when: () => stage === "booth" && !compendiumOpen && !storyMapOpen && !flashDrawerOpen,
    description: "Toggle Ordamor Dossier HUD"
  });

  const strobeHint = useShortcutHint("s");
  const thermalHint = useShortcutHint("t");
  const replayHint = useShortcutHint("r");

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
      value: "seeded",
      label: tl(
        {
          zh: "随机排班 (8人 · 种子模式)",
          en: "Seeded Shift (8 · Custom Seed)",
          ja: "ランダム当直 (8名 · シード)"
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
    setActiveStoryNodeId(null);
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
              zh: "[! OVERDRAFT] 供暖燃料已归零！本次净化透支了备用电容，下一名访客传感器归零 [0 PWR]！",
              en: "[! OVERDRAFT] 0 FUEL! Emergency purge drained backup capacitor—next visitor gets 0 PWR sensor power!",
              ja: "[! OVERDRAFT] 燃料ゼロ！緊急焼却で予備コンデンサを消費——次の訪問者はセンサー電力 0 PWR！"
            },
            lang
          )
        );
      }
    }
    setVerdictState(decision);
    setDossierCollapsed(false);
    setClipState(decision === "PURGE" ? "purge" : "admit");
    setReaction(decision === "PURGE" ? "CLIP: HIGH_TEMP_PURGE" : "CLIP: AIRLOCK_ADMIT");
    setActiveTab("verdict");
  };

  const handleSignShiftLog = (excuseIdx: number) => {
    if (logSigned || verdictState === "NONE" || history.some((h) => h.visitorId === visitor.id)) {
      return;
    }
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
      transitionStage(() => setStage("demo_end"));
      return;
    }

    if (
      activeVisitors.length >= 8 &&
      (campaignMode === "full" || campaignMode === "daily" || campaignMode === "seeded")
    ) {
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
        transitionStage(() => {
          setActiveCrisis(scheduledCrisis);
          setStage("crisis");
        });
        return;
      }
    }

    if (safeIdx < activeVisitors.length - 1) {
      const nextOverdraft = emergencyOverdraftUsed;
      setEmergencyOverdraftUsed(false);
      const nextVisitorSpec = activeVisitors[safeIdx + 1];
      if (visitor.id === "V-01" && nextVisitorSpec?.id === "V-02") {
        const isPurge =
          verdictState === "PURGE" ||
          history.find((h) => h.visitorId === "V-01")?.decision === "PURGE";
        const elenaVerdictNode = isPurge ? "n1_elena_purge" : "n1_elena_admit";
        const corridorNode = isPurge ? "n1_corridor_purge" : "n1_corridor_admit";
        const edgeToVerdict = isPurge ? "e_n1e_con_purge" : "e_n1e_con_admit";
        const edgeToCorridor = isPurge ? "e_n1e_purge_corr" : "e_n1e_admit_corr";
        unlockStoryNodes([elenaVerdictNode, corridorNode], [edgeToVerdict, edgeToCorridor]);
        setActiveStoryNodeId(corridorNode);
      } else {
        if (visitor.id === "V-02") {
          const isPurge =
            verdictState === "PURGE" ||
            history.find((h) => h.visitorId === "V-02")?.decision === "PURGE";
          const leoVerdictNode = isPurge ? "n1_leo_purge" : "n1_leo_admit";
          const edgeToVerdict = isPurge ? "e_n1l_con_purge" : "e_n1l_con_admit";
          const edgeToAfter = isPurge ? "e_n1l_purge_after" : "e_n1l_admit_after";
          unlockStoryNodes([leoVerdictNode, "n1_leo_aftermath"], [edgeToVerdict, edgeToAfter]);
          setActiveStoryNodeId("n1_leo_aftermath");
          resetVisitorState(safeIdx + 1, activeVisitors, false, fuelLeft, nextOverdraft);
          return;
        }
        setActiveStoryNodeId(null);
      }
      resetVisitorState(safeIdx + 1, activeVisitors, true, fuelLeft, nextOverdraft);
    } else {
      stopIntercomVoice();
      playBoothSfx("purge", sfx);
      setActiveStoryNodeId(null);
      transitionStage(() => setStage("night5"));
    }
  };

  const handleSelectBoothStoryChoice = (choice: StoryChoice) => {
    const curId = activeStoryNodeId;
    const edge = STORY_EDGES.find((e) => e.from === curId && e.to === choice.nextNodeId);
    const extraNodes: string[] = [choice.nextNodeId];
    const extraEdges: string[] = edge ? [edge.id] : [];

    if (choice.directVerdict) {
      const isPurge = choice.directVerdict === "PURGE";
      const usedOverdraft = isPurge && fuelLeft <= 0;
      const nextFuel = isPurge && fuelLeft > 0 ? fuelLeft - 1 : fuelLeft;
      stopIntercomVoice();
      playBoothSfx(isPurge ? "purge" : "admit", sfx);
      if (isPurge) {
        if (fuelLeft > 0) setFuelLeft(nextFuel);
        else setEmergencyOverdraftUsed(true);
      }
      const existingDecision = history.some((h) => h.visitorId === visitor.id);
      if (!existingDecision) {
        setHistory((prev) => [
          ...prev,
          {
            visitorId: visitor.id,
            decision: choice.directVerdict!,
            wasMimic: currentRoll.isMimic,
            excuse: SHIFT_EXCUSES[0]!
          }
        ]);
      }

      if (visitor.id === "V-01") {
        extraNodes.push(isPurge ? "n1_elena_purge" : "n1_elena_admit");
        extraEdges.push(isPurge ? "e_n1e_purge_corr" : "e_n1e_admit_corr");
        const v2Idx = activeVisitors.findIndex((v) => v.id === "V-02");
        if (v2Idx > safeIdx) {
          resetVisitorState(v2Idx, activeVisitors, false, nextFuel, usedOverdraft);
        }
      } else if (visitor.id === "V-02") {
        extraNodes.push(isPurge ? "n1_leo_purge" : "n1_leo_admit");
        extraEdges.push(isPurge ? "e_n1l_purge_after" : "e_n1l_admit_after");
      }
    } else {
      playBoothSfx("ptt", sfx);
    }

    if (choice.nextNodeId === "nights_2_5_hub") {
      extraEdges.push("e_n1l_after_hub");
    }
    unlockStoryNodes(extraNodes, extraEdges);

    const nextNode = getStoryNode(choice.nextNodeId);
    if (nextNode && nextNode.kind === "movie") {
      setActiveStoryNodeId(nextNode.id);
    } else {
      setActiveStoryNodeId(null);
      if (
        choice.nextNodeId === "nights_2_5_hub" &&
        visitor.id === "V-02" &&
        safeIdx < activeVisitors.length - 1
      ) {
        resetVisitorState(safeIdx + 1, activeVisitors, true, fuelLeft, emergencyOverdraftUsed);
      }
    }

    if (choice.boothEffect) {
      if (choice.boothEffect.action === "strobe") {
        if (!sensorsBlinded && powerLeft > 0 && verdictState === "NONE") {
          handleTriggerSensor("strobe", false);
        }
      } else if (choice.boothEffect.action === "dossier") {
        setDossierCollapsed(false);
        setActiveTab("baseline");
      }
      setTranscript((prev) => [
        ...prev,
        { speaker: "system", text: choice.boothEffect!.systemNote }
      ]);
    }
  };

  const handleJumpToStoryNode = (nodeId: string) => {
    stopIntercomVoice();
    playBoothSfx("ptt", sfx);

    const pIdx = PROLOGUE_NODE_IDS.indexOf(nodeId as (typeof PROLOGUE_NODE_IDS)[number]);
    if (pIdx >= 0) {
      setActiveStoryNodeId(null);
      setPrologueInitialStep(pIdx);
      transitionStage(() => setStage("intake"), "backward");
      return;
    }

    if (
      nodeId === "n1_elena_arrival" ||
      nodeId === "n1_elena_react_intercom" ||
      nodeId === "n1_elena_react_strobe" ||
      nodeId === "n1_elena_confront"
    ) {
      const idx = Math.max(0, activeVisitors.findIndex((v) => v.id === "V-01"));
      const showMovie = nodeId !== "n1_elena_confront";
      transitionStage(() => {
        setStage("booth");
        resetVisitorState(idx, activeVisitors, !showMovie, fuelLeft, false);
        setActiveStoryNodeId(showMovie ? nodeId : null);
      });
      return;
    }

    if (
      nodeId === "n1_corridor_admit" ||
      nodeId === "n1_corridor_purge" ||
      nodeId === "n1_leo_arrival" ||
      nodeId === "n1_leo_react_intercom" ||
      nodeId === "n1_leo_aftermath" ||
      nodeId === "n1_leo_confront"
    ) {
      const idx = Math.max(0, activeVisitors.findIndex((v) => v.id === "V-02"));
      const showMovie = nodeId !== "n1_leo_confront";
      transitionStage(() => {
        setStage("booth");
        resetVisitorState(idx, activeVisitors, !showMovie, fuelLeft, false);
        setActiveStoryNodeId(showMovie ? nodeId : null);
      });
      return;
    }

    if (nodeId === "nights_2_5_hub") {
      const idx = Math.min(2, activeVisitors.length - 1);
      transitionStage(() => {
        setStage("booth");
        resetVisitorState(idx, activeVisitors, true, fuelLeft, false);
        setActiveStoryNodeId(null);
      });
    }
  };

  const handleResolveCrisisOption = (option: CrisisOption) => {
    if (!activeCrisis) return;
    playBoothSfx("ptt", sfx);
    const nextFuel = fuelLeft + option.fuelDelta;
    const nextOverdraft = nextFuel > 0 ? false : emergencyOverdraftUsed;

    transitionStage(() => {
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
    });
  };

  const handleUpgradeDemoToFullShift = () => {
    stopIntercomVoice();
    playBoothSfx("ptt", sfx);
    const upgradeSeed = generateRunSeed("full");
    const fullRolls = rollShiftForMode("full", ALL_VISITORS, upgradeSeed);
    const mergedRolls = [
      ...rolls.slice(0, 4),
      ...fullRolls.slice(4)
    ];
    const bonusFuel = fuelLeft + 2;
    transitionStage(() => {
      setCampaignMode("full");
      setRunSeed(upgradeSeed);
      setRolls(mergedRolls);
      setFuelLeft(bonusFuel);
      setActiveCrisis(INTER_NIGHT_CRISES[0]!);
      setStage("crisis");
    });
  };

  const handleResolveNight5Ending = (ending: EndingId): AchievementId[] => {
    clearSavedShift();
    setSavedShiftSnapshot(null);
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
    <div
      className={`booth-shell ${stage === "lobby" ? "is-lobby" : ""} ${stage === "booth" ? "is-gta-booth" : ""}`.trim()}
      data-motion={motionPaused ? "paused" : "active"}
    >
      <OverlayHost />
      {stage !== "lobby" ? (
      <header className="topbar">
        <div className="topbar-brand">
          <Button
            id="btn-return-lobby"
            className="station-stamp station-stamp-btn"
            onClick={handleReturnToLobby}
            title={tl({ zh: "返回主大厅（进度已自动保存）", en: "Return to Lobby (autosaved)", ja: "ロビーへ戻る（自動保存済）" }, lang)}
          >
            GATE-0
          </Button>
          <h1 className="topbar-title">ORD-OS // 2036</h1>
          <span className="topbar-subtitle">
            SVALBARD -46°C · OP#09{operatorName.trim() ? ` · ${operatorName.trim()}` : ""}
          </span>
        </div>

        <div className="stepper" aria-label="Visitor progress">
          {activeVisitors.map((v, idx) => (
            <span
              key={v.id}
              aria-label={`Night ${v.night} ${v.id} ${tl(v.name, lang)}`}
              data-night={v.night}
              className={`stepper-pill ${
                stage === "booth" && idx === safeIdx
                  ? "active"
                  : idx < history.length
                    ? "done"
                    : ""
              }`}
            >
              {v.id.replace("V-", "")}
            </span>
          ))}
        </div>

        <div className="topbar-controls">
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

          <Button
            id="btn-studio"
            className={`ctrl-btn ${stage === "studio" ? "amber" : ""}`}
            onClick={() => {
              if (stage === "studio") {
                transitionStage(() => setStage(returnStageRef.current), "backward");
              } else {
                openStudioFrom(stage);
              }
            }}
          >
            <span>{tl({ zh: "制片台", en: "Studio", ja: "制作台" }, lang)}</span>
          </Button>

          <Button
            id="btn-storymap"
            className={`ctrl-btn ${storyMapOpen ? "amber" : ""}`}
            onClick={() => setStoryMapOpen((o) => !o)}
          >
            <StoryBranchIcon />
            <span>{tl({ zh: "故事线", en: "Story Map", ja: "分岐図" }, lang)}</span>
          </Button>

          <Button
            id="btn-compendium"
            className={`ctrl-btn ${compendiumOpen ? "amber" : ""}`}
            onClick={() => setCompendiumOpen((o) => !o)}
          >
            <ArchiveIcon />
            <span>
              {tl({ zh: "图鉴", en: "Archive", ja: "図鑑" }, lang)} (
              {compendium.unlockedEndings.length}/7)
            </span>
          </Button>

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

          <Button
            id="btn-motion-toggle"
            className="ctrl-btn"
            onClick={() => setMotionPaused((p) => !p)}
          >
            {motionPaused ? <MotionPlayIcon /> : <MotionPauseIcon />}
            <span>
              {motionPaused
                ? tl({ zh: "恢复动效", en: "PLAY FX", ja: "動效再生" }, lang)
                : tl({ zh: "暂停动效", en: "PAUSE FX", ja: "動效停止" }, lang)}
            </span>
          </Button>

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

          <Tooltip>
            <TooltipTrigger
              render={
                <Toggle
                  id="btn-sys-console"
                  pressed={sysDrawerOpen}
                  aria-label={tl(
                    {
                      zh: "展开系统控制台",
                      en: "Toggle System Console Drawer",
                      ja: "システム制御盤切替"
                    },
                    lang
                  )}
                  className={`ctrl-btn ${sysDrawerOpen ? "amber" : ""}`}
                  onPressedChange={setSysDrawerOpen}
                />
              }
            >
              <SlidersConsoleIcon />
              <span>SYS</span>
            </TooltipTrigger>
            <TooltipContent>
              {tl(
                {
                  zh: "系统控制舱：音频 · 通信链路 · 班次选项",
                  en: "System Console: Audio · Comms Relay · Shift Ops",
                  ja: "システム制御盤：音声・通信・当直操作"
                },
                lang
              )}
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
      ) : null}

      {stage !== "lobby" ? (
      <Collapsible open={sysDrawerOpen} onOpenChange={setSysDrawerOpen}>
        <CollapsiblePanel keepMounted>
          <div className="sys-console-bar" id="sys-console-drawer">
            <div className="sys-console-group">
              <span className="sys-group-label">
                {tl({ zh: "音频 // 通信", en: "AUDIO // COMMS", ja: "音声 // 通信" }, lang)}
              </span>
              <Toggle
                id="btn-voice-toggle"
                pressed={voice}
                className="ctrl-btn"
                onPressedChange={(next) => {
                  if (!next) stopIntercomVoice();
                  setVoice(next);
                }}
              >
                <MicSignalIcon /> {voice ? "VOICE: ON" : "VOICE: OFF"}
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
                  <SnowHazardIcon /> {ambience ? "AMB: ON" : "AMB: OFF"}
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

              <Toggle id="btn-sfx-toggle" pressed={sfx} className="ctrl-btn" onPressedChange={setSfx}>
                {sfx ? "SFX: ON" : "SFX: OFF"}
              </Toggle>
            </div>

            <div className="sys-console-group">
              <span className="sys-group-label">
                {tl({ zh: "通信 // 链路", en: "COMMS // LINK", ja: "通信 // 回線" }, lang)}
              </span>
              <Button
                id="btn-flash-toggle"
                className={`ctrl-btn ${flashConfig.enabled ? "amber" : ""}`}
                onClick={() => setFlashDrawerOpen((o) => !o)}
              >
                <BoltPowerIcon />{" "}
                {tl(
                  {
                    zh: `实时对讲: ${flashConfig.enabled ? "开" : "关"}`,
                    en: `LIVE COMMS: ${flashConfig.enabled ? "ON" : "OFF"}`,
                    ja: `動的応答: ${flashConfig.enabled ? "ON" : "OFF"}`
                  },
                  lang
                )}
              </Button>
            </div>

            <div className="sys-console-group">
              <span className="sys-group-label">
                {tl({ zh: "班次 // 操作", en: "SHIFT // OPS", ja: "シフト // 操作" }, lang)}
              </span>
              <Button id="btn-reroll-shift" className="ctrl-btn" onClick={() => startNewShift()}>
                {tl(UI_STRINGS.reroll, lang)}
              </Button>
              <Button
                id="btn-night5-jump"
                className="ctrl-btn amber"
                onClick={() => {
                  stopIntercomVoice();
                  playBoothSfx("purge", sfx);
                  transitionStage(() => setStage("night5"));
                }}
              >
                {tl(UI_STRINGS.night5Btn, lang)}
              </Button>
            </div>
          </div>
        </CollapsiblePanel>
      </Collapsible>
      ) : null}

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

      <StoryFlowchartModal
        open={storyMapOpen}
        onOpenChange={setStoryMapOpen}
        lang={lang}
        compendium={compendium}
        currentNodeId={
          stage === "intake"
            ? PROLOGUE_NODE_IDS[Math.min(prologueInitialStep, 2)]
            : stage === "booth" && activeStoryNodeId
              ? activeStoryNodeId
              : stage === "booth" && visitor.id === "V-01"
                ? "n1_elena_confront"
                : stage === "booth" && visitor.id === "V-02"
                  ? "n1_leo_confront"
                  : stage === "booth" || stage === "crisis" || stage === "night5"
                    ? "nights_2_5_hub"
                    : null
        }
        onJumpToNode={handleJumpToStoryNode}
      />

      {stage !== "lobby" && campaignMode === "seeded" ? (
        <div className="seeded-control-bar" id="seeded-control-bar">
          <span className="seeded-badge">
            {isGeneratingSeed
              ? tl(
                  {
                    zh: "⚡ 正在调取该种子对应的 8 名幸存者档案...",
                    en: "⚡ RETRIEVING 8 SURVIVOR DOSSIERS FOR SEED...",
                    ja: "⚡ シードに対応する8名の生存者記録を取得中..."
                  },
                  lang
                )
              : seededSource
                ? "SHIFT SEED // ACTIVE"
                : "SHIFT SEED // READY"}
          </span>
          <form
            className="seeded-form"
            onSubmit={(e) => {
              e.preventDefault();
              void loadSeededRoster(seedDraft, lang, true);
            }}
          >
            <InputGroup className="seeded-input-group">
              <span className="gta-input-prefix" aria-hidden="true">SEED#</span>
              <Input
                id="seed-input"
                type="text"
                className="ask-input"
                value={seedDraft}
                onValueChange={setSeedDraft}
                disabled={isGeneratingSeed}
                aria-label="Campaign Seed"
                placeholder="SVALBARD-2036"
              />
            </InputGroup>
            <Button
              id="btn-seed-random"
              type="button"
              className="ctrl-btn"
              disabled={isGeneratingSeed}
              onClick={() => {
                const next = generateRunSeed("seeded");
                setSeedDraft(next);
                void loadSeededRoster(next, lang, true);
              }}
            >
              {tl({ zh: "🎲 新种子", en: "🎲 Random", ja: "🎲 新シード" }, lang)}
            </Button>
            <Button
              id="btn-seed-load"
              type="submit"
              className="ctrl-btn amber"
              disabled={isGeneratingSeed}
            >
              {tl({ zh: "生成 / 载入", en: "Load Seed", ja: "生成 / 読込" }, lang)}
            </Button>
          </form>
        </div>
      ) : null}

      <main
        ref={mainRef}
        tabIndex={-1}
        className={`booth-main ${stage === "lobby" ? "is-lobby" : ""} ${stage === "booth" ? "is-gta-booth" : ""} ${stage !== "lobby" && stage !== "booth" ? "is-gta-overlay-stage" : ""}`.trim()}
      >
        {stage !== "lobby" && stage !== "booth" ? (
          <>
            <div className="gta-stage-backdrop" aria-hidden="true">
              <img src="./portraits/lobby_bg.jpg" alt="" className="gta-stage-backdrop-img" decoding="async" />
              <div className="gta-world-vignette" />
            </div>
            <WebGLAtmosphere
              mode={stage === "night5" ? "night5" : "lobby"}
              night={stage === "night5" ? 5 : visitor.night}
              bpm={bpm}
              motionPaused={motionPaused}
            />
          </>
        ) : null}
        {stage === "lobby" ? (
          <LobbyScreen
            lang={lang}
            onChangeLang={(next) => {
              stopIntercomVoice();
              setLang(next);
            }}
            operatorName={operatorName}
            onChangeOperatorName={(next) => {
              setOperatorName(next);
              saveOperatorName(next);
            }}
            campaignMode={campaignMode}
            onChangeCampaignMode={handleSwitchCampaignMode}
            campaignModeItems={campaignModeItems}
            seedDraft={seedDraft}
            onChangeSeedDraft={setSeedDraft}
            savedShift={savedShiftSnapshot}
            compendium={compendium}
            ambience={ambience}
            onToggleAmbience={setAmbience}
            motionPaused={motionPaused}
            onToggleMotionPaused={setMotionPaused}
            onStartNewShift={() => {
              playBoothSfx("ptt", sfx);
              setPrologueInitialStep(0);
              transitionStage(() => setStage("intake"));
            }}
            onContinueShift={(save) => {
              playBoothSfx("ptt", sfx);
              setActiveStoryNodeId(null);
              transitionStage(() => applySavedShift(save));
            }}
            onClearSavedShift={() => {
              clearSavedShift();
              setSavedShiftSnapshot(null);
            }}
            onOpenArchive={() => setCompendiumOpen(true)}
            onOpenStoryMap={() => setStoryMapOpen(true)}
            onOpenStudio={() => openStudioFrom("lobby")}
          />
        ) : null}

        {stage === "studio" ? (
          <ProductionStudioView
            lang={lang}
            motionPaused={motionPaused}
            onBack={() => transitionStage(() => setStage(returnStageRef.current), "backward")}
            onPlayStoryNode={handleJumpToStoryNode}
          />
        ) : null}

        {stage === "intake" ? (
          <IntakeModal
            key={`prologue-${prologueInitialStep}`}
            lang={lang}
            operatorName={operatorName}
            motionPaused={motionPaused}
            voiceEnabled={voice}
            initialStep={prologueInitialStep}
            onUnlockNode={unlockStoryNodes}
            onOpenStoryMap={() => setStoryMapOpen(true)}
            onComplete={(profile, answers) => {
              playBoothSfx("ptt", sfx);
              setBaseline(profile);
              setIntakeAnswers(answers);
              setPrologueInitialStep(0);
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
            <div
              className={`gta-booth-stage ${
                visitor.id === "V-01" && !onboardingDismissed
                  ? `tutorial-step-${verdictState !== "NONE" ? 3 : turnsLeft === 4 ? 1 : 2}`
                  : ""
              } ${dossierCollapsed ? "dossier-collapsed" : ""}`.trim()}
              id="main-booth"
            >
              {/* FULL-SCREEN WORLD VIEWPORT + GPU WEBGL2 ATMOSPHERE LAYER */}
              <div className="gta-world-stage">
                <ViewportCanvas
                  visitor={visitor}
                  clipState={clipState}
                  bpm={bpm}
                  bpmDelta={lastBpmDelta}
                  strobeTrigger={strobeTrigger}
                  thermalTrigger={thermalTrigger}
                  verdictState={verdictState}
                  motionPaused={motionPaused}
                  onClipComplete={handleClipComplete}
                />
                <WebGLAtmosphere
                  mode="booth"
                  night={visitor.night}
                  bpm={bpm}
                  strobeTrigger={strobeTrigger}
                  thermalTrigger={thermalTrigger}
                  verdictState={verdictState}
                  signalGlitch={signalGlitch}
                  motionPaused={motionPaused}
                />
                <div className="gta-world-vignette" aria-hidden="true" />
              </div>

              {activeStoryNodeId && getStoryNode(activeStoryNodeId) ? (
                <div className="fmv-booth-overlay" id="fmv-booth-overlay">
                  <InteractiveMoviePlayer
                    key={activeStoryNodeId}
                    node={getStoryNode(activeStoryNodeId)!}
                    lang={lang}
                    motionPaused={motionPaused}
                    voiceEnabled={voice}
                    clipsOverride={
                      activeStoryNodeId === "n1_leo_aftermath" &&
                      (verdictState === "PURGE" ||
                        history.find((h) => h.visitorId === "V-02")?.decision === "PURGE")
                        ? [
                            {
                              id: "n1_leo_outcome_purge",
                              videoSrc: "./videos/story/n1_elena_outcome_purge.mp4",
                              fallbackVideoSrc: "./videos/chamber/purge.mp4",
                              posterSrc: "./portraits/reactions/chamber_purge.jpg",
                              fallbackPosterSrc: "./portraits/reactions/chamber_purge.jpg",
                              hasAudio: false,
                              badge: { zh: "净化实况 · 1,100°C", en: "THERMAL PURGE", ja: "高温焼却" },
                              speaker: {
                                zh: "0 号隔离窗 // 里奥已净化",
                                en: "GATE 0 // LEO PURGED",
                                ja: "第0関門 // リオ焼却"
                              },
                              subtitle: {
                                zh: "热浪吞没了过渡舱，那只白色工具箱也在烈焰中化为灰烬。",
                                en: "1,100°C flames consume both figure and tool chest inside the vestibule.",
                                ja: "高温の炎が前室ごと工具箱を焼き尽くした。"
                              }
                            },
                            getStoryNode("n1_leo_aftermath")!.clips![1]!
                          ]
                        : undefined
                    }
                    operatorBadge={
                      operatorName.trim() ? `#09 · ${operatorName.trim()}` : "#09"
                    }
                    onSelectChoice={handleSelectBoothStoryChoice}
                    onOpenStoryMap={() => setStoryMapOpen(true)}
                    onSkip={() => {
                      playBoothSfx("ptt", sfx);
                      setActiveStoryNodeId(null);
                    }}
                  />
                </div>
              ) : null}

              {/* GTA VERDICT SLASH STINGER OVERLAY */}
              {verdictState !== "NONE" ? (
                <div
                  className={`gta-verdict-stinger ${verdictState === "PURGE" ? "purge" : "admit"}`}
                  id="gta-verdict-stinger"
                  role="status"
                >
                  <div className="gta-stinger-kicker">
                    {verdictState === "PURGE"
                      ? "THERMAL STERILIZATION // 1,100°C"
                      : "AIRLOCK CYCLE // CLEARANCE GRANTED"}
                  </div>
                  <div className="gta-stinger-title">
                    {verdictState === "PURGE"
                      ? tl({ zh: "高温净化完成 // PURGED", en: "INCINERATED // PURGED", ja: "焼却完了 // PURGED" }, lang)
                      : tl({ zh: "气闸放行 // ADMITTED", en: "AIRLOCK CLEARED // ADMITTED", ja: "通過許可 // ADMITTED" }, lang)}
                  </div>
                </div>
              ) : null}

              {/* TOP-LEFT FLOATING SUBJECT, ALERTS & GTA OBJECTIVE CHECKLIST */}
              <div className="gta-hud-topleft">
                <div className="gta-mission-plate">
                  <span className="gta-mission-night">NIGHT 0{visitor.night}</span>
                  <span className="gta-mission-subject">
                    {visitor.id} · {tl(visitor.name, lang).toUpperCase()}
                  </span>
                  <span className="gta-mission-role">{tl(visitor.role, lang)}</span>
                </div>

                {fuelLeft === 0 ? (
                  <div className="cryo-brownout-banner gta-alert-strip" id="cryo-brownout-banner">
                    <SnowHazardIcon />
                    <span>
                      {tl(
                        {
                          zh: "[! CRYO-BROWNOUT · 0 FUEL] 电容结霜 -> 1 PWR（零油强行净化将透支至 0 PWR）",
                          en: "[! CRYO-BROWNOUT · 0 FUEL] CAPACITOR 1 PWR (PURGE OVERDRAFTS TO 0 PWR)",
                          ja: "[! CRYO-BROWNOUT · 0 FUEL] 電力 1 PWR（強行焼却で次回 0 PWR）"
                        },
                        lang
                      )}
                    </span>
                  </div>
                ) : null}

                {visitor.night === 3 ? (
                  <div className="storm-banner gta-alert-strip" id="night3-storm-banner">
                    <HazardTriangleIcon />
                    <span>{tl(UI_STRINGS.stormBanner, lang)}</span>
                  </div>
                ) : null}

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
              </div>

              {/* TOP-RIGHT GTA WANTED-STARS + LIVE 60FPS ECG OSCILLOSCOPE + DOSSIER TOGGLE */}
              <div className="gta-hud-topright">
                <div
                  className={`gta-wanted-stars ${visitor.night === 3 ? "emi" : ""}`}
                  aria-label={`Threat tier ${visitor.night} of 4`}
                >
                  {[1, 2, 3, 4].map((star) => (
                    <span
                      key={star}
                      className={`gta-star ${star <= visitor.night ? "lit" : ""}`}
                    >
                      ★
                    </span>
                  ))}
                </div>

                <div className={`gta-ecg-hud ${sensorsBlinded ? "blinded" : ""}`}>
                  <GtaEcgCanvas bpm={bpm} blinded={sensorsBlinded} motionPaused={motionPaused} />
                  <div className="gta-ecg-readout">
                    <span className="gta-bpm-big">
                      {sensorsBlinded ? "---" : bpm}
                      <small>BPM</small>
                    </span>
                    <span className="gta-bpm-delta">
                      {sensorsBlinded
                        ? "SIGNAL LOST"
                        : lastBpmDelta === null
                          ? reaction.replace("CLIP: ", "")
                          : `${lastBpmDelta >= 0 ? "+" : ""}${lastBpmDelta} Δ`}
                    </span>
                  </div>
                </div>

                <Button
                  id="btn-toggle-dossier"
                  className={`gta-hud-pill ${!dossierCollapsed ? "amber" : ""}`}
                  onClick={() => setDossierCollapsed((c) => !c)}
                >
                  {dossierCollapsed
                    ? tl({ zh: "展开档案 [D] ◀", en: "DOSSIER [D] ◀", ja: "調書 [D] ◀" }, lang)
                    : tl({ zh: "收起档案 [D] ▶", en: "HIDE [D] ▶", ja: "隠す [D] ▶" }, lang)}
                </Button>
              </div>

              {/* RIGHT-SIDE FLOATING TRANSLUCENT ORDAMOR INTEL HUD */}
              <aside className={`gta-dossier-rail ${dossierCollapsed ? "is-collapsed" : ""}`}>
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
                  motionPaused={motionPaused}
                />

                <div className="gta-airlock-mini" aria-label="Airlock Telemetry">
                  <IsometricAirlockSchematic
                    verdictState={verdictState}
                    night={visitor.night}
                    fuelLeft={fuelLeft}
                    powerLeft={powerLeft}
                    maxPower={maxPower}
                    lang={lang}
                  />
                </div>
              </aside>

              {/* BOTTOM-LEFT GTA TACTICAL MINIMAP RADAR + FUEL/PWR BARS + SENSOR KEYS */}
              <div className="gta-hud-bottomleft">
                {sensorToast ? <div className="sensor-toast gta-toast">{sensorToast}</div> : null}

                {stressReplayUnlocked && heartbeatEvents.length > 0 && !sensorsBlinded ? (
                  <div className="stress-replay-panel gta-replay-hud" id="stress-replay-panel">
                    <div className="stress-replay-header">
                      <span>
                        {tl(
                          {
                            zh: "ECG 应激回放",
                            en: "ECG STRESS REPLAY",
                            ja: "ECG ストレス再生"
                          },
                          lang
                        )}
                      </span>
                      <span>{heartbeatEvents.length} TURNS</span>
                    </div>
                    <div className="stress-replay-rows">
                      {heartbeatEvents.map((ev) => (
                        <div
                          key={ev.turnIndex}
                          className={`stress-replay-row anomaly-${ev.anomaly}`}
                        >
                          <span className="sr-turn">T{ev.turnIndex}</span>
                          <span className="sr-bpm">
                            {ev.bpmBefore}→{ev.bpmAfter} ({ev.delta >= 0 ? `+${ev.delta}` : ev.delta})
                          </span>
                          <span className="sr-note">{tl(ev.note, lang)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="gta-radar-frame">
                  <GtaRadarCanvas
                    visitor={visitor}
                    bpm={bpm}
                    verdictState={verdictState}
                    motionPaused={motionPaused}
                  />

                  {/* Iconic GTA Horizontal Status Bars Beneath Minimap (FUEL + PWR) */}
                  <div className="gta-radar-bars">
                    <Tooltip>
                      <TooltipTrigger
                        render={(triggerProps) => {
                          const { type: _type, ...rest } = triggerProps as Record<string, unknown>;
                          return (
                            <div
                              {...(rest as React.HTMLAttributes<HTMLDivElement>)}
                              id="booth-fuel-pill"
                              tabIndex={0}
                              aria-label={`Furnace fuel: ${fuelLeft}`}
                              className={`gta-bar-slot fuel ${fuelLeft === 0 ? "depleted" : fuelLeft <= 1 ? "low" : ""}`}
                            />
                          );
                        }}
                      >
                        <div
                          className="gta-bar-fill fuel"
                          style={{ width: `${Math.min(100, (fuelLeft / 5) * 100)}%` }}
                        />
                        <span className="gta-bar-label">
                          <FlameFuelIcon /> {fuelLeft} FUEL
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {tl(
                          {
                            zh: "炉心净化燃料：每次 PURGE 消耗 1 FUEL，归零触发低温降电 [1 PWR]",
                            en: "Furnace Fuel: Each PURGE costs 1 FUEL; 0 fuel triggers -46°C brownout [1 PWR]",
                            ja: "暖房燃料：焼却ごとに 1 FUEL 消費。ゼロで電圧低下 [1 PWR]"
                          },
                          lang
                        )}
                      </TooltipContent>
                    </Tooltip>

                    <div className="gta-bar-slot pwr">
                      <Meter
                        className="gta-pwr-meter"
                        value={powerLeft}
                        min={0}
                        max={Math.max(1, maxPower)}
                        aria-label={tl({ zh: "传感器剩余电量", en: "Sensor power", ja: "センサー電力" }, lang)}
                      >
                        <MeterTrack>
                          <MeterIndicator />
                        </MeterTrack>
                      </Meter>
                      <span className="gta-bar-label">
                        <BoltPowerIcon /> {powerLeft}/{maxPower} PWR
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tactical Sensor Hotkeys */}
                <div className="gta-sensor-strip">
                  <Tooltip shortcut="s">
                    <TooltipTrigger
                      render={
                        <Button
                          id="btn-strobe"
                          className="gta-sensor-btn"
                          disabled={sensorsBlinded || powerLeft <= 0 || verdictState !== "NONE"}
                          focusableWhenDisabled
                          aria-keyshortcuts={strobeHint.ariaKeyshortcuts}
                          onClick={() => handleTriggerSensor("strobe")}
                        />
                      }
                    >
                      <StrobeTargetIcon />{" "}
                      <span>{tl({ zh: "强光", en: "STROBE", ja: "閃光" }, lang)}</span>{" "}
                      <kbd className="kbd-chip" aria-hidden="true">S</kbd>
                    </TooltipTrigger>
                    <TooltipContent>
                      {tl({ zh: "脉冲强光扫描瞳孔反射", en: "Strobe pupil photomotor scan", ja: "ストロボ瞳孔スキャン" }, lang)}{" "}
                      <TooltipShortcut />
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip shortcut="t">
                    <TooltipTrigger
                      render={
                        <Button
                          id="btn-thermal"
                          className="gta-sensor-btn"
                          disabled={sensorsBlinded || powerLeft <= 0 || verdictState !== "NONE"}
                          focusableWhenDisabled
                          aria-keyshortcuts={thermalHint.ariaKeyshortcuts}
                          onClick={() => handleTriggerSensor("thermal")}
                        />
                      }
                    >
                      <ThermalWaveIcon />{" "}
                      <span>{tl({ zh: "热像", en: "FLIR", ja: "熱像" }, lang)}</span>{" "}
                      <kbd className="kbd-chip" aria-hidden="true">T</kbd>
                    </TooltipTrigger>
                    <TooltipContent>
                      {tl({ zh: "FLIR 颈部神经热成像", en: "FLIR cervical thermal scan", ja: "FLIR 頚部熱画像" }, lang)}{" "}
                      <TooltipShortcut />
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip shortcut="r">
                    <TooltipTrigger
                      render={
                        <Button
                          id="btn-stress-replay"
                          className={`gta-sensor-btn ${stressReplayUnlocked ? "amber" : ""}`}
                          disabled={
                            sensorsBlinded ||
                            powerLeft <= 0 ||
                            verdictState !== "NONE" ||
                            stressReplayUnlocked ||
                            heartbeatEvents.length === 0
                          }
                          focusableWhenDisabled
                          aria-keyshortcuts={replayHint.ariaKeyshortcuts}
                          onClick={handleUnlockStressReplay}
                        />
                      }
                    >
                      <BoltPowerIcon />{" "}
                      <span>
                        {tl(
                          {
                            zh: stressReplayUnlocked ? "已开" : "回放",
                            en: stressReplayUnlocked ? "ON" : "REPLAY",
                            ja: stressReplayUnlocked ? "再生" : "心拍"
                          },
                          lang
                        )}
                      </span>{" "}
                      <kbd className="kbd-chip" aria-hidden="true">R</kbd>
                    </TooltipTrigger>
                    <TooltipContent>
                      {tl(
                        {
                          zh: "消耗 1 PWR 解锁逐轮心率应激曲线与异常标注",
                          en: "Spend 1 PWR to reveal per-turn cardiac stress anomalies",
                          ja: "1 PWR消費でターン別心拍ストレス異常を表示"
                        },
                        lang
                      )}{" "}
                      <TooltipShortcut />
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* BOTTOM-CENTER GTA CINEMA SUBTITLES + RADIO & KILL-SWITCH CONSOLE */}
              <div className="gta-hud-bottomcenter">
                <IntercomPanel
                  visitor={visitor}
                  lang={lang}
                  operatorName={operatorName}
                  turnsLeft={turnsLeft}
                  chatterLeft={chatterLeft}
                  fuelLeft={fuelLeft}
                  verdictDone={verdictState !== "NONE"}
                  isRephrasing={isRephrasing}
                  streamingText={streamingReply}
                  signalGlitch={signalGlitch}
                  transcript={transcript}
                  onAskProbe={handleAskProbe}
                  onExecuteVerdict={handleVerdict}
                />
              </div>
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
            operatorName={operatorName}
            aiEnabled={flashConfig.enabled && flashConfig.mode === "server_proxy"}
            aiFreeTextOnly={flashConfig.freeTextOnly}
            motionPaused={motionPaused}
            onResolveEnding={handleResolveNight5Ending}
            onStartNewRun={handleRestartFromIntake}
            onClose={() => transitionStage(() => setStage("booth"), "backward")}
          />
        ) : null}
      </main>
    </div>
  );
}
