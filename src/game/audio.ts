import {
  VOCAL_SYNTH_PROFILES,
  getVoiceAudioPath,
  type VoiceLineVariant
} from "./media.js";
import type { Locale } from "./types.js";

export type SfxKind = "ptt" | "strobe" | "thermal" | "purge" | "admit" | "heartbeat";

export interface AudioDebugState {
  ctxState: string;
  ambienceEnabled: boolean;
  ambienceDucked: boolean;
  night: number;
  hasAmbienceNodes: boolean;
  voicePlaying: boolean;
}

declare global {
  interface Window {
    __gate0AudioState?: () => AudioDebugState;
  }
}

let sharedAudioCtx: AudioContext | null = null;
let noiseBufferCache: AudioBuffer | null = null;

interface AmbienceHandle {
  masterGain: GainNode;
  stormGain: GainNode;
  scoreGain: GainNode;
  scoreFilter: BiquadFilterNode;
  droneOscs: OscillatorNode[];
  sources: AudioScheduledSourceNode[];
  creakTimer: ReturnType<typeof setInterval> | null;
}

let activeAmbience: AmbienceHandle | null = null;
let activeVoiceAudio: HTMLAudioElement | null = null;
let activeAmbienceEnabled = false;
let activeAmbienceNight = 1;
let activeAmbienceDucked = false;
let unlockListenersAttached = false;

export function getAudioDebugState(): AudioDebugState {
  return {
    ctxState: sharedAudioCtx?.state ?? "uninitialized",
    ambienceEnabled: activeAmbienceEnabled,
    ambienceDucked: activeAmbienceDucked,
    night: activeAmbienceNight,
    hasAmbienceNodes: Boolean(activeAmbience),
    voicePlaying: Boolean(activeVoiceAudio && !activeVoiceAudio.paused && !activeVoiceAudio.ended)
  };
}

function registerAudioDebugHook(): void {
  if (typeof window !== "undefined") {
    window.__gate0AudioState = getAudioDebugState;
  }
}

registerAudioDebugHook();

function getNightScoreChord(night: number): {
  freqs: [number, number, number];
  filterHz: number;
  gain: number;
} {
  if (night >= 6) {
    // Dawn Break hopeful resolving fifth/octave warm pad (A2, E3, A3)
    return { freqs: [110.0, 164.81, 220.0], filterHz: 560, gain: 0.22 };
  }
  if (night === 5) {
    // Mirror Finale tense dissonance (G1, D2, G#2)
    return { freqs: [49.0, 73.42, 103.83], filterHz: 420, gain: 0.28 };
  }
  if (night === 3) {
    // Geomagnetic blackout tension (A1, E2, C3)
    return { freqs: [55.0, 82.41, 130.81], filterHz: 360, gain: 0.24 };
  }
  // Polar thriller D/A minor drone with slow beating detune (A1, E2, A2+detune)
  return { freqs: [55.0, 82.41, 110.38], filterHz: 320, gain: 0.24 };
}

function applyAmbienceGains(ctx: AudioContext): void {
  if (!activeAmbience) return;
  const now = ctx.currentTime;
  if (!activeAmbienceEnabled) {
    activeAmbience.masterGain.gain.setTargetAtTime(0.0001, now, 0.15);
    return;
  }
  const masterTarget = activeAmbienceDucked ? 0.18 : 0.38;
  const chord = getNightScoreChord(activeAmbienceNight);
  activeAmbience.masterGain.gain.setTargetAtTime(masterTarget, now, 0.28);
  activeAmbience.stormGain.gain.setTargetAtTime(
    activeAmbienceNight === 3 ? 0.08 : 0.006,
    now,
    0.35
  );
  activeAmbience.scoreGain.gain.setTargetAtTime(chord.gain, now, 0.45);
  activeAmbience.scoreFilter.frequency.setTargetAtTime(chord.filterHz, now, 0.55);
  chord.freqs.forEach((hz, i) => {
    const osc = activeAmbience?.droneOscs[i];
    if (osc) {
      osc.frequency.setTargetAtTime(hz, now, 0.55);
    }
  });
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  registerAudioDebugHook();
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AC();
  }
  if (sharedAudioCtx.state === "suspended") {
    void sharedAudioCtx
      .resume()
      .then(() => {
        if (sharedAudioCtx) applyAmbienceGains(sharedAudioCtx);
      })
      .catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Unlocks WebAudio cleanly on first user pointer/key/touch gesture so background score
 * and SFX are never stuck silent in autoplay-restricted browsers.
 */
export function ensureAudioUnlocked(): void {
  if (typeof window === "undefined") return;
  registerAudioDebugHook();
  const resumeNow = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      void ctx
        .resume()
        .then(() => applyAmbienceGains(ctx))
        .catch(() => {});
    } else {
      applyAmbienceGains(ctx);
    }
  };
  resumeNow();
  if (!unlockListenersAttached) {
    unlockListenersAttached = true;
    const onGesture = () => {
      resumeNow();
    };
    window.addEventListener("pointerdown", onGesture, { capture: true, passive: true });
    window.addEventListener("keydown", onGesture, { capture: true, passive: true });
    window.addEventListener("touchstart", onGesture, { capture: true, passive: true });
  }
}

