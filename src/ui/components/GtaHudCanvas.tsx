import { useEffect, useRef } from "react";
import { crystalChords } from "../../ordamor/index.js";
import type { VisitorSpec } from "../../game/types.js";

/**
 * GTA-Style Bottom-Left Tilted Canvas Radar / MindCrystal Tactical Minimap.
 * Renders a 60fps sweeping phosphor radar with live Ordamor tension blips & rings,
 * switching to crackling EMI static during Night 3 geomagnetic storm.
 */
export function GtaRadarCanvas({
  visitor,
  bpm,
  verdictState,
  motionPaused = false
}: {
  visitor: VisitorSpec;
  bpm: number;
  verdictState: "NONE" | "ADMIT" | "PURGE";
  motionPaused?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = 186;
    const h = 112;
    canvas.width = w;
    canvas.height = h;

    const chords = crystalChords(visitor.profile);
    const storm = visitor.night === 3;
    let raf = 0;
    let t = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!motionPaused) t += dt;

      ctx.clearRect(0, 0, w, h);

      // Dark tactical radar map grid
      ctx.fillStyle = storm ? "#140808" : "#070e12";
      ctx.fillRect(0, 0, w, h);

      // Sector grid lines
      ctx.strokeStyle = storm ? "rgba(224,70,52,0.18)" : "rgba(158,198,212,0.14)";
      ctx.lineWidth = 1;
      for (let x = 18; x < w; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 18; y < h; y += 22) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const cx = w * 0.5;
      const cy = h * 0.54;
      const rOuter = 44;

      if (storm) {
        // Geomagnetic EMI static bars
        ctx.fillStyle = "rgba(224,70,52,0.22)";
        for (let i = 0; i < 18; i++) {
          const sy = ((i * 19 + Math.floor(t * 70)) % h);
          ctx.fillRect(0, sy, w, 2);
        }
        ctx.fillStyle = "#ff8577";
        ctx.font = "700 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText("EMI // RADAR JAMMED", cx, cy + 3);
      } else {
        // Concentric tactical rings
        ctx.strokeStyle =
          verdictState === "PURGE"
            ? "rgba(224,70,52,0.55)"
            : verdictState === "ADMIT"
              ? "rgba(73,184,130,0.55)"
              : "rgba(235,168,52,0.34)";
        for (const r of [16, 30, rOuter]) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Rotating sweep wedge
        const sweep = (t * (bpm >= 105 ? 2.5 : 1.4)) % (Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, rOuter, sweep - 0.65, sweep);
        ctx.closePath();
        ctx.fillStyle =
          verdictState === "PURGE"
            ? "rgba(224,70,52,0.26)"
            : verdictState === "ADMIT"
              ? "rgba(73,184,130,0.26)"
              : "rgba(235,168,52,0.20)";
        ctx.fill();

        // Sweep beam
        ctx.strokeStyle =
          verdictState === "PURGE"
            ? "#ff7b6b"
            : verdictState === "ADMIT"
              ? "#6ce3aa"
              : "#eba834";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(sweep) * rOuter, cy + Math.sin(sweep) * rOuter);
        ctx.stroke();

        // Plot Ordamor conflict blips around center (gate operator arrow at center)
        chords.forEach((_ch, idx) => {
          const ang = idx * 2.1 + 0.7;
          const dist = 22 + (idx % 2) * 14;
          const bx = cx + Math.cos(ang) * dist;
          const by = cy + Math.sin(ang) * dist;
          const ping = 0.5 + 0.5 * Math.sin(t * 4.5 + idx * 1.7);
          ctx.fillStyle = idx === 0 ? `rgba(235,168,52,${0.55 + ping * 0.45})` : `rgba(158,198,212,${0.5 + ping * 0.45})`;
          ctx.beginPath();
          ctx.arc(bx, by, 3.2, 0, Math.PI * 2);
          ctx.fill();
        });

        // Player Gate-0 chevron at center
        ctx.fillStyle = "#f2f6f8";
        ctx.beginPath();
        ctx.moveTo(cx, cy - 5);
        ctx.lineTo(cx + 4.5, cy + 4);
        ctx.lineTo(cx, cy + 2);
        ctx.lineTo(cx - 4.5, cy + 4);
        ctx.closePath();
        ctx.fill();
      }

      // Corner HUD tag
      ctx.fillStyle = "rgba(228,236,240,0.75)";
      ctx.font = "700 8.5px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`SECTOR 0 // ${visitor.id}`, 6, 12);
      ctx.textAlign = "right";
      ctx.fillStyle = storm ? "#ff8577" : "#eba834";
      ctx.fillText(`N${visitor.night}`, w - 6, 12);

      if (!motionPaused) {
        raf = window.requestAnimationFrame(draw);
      }
    };

    raf = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(raf);
  }, [visitor, bpm, verdictState, motionPaused]);

  return <canvas ref={canvasRef} className="gta-radar-canvas" aria-hidden="true" />;
}

/**
 * GTA-Style Top-Right Real-Time 60fps Scrolling Cardiac ECG Oscilloscope.
 * Dynamically adapts pulse cadence & QRS peak height to live BPM, or flatlines with red EMI noise on Night 3.
 */
export function GtaEcgCanvas({
  bpm,
  blinded = false,
  motionPaused = false
}: {
  bpm: number;
  blinded?: boolean;
  motionPaused?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = 156;
    const h = 34;
    canvas.width = w;
    canvas.height = h;

    let raf = 0;
    let phase = 0;
    let last = performance.now();

    const ecgSample = (p: number): number => {
      const x = ((p % 1) + 1) % 1;
      if (x < 0.14) return 0;
      if (x < 0.2) return Math.sin(((x - 0.14) / 0.06) * Math.PI) * 0.22; // P wave
      if (x < 0.24) return 0;
      if (x < 0.27) return -0.25; // Q dip
      if (x < 0.31) return 1.0; // R peak
      if (x < 0.35) return -0.38; // S dip
      if (x < 0.48) return 0;
      if (x < 0.6) return Math.sin(((x - 0.48) / 0.12) * Math.PI) * 0.3; // T wave
      return 0;
    };

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const beatsPerSec = Math.max(0.75, Math.min(2.6, bpm / 60));
      if (!motionPaused) phase += dt * beatsPerSec;

      ctx.clearRect(0, 0, w, h);

      // Subtle baseline
      ctx.strokeStyle = "rgba(255,255,255,0.09)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.62);
      ctx.lineTo(w, h * 0.62);
      ctx.stroke();

      const high = bpm >= 105;
      const stroke = blinded ? "#e04634" : high ? "#ff5c4a" : bpm >= 86 ? "#eba834" : "#49b882";

      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.75;
      ctx.shadowColor = stroke;
      ctx.shadowBlur = 6;
      ctx.beginPath();

      for (let x = 0; x < w; x++) {
        const u = x / w;
        let y: number;
        if (blinded) {
          const jitter = Math.sin(x * 0.9 + phase * 18) * Math.cos(x * 0.37 - phase * 11) * 3.5;
          y = h * 0.56 + jitter;
        } else {
          const val = ecgSample(u * 2.15 - phase);
          y = h * 0.66 - val * (h * 0.52);
        }
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (!motionPaused) {
        raf = window.requestAnimationFrame(draw);
      }
    };

    raf = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(raf);
  }, [bpm, blinded, motionPaused]);

  return <canvas ref={canvasRef} className="gta-ecg-canvas" aria-hidden="true" />;
}
