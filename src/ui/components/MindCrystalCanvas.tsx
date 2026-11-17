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
}

export function MindCrystalCanvas({
  id,
  orderings,
  neverWon,
  overlays,
  lang
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2 + 4;
    const rx = w * 0.34;
    const ry = h * 0.36;
    const deg2rad = (deg: number) => ((deg - 90) * Math.PI) / 180;

    // 1. Draw the 3 Ordamor value-family arcs (self / bond / rule) from crystal.ts
    ctx.save();
    ctx.strokeStyle = "rgba(156, 176, 190, 0.24)";
    ctx.lineWidth = 2;
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
      ctx.fillStyle = "rgba(148, 163, 184, 0.72)";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        fam.label[lang],
        cx + Math.cos(midR) * (rx * 0.62),
        cy + Math.sin(midR) * (ry * 0.62)
      );
    }
    ctx.restore();

    const pos = {} as Record<ValueToken, { x: number; y: number }>;
    for (const item of FACE_LAYOUT) {
      const r = deg2rad(item.angle);
      pos[item.token] = {
        x: cx + Math.cos(r) * rx,
        y: cy + Math.sin(r) * ry
      };
    }

    const drawChord = (
      fromKey: ValueToken,
      toKey: ValueToken,
      color: string,
      dashed: boolean,
      labelText: string
    ) => {
      const p1 = pos[fromKey];
      const p2 = pos[toKey];
      if (!p1 || !p2) return;
      const midX = (p1.x + p2.x) / 2 + (cx - (p1.x + p2.x) / 2) * 0.45;
      const midY = (p1.y + p2.y) / 2 + (cy - (p1.y + p2.y) / 2) * 0.45;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = dashed ? 2.2 : 2.6;
      if (dashed) ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const angle = Math.atan2(p2.y - midY, p2.x - midX);
      const headLen = 8;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p2.x - headLen * Math.cos(angle - 0.4), p2.y - headLen * Math.sin(angle - 0.4));
      ctx.lineTo(p2.x - headLen * Math.cos(angle + 0.4), p2.y - headLen * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();

      if (labelText) {
        ctx.font = "10px monospace";
        ctx.fillText(labelText, midX - 10, midY - 4);
      }
      ctx.restore();
    };

    for (const ord of orderings) {
      drawChord(
        ord.dropped,
        ord.kept,
        "#f59e0b",
        false,
        ord.weight !== undefined ? ord.weight.toFixed(2) : ""
      );
    }

    for (const ov of overlays ?? []) {
      drawChord(
        ov.dropped,
        ov.kept,
        ov.mismatch ? "#ef4444" : "#10b981",
        true,
        ov.tag ?? ""
      );
    }

    const keptSet = new Set(orderings.map((o) => o.kept));
    const lostSet = new Set(orderings.map((o) => o.dropped));
    const neverWonSet = new Set(neverWon);

    for (const { token } of FACE_LAYOUT) {
      const p = pos[token];
      const isKept = keptSet.has(token);
      const isNeverWon = neverWonSet.has(token);
      const touched = isKept || lostSet.has(token) || isNeverWon;

      if (isNeverWon) {
        ctx.save();
        ctx.strokeStyle = "rgba(148, 163, 184, 0.65)";
        ctx.setLineDash([2, 2]);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.fillStyle = isKept ? "#f59e0b" : touched ? "#64748b" : "#1e293b";
      ctx.beginPath();
      ctx.arc(p.x, p.y, isKept ? 6.5 : touched ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isKept ? "#f59e0b" : touched ? "#e2e8f0" : "#64748b";
      ctx.font = isKept ? "bold 11px sans-serif" : "10px sans-serif";
      ctx.textAlign = p.x < cx - 20 ? "right" : p.x > cx + 20 ? "left" : "center";
      const offsetX = p.x < cx - 20 ? -10 : p.x > cx + 20 ? 10 : 0;
      const offsetY = p.y < cy - 42 ? -9 : p.y > cy + 42 ? 14 : 3;
      ctx.fillText(VALUE_I18N[token][lang], p.x + offsetX, p.y + offsetY);
    }
  }, [orderings, neverWon, overlays, lang]);

  return (
    <canvas
      id={id}
      ref={canvasRef}
      width={460}
      height={235}
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  );
}
