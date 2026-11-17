import {
  VOCAL_SYNTH_PROFILES,
  getVoiceAudioPath,
  type VoiceLineVariant
} from "./media.js";
import type { Locale } from "./types.js";

export type SfxKind = "ptt" | "strobe" | "thermal" | "purge" | "admit" | "heartbeat";

let sharedAudioCtx: AudioContext | null = null;
let noiseBufferCache: AudioBuffer | null = null;

interface AmbienceHandle {
  masterGain: GainNode;
  stormGain: GainNode;
  sources: AudioScheduledSourceNode[];
}

let activeAmbience: AmbienceHandle | null = null;
let activeVoiceAudio: HTMLAudioElement | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AC();
  }
  if (sharedAudioCtx.state === "suspended") {
    void sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
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
 * Starts, updates, or mutes the continuous Svalbard -46°C blizzard wind + fluorescent booth hum.
 * On Night 3 (`night === 3`), boosts geomagnetic aurora static interference.
 */
export function setBoothAmbience(enabled: boolean, night: number): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (!enabled) {
    if (activeAmbience) {
      const now = ctx.currentTime;
      activeAmbience.masterGain.gain.setTargetAtTime(0.0001, now, 0.15);
    }
    return;
  }

  if (!activeAmbience) {
    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.connect(ctx.destination);

      // 1. Exterior Arctic blizzard wind (LFO-swept lowpass filtered noise)
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
      windGain.gain.setValueAtTime(0.28, now);
      windSrc.connect(windFilter).connect(windGain).connect(masterGain);

      // 2. Interior 60Hz CRT / transformer booth hum
      const humOsc = ctx.createOscillator();
      humOsc.type = "sine";
      humOsc.frequency.setValueAtTime(60, now);
      const humGain = ctx.createGain();
      humGain.gain.setValueAtTime(0.018, now);
      humOsc.connect(humGain).connect(masterGain);

      // 3. Night 3 geomagnetic storm crackle layer
      const stormSrc = ctx.createBufferSource();
      stormSrc.buffer = getNoiseBuffer(ctx);
      stormSrc.loop = true;
      const stormFilter = ctx.createBiquadFilter();
      stormFilter.type = "highpass";
      stormFilter.frequency.setValueAtTime(1900, now);
      const stormGain = ctx.createGain();
      stormGain.gain.setValueAtTime(night === 3 ? 0.055 : 0.004, now);
      stormSrc.connect(stormFilter).connect(stormGain).connect(masterGain);

      windSrc.start(now);
      windLfo.start(now);
      humOsc.start(now);
      stormSrc.start(now);

      activeAmbience = {
        masterGain,
        stormGain,
        sources: [windSrc, windLfo, humOsc, stormSrc]
      };
    } catch {
      return;
    }
  }

  const now = ctx.currentTime;
  activeAmbience.masterGain.gain.setTargetAtTime(0.14, now, 0.35);
  activeAmbience.stormGain.gain.setTargetAtTime(night === 3 ? 0.065 : 0.004, now, 0.35);
}

export function stopAllBoothAudio(): void {
  if (activeAmbience) {
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
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
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
