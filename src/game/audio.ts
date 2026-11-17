export type SfxKind = "ptt" | "strobe" | "purge" | "admit";

let sharedAudioCtx: AudioContext | null = null;

export function playBoothSfx(kind: SfxKind, enabled = true): void {
  if (!enabled || typeof window === "undefined") return;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;

  if (!sharedAudioCtx) sharedAudioCtx = new AC();
  if (sharedAudioCtx.state === "suspended") {
    void sharedAudioCtx.resume();
  }

  const now = sharedAudioCtx.currentTime;
  const osc = sharedAudioCtx.createOscillator();
  const gain = sharedAudioCtx.createGain();
  osc.connect(gain).connect(sharedAudioCtx.destination);

  if (kind === "ptt") {
    osc.type = "square";
    osc.frequency.setValueAtTime(1450, now);
    osc.frequency.setValueAtTime(1100, now + 0.04);
    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.start(now);
    osc.stop(now + 0.09);
  } else if (kind === "strobe") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.18);
    gain.gain.setValueAtTime(0.075, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.start(now);
    osc.stop(now + 0.22);
  } else if (kind === "purge") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.55);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.6);
  } else {
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.setValueAtTime(780, now + 0.1);
    gain.gain.setValueAtTime(0.075, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.start(now);
    osc.stop(now + 0.28);
  }
}