export function setAmbienceDucking(ducked: boolean): void {
  activeAmbienceDucked = ducked;
  const ctx = getAudioContext();
  if (ctx) {
    applyAmbienceGains(ctx);
  }
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBufferCache && noiseBufferCache.sampleRate === ctx.sampleRate) {
    return noiseBufferCache;
  }
  const length = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    // Pink-ish noise shaping for realistic Arctic wind & radio static
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    data[i] = Math.max(-1, Math.min(1, (b0 + b1 + b2 + white * 0.1848) * 0.18));
  }
  noiseBufferCache = buffer;
  return buffer;
}

function playStaticBurst(ctx: AudioContext, durationSec: number, gainPeak: number, centerHz = 1350): void {
  const now = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);
  src.loop = true;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.setValueAtTime(centerHz, now);
  bandpass.Q.setValueAtTime(1.6, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainPeak, now);
  gain.gain.exponentialRampToValueAtTime(0.0008, now + durationSec);

  src.connect(bandpass).connect(gain).connect(ctx.destination);
  src.start(now);
  src.stop(now + durationSec);
}

/**
 * Synthesizes a subtle -46°C metallic bulkhead / submarine pressure-hull thermal contraction groan.
 */
function triggerHullStressCreak(ctx: AudioContext, destination: AudioNode): void {
  try {
    const now = ctx.currentTime;
    const duration = 1.65;
    const baseHz = 82 + Math.random() * 34;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = "triangle";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(baseHz * 1.18, now);
    osc1.frequency.exponentialRampToValueAtTime(baseHz * 0.78, now + duration);
    osc2.frequency.setValueAtTime(baseHz * 1.71, now);
    osc2.frequency.exponentialRampToValueAtTime(baseHz * 1.12, now + duration);

    const resonance = ctx.createBiquadFilter();
    resonance.type = "bandpass";
    resonance.frequency.setValueAtTime(195 + Math.random() * 85, now);
    resonance.Q.setValueAtTime(6.5, now);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0002, now);
    env.gain.linearRampToValueAtTime(0.032, now + 0.42);
    env.gain.exponentialRampToValueAtTime(0.0002, now + duration);

    osc1.connect(resonance);
    osc2.connect(resonance);
    resonance.connect(env).connect(destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  } catch {
    // ignore WebAudio scheduling errors
  }
}

/**
 * Starts, updates, or mutes the continuous Svalbard -46°C blizzard wind + sub-bass polar gusts +
 * submarine/outpost metallic bulkhead stress creaks + fluorescent booth hum.
 * On Night 3 (`night === 3`), boosts geomagnetic aurora static interference.
 */
