import { useEffect, useRef, useState } from "react";
import { getVideoClipCandidates, type ClipState } from "../../game/media.js";
import type { VisitorSpec } from "../../game/types.js";

interface Props {
  visitor: VisitorSpec;
  clipState: ClipState;
  bpm: number;
  strobeTrigger: number;
  thermalTrigger: number;
  verdictState: "NONE" | "ADMIT" | "PURGE";
  onClipComplete?: () => void;
}

export function ViewportCanvas({
  visitor,
  clipState,
  bpm,
  strobeTrigger,
  thermalTrigger,
  verdictState,
  onClipComplete
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reactionVideoRef = useRef<HTMLVideoElement | null>(null);

  const strobeAlphaRef = useRef(0);
  const strobeHudUntilRef = useRef(0);
  const thermalHudUntilRef = useRef(0);
  const shutterProgressRef = useRef(0);

  const [photoVisible, setPhotoVisible] = useState(false);
  const [idleVideoReady, setIdleVideoReady] = useState(false);
  const [reactionVideoReady, setReactionVideoReady] = useState(false);
  const [thermalActive, setThermalActive] = useState(false);

  // Reset media flags when switching visitors
  useEffect(() => {
    setPhotoVisible(false);
    setIdleVideoReady(false);
    setReactionVideoReady(false);
    setThermalActive(false);
    shutterProgressRef.current = 0;
  }, [visitor.id]);

  // Strobe flash + 3.0s pupil reticle HUD
  useEffect(() => {
    if (strobeTrigger > 0) {
      strobeAlphaRef.current = 1.0;
      strobeHudUntilRef.current = Date.now() + 3000;
    }
  }, [strobeTrigger]);

  // 3.6s FLIR false-color infrared thermal view
  useEffect(() => {
    if (thermalTrigger <= 0) return;
    thermalHudUntilRef.current = Date.now() + 3600;
    setThermalActive(true);
    const t = setTimeout(() => setThermalActive(false), 3600);
    return () => clearTimeout(t);
  }, [thermalTrigger]);

  // Auto-return non-terminal kinetic clips (`flinch` / `lean_in`) back to `idle`
  useEffect(() => {
    setReactionVideoReady(false);
    if (clipState === "idle" || clipState === "admit" || clipState === "purge") {
      return;
    }
    const vid = reactionVideoRef.current;
    if (vid) {
      try {
        vid.load();
      } catch {
        // ignore in headless DOM
      }
    }
    const fallbackTimer = setTimeout(() => {
      onClipComplete?.();
    }, 2600);
    return () => clearTimeout(fallbackTimer);
  }, [clipState, visitor.id, onClipComplete]);

  useEffect(() => {
    const snow = Array.from({ length: 46 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1 + Math.random() * 2.1,
      vx: 0.0012 + Math.random() * 0.0028,
      vy: 0.0022 + Math.random() * 0.0038
    }));

    const embers = Array.from({ length: 26 }, () => ({
      x: Math.random(),
      y: 0.7 + Math.random() * 0.3,
      vy: 0.004 + Math.random() * 0.008,
      r: 1 + Math.random() * 2.2
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
            const now = Date.now();
            ctx.clearRect(0, 0, w, h);

            // Silhouette fallback if neither video nor portrait image has loaded
            if (!photoVisible && !idleVideoReady) {
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

              const eyeShift = clipState === "flinch" ? 4 : 0;
              ctx.fillStyle = "#9bd5e0";
              ctx.fillRect(w * 0.482 + eyeShift, h * 0.39, 6, 3);
              ctx.fillRect(w * 0.545 + eyeShift, h * 0.39, 6, 3);
            }

            // Blowing polar snow outside the double-glazed glass
            ctx.fillStyle =
              now < thermalHudUntilRef.current
                ? "rgba(255, 190, 95, 0.28)"
                : "rgba(212, 240, 250, 0.34)";
            for (const p of snow) {
              p.x = (p.x + p.vx) % 1;
              p.y = (p.y + p.vy) % 1;
              ctx.beginPath();
              ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
              ctx.fill();
            }

            // BPM-coupled cold breath condensation mist on lower glass
            const breathHz = Math.max(0.9, bpm / 60);
            const pulse = 0.5 + 0.5 * Math.sin((now / 1000) * Math.PI * 2 * breathHz * 0.55);
            const mistBoost = clipState === "lean_in" ? 0.12 : 0;
            const mist = ctx.createRadialGradient(
              w * 0.5,
              h * 0.9,
              10,
              w * 0.5,
              h * 0.9,
              h * (0.31 + pulse * 0.07 + mistBoost)
            );
            mist.addColorStop(0, `rgba(205, 232, 240, ${(0.22 + pulse * 0.1 + mistBoost).toFixed(3)})`);
            mist.addColorStop(1, "rgba(205, 232, 240, 0)");
            ctx.fillStyle = mist;
            ctx.fillRect(0, h * 0.42, w, h * 0.58);

            // Night 3 geomagnetic storm interference bands
            if (visitor.night === 3) {
              const bandY = ((now * 0.09) % (h + 60)) - 30;
              const aurora = ctx.createLinearGradient(0, 0, w, h * 0.45);
              aurora.addColorStop(0, "rgba(56, 189, 248, 0.08)");
              aurora.addColorStop(0.5, "rgba(168, 85, 247, 0.11)");
              aurora.addColorStop(1, "rgba(16, 185, 129, 0.05)");
              ctx.fillStyle = aurora;
              ctx.fillRect(0, 0, w, h * 0.48);

              ctx.fillStyle = "rgba(226, 232, 240, 0.12)";
              ctx.fillRect(0, bandY, w, 6);
              ctx.fillRect(0, (bandY + h * 0.47) % h, w, 2);
            }

            // Pupil Strobe Flash + Biometric Reticle HUD
            if (strobeAlphaRef.current > 0.01) {
              ctx.fillStyle = `rgba(235, 250, 255, ${strobeAlphaRef.current * 0.78})`;
              ctx.fillRect(0, 0, w, h);
              strobeAlphaRef.current *= 0.87;
            }
            if (now < strobeHudUntilRef.current && verdictState === "NONE") {
              const cx = w * 0.5;
              const cy = h * 0.36;
              const r = Math.min(w, h) * 0.11;
              ctx.strokeStyle = "rgba(125, 211, 252, 0.85)";
              ctx.lineWidth = 1.4;
              ctx.strokeRect(cx - r, cy - r * 0.58, r * 2, r * 1.16);
              ctx.beginPath();
              ctx.moveTo(cx - r - 8, cy);
              ctx.lineTo(cx - r + 6, cy);
              ctx.moveTo(cx + r - 6, cy);
              ctx.lineTo(cx + r + 8, cy);
              ctx.stroke();

              ctx.fillStyle = "rgba(125, 211, 252, 0.92)";
              ctx.font = "bold 10px monospace";
              ctx.textAlign = "left";
              ctx.fillText(
                visitor.night === 3 ? "OPTICAL // STORM NOISE" : "PUPIL LOCK // PHOTOMOTOR SCAN",
                cx - r,
                cy - r * 0.58 - 6
              );
            }

            // Neural Port FLIR Thermal HUD
            if (now < thermalHudUntilRef.current && verdictState === "NONE") {
              if (visitor.night === 3) {
                for (let s = 0; s < 28; s++) {
                  const sy = Math.random() * h;
                  ctx.fillStyle = `rgba(255, 120, 180, ${0.08 + Math.random() * 0.2})`;
                  ctx.fillRect(0, sy, w, 2 + Math.random() * 5);
                }
                ctx.fillStyle = "#fda4af";
                ctx.font = "bold 12px monospace";
                ctx.textAlign = "center";
                ctx.fillText("⚡ FLIR ARRAY SATURATED · GEOMAGNETIC STATIC", w / 2, h * 0.5);
              } else {
                const nx = w * 0.52;
                const ny = h * 0.56;
                const hotspot = ctx.createRadialGradient(nx, ny, 3, nx, ny, 34);
                hotspot.addColorStop(0, "rgba(255, 250, 190, 0.82)");
                hotspot.addColorStop(0.45, "rgba(249, 115, 22, 0.45)");
                hotspot.addColorStop(1, "rgba(249, 115, 22, 0)");
                ctx.fillStyle = hotspot;
                ctx.beginPath();
                ctx.arc(nx, ny, 34, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = "rgba(253, 224, 71, 0.9)";
                ctx.lineWidth = 1.3;
                ctx.beginPath();
                ctx.arc(nx, ny, 16, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = "#fde047";
                ctx.font = "bold 10px monospace";
                ctx.textAlign = "left";
                ctx.fillText("IR TARGET // CERVICAL NEURAL PORT", nx + 22, ny + 4);

                // Right-side FLIR scale bar
                const barGrad = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.78);
                barGrad.addColorStop(0, "#fef08a");
                barGrad.addColorStop(0.45, "#f97316");
                barGrad.addColorStop(0.8, "#9333ea");
                barGrad.addColorStop(1, "#1e1b4b");
                ctx.fillStyle = barGrad;
                ctx.fillRect(w - 22, h * 0.2, 7, h * 0.58);
                ctx.fillStyle = "#fde047";
                ctx.fillText("40°C", w - 52, h * 0.23);
                ctx.fillText("34°C", w - 52, h * 0.78);
              }
            }

            // Verdict Mechanical Shutter / Airlock Cryo-Steam
            if (verdictState === "PURGE") {
              shutterProgressRef.current = Math.min(1, shutterProgressRef.current + 0.08);
              const dropH = h * 0.88 * shutterProgressRef.current;

              ctx.fillStyle = "#110908";
              ctx.fillRect(0, 0, w, dropH);

              // Corrugated horizontal blast-door ribs
              ctx.strokeStyle = "rgba(42, 24, 20, 0.9)";
              ctx.lineWidth = 2;
              for (let ry = 18; ry < dropH; ry += 22) {
                ctx.beginPath();
                ctx.moveTo(0, ry);
                ctx.lineTo(w, ry);
                ctx.stroke();
              }

              const fire = ctx.createLinearGradient(0, h * 0.7, 0, h);
              fire.addColorStop(0, "rgba(239, 68, 68, 0.82)");
              fire.addColorStop(1, "rgba(245, 158, 11, 0.96)");
              ctx.fillStyle = fire;
              ctx.fillRect(0, h * 0.82, w, h * 0.18);

              ctx.fillStyle = "rgba(254, 215, 170, 0.88)";
              for (const e of embers) {
                e.y -= e.vy;
                if (e.y < 0.55) {
                  e.y = 0.98;
                  e.x = Math.random();
                }
                ctx.beginPath();
                ctx.arc(e.x * w, e.y * h, e.r, 0, Math.PI * 2);
                ctx.fill();
              }

              ctx.fillStyle = "#fecaca";
              ctx.font = "bold 13px monospace";
              ctx.textAlign = "center";
              ctx.fillText("CHAMBER PURGED · 1,100°C THERMAL STERILIZATION", w / 2, h * 0.46);
            } else if (verdictState === "ADMIT") {
              ctx.fillStyle = "rgba(16, 185, 129, 0.16)";
              ctx.fillRect(0, 0, w, h);

              const steam = ctx.createRadialGradient(w * 0.82, h * 0.65, 12, w * 0.7, h * 0.6, w * 0.55);
              steam.addColorStop(0, "rgba(236, 253, 245, 0.42)");
              steam.addColorStop(1, "rgba(16, 185, 129, 0)");
              ctx.fillStyle = steam;
              ctx.fillRect(0, 0, w, h);

              ctx.fillStyle = "#a7f3d0";
              ctx.font = "bold 13px monospace";
              ctx.textAlign = "center";
              ctx.fillText("INNER AIRLOCK UNSEALED · SUBJECT ADMITTED", w / 2, h * 0.48);
            }

            // Corner camera overlay badge
            ctx.fillStyle = "rgba(8, 15, 20, 0.68)";
            ctx.fillRect(12, 12, 168, 20);
            ctx.fillStyle = idleVideoReady ? "#34d399" : "#f59e0b";
            ctx.font = "10px monospace";
            ctx.textAlign = "left";
            ctx.fillText(
              idleVideoReady ? "● I2V LOOP ACTIVE" : "● PROC-CAM · ZERO-LIP",
              18,
              25
            );

            ctx.strokeStyle = "rgba(10, 17, 22, 0.94)";
            ctx.lineWidth = 12;
            ctx.strokeRect(0, 0, w, h);
          }
        }
      }
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [bpm, clipState, idleVideoReady, photoVisible, verdictState, visitor.night]);

  const idleCandidates = getVideoClipCandidates(visitor.id, "idle");
  const activeReactionCandidates =
    clipState !== "idle" ? getVideoClipCandidates(visitor.id, clipState) : [];
  const breathPeriodSec = (60 / Math.max(55, Math.min(150, bpm)) * 2.2).toFixed(2);

  return (
    <div className="viewport-frame" id="quarantine-viewport" data-clip-state={clipState}>
      <div
        className={`viewport-media-stage clip-${clipState} ${thermalActive ? "mode-thermal" : ""}`}
        style={{ ["--breath-period" as string]: `${breathPeriodSec}s` }}
      >
        {visitor.portraitUrl ? (
          <img
            src={visitor.portraitUrl}
            alt={visitor.name.en}
            className="viewport-photo"
            style={{ display: photoVisible && !idleVideoReady ? "block" : "none" }}
            onLoad={() => setPhotoVisible(true)}
            onError={() => setPhotoVisible(false)}
          />
        ) : null}

        <video
          key={`${visitor.id}-idle`}
          className="viewport-video"
          style={{ opacity: idleVideoReady ? 1 : 0 }}
          muted
          loop
          playsInline
          autoPlay
          onCanPlay={() => setIdleVideoReady(true)}
          onError={() => setIdleVideoReady(false)}
        >
          {idleCandidates.map((src) => (
            <source key={src} src={src} type={src.endsWith(".webm") ? "video/webm" : "video/mp4"} />
          ))}
        </video>

        {clipState !== "idle" ? (
          <video
            key={`${visitor.id}-${clipState}`}
            ref={reactionVideoRef}
            className="viewport-video reaction-layer"
            style={{ opacity: reactionVideoReady ? 1 : 0 }}
            muted
            playsInline
            autoPlay
            onCanPlay={() => setReactionVideoReady(true)}
            onEnded={() => {
              if (clipState !== "admit" && clipState !== "purge") {
                onClipComplete?.();
              }
            }}
            onError={() => setReactionVideoReady(false)}
          >
            {activeReactionCandidates.map((src) => (
              <source
                key={src}
                src={src}
                type={src.endsWith(".webm") ? "video/webm" : "video/mp4"}
              />
            ))}
          </video>
        ) : null}
      </div>

      <div className="viewport-scanlines" aria-hidden="true" />
      <canvas ref={canvasRef} className="viewport-canvas" />
    </div>
  );
}
