import { useEffect, useRef } from "react";
import { FAMILY_ARC_SPANS, VALUE_I18N } from "../../game/i18n.js";
import type { Locale } from "../../game/types.js";
import { FACE_LAYOUT, type ValueToken } from "../../ordamor/index.js";

export interface ChordArc {
  kept: ValueToken;
  dropped: ValueToken;
  weight?: number;
}

export interface OverlayArc {
  kept: ValueToken;
  dropped: ValueToken;
  mismatch: boolean;
  tag?: string;
}

interface Props {
  id: string;
  orderings: readonly ChordArc[];
  neverWon: readonly ValueToken[];
  overlays?: readonly OverlayArc[];
  lang: Locale;
  motionPaused?: boolean;
}

export function MindCrystalCanvas({
  id,
  orderings,
  neverWon,
  overlays,
  lang,
  motionPaused = false
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2 + 2;
    const rx = w * 0.31;
    const ry = h * 0.305;
    const deg2rad = (deg: number) => ((deg - 90) * Math.PI) / 180;

    const pos = {} as Record<ValueToken, { x: number; y: number }>;
    for (const item of FACE_LAYOUT) {
      const r = deg2rad(item.angle);
      pos[item.token] = {
        x: cx + Math.cos(r) * rx,
        y: cy + Math.sin(r) * ry
      };
    }

    const drawPartialChord = (
      fromKey: ValueToken,
      toKey: ValueToken,
      color: string,
      dashed: boolean,
      labelText: string,
      t: number,
      showTipPulse: boolean,
      beadPhase: number | null,
      mismatchSpark = false,
      haloPhase = 0.5
    ) => {
      const p1 = pos[fromKey];
      const p2 = pos[toKey];
      if (!p1 || !p2 || t <= 0.01) return;
      const midX = (p1.x + p2.x) / 2 + (cx - (p1.x + p2.x) / 2) * 0.45;
      const midY = (p1.y + p2.y) / 2 + (cy - (p1.y + p2.y) / 2) * 0.45;

      // Exact quadratic Bezier sub-segment [0, t]
      const q1x = (1 - t) * p1.x + t * midX;
      const q1y = (1 - t) * p1.y + t * midY;
      const q2x = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * midX + t * t * p2.x;
      const q2y = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * midY + t * t * p2.y;

      ctx.save();
      // Subtle phosphor under-glow for legibility
      ctx.strokeStyle = color;
      ctx.globalAlpha = dashed ? 0.22 : 0.26;
      ctx.lineWidth = dashed ? 5.5 : 6;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(q1x, q1y, q2x, q2y);
      ctx.stroke();

      // Core Bezier chord
      ctx.globalAlpha = 1;
      ctx.lineWidth = dashed ? 2.1 : 2.5;
      if (dashed) ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(q1x, q1y, q2x, q2y);
      ctx.stroke();
      ctx.setLineDash([]);

      const dx = q2x - q1x;
      const dy = q2y - q1y;
      const angle =
        Math.hypot(dx, dy) > 0.5 ? Math.atan2(dy, dx) : Math.atan2(midY - p1.y, midX - p1.x);
      const headLen = 8;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(q2x, q2y);
      ctx.lineTo(q2x - headLen * Math.cos(angle - 0.4), q2y - headLen * Math.sin(angle - 0.4));
      ctx.lineTo(q2x - headLen * Math.cos(angle + 0.4), q2y - headLen * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();

      if (showTipPulse && t < 0.99) {
        ctx.fillStyle = "#f6bd54";
        ctx.beginPath();
        ctx.arc(q2x, q2y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Live directional energy bead traveling from dropped -> kept along completed chord
      if (beadPhase !== null && t >= 0.99) {
        const u = beadPhase;
        const bx = (1 - u) * (1 - u) * p1.x + 2 * (1 - u) * u * midX + u * u * p2.x;
        const by = (1 - u) * (1 - u) * p1.y + 2 * (1 - u) * u * midY + u * u * p2.y;
        const beadAlpha = Math.sin(u * Math.PI);
        ctx.save();
        ctx.globalAlpha = beadAlpha * 0.92;
        ctx.fillStyle = dashed ? (mismatchSpark ? "#ff9c8f" : "#86e8b8") : "#fde68a";
        ctx.beginPath();
        ctx.arc(bx, by, dashed ? 2.4 : 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (mismatchSpark && t >= 0.85) {
        ctx.save();
        ctx.translate(midX, midY);
        const s = 4.6 + haloPhase * 2.2;
        ctx.rotate(haloPhase * 0.65);
        ctx.strokeStyle = "#ff9c8f";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(-s, 0);
        ctx.lineTo(0, -s);
        ctx.lineTo(s, 0);
        ctx.lineTo(0, s);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      if (labelText && t >= 0.65) {
        ctx.globalAlpha = Math.min(1, (t - 0.65) / 0.35);
        ctx.fillStyle = color;
        ctx.font = "700 10px 'IBM Plex Mono', monospace";
        ctx.textAlign = "center";
        // Offset overlay labels below chord so they never collide with base weight labels above chord
        ctx.fillText(labelText, midX, dashed ? midY + 14 : midY - 8);
      }
      ctx.restore();
    };

    const drawScene = (drawT: number, haloPhase: number, sweepRad: number | null, beadPhase: number | null) => {
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      // Subtle rotating CRT phosphor radar sweep wedge
      if (sweepRad !== null) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, ry / rx);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, rx, sweepRad - 0.55, sweepRad);
        ctx.closePath();
        ctx.fillStyle = "rgba(235, 168, 52, 0.055)";
        ctx.fill();
        ctx.strokeStyle = "rgba(235, 168, 52, 0.24)";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(sweepRad) * rx, Math.sin(sweepRad) * rx);
        ctx.stroke();
        ctx.restore();
      }

      // Concentric tactical radar guide ellipses
      ctx.strokeStyle = "rgba(198, 176, 138, 0.09)";
      ctx.lineWidth = 1;
      for (const ratio of [0.56, 0.84]) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * ratio, ry * ratio, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 12 outer vernier degree ticks
      ctx.strokeStyle = "rgba(158, 198, 212, 0.2)";
      for (let deg = 0; deg < 360; deg += 30) {
        const r = deg2rad(deg);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(r) * (rx * 1.03), cy + Math.sin(r) * (ry * 1.03));
        ctx.lineTo(cx + Math.cos(r) * (rx * 1.08), cy + Math.sin(r) * (ry * 1.08));
        ctx.stroke();
      }

      // 1. Draw the 3 Ordamor value-family arcs (self / bond / rule) from crystal.ts
      ctx.strokeStyle = "rgba(235, 168, 52, 0.28)";
      ctx.lineWidth = 1.6;
      for (const fam of FAMILY_ARC_SPANS) {
        ctx.beginPath();
        for (let d = fam.startDeg; d <= fam.endDeg; d += 2) {
          const r = deg2rad(d);
          const x = cx + Math.cos(r) * rx;
          const y = cy + Math.sin(r) * ry;
          if (d === fam.startDeg) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        const midR = deg2rad((fam.startDeg + fam.endDeg) / 2);
        ctx.fillStyle = "rgba(198, 176, 138, 0.72)";
        ctx.font = "10px 'IBM Plex Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          fam.label[lang],
          cx + Math.cos(midR) * (rx * 0.54),
          cy + Math.sin(midR) * (ry * 0.54)
        );
      }

      // Center tactical registration crosshair
      ctx.strokeStyle = "rgba(235, 168, 52, 0.32)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy);
      ctx.lineTo(cx + 7, cy);
      ctx.moveTo(cx, cy - 7);
      ctx.lineTo(cx, cy + 7);
      ctx.stroke();

      // Compact top-corner telemetry micro-legend
      ctx.font = "9px 'IBM Plex Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(235, 168, 52, 0.85)";
      ctx.fillText("— BASE", 8, 14);
      if (overlays && overlays.length > 0) {
        ctx.textAlign = "right";
        const anyMismatch = overlays.some((o) => o.mismatch);
        ctx.fillStyle = anyMismatch ? "rgba(255, 156, 143, 0.9)" : "rgba(134, 232, 184, 0.9)";
        ctx.fillText(anyMismatch ? "-- DIFF // MISMATCH" : "-- LIVE // MATCH", w - 8, 14);
      }
      ctx.restore();

      orderings.forEach((ord, idx) => {
        const phasedBead = beadPhase !== null ? (beadPhase + idx * 0.37) % 1 : null;
        drawPartialChord(
          ord.dropped,
          ord.kept,
          "#eba834",
          false,
          ord.weight !== undefined ? ord.weight.toFixed(2) : "",
          drawT,
          drawT < 1,
          phasedBead,
          false,
          haloPhase
        );
      });

      const overlayT = Math.max(0, Math.min(1, (drawT - 0.18) / 0.82));
      (overlays ?? []).forEach((ov, idx) => {
        const phasedBead = beadPhase !== null ? (beadPhase + 0.52 + idx * 0.25) % 1 : null;
        drawPartialChord(
          ov.dropped,
          ov.kept,
          ov.mismatch ? "#e04634" : "#49b882",
          true,
          ov.tag ?? "",
          drawT >= 1 ? 1 : overlayT,
          drawT < 1,
          phasedBead,
          ov.mismatch,
          haloPhase
        );
      });

      const keptSet = new Set(orderings.map((o) => o.kept));
      const lostSet = new Set(orderings.map((o) => o.dropped));
      const neverWonSet = new Set(neverWon);

      for (const { token } of FACE_LAYOUT) {
        const p = pos[token];
        const isKept = keptSet.has(token);
        const isNeverWon = neverWonSet.has(token);
        const touched = isKept || lostSet.has(token) || isNeverWon;

        if (isKept) {
          ctx.save();
          ctx.strokeStyle = `rgba(235, 168, 52, ${(0.22 + 0.35 * haloPhase).toFixed(2)})`;
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8 + haloPhase * 4.2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        if (isNeverWon) {
          ctx.save();
          ctx.strokeStyle = "rgba(198, 176, 138, 0.68)";
          ctx.setLineDash([2, 2]);
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 10.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        ctx.fillStyle = isKept ? "#eba834" : touched ? "#8b98a2" : "#28333d";
        ctx.beginPath();
        ctx.arc(p.x, p.y, isKept ? 5.8 : touched ? 4.4 : 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isKept ? "#eba834" : touched ? "#e3e8ec" : "#74828d";
        ctx.font = isKept
          ? "700 11px 'IBM Plex Mono', monospace"
          : "10px 'IBM Plex Mono', monospace";
        ctx.textAlign = p.x < cx - 22 ? "right" : p.x > cx + 22 ? "left" : "center";
        const offsetX = p.x < cx - 22 ? -10 : p.x > cx + 22 ? 10 : 0;
        const offsetY = p.y < cy - 42 ? -10 : p.y > cy + 42 ? 15 : 3;
        const clampedY = Math.max(15, Math.min(h - 9, p.y + offsetY));
        ctx.fillText(VALUE_I18N[token][lang], p.x + offsetX, clampedY);
      }
    };

    const reduceMotion =
      motionPaused ||
      (typeof window !== "undefined" &&
        Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches));

    if (reduceMotion) {
      drawScene(1, 0.4, null, null);
      return;
    }

    const startTime = performance.now();
    let rafId = 0;
    const step = (now: number) => {
      const elapsed = now - startTime;
      const linear = Math.min(1, elapsed / 460);
      const eased = 1 - Math.pow(1 - linear, 3);
      const halo = 0.5 + 0.5 * Math.sin((elapsed / 2800) * Math.PI * 2);
      const sweepRad = ((elapsed % 9000) / 9000) * Math.PI * 2 - Math.PI / 2;
      const beadPhase = (elapsed % 2800) / 2800;
      drawScene(eased, halo, sweepRad, beadPhase);
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [orderings, neverWon, overlays, lang, motionPaused]);

  return (
    <canvas
      id={id}
      ref={canvasRef}
      width={460}
      height={252}
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  );
}