export function setBoothAmbience(enabled: boolean, night: number): void {
  activeAmbienceEnabled = enabled;
  activeAmbienceNight = night;
  registerAudioDebugHook();
  const ctx = getAudioContext();
  if (!ctx) return;

  if (!enabled) {
    if (activeAmbience) {
      if (activeAmbience.creakTimer) {
        clearInterval(activeAmbience.creakTimer);
        activeAmbience.creakTimer = null;
      }
      applyAmbienceGains(ctx);
    }
    return;
  }

  if (!activeAmbience) {
    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.connect(ctx.destination);

      // 1. Exterior Arctic blizzard wind (LFO-swept mid-low bandpass noise)
      const windSrc = ctx.createBufferSource();
      windSrc.buffer = getNoiseBuffer(ctx);
      windSrc.loop = true;

      const windFilter = ctx.createBiquadFilter();
      windFilter.type = "bandpass";
      windFilter.frequency.setValueAtTime(240, now);
      windFilter.Q.setValueAtTime(2.4, now);

      const windLfo = ctx.createOscillator();
      windLfo.type = "sine";
      windLfo.frequency.setValueAtTime(0.14, now);
      const windLfoGain = ctx.createGain();
      windLfoGain.gain.setValueAtTime(115, now);
      windLfo.connect(windLfoGain).connect(windFilter.frequency);

      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.32, now);
      windSrc.connect(windFilter).connect(windGain).connect(masterGain);

      // 2. Deep -46°C sub-bass polar pressure rumble (58Hz resonant lowpass + slow 0.08Hz swell)
      const subWindSrc = ctx.createBufferSource();
      subWindSrc.buffer = getNoiseBuffer(ctx);
      subWindSrc.loop = true;

      const subFilter = ctx.createBiquadFilter();
      subFilter.type = "lowpass";
      subFilter.frequency.setValueAtTime(64, now);
      subFilter.Q.setValueAtTime(2.8, now);

      const subLfo = ctx.createOscillator();
      subLfo.type = "sine";
      subLfo.frequency.setValueAtTime(0.08, now);
      const subLfoGain = ctx.createGain();
      subLfoGain.gain.setValueAtTime(22, now);
      subLfo.connect(subLfoGain).connect(subFilter.frequency);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.38, now);
      subWindSrc.connect(subFilter).connect(subGain).connect(masterGain);

      // 3. Continuous dark sci-fi thriller harmonic synth score pad
      const chord = getNightScoreChord(night);
      const scoreFilter = ctx.createBiquadFilter();
      scoreFilter.type = "lowpass";
      scoreFilter.frequency.setValueAtTime(chord.filterHz, now);
      scoreFilter.Q.setValueAtTime(1.6, now);

      const scoreLfo = ctx.createOscillator();
      scoreLfo.type = "sine";
      scoreLfo.frequency.setValueAtTime(0.06, now);
      const scoreLfoGain = ctx.createGain();
      scoreLfoGain.gain.setValueAtTime(95, now);
      scoreLfo.connect(scoreLfoGain).connect(scoreFilter.frequency);

      const scoreGain = ctx.createGain();
      scoreGain.gain.setValueAtTime(chord.gain, now);
      scoreFilter.connect(scoreGain).connect(masterGain);

      const osc1 = ctx.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(chord.freqs[0], now);
      const osc1Gain = ctx.createGain();
      osc1Gain.gain.setValueAtTime(0.46, now);
      osc1.connect(osc1Gain).connect(scoreFilter);

      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(chord.freqs[1], now);
      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.32, now);
      osc2.connect(osc2Gain).connect(scoreFilter);

      const osc3 = ctx.createOscillator();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(chord.freqs[2], now);
      const osc3Gain = ctx.createGain();
      osc3Gain.gain.setValueAtTime(0.28, now);
      osc3.connect(osc3Gain).connect(scoreFilter);

      // 4. Interior 60Hz CRT / transformer booth hum
      const humOsc = ctx.createOscillator();
      humOsc.type = "sine";
      humOsc.frequency.setValueAtTime(60, now);
      const humGain = ctx.createGain();
      humGain.gain.setValueAtTime(0.022, now);
      humOsc.connect(humGain).connect(masterGain);

      // 5. Night 3 geomagnetic storm crackle layer
      const stormSrc = ctx.createBufferSource();
      stormSrc.buffer = getNoiseBuffer(ctx);
      stormSrc.loop = true;
      const stormFilter = ctx.createBiquadFilter();
      stormFilter.type = "highpass";
      stormFilter.frequency.setValueAtTime(1900, now);
      const stormGain = ctx.createGain();
      stormGain.gain.setValueAtTime(night === 3 ? 0.08 : 0.006, now);
      stormSrc.connect(stormFilter).connect(stormGain).connect(masterGain);

      windSrc.start(now);
      windLfo.start(now);
      subWindSrc.start(now);
      subLfo.start(now);
      scoreLfo.start(now);
      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      humOsc.start(now);
      stormSrc.start(now);

      activeAmbience = {
        masterGain,
        stormGain,
        scoreGain,
        scoreFilter,
        droneOscs: [osc1, osc2, osc3],
        sources: [
          windSrc,
          windLfo,
          subWindSrc,
          subLfo,
          scoreLfo,
          osc1,
          osc2,
          osc3,
          humOsc,
          stormSrc
        ],
        creakTimer: null
      };
    } catch {
      return;
    }
  }

  if (!activeAmbience.creakTimer) {
    activeAmbience.creakTimer = setInterval(() => {
      if (activeAmbience && activeAmbienceEnabled) {
        triggerHullStressCreak(ctx, activeAmbience.masterGain);
      }
    }, 12500);
  }

  applyAmbienceGains(ctx);
}

