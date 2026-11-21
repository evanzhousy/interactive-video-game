import { createSeededRng } from "./visitors/index.js";
import type {
  HeartbeatAnomaly,
  HeartbeatEvent,
  InterrogateAxisKey,
  LocalizedText,
  VisitorRoll,
  VisitorSpec
} from "./types.js";

export interface HeartbeatProfile {
  baseBpm: number;
  reactivity: number;
  recovery: number;
  jitterAmp: number;
  mismatchStyle: "flat" | "snapped_reset";
}

export interface HeartbeatStepInput {
  visitor: VisitorSpec;
  roll: VisitorRoll;
  runSeed: string;
  currentBpm: number;
  turnIndex: number;
  axis: InterrogateAxisKey;
  onAxis: boolean;
  isFlawedAxis: boolean;
  questionText: string;
}

export interface HeartbeatStepResult {
  blinded: boolean;
  bpmBefore: number;
  bpmAfter: number;
  delta: number;
  anomaly: HeartbeatAnomaly;
  event: HeartbeatEvent;
  profile: HeartbeatProfile;
}

function clampBpm(val: number): number {
  return Math.max(56, Math.min(152, Math.round(val)));
}

/**
 * Derives deterministic, per-seed physiological parameters for a visitor.
 * Individual variance prevents players from memorizing fixed BPM numbers across runs.
 */
export function deriveHeartbeatProfile(
  visitor: VisitorSpec,
  runSeed: string
): HeartbeatProfile {
  const rng = createSeededRng(`hb:${runSeed}:${visitor.id}`);
  const baseOffset = Math.round((rng() - 0.5) * 8);
  const baseBpm = Math.max(60, Math.min(108, visitor.baseBpm + baseOffset));
  const reactivity = 0.85 + rng() * 0.4;
  const recovery = 0.3 + rng() * 0.18;
  const jitterAmp = 2 + Math.floor(rng() * 3);
  const mismatchStyle = rng() < 0.55 ? "flat" : "snapped_reset";

  return {
    baseBpm,
    reactivity,
    recovery,
    jitterAmp,
    mismatchStyle
  };
}

/**
 * Checks whether the operator directly cited factual evidence keywords from the dossier (`o-N`).
 */
export function hasEvidencePressure(questionText: string, visitor: VisitorSpec): boolean {
  const lower = questionText.toLowerCase();
  if (!lower.trim()) return false;
  for (const card of visitor.evidenceCards) {
    if (card.type !== "obs" || !card.kw) continue;
    for (const lang of ["zh", "en", "ja"] as const) {
      const kw = card.kw[lang]?.trim().toLowerCase();
      if (kw && kw.length >= 2 && lower.includes(kw)) {
        return true;
      }
    }
  }
  return false;
}

function buildAnomalyNote(
  anomaly: HeartbeatAnomaly,
  delta: number,
  evidenceHit: boolean
): LocalizedText {
  const sign = delta > 0 ? `+${delta}` : `${delta}`;
  switch (anomaly) {
    case "blinded":
      return {
        zh: "磁暴 EMI 干扰 · ECG 遥测离线",
        en: "Geomagnetic EMI · ECG telemetry lost",
        ja: "磁気嵐EMI干渉 · ECGテレメトリ喪失"
      };
    case "spike":
      return {
        zh: evidenceHit
          ? `真实利害应激 (${sign} BPM · 证据压迫)`
          : `真实利害应激 (${sign} BPM · 肾上腺素跃升)`,
        en: evidenceHit
          ? `Authentic stake spike (${sign} BPM · dossier pressure)`
          : `Authentic stake spike (${sign} BPM · adrenaline surge)`,
        ja: evidenceHit
          ? `本音の利害反応 (${sign} BPM · 証拠圧迫)`
          : `本音の利害反応 (${sign} BPM · アドレナリン急上昇)`
      };
    case "elevated":
      return {
        zh: `情绪张力抬升 (${sign} BPM · 符合压力预期)`,
        en: `Elevated tension (${sign} BPM · consistent pressure)`,
        ja: `緊張上昇 (${sign} BPM · 圧力と整合)`
      };
    case "flat_mismatch":
      return {
        zh: `核心冲突下脉搏异常平直 (${sign} BPM · 言辞与心率脱节)`,
        en: `Eerily flat pulse on conflict axis (${sign} BPM · affect mismatch)`,
        ja: `対立軸で脈拍が異常に平坦 (${sign} BPM · 言動と心拍の乖離)`
      };
    case "snapped_reset":
      return {
        zh: `应激后瞬间回落基线 (${sign} BPM · 缺乏人类余震)`,
        en: `Instant snap-back to baseline (${sign} BPM · no adrenaline decay)`,
        ja: `基準値へ瞬間復帰 (${sign} BPM · 余韻欠如)`
      };
    case "steady":
    default:
      return {
        zh: `平稳波动 (${sign} BPM · 非核心轴自然回落)`,
        en: `Steady drift (${sign} BPM · natural baseline recovery)`,
        ja: `安定推移 (${sign} BPM · 自然回復)`
      };
  }
}

