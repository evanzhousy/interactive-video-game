import { useEffect, useRef, useState } from "react";
import type { VisitorSpec } from "../../game/types.js";

interface Props {
  visitor: VisitorSpec;
  reaction: string;
  strobeTrigger: number;
  verdictState: "NONE" | "ADMIT" | "PURGE";
}

export function ViewportCanvas({
  visitor,
  reaction,
  strobeTrigger,
  verdictState
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strobeAlphaRef = useRef(0);
  const [photoVisible, setPhotoVisible] = useState(false);

  useEffect(() => {
    setPhotoVisible(false);
  }, [visitor.id]);

  useEffect(() => {
    if (strobeTrigger > 0) {
      strobeAlphaRef.current = 1.0;
    }
  }, [strobeTrigger]);

  useEffect(() => {
    const snow = Array.from({ length: 44 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1 + Math.random() * 2,
      vx: 0.001 + Math.random() * 0.0026,
      vy: 0.002 + Math.random() * 0.0036
    }));

    let rafId = 0;
    const draw = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        if (rect.width > 0) {
          const w = Math.floor(rect.width);
          const h = Math.floor(rect.height);
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, w, h);

            if (!photoVisible) {
              const bg = ctx.createRadialGradient(w * 0.5, h * 0.35, 18, w * 0.5, h * 0.5, w * 0.72);
              bg.addColorStop(0, "#123844");
              bg.addColorStop(1, "#050b0f");
              ctx.fillStyle = bg;
              ctx.fillRect(0, 0, w, h);

              ctx.fillStyle = "#091318";
              ctx.beginPath();
              ctx.arc(w * 0.52, h * 0.42, h * 0.16, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.ellipse(w * 0.52, h * 0.89, w * 0.23, h * 0.34, 0, Math.PI, 0);
              ctx.fill();

              const eyeShift = reaction.includes("FLINCH") ? 4 : 0;
              ctx.fillStyle = "#9bd5e0";
              ctx.fillRect(w * 0.482 + eyeShift, h * 0.39, 6, 3);
              ctx.fillRect(w * 0.545 + eyeShift, h * 0.39, 6, 3);

              ctx.fillStyle = "rgba(245, 158, 11, 0.78)";
              ctx.beginPath();
              ctx.arc(w * 0.57, h * 0.54, 3, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.fillStyle = "rgba(212, 240, 250, 0.36)";
            for (const p of snow) {
              p.x = (p.x + p.vx) % 1;
              p.y = (p.y + p.vy) % 1;
              ctx.beginPath();
              ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
              ctx.fill();
            }

            const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.0022);
            const mist = ctx.createRadialGradient(
              w * 0.52,
              h * 0.92,
              10,
              w * 0.52,
              h * 0.92,
              h * (0.34 + pulse * 0.05)
            );
            mist.addColorStop(0, "rgba(205, 232, 240, 0.27)");
            mist.addColorStop(1, "rgba(205, 232, 240, 0)");
            ctx.fillStyle = mist;
            ctx.fillRect(0, h * 0.48, w, h * 0.52);

            if (strobeAlphaRef.current > 0.01) {
              ctx.fillStyle = `rgba(235, 250, 255, ${strobeAlphaRef.current * 0.76})`;
              ctx.fillRect(0, 0, w, h);
              strobeAlphaRef.current *= 0.88;
            }

            if (verdictState === "PURGE") {
              ctx.fillStyle = "#120806";
              ctx.fillRect(0, 0, w, h * 0.86);
              const fire = ctx.createLinearGradient(0, h * 0.72, 0, h);
              fire.addColorStop(0, "rgba(239, 68, 68, 0.86)");
              fire.addColorStop(1, "rgba(245, 158, 11, 0.96)");
              ctx.fillStyle = fire;
              ctx.fillRect(0, h * 0.82, w, h * 0.18);
              ctx.fillStyle = "#fecaca";
              ctx.font = "bold 13px monospace";
              ctx.textAlign = "center";
              ctx.fillText("CHAMBER PURGED · 1,100°C THERMAL STERILIZATION", w / 2, h * 0.46);
            } else if (verdictState === "ADMIT") {
              ctx.fillStyle = "rgba(16, 185, 129, 0.18)";
              ctx.fillRect(0, 0, w, h);
              ctx.fillStyle = "#a7f3d0";
              ctx.font = "bold 13px monospace";
              ctx.textAlign = "center";
              ctx.fillText("INNER AIRLOCK UNSEALED · SUBJECT ADMITTED", w / 2, h * 0.48);
            }

            ctx.strokeStyle = "rgba(10, 17, 22, 0.92)";
            ctx.lineWidth = 12;
            ctx.strokeRect(0, 0, w, h);
          }
        }
      }
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [photoVisible, reaction, verdictState]);

  return (
    <div className="viewport-frame" id="quarantine-viewport">
      {visitor.portraitUrl ? (
        <img
          src={visitor.portraitUrl}
          alt={visitor.name.en}
          className="viewport-photo"
          style={{ display: photoVisible ? "block" : "none" }}
          onLoad={() => setPhotoVisible(true)}
          onError={() => setPhotoVisible(false)}
        />
      ) : null}
      <canvas ref={canvasRef} className="viewport-canvas" />
    </div>
  );
}
