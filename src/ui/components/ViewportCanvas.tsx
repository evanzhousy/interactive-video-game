import { useEffect, useRef, useState } from "react";
import {
  getPhotorealFrameSrc,
  getVideoClipCandidates,
  getVisitorPreloadFrames,
  type ClipState
} from "../../game/media.js";
import type { VisitorSpec } from "../../game/types.js";
import { ViewportHudOverlay } from "./Schematics.js";

interface Props {
  visitor: VisitorSpec;
  clipState: ClipState;
  bpm: number;
  strobeTrigger: number;
  thermalTrigger: number;
  verdictState: "NONE" | "ADMIT" | "PURGE";
  motionPaused?: boolean;
  onClipComplete?: () => void;
}

export function ViewportCanvas({
  visitor,
  clipState,
  bpm,
  strobeTrigger,
  thermalTrigger,
  verdictState,
  motionPaused = false,
  onClipComplete
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const idleVideoRef = useRef<HTMLVideoElement | null>(null);
  const reactionVideoRef = useRef<HTMLVideoElement | null>(null);

  const strobeAlphaRef = useRef(0);
  const strobeHudUntilRef = useRef(0);
  const thermalHudUntilRef = useRef(0);

  const [idleVideoReady, setIdleVideoReady] = useState(false);
  const [reactionVideoReady, setReactionVideoReady] = useState(false);
  const [thermalActive, setThermalActive] = useState(false);

  const activeState: ClipState =
    verdictState === "PURGE" ? "purge" : verdictState === "ADMIT" ? "admit" : clipState;

  const idleFrameSrc = getPhotorealFrameSrc(visitor.id, "idle", visitor.portraitUrl);
  const activeReactionFrameSrc =
    activeState !== "idle"
      ? getPhotorealFrameSrc(visitor.id, activeState, visitor.portraitUrl)
      : null;

  const [retainedReactionSrc, setRetainedReactionSrc] = useState<string | null>(null);

  useEffect(() => {
    if (activeReactionFrameSrc) {
      setRetainedReactionSrc(activeReactionFrameSrc);
    }
  }, [activeReactionFrameSrc]);

  // Preload all 5 photorealistic AI frames (`idle`, `flinch`, `lean_in`, `admit`, `purge`) per visitor
  // and reset video readiness flags on visitor change.
  useEffect(() => {
    setIdleVideoReady(false);
    setReactionVideoReady(false);
    setThermalActive(false);
    setRetainedReactionSrc(null);

    if (typeof Image !== "undefined") {
      for (const src of getVisitorPreloadFrames(visitor.id, visitor.portraitUrl)) {
        const img = new Image();
        img.src = src;
      }
    }

    const idleVid = idleVideoRef.current;
    if (idleVid && idleVid.readyState >= 2) {
      setIdleVideoReady(true);
    }
  }, [visitor.id, visitor.portraitUrl]);

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

  // WCAG 2.2.2: Pause/resume ambient looping portrait videos when user pauses motion
  useEffect(() => {
    const videos = [idleVideoRef.current, reactionVideoRef.current];
    for (const vid of videos) {
      if (!vid) continue;
      try {
        if (motionPaused) {
          vid.pause();
        } else if (vid.paused) {
          void vid.play?.().catch?.(() => {});
        }
      } catch {
        // ignore in headless DOM
      }
    }
  }, [motionPaused, activeState, idleVideoReady, reactionVideoReady]);

  // Auto-return non-terminal kinetic clips (`flinch` / `lean_in`) back to `idle`
  useEffect(() => {
    setReactionVideoReady(false);
    if (activeState === "idle" || activeState === "admit" || activeState === "purge") {
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
    }, 3400);
    return () => clearTimeout(fallbackTimer);
  }, [activeState, visitor.id, onClipComplete]);

  useEffect(() => {
    const sleet = Array.from({ length: 28 }, () => ({
      x: Math.random(),
      y: Math.random(),
      len: 8 + Math.random() * 16,
      vx: 0.0035 + Math.random() * 0.0045,
      vy: 0.0055 + Math.random() * 0.0075
    }));

    const embers = Array.from({ length: 22 }, () => ({
      x: 0.18 + Math.random() * 0.64,
      y: 0.65 + Math.random() * 0.32,
      vy: 0.0035 + Math.random() * 0.0075,
      vx: (Math.random() - 0.5) * 0.002,
      r: 0.9 + Math.random() * 1.8
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

            // Subtle 1/48s shutter-blurred polar sleet wisps outside the double-glazed glass
            if (verdictState !== "PURGE") {
              ctx.strokeStyle =
                now < thermalHudUntilRef.current
                  ? "rgba(255, 190, 95, 0.14)"
                  : "rgba(212, 240, 250, 0.11)";
              ctx.lineWidth = 0.9;
              ctx.beginPath();
              for (const p of sleet) {
                p.x = (p.x + p.vx) % 1;
                p.y = (p.y + p.vy) % 1;
                const sx = p.x * w;
                const sy = p.y * h;
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx + p.len * 0.55, sy + p.len);
              }
              ctx.stroke();
            }

            // Subtle BPM-coupled cold breath condensation mist on lower glass pane
            if (verdictState === "NONE") {
              const breathHz = Math.max(0.9, bpm / 60);
              const pulse = 0.5 + 0.5 * Math.sin((now / 1000) * Math.PI * 2 * breathHz * 0.55);
              const mistBoost = activeState === "lean_in" ? 0.08 : 0;
              const mist = ctx.createRadialGradient(
                w * 0.5,
                h * 0.94,
                8,
                w * 0.5,
                h * 0.94,
                h * (0.26 + pulse * 0.05 + mistBoost)
              );
              mist.addColorStop(
                0,
                `rgba(205, 232, 240, ${(0.09 + pulse * 0.06 + mistBoost).toFixed(3)})`
              );
              mist.addColorStop(1, "rgba(205, 232, 240, 0)");
              ctx.fillStyle = mist;
              ctx.fillRect(0, h * 0.5, w, h * 0.5);
            }

            // Night 3 geomagnetic storm interference bands
            if (visitor.night === 3) {
              const bandY = ((now * 0.09) % (h + 60)) - 30;
              const aurora = ctx.createLinearGradient(0, 0, w, h * 0.45);
              aurora.addColorStop(0, "rgba(56, 189, 248, 0.06)");
              aurora.addColorStop(0.5, "rgba(168, 85, 247, 0.09)");
              aurora.addColorStop(1, "rgba(16, 185, 129, 0.04)");
              ctx.fillStyle = aurora;
              ctx.fillRect(0, 0, w, h * 0.48);

              ctx.fillStyle = "rgba(226, 232, 240, 0.09)";
              ctx.fillRect(0, bandY, w, 4);
              ctx.fillRect(0, (bandY + h * 0.47) % h, w, 1.5);
            }

            // Pupil Strobe Flash + Biometric Reticle HUD
            if (strobeAlphaRef.current > 0.01) {
              ctx.fillStyle = `rgba(235, 250, 255, ${strobeAlphaRef.current * 0.74})`;
              ctx.fillRect(0, 0, w, h);
              strobeAlphaRef.current *= 0.87;
            }
            if (now < strobeHudUntilRef.current && verdictState === "NONE") {
              const cx = w * 0.5;
              const cy = h * 0.34;
              const r = Math.min(w, h) * 0.11;
              ctx.strokeStyle = "rgba(125, 211, 252, 0.85)";
              ctx.lineWidth = 1.3;
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
                for (let s = 0; s < 24; s++) {
                  const sy = Math.random() * h;
                  ctx.fillStyle = `rgba(255, 120, 180, ${0.06 + Math.random() * 0.16})`;
                  ctx.fillRect(0, sy, w, 2 + Math.random() * 4);
                }
                ctx.fillStyle = "#fda4af";
                ctx.font = "bold 12px monospace";
                ctx.textAlign = "center";
                ctx.fillText("[! FLIR ARRAY SATURATED · GEOMAGNETIC STATIC]", w / 2, h * 0.5);
              } else {
                const nx = w * 0.52;
                const ny = h * 0.54;
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

            // Diegetic Optical Telemetry over Photorealistic Verdict Cinema Frames
            if (verdictState === "PURGE") {
              const flicker = 0.06 + 0.05 * Math.sin(now * 0.027);
              const glow = ctx.createLinearGradient(0, h * 0.55, 0, h);
              glow.addColorStop(0, "rgba(249, 115, 22, 0)");
              glow.addColorStop(1, `rgba(249, 115, 22, ${flicker.toFixed(3)})`);
              ctx.fillStyle = glow;
              ctx.fillRect(0, h * 0.55, w, h * 0.45);

              ctx.fillStyle = "rgba(254, 215, 170, 0.78)";
              for (const e of embers) {
                e.y -= e.vy;
                e.x += e.vx;
                if (e.y < 0.48) {
                  e.y = 0.96;
                  e.x = 0.2 + Math.random() * 0.6;
                }
                ctx.beginPath();
                ctx.arc(e.x * w, e.y * h, e.r, 0, Math.PI * 2);
                ctx.fill();
              }

              const bannerW = Math.min(w - 32, 390);
              ctx.fillStyle = "rgba(15, 7, 6, 0.78)";
              ctx.fillRect((w - bannerW) / 2, h - 38, bannerW, 24);
              ctx.strokeStyle = "rgba(248, 113, 113, 0.65)";
              ctx.lineWidth = 1;
              ctx.strokeRect((w - bannerW) / 2, h - 38, bannerW, 24);
              ctx.fillStyle = "#fecaca";
              ctx.font = "bold 11px monospace";
              ctx.textAlign = "center";
              ctx.fillText("CHAMBER PURGED · 1,100°C THERMAL STERILIZATION", w / 2, h - 22);
            } else if (verdictState === "ADMIT") {
              const bannerW = Math.min(w - 32, 360);
              ctx.fillStyle = "rgba(5, 20, 16, 0.76)";
              ctx.fillRect((w - bannerW) / 2, h - 38, bannerW, 24);
              ctx.strokeStyle = "rgba(52, 211, 153, 0.65)";
              ctx.lineWidth = 1;
              ctx.strokeRect((w - bannerW) / 2, h - 38, bannerW, 24);
              ctx.fillStyle = "#a7f3d0";
              ctx.font = "bold 11px monospace";
              ctx.textAlign = "center";
              ctx.fillText("INNER AIRLOCK UNSEALED · SUBJECT ADMITTED", w / 2, h - 22);
            }

            // Top-left surveillance camera REC telemetry badge
            const recBlink = Math.floor(now / 700) % 2 === 0;
            const streamActive = idleVideoReady || reactionVideoReady;
            ctx.fillStyle = "rgba(6, 12, 16, 0.66)";
            ctx.fillRect(12, 12, 186, 20);
            ctx.fillStyle = streamActive ? "#34d399" : recBlink ? "#ef4444" : "#7f1d1d";
            ctx.beginPath();
            ctx.arc(21, 22, 3.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = streamActive ? "#a7f3d0" : "#e2e8f0";
            ctx.font = "10px monospace";
            ctx.textAlign = "left";
            ctx.fillText(
              streamActive ? "CAM-01 // LIVE I2V STREAM" : "CAM-01 // 35MM AI LIVE",
              30,
              25
            );
          }
        }
      }
      const prefersReduced =
        typeof window !== "undefined" &&
        Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
      if (!motionPaused && !prefersReduced) {
        rafId = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [activeState, bpm, idleVideoReady, motionPaused, reactionVideoReady, verdictState, visitor.night]);

  const idleCandidates = getVideoClipCandidates(visitor.id, "idle");
  const activeReactionCandidates =
    activeState !== "idle" ? getVideoClipCandidates(visitor.id, activeState) : [];
  const breathPeriodSec = ((60 / Math.max(55, Math.min(150, bpm))) * 2.2).toFixed(2);
  const reactionPhotoOverlaySrc = activeReactionFrameSrc ?? retainedReactionSrc ?? idleFrameSrc;
  const showReactionPhoto = activeState !== "idle" && !reactionVideoReady;

  return (
    <div className="viewport-frame" id="quarantine-viewport" data-clip-state={activeState}>
      <div
        className={`viewport-media-stage clip-${activeState} ${thermalActive ? "mode-thermal" : ""}`}
        style={{ ["--breath-period" as string]: `${breathPeriodSec}s` }}
      >
        <img
          key={`${visitor.id}-idle-photo`}
          src={idleFrameSrc}
          alt={visitor.name.en}
          className="viewport-photo base-photo-layer"
          decoding="async"
        />

        <img
          key={`${visitor.id}-reaction-photo`}
          src={reactionPhotoOverlaySrc}
          alt={`${visitor.name.en} (${activeState})`}
          className={`viewport-photo reaction-photo-layer ${showReactionPhoto ? "is-visible" : ""}`}
          decoding="async"
        />

        <video
          key={`${visitor.id}-idle-video`}
          ref={idleVideoRef}
          className="viewport-video"
          style={{ opacity: idleVideoReady ? 1 : 0 }}
          muted
          loop
          playsInline
          autoPlay
          onLoadedData={() => setIdleVideoReady(true)}
          onCanPlay={() => setIdleVideoReady(true)}
          onError={() => setIdleVideoReady(false)}
        >
          {idleCandidates.map((src) => (
            <source key={src} src={src} type={src.endsWith(".webm") ? "video/webm" : "video/mp4"} />
          ))}
        </video>

        {activeState !== "idle" ? (
          <video
            key={`${visitor.id}-${activeState}-video`}
            ref={reactionVideoRef}
            className="viewport-video reaction-layer"
            style={{ opacity: reactionVideoReady ? 1 : 0 }}
            muted
            playsInline
            autoPlay
            onLoadedData={() => setReactionVideoReady(true)}
            onCanPlay={() => setReactionVideoReady(true)}
            onEnded={() => {
              if (activeState !== "admit" && activeState !== "purge") {
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
      <ViewportHudOverlay
        visitorId={visitor.id}
        night={visitor.night}
        bpm={bpm}
        clipState={activeState}
        verdictState={verdictState}
      />
      <canvas ref={canvasRef} className="viewport-canvas" />
    </div>
  );
}