/**
 * Pure deterministic heartbeat step function.
 *
 * Design invariants:
 * 1. Never controlled by LLM output — 100% deterministic from engine stance + runSeed.
 * 2. Corroboration only: mimics passing an axis spike identically to humans; physiological
 *    dissonance appears ONLY on axes where `decideStance` already exposes a flawed stance.
 * 3. Night 3 geomagnetic storm blinds ECG alongside optical & thermal sensors.
 */
export function stepHeartbeat(input: HeartbeatStepInput): HeartbeatStepResult {
  const {
    visitor,
    roll,
    runSeed,
    currentBpm,
    turnIndex,
    axis,
    onAxis,
    isFlawedAxis,
    questionText
  } = input;

  const profile = deriveHeartbeatProfile(visitor, runSeed);
  const summary =
    questionText.trim().length > 26
      ? `${questionText.trim().slice(0, 26)}…`
      : questionText.trim() || axis;

  if (visitor.night === 3) {
    const event: HeartbeatEvent = {
      turnIndex,
      axis,
      questionSummary: summary,
      bpmBefore: currentBpm,
      bpmAfter: currentBpm,
      delta: 0,
      anomaly: "blinded",
      note: buildAnomalyNote("blinded", 0, false)
    };
    return {
      blinded: true,
      bpmBefore: currentBpm,
      bpmAfter: currentBpm,
      delta: 0,
      anomaly: "blinded",
      event,
      profile
    };
  }

  const turnRng = createSeededRng(`hb-turn:${runSeed}:${visitor.id}:${turnIndex}:${axis}`);
  const jitter = Math.round((turnRng() * 2 - 1) * profile.jitterAmp);
  const evidenceHit = hasEvidencePressure(questionText, visitor);

  let nextBpm: number;
  let anomaly: HeartbeatAnomaly;

  if (onAxis && roll.isMimic && isFlawedAxis) {
    // Physiological dissonance corroborating the mimic's flawed axis
    if (profile.mismatchStyle === "snapped_reset" && currentBpm > profile.baseBpm + 8) {
      nextBpm = clampBpm(profile.baseBpm + Math.round((turnRng() - 0.5) * 3));
      anomaly = "snapped_reset";
    } else {
      const tinyShift = Math.round((turnRng() * 2 - 1) * 2.5);
      nextBpm = clampBpm(currentBpm + tinyShift);
      anomaly = "flat_mismatch";
    }
  } else if (onAxis) {
    // Authentic conflict stake (all humans, plus mimics on axes they successfully pass)
    const partialDecay = (currentBpm - profile.baseBpm) * profile.recovery * 0.45;
    const rawSpike = (14 + turnRng() * 7 + (evidenceHit ? 4 : 0)) * profile.reactivity;
    nextBpm = clampBpm(currentBpm - partialDecay + rawSpike);
    const deltaCheck = nextBpm - currentBpm;
    anomaly = deltaCheck >= 11 ? "spike" : "elevated";
  } else {
    // Off-axis / trivia: natural adrenaline decay toward baseline + micro-jitter
    const decay = (currentBpm - profile.baseBpm) * profile.recovery;
    nextBpm = clampBpm(currentBpm - decay + jitter);
    anomaly = "steady";
  }

  const delta = nextBpm - currentBpm;
  const event: HeartbeatEvent = {
    turnIndex,
    axis,
    questionSummary: summary,
    bpmBefore: currentBpm,
    bpmAfter: nextBpm,
    delta,
    anomaly,
    note: buildAnomalyNote(anomaly, delta, evidenceHit)
  };

  return {
    blinded: false,
    bpmBefore: currentBpm,
    bpmAfter: nextBpm,
    delta,
    anomaly,
    event,
    profile
  };
}