export function stopAllBoothAudio(): void {
  if (activeAmbience) {
    if (activeAmbience.creakTimer) {
      clearInterval(activeAmbience.creakTimer);
      activeAmbience.creakTimer = null;
    }
    for (const s of activeAmbience.sources) {
      try {
        s.stop();
      } catch {
        // ignore already stopped
      }
    }
    activeAmbience = null;
  }
  stopIntercomVoice();
}

export function playBoothSfx(kind: SfxKind, enabled = true): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (kind === "ptt") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(1580, now);
      osc.frequency.setValueAtTime(1120, now + 0.035);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.085);
      playStaticBurst(ctx, 0.11, 0.045, 1450);
    } else if (kind === "strobe") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(3100, now + 0.16);
      gain.gain.setValueAtTime(0.075, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
      playStaticBurst(ctx, 0.06, 0.09, 2600);
    } else if (kind === "thermal") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1320, now + 0.07);
      gain.gain.setValueAtTime(0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (kind === "purge") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(125, now);
      osc.frequency.exponentialRampToValueAtTime(34, now + 0.72);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.78);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.78);
      playStaticBurst(ctx, 0.65, 0.14, 420);
    } else if (kind === "admit") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.setValueAtTime(780, now + 0.11);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.34);
      playStaticBurst(ctx, 0.38, 0.055, 1900);
    } else if (kind === "heartbeat") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(68, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.14);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    }
  } catch {
    // Ignore WebAudio errors in headless/restricted environments
  }
}

export function stopIntercomVoice(): void {
  if (activeVoiceAudio) {
    try {
      activeVoiceAudio.pause();
      activeVoiceAudio.src = "";
    } catch {
      // ignore
    }
    activeVoiceAudio = null;
  }
  setAmbienceDucking(false);
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

/**
 * Plays a pre-rendered studio character voice cue for Nights 2–5 FMV clips that have no
 * baked-in soundtrack (`public/audio/{locale}/{slug}/{file}.mp3`), automatically ducking
 * background synth/blizzard ambience while the character speaks.
 */
export function playStoryVoiceAudio(audioUrl: string, enabled: boolean): void {
  if (!enabled || typeof window === "undefined" || typeof Audio === "undefined") {
    stopIntercomVoice();
    return;
  }
  stopIntercomVoice();
  ensureAudioUnlocked();

  try {
    const el = new Audio(audioUrl);
    activeVoiceAudio = el;
    setAmbienceDucking(true);

    const ctx = getAudioContext();
    let connectedWebAudio = false;

    const cleanup = () => {
      if (activeVoiceAudio === el) {
        activeVoiceAudio = null;
        setAmbienceDucking(false);
      }
    };

    el.addEventListener("error", cleanup, { once: true });
    el.addEventListener(
      "ended",
      () => {
        if (ctx) playStaticBurst(ctx, 0.08, 0.032, 1300);
        cleanup();
      },
      { once: true }
    );
    el.addEventListener(
      "canplaythrough",
      () => {
        if (activeVoiceAudio !== el) return;
        if (ctx && !connectedWebAudio) {
          try {
            const src = ctx.createMediaElementSource(el);
            const hp = ctx.createBiquadFilter();
            hp.type = "highpass";
            hp.frequency.value = 380;
            const lp = ctx.createBiquadFilter();
            lp.type = "lowpass";
            lp.frequency.value = 3100;
            const boost = ctx.createGain();
            boost.gain.value = 1.25;
            src.connect(hp).connect(lp).connect(boost).connect(ctx.destination);
            connectedWebAudio = true;
            playStaticBurst(ctx, 0.06, 0.035, 1400);
          } catch {
            // Direct HTMLAudioElement playback remains intact
          }
        }
        void el.play().catch(cleanup);
      },
      { once: true }
    );
    el.load();
  } catch {
    setAmbienceDucking(false);
  }
}

/**
 * Strips leading stage directions in parentheses, e.g. `（攥紧衣领）` or `(Shivering)`,
 * so spoken intercom TTS reads only the audible dialogue.
 */
export function stripStageDirections(line: string): string {
  return line
    .replace(/^\s*（[^）]{1,40}）\s*/g, "")
    .replace(/^\s*\([^)]{1,50}\)\s*/g, "")
    .trim();
}

