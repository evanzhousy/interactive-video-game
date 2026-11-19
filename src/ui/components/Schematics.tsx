import { useId } from "react";
import { SPECIALIST_LABELS, type SpecialistRole } from "../../game/economy.js";
import { tl } from "../../game/i18n.js";
import type { EndingId, Locale } from "../../game/types.js";

export function IsometricOutpostBanner({
  step,
  totalSteps
}: {
  step: number;
  totalSteps: number;
}) {
  const uid = useId().replace(/:/g, "");
  const surfaceActive = step <= 1;
  const gateActive = step === 2;
  const subActive = step >= 3;

  return (
    <div className="iso-banner-wrap">
      <svg
        aria-hidden="true"
        className="iso-outpost-svg"
        viewBox="0 0 680 132"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`${uid}-grid`} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M16 0H0v16" stroke="rgba(235,168,52,0.055)" strokeWidth="0.7" />
          </pattern>
          <pattern
            id={`${uid}-strata`}
            width="10"
            height="10"
            patternTransform="rotate(-32)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(158,198,212,0.07)" strokeWidth="1" />
          </pattern>
          <linearGradient id={`${uid}-ice`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(158,198,212,0.16)" />
            <stop offset="100%" stopColor="rgba(158,198,212,0.01)" />
          </linearGradient>
        </defs>

        <rect x="0.5" y="0.5" width="679" height="131" fill="#050709" stroke="rgba(198,176,138,0.24)" />
        <rect x="1" y="1" width="678" height="130" fill={`url(#${uid}-grid)`} />

        {/* Subterranean Glacial Strata Shading */}
        <path d="M44 54 L106 34 L176 48 L224 44 L224 130 L44 130 Z" fill={`url(#${uid}-ice)`} />
        <rect x="44" y="88" width="634" height="42" fill={`url(#${uid}-strata)`} />

        {/* Left Depth Elevation Scale (0M / -60 / -180) + Live Depth Pointer */}
        <g stroke="rgba(198,176,138,0.28)" strokeWidth="0.9">
          <line x1="38" y1="22" x2="38" y2="112" />
          <line x1="34" y1="36" x2="42" y2="36" />
          <line x1="34" y1="70" x2="42" y2="70" />
          <line x1="34" y1="104" x2="42" y2="104" />
        </g>
        <circle
          cx="38"
          cy={surfaceActive ? 36 : gateActive ? 70 : 104}
          r="2.4"
          fill="#eba834"
          className="svg-node-breathe"
        />
        <text x="31" y="39" textAnchor="end" fill="#6c7983" fontSize="7.5" fontFamily="monospace">
          0M
        </text>
        <text x="31" y="73" textAnchor="end" fill="#eba834" fontSize="7.5" fontFamily="monospace">
          -60
        </text>
        <text x="31" y="107" textAnchor="end" fill="#9ec6d4" fontSize="7.5" fontFamily="monospace">
          -180
        </text>

        {/* Zone 1: Surface Polar Ridge + Comms Mast */}
        <path
          d="M44 54 L106 34 L176 48 L212 43"
          stroke={surfaceActive ? "#eba834" : "rgba(158,198,212,0.58)"}
          strokeWidth="1.3"
        />
        <g>
          <path
            d="M84 41 V16 M77 20 H91 M80 26 H88"
            stroke={surfaceActive ? "#eba834" : "#9ec6d4"}
            strokeWidth="1.3"
          />
          <circle
            cx="84"
            cy="15"
            r="2.4"
            fill={surfaceActive ? "#eba834" : "#9ec6d4"}
            className="svg-node-breathe"
          />
          <path
            d="M93 11 Q100 15 93 19"
            className="svg-radar-wave"
            stroke={surfaceActive ? "#eba834" : "#9ec6d4"}
            strokeWidth="1.15"
          />
          <path
            d="M98 7 Q108 15 98 23"
            className="svg-radar-wave delayed"
            stroke={surfaceActive ? "#eba834" : "#9ec6d4"}
            strokeWidth="0.95"
          />
        </g>
        <path
          d="M48 25 L75 19 M45 34 L73 28"
          className="svg-wind-line"
          stroke="rgba(158,198,212,0.55)"
          strokeDasharray="6 4"
          strokeWidth="1"
        />
        <path
          d="M112 22 L156 16 M122 31 L168 25"
          className="svg-wind-line slow"
          stroke="rgba(158,198,212,0.34)"
          strokeDasharray="5 5"
          strokeWidth="0.9"
        />
        <text
          x="50"
          y="119"
          fill={surfaceActive ? "#eba834" : "#7e8c96"}
          fontSize="8.5"
          fontFamily="monospace"
          fontWeight={surfaceActive ? "700" : "400"}
        >
          SURFACE // -46°C POLAR SHELF
        </text>

        {/* Cable Tunnel: Surface -> Gate 0 (Base dashed + Glowing Traveling Beam) */}
        <path
          d="M198 46 L264 60"
          className="svg-signal-flow"
          stroke={surfaceActive || gateActive ? "rgba(235,168,52,0.52)" : "rgba(235,168,52,0.28)"}
          strokeWidth="1.1"
          strokeDasharray="5 4"
        />
        <path
          d="M198 46 L264 60"
          pathLength={100}
          className="svg-beam-travel"
          stroke="#f6bd54"
          strokeWidth="2"
        />

        {/* Zone 2: Gate-0 Isometric Blast Airlock Prism */}
        <g strokeWidth="1.2">
          <polygon
            points="332,96 402,72 332,110 262,72"
            fill="rgba(235,168,52,0.04)"
            stroke="rgba(198,176,138,0.18)"
            strokeWidth="0.8"
          />
          <polygon
            points="332,26 398,50 332,74 266,50"
            fill={gateActive ? "rgba(235,168,52,0.16)" : "rgba(235,168,52,0.07)"}
            stroke="#eba834"
          />
          <polygon
            points="266,50 332,74 332,102 266,78"
            fill="rgba(16,21,26,0.94)"
            stroke="rgba(198,176,138,0.52)"
          />
          <polygon
            points="398,50 332,74 332,102 398,78"
            fill="rgba(11,14,17,0.96)"
            stroke={gateActive ? "#f6bd54" : "rgba(235,168,52,0.65)"}
          />
          <line x1="278" y1="60" x2="278" y2="76" stroke="rgba(198,176,138,0.35)" strokeWidth="1" />
          <line x1="286" y1="63" x2="286" y2="79" stroke="rgba(198,176,138,0.35)" strokeWidth="1" />
          {/* Zero-Lip Blast Glass Partition with Animated Optical Shimmer */}
          <polygon
            points="332,34 332,92 362,81 362,23"
            fill="rgba(158,198,212,0.14)"
            stroke="#9ec6d4"
            strokeDasharray="2 2"
            className="svg-dash-slow"
          />
          <line
            x1="334"
            y1="38"
            x2="360"
            y2="29"
            className="svg-glass-sweep"
            stroke="rgba(158,198,212,0.72)"
            strokeWidth="1.6"
          />
          {/* Beacon Ping */}
          <polygon
            points="304,61 317,67 304,73 291,67"
            className="svg-beacon-ping"
            style={{ transformOrigin: "304px 67px" }}
            stroke="#eba834"
            strokeWidth="1"
          />
          <circle cx="304" cy="67" r="3.4" fill="#eba834" className="svg-node-breathe" />
        </g>
        <text
          x="332"
          y="120"
          textAnchor="middle"
          fill="#eba834"
          fontSize="8.8"
          fontFamily="monospace"
          fontWeight="700"
        >
          GATE-0 // AIRLOCK BOOTH
        </text>

        {/* Sub-glacial Elevator Shaft: Gate-0 -> Nautilus-0 */}
        <path
          d="M398 73 H460 L488 92"
          className="svg-signal-flow"
          stroke={subActive ? "rgba(73,184,130,0.65)" : "rgba(158,198,212,0.45)"}
          strokeWidth="1.2"
          strokeDasharray="5 3"
        />
        <path
          d="M398 73 H460 L488 92"
          pathLength={100}
          className="svg-beam-travel delay-1"
          stroke={subActive ? "#86e8b8" : "#9ec6d4"}
          strokeWidth="2"
        />
        <line x1="460" y1="73" x2="460" y2="92" stroke="rgba(158,198,212,0.28)" strokeDasharray="2 2" />

        {/* Zone 3: Nautilus-0 Sub-glacial Berth (Buoyant Hull Float + Sonar) */}
        <g transform="translate(492, 66)">
          <g className="svg-sub-bob">
            <path
              d="M4 18 Q-2 24 4 30"
              className="svg-sonar-arc"
              stroke={subActive ? "#49b882" : "#9ec6d4"}
              strokeWidth="1.15"
            />
            <path
              d="M-1 14 Q-9 24 -1 34"
              className="svg-sonar-arc delayed"
              stroke={subActive ? "#49b882" : "#9ec6d4"}
              strokeWidth="0.95"
            />
            <path
              d="M12 16 H116 L138 24 L116 32 H12 L4 24 Z"
              fill={subActive ? "rgba(73,184,130,0.16)" : "rgba(73,184,130,0.08)"}
              stroke={subActive ? "#49b882" : "rgba(158,198,212,0.72)"}
              strokeWidth="1.25"
            />
            <path
              d="M52 16 V7 H76 L81 16"
              stroke={subActive ? "#49b882" : "rgba(158,198,212,0.72)"}
              strokeWidth="1.2"
            />
            <line x1="60" y1="7" x2="60" y2="2" stroke="#9ec6d4" strokeWidth="1.1" />
            <circle cx="60" cy="2" r="1.4" fill="#eba834" className="svg-node-breathe" />
            <path d="M34 16 V32 M64 16 V32 M94 16 V32" stroke="rgba(158,198,212,0.34)" strokeWidth="1" />
            <path d="M140 17 V31 M134 24 H145" stroke="#eba834" strokeWidth="1.5" />
          </g>
        </g>
        <text
          x="564"
          y="119"
          textAnchor="middle"
          fill={subActive ? "#86e8b8" : "#9ec6d4"}
          fontSize="8.5"
          fontFamily="monospace"
          fontWeight={subActive ? "700" : "400"}
        >
          -180M // NAUTILUS-0 BERTH
        </text>

        {/* Top-Right Intake Sequence Nodes */}
        <g transform="translate(534, 12)">
          {Array.from({ length: totalSteps }, (_, i) => {
            const num = i + 1;
            const active = num === step;
            const done = num < step;
            const x = i * 44;
            return (
              <g key={num} transform={`translate(${x}, 0)`}>
                {i > 0 ? (
                  <line
                    x1="-14"
                    y1="9"
                    x2="0"
                    y2="9"
                    stroke={done || active ? "#eba834" : "rgba(198,176,138,0.28)"}
                    strokeWidth="1.2"
                  />
                ) : null}
                <rect
                  x="0"
                  y="0"
                  width="30"
                  height="18"
                  className={active ? "svg-node-breathe" : undefined}
                  fill={active ? "#eba834" : done ? "rgba(73,184,130,0.22)" : "#0b0e11"}
                  stroke={active ? "#eba834" : done ? "#49b882" : "rgba(198,176,138,0.35)"}
                />
                <text
                  x="15"
                  y="12"
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="700"
                  fill={active ? "#060809" : done ? "#86e8b8" : "#a2aeb6"}
                >
                  0{num}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export function ViewportHudOverlay({
  visitorId,
  night,
  bpm,
  clipState,
  verdictState
}: {
  visitorId: string;
  night: number;
  bpm: number;
  clipState: string;
  verdictState: "NONE" | "ADMIT" | "PURGE";
}) {
  const uid = useId().replace(/:/g, "");
  const highPulse = bpm >= 105;
  const elevatedPulse = bpm >= 84;
  const stateLabel = clipState.toUpperCase();
  const stateColor =
    verdictState === "PURGE"
      ? "#ff9c8f"
      : verdictState === "ADMIT"
        ? "#86e8b8"
        : highPulse
          ? "#eba834"
          : "#9ec6d4";
  const ecgPeriod = `${Math.max(0.75, (60 / Math.max(55, bpm)) * 1.6).toFixed(2)}s`;
  const bpmFillW = Math.round(Math.max(12, Math.min(100, ((bpm - 50) / 95) * 100)) * 1.46);
  const bpmBarColor = highPulse ? "#e04634" : elevatedPulse ? "#eba834" : "#49b882";

  return (
    <svg
      aria-hidden="true"
      className="viewport-hud-overlay"
      viewBox="0 0 640 360"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`${uid}-scan`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(235,168,52,0)" />
          <stop offset="86%" stopColor="rgba(235,168,52,0.09)" />
          <stop offset="100%" stopColor="rgba(235,168,52,0.34)" />
        </linearGradient>
      </defs>

      {/* Soft Feathered Phosphor Optical CRT Scan Ribbon */}
      <rect x="10" y="10" width="620" height="24" fill={`url(#${uid}-scan)`} className="svg-crt-scanbar" />

      {/* Optical Rangefinder Corner Brackets */}
      <g
        stroke={
          verdictState === "PURGE"
            ? "rgba(224,70,52,0.75)"
            : verdictState === "ADMIT"
              ? "rgba(73,184,130,0.72)"
              : "rgba(235,168,52,0.55)"
        }
        strokeWidth="1.25"
        fill="none"
      >
        <path d="M10 28 V10 H28" />
        <path d="M612 10 H630 V28" />
        <path d="M10 332 V350 H28" />
        <path d="M612 350 H630 V332" />
      </g>

      {/* Top & Bottom Center Optical Vernier Ticks */}
      <g stroke="rgba(198,176,138,0.28)" strokeWidth="0.9">
        <line x1="296" y1="12" x2="344" y2="12" />
        <line x1="320" y1="10" x2="320" y2="16" />
        <line x1="296" y1="348" x2="344" y2="348" />
        <line x1="320" y1="344" x2="320" y2="350" />
      </g>

      {/* Kinetic Optical Crosshair Reticle (Breathing Aperture + Flinch/Lean Reaction) */}
      <g
        className={`svg-reticle-cross clip-${clipState}`}
        style={{ transformOrigin: "320px 180px" }}
        stroke="rgba(158,198,212,0.34)"
        strokeWidth="0.95"
      >
        <g className="svg-reticle-breathe" style={{ transformOrigin: "320px 180px" }}>
          <line x1="304" y1="180" x2="313" y2="180" />
          <line x1="327" y1="180" x2="336" y2="180" />
          <line x1="320" y1="164" x2="320" y2="173" />
          <line x1="320" y1="187" x2="320" y2="196" />
          <rect
            x="313"
            y="173"
            width="14"
            height="14"
            fill="none"
            className="svg-dash-slow"
            strokeDasharray="3 3"
            stroke="rgba(235,168,52,0.32)"
          />
        </g>
      </g>

      {/* Left Vertical Cryo Scale with Oscillating Live Cryo Pointer */}
      <g stroke="rgba(158,198,212,0.44)" strokeWidth="1">
        <line x1="16" y1="108" x2="16" y2="252" />
        <line x1="16" y1="108" x2="23" y2="108" />
        <line x1="16" y1="144" x2="20" y2="144" />
        <line x1="16" y1="180" x2="24" y2="180" />
        <line x1="16" y1="216" x2="20" y2="216" />
        <line x1="16" y1="252" x2="23" y2="252" />
      </g>
      <polygon points="11,114 15,117 11,120" fill="#9ec6d4" className="svg-cryo-needle" />
      <text x="27" y="112" fill="rgba(158,198,212,0.82)" fontSize="8" fontFamily="monospace">
        -46°C
      </text>
      <text x="27" y="183" fill="rgba(158,198,212,0.52)" fontSize="7.5" fontFamily="monospace">
        00M
      </text>
      <text x="27" y="254" fill="rgba(108,121,131,0.85)" fontSize="8" fontFamily="monospace">
        EXT
      </text>

      {/* Night 3 Geomagnetic Interference HUD Badge */}
      {night === 3 ? (
        <g transform="translate(14, 316)">
          <rect
            x="0"
            y="0"
            width="148"
            height="18"
            className="svg-missing-bay"
            fill="rgba(28,8,8,0.82)"
            stroke="#e04634"
            strokeWidth="1"
          />
          <text x="8" y="12" fill="#ff9c8f" fontSize="8" fontFamily="monospace" fontWeight="700">
            [! MAG-STORM // EMI]
          </text>
        </g>
      ) : null}

      {/* Top-Right Live Biometric ECG Telemetry Widget */}
      <g transform="translate(466, 12)">
        <rect
          x="0"
          y="0"
          width="162"
          height="42"
          fill="rgba(6,8,9,0.82)"
          stroke={highPulse ? "rgba(224,70,52,0.7)" : "rgba(235,168,52,0.48)"}
          strokeWidth="1"
        />
        <polyline
          points="8,21 20,21 24,13 28,27 32,8 37,24 41,21 56,21"
          fill="none"
          stroke="rgba(235,168,52,0.22)"
          strokeWidth="1.2"
        />
        <polyline
          points="8,21 20,21 24,13 28,27 32,8 37,24 41,21 56,21"
          pathLength={100}
          className="svg-ecg-trace"
          style={{ ["--ecg-period" as string]: ecgPeriod }}
          fill="none"
          stroke={highPulse ? "#e04634" : "#eba834"}
          strokeWidth="1.6"
        />
        <text
          x="64"
          y="16"
          fill={highPulse ? "#ff9c8f" : "#e4e8eb"}
          fontSize="10"
          fontFamily="monospace"
          fontWeight="700"
        >
          {bpm} BPM
        </text>
        <text x="64" y="28" fill={stateColor} fontSize="8.5" fontFamily="monospace">
          {stateLabel}
        </text>
        {/* Live Stress / Pulse Gauge Strip */}
        <rect x="8" y="34" width="146" height="3.5" fill="rgba(198,176,138,0.14)" />
        <rect x="8" y="34" width={bpmFillW} height="3.5" fill={bpmBarColor} className="svg-node-breathe" />
      </g>

      {/* Compact Lens + Subject Stamp Below ECG Box */}
      <g transform="translate(466, 58)">
        <rect
          x="0"
          y="0"
          width="162"
          height="16"
          fill="rgba(6,8,9,0.72)"
          stroke="rgba(198,176,138,0.24)"
          strokeWidth="0.8"
        />
        <text x="8" y="11" fill="#a2aeb6" fontSize="8" fontFamily="monospace">
          {visitorId} // N{night} · ZERO-LIP GLASS
        </text>
      </g>
    </svg>
  );
}

export function Night5HudOverlay({
  gap,
  flinchActive = false,
  finalAction = "NONE",
  rebuttedCount = 0
}: {
  gap: number;
  flinchActive?: boolean;
  finalAction?: "NONE" | "PURGE" | "ADMIT" | "STEP_OUT";
  rebuttedCount?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const gapPct = Math.round(gap * 100);
  const accent =
    finalAction === "PURGE" || flinchActive
      ? "#e04634"
      : finalAction === "ADMIT"
        ? "#49b882"
        : "#eba834";

  return (
    <svg
      aria-hidden="true"
      className="viewport-hud-overlay"
      viewBox="0 0 640 360"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`${uid}-n5scan`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(158,198,212,0)" />
          <stop offset="85%" stopColor="rgba(158,198,212,0.09)" />
          <stop offset="100%" stopColor="rgba(235,168,52,0.34)" />
        </linearGradient>
      </defs>

      {/* Rolling Biometric Scan Ribbon */}
      <rect x="10" y="10" width="620" height="24" fill={`url(#${uid}-n5scan)`} className="svg-crt-scanbar" />

      {/* Optical Brackets */}
      <g stroke={accent} strokeOpacity="0.68" strokeWidth="1.3" fill="none">
        <path d="M10 28 V10 H28" />
        <path d="M612 10 H630 V28" />
        <path d="M10 332 V350 H28" />
        <path d="M612 350 H630 V332" />
      </g>

      {/* Top-Left Mirror Cam Stamp */}
      <g transform="translate(14, 14)">
        <rect
          x="0"
          y="0"
          width="174"
          height="20"
          fill="rgba(6,8,9,0.78)"
          stroke="rgba(158,198,212,0.38)"
          strokeWidth="0.9"
        />
        <circle cx="10" cy="10" r="3" fill={flinchActive ? "#e04634" : "#eba834"} className="svg-low-fuel-cell" />
        <text x="19" y="13" fill="#e4e8eb" fontSize="8.5" fontFamily="monospace" fontWeight="700">
          CAM-01 // MIRROR AUDIT
        </text>
      </g>

      {/* Breathing Facial Sync Lock Reticle */}
      <g
        className={`svg-reticle-cross ${flinchActive ? "clip-flinch" : ""}`}
        style={{ transformOrigin: "320px 158px" }}
      >
        <g className="svg-lock-breathe" style={{ transformOrigin: "320px 158px" }}>
          <path
            d="M276 120 H290 M276 120 V134 M364 120 H350 M364 120 V134 M276 196 H290 M276 196 V182 M364 196 H350 M364 196 V182"
            stroke={flinchActive ? "#e04634" : "rgba(158,198,212,0.56)"}
            strokeWidth="1.25"
            fill="none"
          />
          <line x1="312" y1="158" x2="328" y2="158" stroke="rgba(235,168,52,0.42)" strokeWidth="0.9" />
          <line x1="320" y1="150" x2="320" y2="166" stroke="rgba(235,168,52,0.42)" strokeWidth="0.9" />
        </g>
      </g>

      {/* Top-Right Facial Match & Dual-Phase SAY vs DO Sync Oscilloscope */}
      <g transform="translate(442, 12)">
        <rect
          x="0"
          y="0"
          width="186"
          height="54"
          fill="rgba(6,8,9,0.84)"
          stroke={flinchActive ? "#e04634" : "rgba(235,168,52,0.52)"}
          strokeWidth="1"
        />
        <text x="8" y="14" fill="#eba834" fontSize="9" fontFamily="monospace" fontWeight="700">
          FACIAL MATCH // 99.98%
        </text>
        <text x="8" y="26" fill="#9ec6d4" fontSize="7.8" fontFamily="monospace">
          SAY/DO GAP {gapPct}% · EXPOSED {rebuttedCount}
        </text>
        <line x1="8" y1="42" x2="178" y2="42" stroke="rgba(198,176,138,0.14)" strokeWidth="0.7" />
        {/* Moving Phase Scope Cursor */}
        <line
          x1="10"
          y1="33"
          x2="10"
          y2="50"
          className="svg-scope-cursor"
          stroke="rgba(235,168,52,0.52)"
          strokeWidth="1"
        />
        {/* Dual Sync Waveforms (Amber SAY vs Cyan DO) */}
        <path
          d="M8 42 Q22 36 36 42 T64 42 T92 42 T120 42 T148 42 T176 42"
          pathLength={100}
          className="svg-mirror-wave"
          stroke="#eba834"
          strokeWidth="1.25"
          fill="none"
        />
        <path
          d={
            gapPct > 15
              ? "M8 42 Q22 48 36 42 T64 42 T92 42 T120 42 T148 42 T176 42"
              : "M8 42 Q22 37 36 42 T64 42 T92 42 T120 42 T148 42 T176 42"
          }
          className="svg-signal-flow"
          stroke={flinchActive ? "#e04634" : "#9ec6d4"}
          strokeWidth="1.25"
          strokeDasharray="4 3"
          fill="none"
        />
      </g>

      {/* Bottom-Left External Frost Telemetry */}
      <text x="18" y="342" fill="rgba(158,198,212,0.72)" fontSize="8" fontFamily="monospace">
        EXT -46°C · SUBJECT: OP#09 DOUBLE
      </text>
    </svg>
  );
}

export function IsometricAirlockSchematic({
  verdictState,
  night,
  fuelLeft,
  powerLeft,
  maxPower
}: {
  verdictState: "NONE" | "ADMIT" | "PURGE";
  night: number;
  fuelLeft: number;
  powerLeft: number;
  maxPower: number;
}) {
  const uid = useId().replace(/:/g, "");
  const chamberColor =
    verdictState === "PURGE"
      ? "#e04634"
      : verdictState === "ADMIT"
        ? "#49b882"
        : "#eba834";

  const visibleFuelSlots = 5;
  const overflowFuel = Math.max(0, fuelLeft - visibleFuelSlots);
  const capSlots = Math.max(2, Math.min(4, maxPower));
  const tempLabel =
    verdictState === "PURGE" ? "1,100°C" : verdictState === "ADMIT" ? "+18°C" : "-12°C";
  const pressureLabel =
    verdictState === "PURGE" ? "VENT" : verdictState === "ADMIT" ? "EQUALIZED" : "101.3 kPa";

  return (
    <div className="iso-airlock-strip" id="iso-airlock-schematic">
      <svg
        aria-hidden="true"
        className="iso-airlock-svg"
        viewBox="0 0 540 78"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={`${uid}-purge`}
            width="6"
            height="6"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(224,70,52,0.55)" strokeWidth="2" />
          </pattern>
        </defs>

        <rect x="0.5" y="0.5" width="539" height="77" fill="#050709" stroke="rgba(198,176,138,0.22)" />

        {/* Zone 1: Spatial Isometric Airlock Chamber Mechanics */}
        <text x="10" y="15" fill="#7c8a94" fontSize="8.2" fontFamily="monospace">
          AIRLOCK // 00
        </text>
        <text x="10" y="27" fill="#9ec6d4" fontSize="7.5" fontFamily="monospace">
          {pressureLabel}
        </text>
        <text x="10" y="67" fill={chamberColor} fontSize="8.4" fontFamily="monospace" fontWeight="700">
          {verdictState === "NONE" ? "LOCK: SEALED" : verdictState === "ADMIT" ? "HATCH: OPEN" : "BURN: ACTIVE"}
        </text>

        {/* Exterior Cold Shelf Vector */}
        <path
          d="M14 44 H58"
          className="svg-wind-line"
          stroke="#9ec6d4"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
        <rect x="58" y="34" width="6" height="20" fill="#0b0e11" stroke="#6c7983" />

        {/* Isometric Airlock Chamber Prism */}
        <polygon
          points="120,12 168,26 120,40 72,26"
          className={verdictState === "PURGE" ? "svg-missing-bay" : undefined}
          fill={verdictState === "PURGE" ? `url(#${uid}-purge)` : "rgba(16,21,26,0.92)"}
          stroke={chamberColor}
          strokeWidth="1.15"
        />
        <polygon
          points="72,26 120,40 120,64 72,50"
          fill="rgba(11,14,17,0.92)"
          stroke="rgba(198,176,138,0.45)"
          strokeWidth="1"
        />
        <polygon
          points="168,26 120,40 120,64 168,50"
          fill="rgba(7,10,13,0.96)"
          stroke={chamberColor}
          strokeWidth="1.15"
        />

        {/* Animated Chamber Telemetry Scan Sweep when Sealed */}
        {verdictState === "NONE" ? (
          <line
            x1="84"
            y1="28"
            x2="156"
            y2="28"
            className="svg-chamber-scan"
            stroke="rgba(235,168,52,0.52)"
            strokeWidth="1.1"
          />
        ) : null}

        {/* Blast Glass Partition (Splits open cleanly on ADMIT) */}
        <line
          x1="168"
          y1="26"
          x2="168"
          y2={verdictState === "ADMIT" ? "34" : "56"}
          stroke="#9ec6d4"
          strokeWidth="2.3"
        />
        {verdictState === "ADMIT" ? (
          <line x1="168" y1="48" x2="168" y2="56" stroke="#9ec6d4" strokeWidth="2.3" />
        ) : null}

        {/* Subject Beacon & Sonar Pulse */}
        {verdictState === "NONE" ? (
          <polygon
            points="120,30 133,38 120,46 107,38"
            className="svg-beacon-ping"
            style={{ transformOrigin: "120px 38px" }}
            stroke={chamberColor}
            strokeWidth="1"
          />
        ) : null}
        <circle cx="120" cy="38" r="3.8" fill={chamberColor} className="svg-node-breathe" />

        {/* Thermal Purge Nozzles */}
        {verdictState === "PURGE" ? (
          <g className="svg-purge-jets" stroke="#e04634" strokeWidth="1.35">
            <line x1="108" y1="22" x2="108" y2="46" strokeDasharray="3 2" />
            <line x1="120" y1="20" x2="120" y2="48" strokeDasharray="3 2" />
            <line x1="132" y1="22" x2="132" y2="46" strokeDasharray="3 2" />
          </g>
        ) : null}

        {/* Booth OP#09 + Live PTT Bus Link */}
        <rect x="180" y="22" width="66" height="36" fill="#0b0e11" stroke="rgba(158,198,212,0.52)" />
        <circle cx="240" cy="28" r="2" fill={chamberColor} className="svg-node-breathe" />
        <text x="213" y="36" textAnchor="middle" fill="#e4e8eb" fontSize="8.5" fontFamily="monospace" fontWeight="700">
          OP #09
        </text>
        <text x="213" y="48" textAnchor="middle" fill={chamberColor} fontSize="7.6" fontFamily="monospace">
          {tempLabel}
        </text>

        {/* Directional Access Vector / PTT Carrier Beam */}
        {verdictState === "ADMIT" ? (
          <path
            d="M150 40 H177 M172 36 L178 40 L172 44"
            className="svg-admit-arrow"
            stroke="#49b882"
            strokeWidth="1.8"
          />
        ) : (
          <>
            <line
              x1="156"
              y1="40"
              x2="180"
              y2="40"
              className="svg-signal-flow"
              stroke="rgba(235,168,52,0.45)"
              strokeWidth="1.1"
              strokeDasharray="3 3"
            />
            <path
              d="M156 40 H180"
              pathLength={100}
              className="svg-beam-travel"
              stroke="#f6bd54"
              strokeWidth="1.8"
            />
          </>
        )}

        {/* Vertical Divider */}
        <line x1="258" y1="10" x2="258" y2="68" stroke="rgba(198,176,138,0.22)" />

        {/* Zone 2: Thermal Coil Canister Rack (Overflow-Safe + Live Staggered Thermal Shimmer) */}
        <text x="270" y="26" fill="#a2aeb6" fontSize="8.6" fontFamily="monospace" fontWeight="700">
          THERMAL RACK
        </text>
        {Array.from({ length: visibleFuelSlots }, (_, idx) => {
          const lit = idx < fuelLeft;
          const x = 352 + idx * 21;
          return (
            <polygon
              key={idx}
              className={
                lit
                  ? fuelLeft <= 1
                    ? "svg-low-fuel-cell"
                    : "svg-cell-breathe"
                  : undefined
              }
              style={lit && fuelLeft > 1 ? { animationDelay: `${(idx * 0.28).toFixed(2)}s` } : undefined}
              points={`${x + 3},14 ${x + 17},14 ${x + 14},30 ${x},30`}
              fill={lit ? (fuelLeft <= 1 ? "#eb7634" : "#eba834") : "#0d1115"}
              stroke={lit ? "#eba834" : "rgba(198,176,138,0.25)"}
            />
          );
        })}
        {overflowFuel > 0 ? (
          <g transform="translate(459, 14)">
            <rect
              x="0"
              y="0"
              width="24"
              height="16"
              className="svg-node-breathe"
              fill="rgba(235,168,52,0.18)"
              stroke="#eba834"
            />
            <text x="12" y="11" textAnchor="middle" fill="#eba834" fontSize="8.5" fontFamily="monospace" fontWeight="700">
              +{overflowFuel}
            </text>
          </g>
        ) : null}
        <text
          x="530"
          y="26"
          textAnchor="end"
          fill={fuelLeft === 0 ? "#ff9c8f" : "#eba834"}
          fontSize="9"
          fontFamily="monospace"
          fontWeight="700"
        >
          {fuelLeft} U
        </text>

        {/* Zone 3: Sensor Capacitor Bank (Live Charge Pulse) */}
        <text x="270" y="56" fill="#a2aeb6" fontSize="8.6" fontFamily="monospace" fontWeight="700">
          CAP BANK
        </text>
        {Array.from({ length: capSlots }, (_, idx) => {
          const lit = idx < powerLeft;
          const cellW = capSlots > 2 ? 22 : 30;
          const x = 352 + idx * (cellW + 6);
          return (
            <g key={idx} transform={`translate(${x}, 44)`}>
              <rect
                x="0"
                y="0"
                width={cellW}
                height="16"
                fill={lit ? "rgba(158,198,212,0.22)" : "#0d1115"}
                stroke={lit ? "#9ec6d4" : "rgba(224,70,52,0.48)"}
              />
              <rect
                x="4"
                y="5"
                width={cellW - 8}
                height="6"
                className={lit ? "svg-cell-breathe" : undefined}
                style={lit ? { animationDelay: `${(idx * 0.4).toFixed(2)}s` } : undefined}
                fill={lit ? "#9ec6d4" : "rgba(224,70,52,0.22)"}
              />
            </g>
          );
        })}
        <text
          x="530"
          y="56"
          textAnchor="end"
          fill={night === 3 || powerLeft === 0 ? "#ff9c8f" : "#9ec6d4"}
          fontSize="8.8"
          fontFamily="monospace"
          fontWeight="700"
        >
          {night === 3 ? "[! EMI STORM]" : `${powerLeft}/${maxPower} PWR`}
        </text>
      </svg>
    </div>
  );
}

export function CommsWaveformSvg({ active = false }: { active?: boolean }) {
  const heights = [4, 9, 6, 12, 7, 10, 5];
  return (
    <svg
      aria-hidden="true"
      className={`comms-waveform-svg ${active ? "active" : ""}`}
      width="32"
      height="14"
      viewBox="0 0 32 14"
      fill="none"
    >
      {heights.map((h, i) => {
        const y = (14 - h) / 2;
        return (
          <rect
            key={i}
            x={1 + i * 4.5}
            y={y}
            width="2.5"
            height={h}
            className="svg-waveform-bar"
            style={{
              transformOrigin: `${2.25 + i * 4.5}px 7px`,
              animationDelay: `${(i * 0.14).toFixed(2)}s`
            }}
            fill={active ? "#eba834" : "#9ec6d4"}
          />
        );
      })}
    </svg>
  );
}

export function PipelineFirewallSchematic({
  revealed,
  flashEnabled,
  hasPayload
}: {
  revealed: boolean;
  flashEnabled: boolean;
  hasPayload: boolean;
}) {
  return (
    <div className="pipeline-schematic-wrap">
      <svg
        aria-hidden="true"
        className="pipeline-schematic-svg"
        viewBox="0 0 460 94"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0.5" y="0.5" width="459" height="93" fill="#050709" stroke="rgba(198,176,138,0.22)" />

        {/* Stage 1: Axis Detection */}
        <rect
          x="10"
          y="18"
          width="72"
          height="42"
          fill="#0d1115"
          stroke={hasPayload ? "#eba834" : "rgba(198,176,138,0.38)"}
        />
        <circle cx="75" cy="24" r="2" fill={hasPayload ? "#eba834" : "#6c7983"} className="svg-node-breathe" />
        <text x="46" y="34" textAnchor="middle" fill="#eba834" fontSize="8" fontFamily="monospace" fontWeight="700">
          01 AXIS
        </text>
        <text x="46" y="48" textAnchor="middle" fill="#8b98a2" fontSize="7" fontFamily="monospace">
          INTENT
        </text>

        <line
          x1="82"
          y1="39"
          x2="104"
          y2="39"
          className="svg-signal-flow"
          stroke="rgba(235,168,52,0.45)"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
        <path d="M82 39 H104" pathLength={100} className="svg-beam-travel" stroke="#f6bd54" strokeWidth="2" />

        {/* Stage 2: Deterministic Stance */}
        <rect
          x="104"
          y="18"
          width="82"
          height="42"
          fill="#0d1115"
          stroke={hasPayload ? "#eba834" : "rgba(198,176,138,0.38)"}
        />
        <circle
          cx="179"
          cy="24"
          r="2"
          fill={hasPayload ? "#eba834" : "#6c7983"}
          className="svg-node-breathe"
          style={{ animationDelay: "0.4s" }}
        />
        <text x="145" y="34" textAnchor="middle" fill="#eba834" fontSize="8" fontFamily="monospace" fontWeight="700">
          02 STANCE
        </text>
        <text x="145" y="48" textAnchor="middle" fill="#8b98a2" fontSize="7" fontFamily="monospace">
          ORDAMOR v6
        </text>

        {/* Zero-Leakage Firewall Barrier with Active Vertical Inspection Laser */}
        <line
          x1="186"
          y1="39"
          x2="262"
          y2="39"
          className="svg-signal-flow"
          stroke="rgba(224,70,52,0.55)"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
        <path
          d="M186 39 H262"
          pathLength={100}
          className="svg-beam-travel delay-1"
          stroke="#ff9c8f"
          strokeWidth="2"
        />
        <rect
          x="198"
          y="7"
          width="52"
          height="64"
          fill="rgba(224,70,52,0.13)"
          stroke="#e04634"
          strokeWidth="1.2"
          strokeDasharray="3 2"
          className="svg-dash-slow"
        />
        <line
          x1="201"
          y1="14"
          x2="247"
          y2="14"
          className="svg-firewall-scan"
          stroke="rgba(255,156,143,0.75)"
          strokeWidth="1.4"
        />
        <text x="224" y="20" textAnchor="middle" fill="#ff9c8f" fontSize="7.4" fontFamily="monospace" fontWeight="700">
          FIREWALL
        </text>
        <text x="224" y="34" textAnchor="middle" fill="#e4e8eb" fontSize="6.8" fontFamily="monospace">
          STRIP
        </text>
        <text x="224" y="46" textAnchor="middle" fill="#ff9c8f" fontSize="6.6" fontFamily="monospace">
          HIDDEN
        </text>
        <text x="224" y="61" textAnchor="middle" fill={revealed ? "#eba834" : "#86e8b8"} fontSize="6.8" fontFamily="monospace" fontWeight="700">
          {revealed ? "DEBUG" : "SEALED"}
        </text>

        {/* Stage 3: Sanitized LLM Payload */}
        <rect x="262" y="18" width="82" height="42" fill="#0d1115" stroke="#9ec6d4" />
        <circle
          cx="337"
          cy="24"
          r="2"
          fill="#9ec6d4"
          className="svg-node-breathe"
          style={{ animationDelay: "0.8s" }}
        />
        <text x="303" y="34" textAnchor="middle" fill="#9ec6d4" fontSize="8" fontFamily="monospace" fontWeight="700">
          03 CLEAN
        </text>
        <text x="303" y="48" textAnchor="middle" fill="#8b98a2" fontSize="7" fontFamily="monospace">
          ZERO-LEAK
        </text>

        <line
          x1="344"
          y1="39"
          x2="366"
          y2="39"
          className="svg-signal-flow"
          stroke={flashEnabled ? "rgba(73,184,130,0.55)" : "rgba(158,198,212,0.55)"}
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
        <path
          d="M344 39 H366"
          pathLength={100}
          className="svg-beam-travel delay-2"
          stroke={flashEnabled ? "#86e8b8" : "#9ec6d4"}
          strokeWidth="2"
        />

        {/* Stage 5: Flash / Offline Fallback */}
        <rect
          x="366"
          y="18"
          width="84"
          height="42"
          fill={flashEnabled ? "rgba(73,184,130,0.12)" : "#0d1115"}
          stroke={flashEnabled ? "#49b882" : "rgba(198,176,138,0.45)"}
        />
        <circle
          cx="443"
          cy="24"
          r="2"
          fill={flashEnabled ? "#49b882" : "#eba834"}
          className="svg-node-breathe"
          style={{ animationDelay: "1.2s" }}
        />
        <text
          x="408"
          y="34"
          textAnchor="middle"
          fill={flashEnabled ? "#86e8b8" : "#e4e8eb"}
          fontSize="8"
          fontFamily="monospace"
          fontWeight="700"
        >
          05 OUTPUT
        </text>
        <text x="408" y="48" textAnchor="middle" fill="#8b98a2" fontSize="7" fontFamily="monospace">
          {flashEnabled ? "FLASH LIVE" : "0MS LOCAL"}
        </text>

        {/* Footer Rule Legend */}
        <text x="10" y="84" fill="#6c7983" fontSize="7.2" fontFamily="monospace">
          BOUNDARY // ENGINE ROLL NEVER CROSSES STAGE 02 -&gt; 03
        </text>
        <text x="450" y="84" textAnchor="end" fill={hasPayload ? "#eba834" : "#6c7983"} fontSize="7.2" fontFamily="monospace">
          {hasPayload ? "TRACE: ACTIVE" : "TRACE: STANDBY"}
        </text>
      </svg>
    </div>
  );
}

export function EndingConstellationSvg({
  unlockedEndings,
  lang
}: {
  unlockedEndings: ReadonlySet<EndingId>;
  lang: Locale;
}) {
  const nodes: Array<{
    id: EndingId;
    short: string;
    x: number;
    y: number;
    rail: "top" | "mid" | "bot";
  }> = [
    { id: "C", short: "C // BREACH", x: 320, y: 12, rail: "top" },
    { id: "B", short: "B // EXIT", x: 520, y: 12, rail: "top" },
    { id: "D", short: "D // WITNESS", x: 320, y: 44, rail: "mid" },
    { id: "A", short: "A // SURVIVOR", x: 520, y: 44, rail: "mid" },
    { id: "OPEN_PURGE", short: "OP·P // MASK", x: 320, y: 76, rail: "bot" },
    { id: "OPEN_ADMIT", short: "OP·A // DOUBLE", x: 520, y: 76, rail: "bot" },
    { id: "MIRROR", short: "MIR // 100%", x: 720, y: 76, rail: "bot" }
  ];

  const topLit = unlockedEndings.has("C") || unlockedEndings.has("B");
  const midLit = unlockedEndings.has("D") || unlockedEndings.has("A");
  const botLit =
    unlockedEndings.has("OPEN_PURGE") ||
    unlockedEndings.has("OPEN_ADMIT") ||
    unlockedEndings.has("MIRROR");

  return (
    <div className="ending-constellation-wrap" aria-label="Ending Branching Constellation">
      <svg
        aria-hidden="true"
        className="ending-constellation-svg"
        viewBox="0 0 920 108"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0.5" y="0.5" width="919" height="107" fill="#050709" stroke="rgba(198,176,138,0.22)" />

        {/* Root Node */}
        <rect x="14" y="34" width="128" height="40" fill="#10151a" stroke="#eba834" strokeWidth="1.2" />
        <circle cx="133" cy="41" r="2.2" fill="#eba834" className="svg-node-breathe" />
        <text x="78" y="51" textAnchor="middle" fill="#eba834" fontSize="9.5" fontFamily="monospace" fontWeight="700">
          N0–N4 // SHIFT
        </text>
        <text x="78" y="65" textAnchor="middle" fill="#9ec6d4" fontSize="8" fontFamily="monospace">
          {tl({ zh: "终局决策树", en: "AUDIT MATRIX", ja: "終局分岐網" }, lang)}
        </text>

        {/* Orthogonal PCB Branch Rails + Traveling Circuit Pulses */}
        <path
          d="M142 54 H186 V24 H320 M476 24 H520"
          className={topLit ? undefined : "svg-signal-flow"}
          stroke={topLit ? "rgba(224,70,52,0.72)" : "rgba(198,176,138,0.28)"}
          strokeWidth={topLit ? "1.5" : "1"}
          strokeDasharray={topLit ? undefined : "4 3"}
        />
        <path
          d="M142 54 H186 V24 H520"
          pathLength={100}
          className="svg-beam-travel"
          stroke={topLit ? "#ff9c8f" : "rgba(224,70,52,0.65)"}
          strokeWidth="1.8"
        />

        <path
          d="M142 54 H320 M476 54 H520"
          className={midLit ? undefined : "svg-signal-flow"}
          stroke={midLit ? "rgba(235,168,52,0.82)" : "rgba(198,176,138,0.28)"}
          strokeWidth={midLit ? "1.5" : "1"}
          strokeDasharray={midLit ? undefined : "4 3"}
        />
        <path
          d="M142 54 H520"
          pathLength={100}
          className="svg-beam-travel delay-1"
          stroke={midLit ? "#f6bd54" : "rgba(235,168,52,0.72)"}
          strokeWidth="1.8"
        />

        <path
          d="M142 54 H186 V88 H320 M476 88 H520 M676 88 H720"
          className={botLit ? undefined : "svg-signal-flow"}
          stroke={botLit ? "rgba(158,198,212,0.82)" : "rgba(198,176,138,0.28)"}
          strokeWidth={botLit ? "1.5" : "1"}
          strokeDasharray={botLit ? undefined : "4 3"}
        />
        <path
          d="M142 54 H186 V88 H720"
          pathLength={100}
          className="svg-beam-travel delay-2"
          stroke={botLit ? "#9ec6d4" : "rgba(158,198,212,0.62)"}
          strokeWidth="1.8"
        />

        {/* Branch Condition Labels */}
        <text x="196" y="20" fill="#7c8a94" fontSize="7.6" fontFamily="monospace">
          LEAK / STEP OUT
        </text>
        <text x="196" y="50" fill="#eba834" fontSize="7.6" fontFamily="monospace">
          CONFESS GAP
        </text>
        <text x="196" y="84" fill="#9ec6d4" fontSize="7.6" fontFamily="monospace">
          MASK / 0% GAP
        </text>

        {/* 7 Ending Sockets */}
        {nodes.map((node, idx) => {
          const on = unlockedEndings.has(node.id);
          return (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <rect
                x="0"
                y="0"
                width="156"
                height="24"
                className={on ? "svg-node-breathe" : undefined}
                style={on ? { animationDelay: `${(idx * 0.2).toFixed(1)}s` } : undefined}
                fill={on ? "#eba834" : "#0b0e11"}
                stroke={on ? "#eba834" : "rgba(198,176,138,0.34)"}
                strokeDasharray={on ? undefined : "3 2"}
                strokeWidth="1.1"
              />
              {on ? (
                <circle
                  cx="13"
                  cy="12"
                  r="5.5"
                  className="svg-beacon-ping"
                  style={{ transformOrigin: "13px 12px" }}
                  stroke="#060809"
                  strokeWidth="1"
                />
              ) : null}
              <circle
                cx="13"
                cy="12"
                r="3.2"
                fill={on ? "#060809" : "none"}
                stroke={on ? "#060809" : "#6c7983"}
                strokeWidth="1.2"
              />
              <text
                x="24"
                y="15"
                fill={on ? "#060809" : "#7f8d97"}
                fontSize="9"
                fontFamily="monospace"
                fontWeight="700"
              >
                {node.short}
              </text>
            </g>
          );
        })}

        {/* Summary Ratio Stamp on Right */}
        <g transform="translate(720, 12)">
          <rect x="0" y="0" width="182" height="54" fill="#0b0e11" stroke="rgba(235,168,52,0.38)" />
          <circle cx="171" cy="11" r="2.2" fill="#eba834" className="svg-node-breathe" />
          <text x="12" y="20" fill="#6c7983" fontSize="8" fontFamily="monospace">
            UNLOCKED ARCHIVE
          </text>
          <text x="12" y="42" fill="#eba834" fontSize="16" fontFamily="monospace" fontWeight="700">
            0{unlockedEndings.size} / 07
          </text>
        </g>
      </svg>
    </div>
  );
}

export function AchievementMedallionSvg({
  unlocked,
  index
}: {
  unlocked: boolean;
  index: number;
}) {
  const stroke = unlocked ? "#49b882" : "rgba(198,176,138,0.38)";
  const fill = unlocked ? "rgba(73,184,130,0.18)" : "#050709";
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      {unlocked ? (
        <circle
          cx="12"
          cy="12"
          r="10.8"
          className="svg-hex-orbit"
          style={{ transformOrigin: "12px 12px" }}
          stroke="rgba(73,184,130,0.55)"
          strokeWidth="0.9"
          strokeDasharray="3 3"
        />
      ) : null}
      <polygon
        points="12,2.5 20.5,7.2 20.5,16.8 12,21.5 3.5,16.8 3.5,7.2"
        className={!unlocked ? "svg-dash-slow" : undefined}
        fill={fill}
        stroke={stroke}
        strokeWidth="1.3"
        strokeDasharray={unlocked ? undefined : "2.5 2"}
      />
      {unlocked ? (
        <polygon
          points="12,6.5 16.5,12 12,17.5 7.5,12"
          fill="#49b882"
          className="svg-node-breathe"
        />
      ) : (
        <text
          x="12"
          y="15"
          textAnchor="middle"
          fill="#6c7983"
          fontSize="8.5"
          fontFamily="monospace"
          fontWeight="700"
        >
          0{index + 1}
        </text>
      )}
    </svg>
  );
}

export function IsometricLockedModule({
  id,
  tier,
  night,
  kind
}: {
  id: string;
  tier: 2 | 4;
  night: 2 | 4;
  kind: "crystal" | "boggart";
}) {
  const title = kind === "crystal" ? "MIND CRYSTAL ARCS" : "DISPOSAL SIG + TRAP";
  const accent = kind === "crystal" ? "#eba834" : "#e04634";
  return (
    <div className="iso-lock-card" id={id}>
      <svg aria-hidden="true" width="52" height="44" viewBox="0 0 52 44" fill="none">
        {/* Outer isometric wireframe lock cage with slow marching lock edges */}
        <polygon
          points="26,3 46,12 26,21 6,12"
          className="svg-dash-slow"
          stroke="rgba(198,176,138,0.5)"
          strokeDasharray="2 2"
        />
        <polygon points="6,12 26,21 26,40 6,31" stroke="rgba(198,176,138,0.32)" />
        <polygon points="46,12 26,21 26,40 46,31" stroke="rgba(235,168,52,0.42)" />
        {/* Mini scanner laser sweeping inside lock cage */}
        <line
          x1="10"
          y1="14"
          x2="42"
          y2="14"
          className="svg-mini-scan"
          stroke={accent}
          strokeOpacity="0.45"
          strokeWidth="1"
        />
        <g className="svg-iso-float">
          {kind === "crystal" ? (
            <polygon
              points="26,12 36,22 26,33 16,22"
              fill="rgba(235,168,52,0.16)"
              stroke="#eba834"
              strokeWidth="1.3"
            />
          ) : (
            <g stroke="#e04634" strokeWidth="1.3">
              <rect x="19" y="16" width="14" height="14" fill="rgba(224,70,52,0.14)" />
              <path d="M22 20 L30 26 M30 20 L22 26" />
            </g>
          )}
        </g>
      </svg>
      <div className="iso-lock-meta">
        <span className="iso-lock-code">
          LOCKED // TIER-0{tier} · N{night}
        </span>
        <span className="iso-lock-title">{title}</span>
      </div>
    </div>
  );
}

export function IsometricLeverGlyph({
  kind
}: {
  kind: "admit" | "purge" | "step_out";
}) {
  if (kind === "admit") {
    return (
      <svg aria-hidden="true" width="26" height="26" viewBox="0 0 26 26" fill="none" style={{ flexShrink: 0 }}>
        <polygon points="4,6 15,2 15,20 4,24" stroke="currentColor" strokeWidth="1.4" fill="rgba(73,184,130,0.15)" />
        <path
          className="svg-glyph-arrow"
          d="M12 13 H23 M19 9 L23.5 13 L19 17"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    );
  }
  if (kind === "purge") {
    return (
      <svg aria-hidden="true" width="26" height="26" viewBox="0 0 26 26" fill="none" style={{ flexShrink: 0 }}>
        <polygon points="13,3 23,8 13,13 3,8" stroke="currentColor" strokeWidth="1.4" fill="rgba(224,70,52,0.22)" />
        <path
          className="svg-nozzle-pulse"
          d="M8 14 V22 M13 15 V24 M18 14 V22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" width="26" height="26" viewBox="0 0 26 26" fill="none" style={{ flexShrink: 0 }}>
      <polygon
        points="5,5 21,5 21,21 5,21"
        className="svg-dash-slow"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="3 2"
      />
      <path
        className="svg-glyph-arrow"
        d="M9 13 H22 M18 9 L22.5 13 L18 17"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function NautilusSubSchematic({
  admittedHumans,
  requiredCrewCount,
  checkedRoles,
  rolesPresent,
  launchReady,
  lang
}: {
  admittedHumans: number;
  requiredCrewCount: number;
  checkedRoles: readonly SpecialistRole[];
  rolesPresent: readonly SpecialistRole[];
  launchReady: boolean;
  lang: Locale;
}) {
  const uid = useId().replace(/:/g, "");
  const bayWidth = checkedRoles.length > 0 ? Math.floor(316 / checkedRoles.length) - 8 : 96;

  return (
    <div className="sub-readiness-bar" id="n5-sub-readiness">
      <svg
        aria-hidden="true"
        className="nautilus-svg"
        viewBox="0 0 460 94"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={`${uid}-miss`}
            width="6"
            height="6"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(224,70,52,0.48)" strokeWidth="2" />
          </pattern>
        </defs>

        {/* Header Telemetry Strip (Fixed above buoyant hull) */}
        <text x="10" y="14" fill="#9ec6d4" fontSize="9.2" fontFamily="monospace" fontWeight="700">
          SUB // NAUTILUS-0 · -180M
        </text>
        <text
          x="450"
          y="14"
          textAnchor="end"
          fill={launchReady ? "#86e8b8" : "#ff9c8f"}
          fontSize="9.2"
          fontFamily="monospace"
          fontWeight="700"
        >
          {launchReady
            ? tl({ zh: "满编可启航", en: "LAUNCH READY", ja: "出航可能" }, lang)
            : tl({ zh: "船员缺编警报", en: "UNDERCREWED", ja: "要員不足" }, lang)}{" "}
          ({admittedHumans}/{requiredCrewCount})
        </text>

        {/* Buoyantly Floating Submarine Assembly */}
        <g className="svg-sub-bob">
          {/* Bow Sonar Sweep Arcs */}
          <path
            d="M15 49 Q9 58 15 67"
            className="svg-sonar-arc"
            stroke={launchReady ? "#49b882" : "#9ec6d4"}
            strokeWidth="1.2"
          />
          <path
            d="M9 45 Q1 58 9 71"
            className="svg-sonar-arc delayed"
            stroke={launchReady ? "#49b882" : "#9ec6d4"}
            strokeWidth="1"
          />

          {/* Submarine Pressure Hull + Inner Keel Contour */}
          <path
            d="M28 38 H378 L428 56 L378 78 H28 L12 58 Z"
            fill="#050709"
            stroke={launchReady ? "#49b882" : "rgba(224,70,52,0.75)"}
            strokeWidth="1.45"
          />
          <path
            d="M34 41 H374 L414 56 L374 75 H34"
            className="svg-dash-slow"
            stroke="rgba(198,176,138,0.18)"
            strokeWidth="0.9"
            strokeDasharray="4 4"
          />

          {/* Conning Tower & Pulsing Periscope Beacon */}
          <path
            d="M168 38 V18 H232 L242 38"
            fill="#0b0e11"
            stroke={launchReady ? "#49b882" : "#eba834"}
            strokeWidth="1.2"
          />
          <line x1="184" y1="18" x2="184" y2="9" stroke="#9ec6d4" strokeWidth="1.5" />
          <line x1="184" y1="9" x2="195" y2="9" stroke="#9ec6d4" strokeWidth="1.5" />
          <circle
            cx="196"
            cy="9"
            r="2"
            fill={launchReady ? "#49b882" : "#eba834"}
            className="svg-node-breathe"
          />

          {/* Stern Twin Fins & Cavitation Wake */}
          <path d="M432 44 V70 M422 56 H440" stroke="#eba834" strokeWidth="1.6" />
          {launchReady ? (
            <path
              d="M443 52 H456 M443 60 H456"
              className="svg-signal-flow"
              stroke="#49b882"
              strokeWidth="1.3"
              strokeDasharray="3 3"
            />
          ) : null}

          {/* Internal Specialist Bulkhead Bays with Role Emblems */}
          {checkedRoles.map((role, idx) => {
            const ok = rolesPresent.includes(role);
            const x = 44 + idx * (bayWidth + 8);
            const color = ok ? "#86e8b8" : "#ff9c8f";
            return (
              <g key={role} transform={`translate(${x}, 44)`}>
                <rect
                  className={!ok ? "svg-missing-bay" : undefined}
                  x="0"
                  y="0"
                  width={bayWidth}
                  height="28"
                  fill={ok ? "rgba(73,184,130,0.16)" : `url(#${uid}-miss)`}
                  stroke={ok ? "#49b882" : "#e04634"}
                  strokeDasharray={ok ? undefined : "3 2"}
                />
                {ok ? (
                  <circle
                    cx={bayWidth - 7}
                    cy="7"
                    r="2"
                    fill="#49b882"
                    className="svg-node-breathe"
                    style={{ animationDelay: `${(idx * 0.35).toFixed(2)}s` }}
                  />
                ) : null}
                {/* Role Mini Emblem */}
                <g stroke={color} strokeWidth="1.15" fill="none">
                  {role === "doctor" ? (
                    <path d="M12 10 V18 M8 14 H16" />
                  ) : role === "mechanic" ? (
                    <polygon points="12,9.5 16,12 16,16 12,18.5 8,16 8,12" />
                  ) : (
                    <circle cx="12" cy="14" r="4" />
                  )}
                </g>
                <text
                  x="21"
                  y="18"
                  fill={color}
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  {ok ? "✓" : "✕"} {tl(SPECIALIST_LABELS[role], lang)}
                </text>
              </g>
            );
          })}
        </g>

        {/* Keel Pressure Footer */}
        <text x="28" y="90" fill="#6c7983" fontSize="7.4" fontFamily="monospace">
          PRESSURE 19.2 ATM // HULL INTEGRITY 98%
        </text>
        <text x="378" y="90" textAnchor="end" fill="#6c7983" fontSize="7.4" fontFamily="monospace">
          BERTH LOCK: {launchReady ? "DISENGAGE READY" : "HOLD"}
        </text>
      </svg>

      {/* Accessible mirrored status pills */}
      <div className="visually-hidden">
        {checkedRoles.map((role) => {
          const ok = rolesPresent.includes(role);
          return (
            <span key={role} className={`role-pill ${ok ? "ok" : "missing"}`}>
              {ok ? "✓" : "✕"} {tl(SPECIALIST_LABELS[role], lang)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function IsometricCrisisGlyph({ crisisId }: { crisisId: string }) {
  return (
    <svg aria-hidden="true" width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ flexShrink: 0 }}>
      <g className="svg-iso-float">
        <polygon
          points="22,4 40,12 22,20 4,12"
          fill="rgba(235,168,52,0.14)"
          stroke="#eba834"
          strokeWidth="1.2"
        />
        <polygon points="4,12 22,20 22,38 4,30" stroke="rgba(198,176,138,0.45)" strokeWidth="1.1" />
        <polygon points="40,12 22,20 22,38 40,30" stroke="#eba834" strokeWidth="1.1" />
        {crisisId === "N2_SERUM" ? (
          <path d="M22 14 V29 M18 19 H26" className="svg-node-breathe" stroke="#9ec6d4" strokeWidth="2" />
        ) : crisisId === "N3_BRIBE" ? (
          <g stroke="#eba834" strokeWidth="1.5" className="svg-node-breathe">
            <rect x="14" y="21" width="6" height="10" />
            <rect x="24" y="21" width="6" height="10" />
          </g>
        ) : (
          <path
            d="M17 24 H27 V31 H17 Z M19 24 V20 A3 3 0 0 1 25 20 V24"
            className="svg-node-breathe"
            stroke="#ff9c8f"
            strokeWidth="1.4"
          />
        )}
      </g>
    </svg>
  );
}

export function ForensicContrastSchematic({ lang }: { lang: Locale }) {
  return (
    <div className="forensic-contrast-wrap">
      <svg
        aria-hidden="true"
        className="forensic-contrast-svg"
        viewBox="0 0 460 76"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0.5" y="0.5" width="459" height="75" fill="#050709" stroke="rgba(198,176,138,0.22)" />
        {/* Left Entry Node */}
        <rect x="10" y="20" width="84" height="36" fill="#0d1115" stroke="#eba834" strokeWidth="1.1" />
        <circle cx="87" cy="26" r="2" fill="#eba834" className="svg-node-breathe" />
        <text x="52" y="35" textAnchor="middle" fill="#eba834" fontSize="8" fontFamily="monospace" fontWeight="700">
          PTT PROBE
        </text>
        <text x="52" y="47" textAnchor="middle" fill="#9ec6d4" fontSize="7" fontFamily="monospace">
          {tl({ zh: "审讯对质", en: "CONFRONT", ja: "対立尋問" }, lang)}
        </text>

        {/* Dual Animated Branch Connectors + Glowing Traveling Signal Pulses */}
        <path
          d="M94 38 H122 V21 H146"
          className="svg-signal-flow"
          stroke="rgba(73,184,130,0.48)"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
        <path
          d="M94 38 H122 V21 H146"
          pathLength={100}
          className="svg-beam-travel"
          stroke="#86e8b8"
          strokeWidth="2"
        />

        <path
          d="M94 38 H122 V55 H146"
          className="svg-signal-flow"
          stroke="rgba(224,70,52,0.48)"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
        <path
          d="M94 38 H122 V55 H146"
          pathLength={100}
          className="svg-beam-travel delay-1"
          stroke="#ff9c8f"
          strokeWidth="2"
        />

        {/* Upper Branch: Human Match */}
        <rect x="146" y="9" width="184" height="24" fill="rgba(73,184,130,0.1)" stroke="#49b882" />
        <text x="155" y="24" fill="#86e8b8" fontSize="7.8" fontFamily="monospace" fontWeight="700">
          DO [o-N] {tl({ zh: "承认冷酷事实", en: "OWNS HARD FACTS", ja: "事実行動に一致" }, lang)}
        </text>
        <line x1="330" y1="21" x2="352" y2="21" stroke="rgba(73,184,130,0.5)" strokeWidth="1.2" />
        <path d="M330 21 H352" pathLength={100} className="svg-beam-travel delay-1" stroke="#86e8b8" strokeWidth="2" />
        <rect x="352" y="9" width="98" height="24" fill="#49b882" className="svg-cell-breathe" />
        <text x="401" y="24" textAnchor="middle" fill="#060809" fontSize="8" fontFamily="monospace" fontWeight="700">
          HUMAN // ADMIT
        </text>

        {/* Lower Branch: Mimic Self-Narrative */}
        <rect
          x="146"
          y="43"
          width="184"
          height="24"
          className="svg-dash-slow"
          fill="rgba(224,70,52,0.1)"
          stroke="#e04634"
          strokeDasharray="3 2"
        />
        <text x="155" y="58" fill="#ff9c8f" fontSize="7.8" fontFamily="monospace" fontWeight="700">
          SAY [0W] {tl({ zh: "复读体面台词", en: "ECHOES NEVERWON", ja: "建前語りを復唱" }, lang)}
        </text>
        <line x1="330" y1="55" x2="352" y2="55" stroke="rgba(224,70,52,0.5)" strokeWidth="1.2" />
        <path d="M330 55 H352" pathLength={100} className="svg-beam-travel delay-2" stroke="#ff9c8f" strokeWidth="2" />
        <rect
          x="352"
          y="43"
          width="98"
          height="24"
          fill="#e04634"
          className="svg-cell-breathe"
          style={{ animationDelay: "0.7s" }}
        />
        <text x="401" y="58" textAnchor="middle" fill="#060809" fontSize="8" fontFamily="monospace" fontWeight="700">
          MIMIC // PURGE
        </text>
      </svg>
    </div>
  );
}

export function StandbyVerdictSchematic({ lang }: { lang: Locale }) {
  return (
    <div className="standby-seal-box">
      <svg
        aria-hidden="true"
        className="standby-schematic-svg"
        viewBox="0 0 420 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0.5" y="0.5" width="419" height="119" fill="#050709" stroke="rgba(198,176,138,0.22)" />
        {/* Step 1: Isometric Lever Trigger */}
        <g transform="translate(20, 22)">
          <polygon
            points="36,4 68,18 36,32 4,18"
            className="svg-dash-slow"
            fill="rgba(235,168,52,0.1)"
            stroke="#eba834"
            strokeDasharray="3 2"
          />
          <polygon points="4,18 36,32 36,56 4,42" stroke="rgba(198,176,138,0.38)" />
          <polygon points="68,18 36,32 36,56 68,42" stroke="#eba834" />
          <circle cx="36" cy="32" r="3.4" fill="#eba834" className="svg-node-breathe" />
          <polygon
            points="36,24 46,32 36,40 26,32"
            className="svg-beacon-ping"
            style={{ transformOrigin: "36px 32px" }}
            stroke="#eba834"
            strokeWidth="1"
          />
          <text x="36" y="72" textAnchor="middle" fill="#eba834" fontSize="8" fontFamily="monospace" fontWeight="700">
            01 // LEVER
          </text>
        </g>

        <line
          x1="96"
          y1="52"
          x2="144"
          y2="52"
          className="svg-signal-flow"
          stroke="rgba(235,168,52,0.48)"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
        <path d="M96 52 H144" pathLength={100} className="svg-beam-travel" stroke="#f6bd54" strokeWidth="2" />

        {/* Step 2: Chord Overlay Compare with Animated Tracing Chords */}
        <g transform="translate(148, 22)">
          <rect x="0" y="6" width="112" height="48" fill="#0d1115" stroke="#9ec6d4" strokeDasharray="3 2" />
          <ellipse cx="56" cy="30" rx="34" ry="14" stroke="rgba(235,168,52,0.35)" />
          <path d="M28 36 Q56 14 84 26" pathLength={100} className="svg-chord-trace" stroke="#eba834" strokeWidth="1.6" />
          <path
            d="M28 24 Q56 42 84 34"
            pathLength={100}
            className="svg-chord-trace delay-1"
            stroke="#e04634"
            strokeWidth="1.4"
          />
          <text x="56" y="72" textAnchor="middle" fill="#9ec6d4" fontSize="8" fontFamily="monospace" fontWeight="700">
            02 // CHORD DIFF
          </text>
        </g>

        <line
          x1="264"
          y1="52"
          x2="306"
          y2="52"
          className="svg-signal-flow"
          stroke="rgba(158,198,212,0.48)"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
        <path d="M264 52 H306" pathLength={100} className="svg-beam-travel delay-1" stroke="#9ec6d4" strokeWidth="2" />

        {/* Step 3: Sign Shift Log with Sequential Writing Lines */}
        <g transform="translate(310, 22)">
          <rect x="0" y="6" width="90" height="48" fill="#0d1115" stroke="rgba(198,176,138,0.45)" />
          <line x1="12" y1="20" x2="78" y2="20" pathLength={100} className="svg-line-write" stroke="#eba834" strokeWidth="1.4" />
          <line
            x1="12"
            y1="30"
            x2="66"
            y2="30"
            pathLength={100}
            className="svg-line-write delay-1"
            stroke="rgba(198,176,138,0.62)"
            strokeWidth="1.1"
          />
          <line
            x1="12"
            y1="40"
            x2="54"
            y2="40"
            pathLength={100}
            className="svg-line-write delay-2"
            stroke="rgba(198,176,138,0.52)"
            strokeWidth="1.1"
          />
          <text x="45" y="72" textAnchor="middle" fill="#a2aeb6" fontSize="8" fontFamily="monospace" fontWeight="700">
            03 // SIGN DO
          </text>
        </g>

        <text x="210" y="111" textAnchor="middle" fill="#eba834" fontSize="8.2" fontFamily="monospace" fontWeight="700">
          {tl(
            {
              zh: "待命 // 拉动 [放行 / 净化] 闸门后解锁叠图比对",
              en: "AWAITING VERDICT // PULL [ADMIT | PURGE] TO UNLOCK DIFF",
              ja: "待機中 // [通過 / 焼却] レバー操作で差分照合を解除"
            },
            lang
          )}
        </text>
      </svg>
    </div>
  );
}

export function VerdictSealStamp({ correct }: { correct: boolean }) {
  const color = correct ? "#49b882" : "#e04634";
  const bg = correct ? "rgba(73,184,130,0.16)" : "rgba(224,70,52,0.16)";
  return (
    <svg
      aria-hidden="true"
      className="svg-stamp-in"
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <polygon
        points="10,2 22,2 30,10 30,22 22,30 10,30 2,22 2,10"
        className="svg-node-breathe"
        fill={bg}
        stroke={color}
        strokeWidth="1.4"
      />
      {correct ? (
        <path d="M9.5 16.5 L14 21 L22.5 11.5" stroke={color} strokeWidth="2.1" />
      ) : (
        <path d="M11 11 L21 21 M21 11 L11 21" stroke={color} strokeWidth="2.1" />
      )}
    </svg>
  );
}

export function BoggartTrapSchematic({ lang }: { lang: Locale }) {
  return (
    <div className="boggart-schematic-wrap">
      <svg
        aria-hidden="true"
        className="boggart-schematic-svg"
        viewBox="0 0 440 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0.5" y="0.5" width="439" height="49" fill="#050709" stroke="rgba(224,70,52,0.42)" />
        <rect x="8" y="10" width="112" height="30" fill="#0d1115" stroke="#eba834" />
        <text x="64" y="23" textAnchor="middle" fill="#eba834" fontSize="7.6" fontFamily="monospace" fontWeight="700">
          EXCUSE LOOP
        </text>
        <text x="64" y="34" textAnchor="middle" fill="#8b98a2" fontSize="6.8" fontFamily="monospace">
          {tl({ zh: "默认开脱剧本", en: "DEFAULT SCRIPT", ja: "既定の言い訳" }, lang)}
        </text>

        <line
          x1="120"
          y1="25"
          x2="152"
          y2="25"
          className="svg-signal-flow"
          stroke="rgba(224,70,52,0.52)"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
        <path d="M120 25 H152" pathLength={100} className="svg-beam-travel" stroke="#ff9c8f" strokeWidth="2" />

        <rect
          x="152"
          y="8"
          width="136"
          height="34"
          className="svg-dash-slow"
          fill="rgba(224,70,52,0.14)"
          stroke="#e04634"
          strokeDasharray="3 2"
        />
        <line
          x1="156"
          y1="12"
          x2="284"
          y2="12"
          className="svg-mini-scan"
          stroke="rgba(255,156,143,0.72)"
          strokeWidth="1.2"
        />
        <text x="220" y="22" textAnchor="middle" fill="#ff9c8f" fontSize="7.6" fontFamily="monospace" fontWeight="700">
          STRIP disposalRequires
        </text>
        <text x="220" y="34" textAnchor="middle" fill="#e4e8eb" fontSize="6.8" fontFamily="monospace">
          {tl({ zh: "拆掉退路前提 [BOGGART]", en: "REMOVE PREREQUISITE", ja: "逃げ道前提を剥奪" }, lang)}
        </text>

        <line
          x1="288"
          y1="25"
          x2="318"
          y2="25"
          className="svg-signal-flow"
          stroke="rgba(73,184,130,0.52)"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
        <path d="M288 25 H318" pathLength={100} className="svg-beam-travel delay-1" stroke="#86e8b8" strokeWidth="2" />

        <rect x="318" y="10" width="114" height="30" fill="rgba(73,184,130,0.12)" stroke="#49b882" />
        <circle cx="425" cy="16" r="1.9" fill="#49b882" className="svg-node-breathe" />
        <text x="375" y="23" textAnchor="middle" fill="#86e8b8" fontSize="7.6" fontFamily="monospace" fontWeight="700">
          SIG EXPOSURE
        </text>
        <text x="375" y="34" textAnchor="middle" fill="#a2aeb6" fontSize="6.8" fontFamily="monospace">
          {tl({ zh: "真活人变招 · 伪人卡死", en: "HUMAN ADAPTS / MIMIC LOOPS", ja: "人間は適応・擬態破綻" }, lang)}
        </text>
      </svg>
    </div>
  );
}

export function IsometricCrisisBanner({
  crisisId,
  fuelLeft
}: {
  crisisId: string;
  fuelLeft: number;
}) {
  const uid = useId().replace(/:/g, "");
  return (
    <div className="iso-banner-wrap">
      <svg
        aria-hidden="true"
        className="iso-outpost-svg"
        viewBox="0 0 680 104"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`${uid}-cgrid`} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M16 0H0v16" stroke="rgba(235,168,52,0.06)" strokeWidth="0.7" />
          </pattern>
        </defs>
        <rect x="0.5" y="0.5" width="679" height="103" fill="#050709" stroke="rgba(235,168,52,0.34)" />
        <rect x="1" y="1" width="678" height="102" fill={`url(#${uid}-cgrid)`} />

        {/* Left: Booth #09 Origin Block */}
        <g transform="translate(30, 18)">
          <polygon points="54,4 104,22 54,40 4,22" fill="rgba(235,168,52,0.1)" stroke="#eba834" />
          <polygon points="4,22 54,40 54,66 4,48" fill="#0d1115" stroke="rgba(198,176,138,0.45)" />
          <polygon points="104,22 54,40 54,66 104,48" fill="#080b0e" stroke="#eba834" />
          <circle cx="54" cy="11" r="2.2" fill="#eba834" className="svg-node-breathe" />
          <text x="54" y="25" textAnchor="middle" fill="#eba834" fontSize="8.5" fontFamily="monospace" fontWeight="700">
            BOOTH #09
          </text>
          <text x="54" y="79" textAnchor="middle" fill="#7c8a94" fontSize="7.6" fontFamily="monospace">
            FUEL: {fuelLeft} UNIT
          </text>
        </g>

        {/* Connecting Telemetry Conduit + Glowing Data Packet */}
        <path
          d="M142 52 H262"
          className="svg-signal-flow"
          stroke="rgba(235,168,52,0.52)"
          strokeWidth="1.4"
          strokeDasharray="6 4"
        />
        <path d="M142 52 H262" pathLength={100} className="svg-beam-travel" stroke="#f6bd54" strokeWidth="2.2" />

        {/* Center: Tailored Isometric Crisis Asset */}
        {crisisId === "N2_SERUM" ? (
          <g transform="translate(274, 14)">
            <rect x="0" y="6" width="136" height="66" fill="#0b1015" stroke="#9ec6d4" strokeWidth="1.2" />
            <circle
              cx="68"
              cy="39"
              r="18"
              className="svg-beacon-ping"
              style={{ transformOrigin: "68px 39px" }}
              stroke="#9ec6d4"
              strokeWidth="1"
            />
            <g className="svg-iso-float">
              <rect x="52" y="18" width="32" height="42" fill="rgba(158,198,212,0.16)" stroke="#9ec6d4" strokeWidth="1.4" />
              <path d="M68 28 V48 M59 38 H77" stroke="#86e8b8" strokeWidth="2.2" />
            </g>
            <text x="68" y="84" textAnchor="middle" fill="#9ec6d4" fontSize="8.2" fontFamily="monospace" fontWeight="700">
              CRYO-SERUM // VIAL-01
            </text>
          </g>
        ) : crisisId === "N3_BRIBE" ? (
          <g transform="translate(274, 14)">
            <rect x="0" y="6" width="136" height="66" fill="#120e09" stroke="#eba834" strokeWidth="1.2" />
            <g className="svg-iso-float">
              <polygon
                points="34,20 56,20 50,56 28,56"
                className="svg-cell-breathe"
                fill="rgba(235,168,52,0.28)"
                stroke="#eba834"
                strokeWidth="1.3"
              />
              <polygon
                points="68,20 90,20 84,56 62,56"
                className="svg-cell-breathe"
                style={{ animationDelay: "0.45s" }}
                fill="rgba(235,168,52,0.28)"
                stroke="#eba834"
                strokeWidth="1.3"
              />
              <text x="111" y="42" textAnchor="middle" fill="#eba834" fontSize="11" fontFamily="monospace" fontWeight="700">
                +2U
              </text>
            </g>
            <text x="68" y="84" textAnchor="middle" fill="#eba834" fontSize="8.2" fontFamily="monospace" fontWeight="700">
              FUEL CHUTE // DEPUTY OVERRIDE
            </text>
          </g>
        ) : (
          <g transform="translate(274, 14)">
            <rect x="0" y="6" width="136" height="66" fill="#130909" stroke="#e04634" strokeWidth="1.2" />
            <line
              x1="10"
              y1="14"
              x2="126"
              y2="14"
              className="svg-firewall-scan"
              stroke="rgba(255,156,143,0.68)"
              strokeWidth="1.3"
            />
            <g className="svg-iso-float">
              <rect x="44" y="28" width="48" height="30" fill="rgba(224,70,52,0.16)" stroke="#ff9c8f" strokeWidth="1.3" />
              <path d="M54 28 V20 A14 14 0 0 1 82 20 V28" stroke="#ff9c8f" strokeWidth="1.5" />
              <circle cx="68" cy="43" r="3.5" fill="#eba834" className="svg-node-breathe" />
            </g>
            <text x="68" y="84" textAnchor="middle" fill="#ff9c8f" fontSize="8.2" fontFamily="monospace" fontWeight="700">
              COMMAND VAULT // SEALED
            </text>
          </g>
        )}

        {/* Right: Night 5 Record Sink */}
        <path
          d="M418 52 H516"
          className="svg-signal-flow"
          stroke="rgba(158,198,212,0.52)"
          strokeWidth="1.3"
          strokeDasharray="5 3"
        />
        <path
          d="M418 52 H516"
          pathLength={100}
          className="svg-beam-travel delay-1"
          stroke="#9ec6d4"
          strokeWidth="2.2"
        />
        <g transform="translate(520, 22)">
          <rect x="0" y="0" width="132" height="58" fill="#0d1115" stroke="rgba(158,198,212,0.5)" />
          <circle cx="122" cy="10" r="2.5" fill="#e04634" className="svg-low-fuel-cell" />
          <text x="66" y="21" textAnchor="middle" fill="#9ec6d4" fontSize="8.4" fontFamily="monospace" fontWeight="700">
            ORD-OS // DO LOG
          </text>
          <text x="66" y="36" textAnchor="middle" fill="#eba834" fontSize="7.6" fontFamily="monospace">
            PERMANENT RECORD
          </text>
          <text x="66" y="49" textAnchor="middle" fill="#6c7983" fontSize="7.2" fontFamily="monospace">
            AUDITED ON NIGHT 5
          </text>
        </g>
      </svg>
    </div>
  );
}