const LOCALE_BCP47: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en-US",
  ja: "ja-JP"
};

function speakWithBrowserFallback(visitorId: string, text: string, locale: Locale): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    return;
  }
  const spoken = stripStageDirections(text);
  if (!spoken) return;

  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(spoken);
    const profile = VOCAL_SYNTH_PROFILES[visitorId] ?? {
      pitch: 1.0,
      rate: 1.0,
      genderHint: "female"
    };
    utter.lang = LOCALE_BCP47[locale];
    utter.pitch = profile.pitch;
    utter.rate = profile.rate;
    utter.volume = 0.88;

    const voices = window.speechSynthesis.getVoices?.() ?? [];
    const langPrefix = locale === "zh" ? "zh" : locale === "ja" ? "ja" : "en";
    const matching = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
    if (matching.length > 0) {
      utter.voice = matching[0]!;
    }

    const ctx = getAudioContext();
    utter.onend = () => {
      if (ctx) playStaticBurst(ctx, 0.09, 0.035, 1300);
    };

    if (ctx) playStaticBurst(ctx, 0.08, 0.04, 1350);
    window.speechSynthesis.speak(utter);
  } catch {
    // Ignore speechSynthesis failures in headless browsers
  }
}

/**
 * Plays a survivor's intercom line through a bandpass-filtered wall speaker:
 * 1. Tries pre-rendered studio audio at `./audio/{locale}/{slug}/{lineId}.mp3` routed through
 *    a WebAudio 380Hz–3100Hz intercom filter + soft overdrive.
 * 2. Automatically falls back to tuned Web Speech synthesis + PTT radio squelch static if absent
 *    (or when the line was dynamically rewritten by the online Flash rephraser).
 */
export function speakIntercomLine(opts: {
  visitorId: string;
  locale: Locale;
  text: string;
  lineId?: VoiceLineVariant;
  isDynamicFlash?: boolean;
  enabled: boolean;
}): void {
  if (!opts.enabled || typeof window === "undefined") return;
  stopIntercomVoice();

  // Dynamic Flash-rewritten lines have custom wording, so synthesize directly
  if (opts.isDynamicFlash || !opts.lineId || typeof Audio === "undefined") {
    speakWithBrowserFallback(opts.visitorId, opts.text, opts.locale);
    return;
  }

  const audioUrl = getVoiceAudioPath(opts.visitorId, opts.locale, opts.lineId);
  try {
    const el = new Audio(audioUrl);
    activeVoiceAudio = el;

    const ctx = getAudioContext();
    let connectedWebAudio = false;

    const handleFallback = () => {
      if (activeVoiceAudio === el) {
        activeVoiceAudio = null;
        speakWithBrowserFallback(opts.visitorId, opts.text, opts.locale);
      }
    };

    el.addEventListener("error", handleFallback, { once: true });
    el.addEventListener(
      "canplaythrough",
      () => {
        if (activeVoiceAudio !== el) return;
        if (ctx && !connectedWebAudio) {
          try {
            const src = ctx.createMediaElementSource(el);
            const hp = ctx.createBiquadFilter();
            hp.type = "highpass";
            hp.frequency.value = 380;
            const lp = ctx.createBiquadFilter();
            lp.type = "lowpass";
            lp.frequency.value = 3100;
            src.connect(hp).connect(lp).connect(ctx.destination);
            connectedWebAudio = true;
            playStaticBurst(ctx, 0.07, 0.04, 1400);
          } catch {
            // Element playback still works directly
          }
        }
        void el.play().catch(handleFallback);
      },
      { once: true }
    );
    el.addEventListener(
      "ended",
      () => {
        if (ctx) playStaticBurst(ctx, 0.09, 0.035, 1300);
      },
      { once: true }
    );
    el.load();
  } catch {
    speakWithBrowserFallback(opts.visitorId, opts.text, opts.locale);
  }
}
