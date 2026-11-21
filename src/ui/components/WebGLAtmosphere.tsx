import { VFX, type ShaderPreset } from "@vfx-js/core";
import { useEffect, useRef } from "react";

let sharedVfxInstance: VFX | null | undefined;

function getSharedVfx(): VFX | null {
  if (typeof window === "undefined") return null;
  if (sharedVfxInstance !== undefined) return sharedVfxInstance;
  try {
    // Check real WebGL support before initializing VFX-JS (graceful no-op in happy-dom / mocked canvas)
    const testCanvas = document.createElement("canvas");
    const gl = testCanvas.getContext("webgl2") || testCanvas.getContext("webgl");
    if (!gl || typeof gl.getParameter !== "function" || !gl.getParameter(gl.VERSION)) {
      sharedVfxInstance = null;
      return null;
    }
    sharedVfxInstance = VFX.init({
      pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
      zIndex: 12,
      scrollPadding: false
    });
  } catch {
    sharedVfxInstance = null;
  }
  return sharedVfxInstance;
}

/**
 * Attaches a @vfx-js/core (fand/vfx-js) WebGL shader directly to a DOM element (e.g. GTA emblem or verdict stinger).
 * Uses `overlay: true` so crisp web fonts / CJK glyphs remain intact beneath the GPU shader pass.
 * Safely no-ops in headless/non-WebGL environments or when motion is paused.
 */
export function useVfxShader<T extends HTMLElement>(
  shader: ShaderPreset,
  enabled: boolean
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const vfx = getSharedVfx();
    if (!vfx) return;

    let active = true;
    void vfx.add(el, { shader, overlay: true }).catch(() => {
      // ignore WebGL capture edge cases
    });

    return () => {
      if (active) {
        active = false;
        try {
          vfx.remove(el);
        } catch {
          // ignore
        }
      }
    };
  }, [shader, enabled]);

  return ref;
}

const VERTEX_SHADER_SRC = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/**
 * Full-screen GPU Fragment Shader combining:
 * - Multi-layer drifting Arctic snowstorm & wind streaks
 * - Crystalline edge frost & mouse-reactive specular ice glint (inspired by frozen / canvas-ui Glass)
 * - Cardiac red-amber vignette pulse synced to BPM
 * - Night 3 geomagnetic VHS EMI static tear (inspired by canvas-ui VHS)
 * - FLIR thermal scanline wave (T), optical strobe flash (S), 1,100°C Purge Blaze embers, Admit Cryo wash
 * - Chromatic signal glitch tear on LLM fallback
 */
const FRAGMENT_SHADER_SRC = `
precision mediump float;
varying vec2 v_uv;

uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_frost;
uniform float u_storm;
uniform float u_thermal;
uniform float u_strobe;
uniform float u_purge;
uniform float u_admit;
uniform float u_glitch;
uniform float u_pulse;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v += amp * noise(p);
    p *= 2.04;
    amp *= 0.5;
  }
  return v;
}

float snowLayer(vec2 uv, float scale, float speed, float wind, float t) {
  vec2 p = uv * scale;
  p.x -= t * wind;
  p.y += t * speed;
  vec2 id = floor(p);
  vec2 f = fract(p) - 0.5;
  float n = hash21(id);
  vec2 offset = vec2(sin(n * 6.283 + t * 1.4) * 0.28, (fract(n * 17.3) - 0.5) * 0.45);
  float d = length(f - offset);
  float r = mix(0.03, 0.11, fract(n * 31.7));
  return smoothstep(r, r * 0.15, d) * step(0.68, n);
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_res.x / max(u_res.y, 1.0);
  vec2 uvAspect = vec2((uv.x - 0.5) * aspect + 0.5, uv.y);

  vec3 col = vec3(0.0);
  float alpha = 0.0;

  // 1. Multi-layer wind-driven Arctic snow flakes
  float s1 = snowLayer(uvAspect, 16.0, 0.65, 2.4, u_time);
  float s2 = snowLayer(uvAspect + vec2(3.1, 1.7), 28.0, 0.42, 1.5, u_time * 0.85);
  float s3 = snowLayer(uvAspect + vec2(7.4, 5.2), 44.0, 0.25, 0.9, u_time * 0.7);
  float snow = clamp(s1 * 0.55 + s2 * 0.35 + s3 * 0.25, 0.0, 1.0);
  col += vec3(0.76, 0.91, 0.96) * snow;
  alpha = max(alpha, snow * 0.32);

  // 2. Crystalline edge frost & mouse specular ice glint
  vec2 edgeDist = min(uv, 1.0 - uv);
  float edgeMask = 1.0 - smoothstep(0.0, 0.18, min(edgeDist.x * aspect * 0.65, edgeDist.y));
  float frostTex = fbm(uv * vec2(12.0 * aspect, 12.0) + vec2(u_time * 0.03, -u_time * 0.02));
  float frost = edgeMask * smoothstep(0.32, 0.78, frostTex) * u_frost;
  float mouseDist = length(uvAspect - vec2((u_mouse.x - 0.5) * aspect + 0.5, u_mouse.y));
  float glint = exp(-mouseDist * 5.2) * frost * 0.55;
  col += vec3(0.56, 0.79, 0.88) * frost * 0.42 + vec3(0.95, 0.78, 0.42) * glint;
  alpha = max(alpha, frost * 0.36);

  // 3. Subtle CRT phosphor scanlines & film grain
  float scan = sin(uv.y * u_res.y * 1.1) * 0.5 + 0.5;
  float grain = (hash21(uv * u_res + fract(u_time) * 191.0) - 0.5) * 0.07;
  alpha = max(alpha, scan * 0.045);
  col += vec3(grain);

  // 4. Cardiac high-BPM perimeter pulse
  if (u_pulse > 0.01) {
    float vig = smoothstep(0.36, 0.88, length((uv - 0.5) * vec2(aspect * 0.75, 1.05)));
    float beat = pow(0.5 + 0.5 * sin(u_time * 7.5), 3.0);
    float pulseGlow = vig * beat * u_pulse;
    col += vec3(0.88, 0.22, 0.15) * pulseGlow;
    alpha = max(alpha, pulseGlow * 0.38);
  }

  // 5. Night 3 geomagnetic storm VHS EMI static tears
  if (u_storm > 0.01) {
    float band = smoothstep(0.92, 0.99, sin(uv.y * 18.0 + u_time * 9.0) * sin(uv.y * 7.0 - u_time * 4.3));
    float staticNoise = hash21(vec2(floor(uv.y * 180.0), floor(u_time * 24.0)));
    float tear = band * step(0.45, staticNoise) * u_storm;
    col += vec3(0.95, 0.34, 0.26) * tear * 0.75 + vec3(0.45, 0.85, 0.95) * tear * 0.25;
    alpha = max(alpha, tear * 0.45);
  }

  // 6. FLIR Thermal sensor sweep wave (T)
  if (u_thermal > 0.01) {
    float sweepY = fract(u_time * 0.85);
    float scanLine = exp(-abs(uv.y - sweepY) * 42.0) * u_thermal;
    float heat = fbm(uv * 5.0 + vec2(0.0, u_time * 0.4)) * u_thermal;
    col += vec3(1.0, 0.55, 0.12) * scanLine * 0.95 + vec3(0.85, 0.18, 0.36) * heat * 0.35;
    alpha = max(alpha, max(scanLine * 0.55, heat * 0.25));
  }

  // 7. Optical Strobe flash shockwave (S)
  if (u_strobe > 0.01) {
    float rad = length((uv - 0.5) * vec2(aspect, 1.0));
    float ring = exp(-abs(rad - (1.0 - u_strobe) * 0.95) * 18.0) * u_strobe;
    col += vec3(0.86, 0.96, 1.0) * (u_strobe * 0.65 + ring * 0.9);
    alpha = max(alpha, clamp(u_strobe * 0.55 + ring * 0.5, 0.0, 0.82));
  }

  // 8. 1,100°C PURGE Furnace Blaze & rising ember sparks
  if (u_purge > 0.01) {
    float fireNoise = fbm(vec2(uv.x * 6.0 * aspect, uv.y * 4.5 - u_time * 2.6));
    float heatMask = smoothstep(0.15, 0.85, (1.0 - uv.y) * 0.85 + fireNoise * 0.55) * u_purge;
    float ember = snowLayer(uvAspect, 22.0, -1.8, 0.3, u_time * 1.3) * u_purge;
    col += vec3(0.95, 0.30, 0.10) * heatMask * 0.65 + vec3(1.0, 0.74, 0.24) * ember * 1.1;
    alpha = max(alpha, max(heatMask * 0.42, ember * 0.65));
  }

  // 9. ADMIT Cryo-steam decompression wash
  if (u_admit > 0.01) {
    float mist = fbm(vec2(uv.x * 4.0 * aspect - u_time * 0.4, uv.y * 4.0 + u_time * 0.6)) * u_admit;
    col += vec3(0.28, 0.82, 0.58) * mist * 0.55;
    alpha = max(alpha, mist * 0.34);
  }

  // 10. Signal glitch chromatic tear
  if (u_glitch > 0.01) {
    float bar = step(0.72, hash21(vec2(floor(uv.y * 32.0), floor(u_time * 30.0))));
    col += vec3(0.98, 0.32, 0.22) * bar * u_glitch * 0.85;
    alpha = max(alpha, bar * u_glitch * 0.48);
  }

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.86));
}
`;

export interface WebGLAtmosphereProps {
  mode: "lobby" | "booth" | "night5";
  night?: number;
  bpm?: number;
  strobeTrigger?: number;
  thermalTrigger?: number;
  verdictState?: "NONE" | "ADMIT" | "PURGE";
  signalGlitch?: boolean;
  motionPaused?: boolean;
}

export function WebGLAtmosphere({
  mode,
  night = 1,
  bpm = 76,
  strobeTrigger = 0,
  thermalTrigger = 0,
  verdictState = "NONE",
  signalGlitch = false,
  motionPaused = false
}: WebGLAtmosphereProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    mode,
    night,
    bpm,
    verdictState,
    signalGlitch,
    motionPaused,
    strobePower: 0,
    thermalPower: 0,
    glitchPower: 0,
    mouseX: 0.5,
    mouseY: 0.5
  });

  stateRef.current.mode = mode;
  stateRef.current.night = night;
  stateRef.current.bpm = bpm;
  stateRef.current.verdictState = verdictState;
  stateRef.current.signalGlitch = signalGlitch;
  stateRef.current.motionPaused = motionPaused;

  useEffect(() => {
    if (strobeTrigger > 0) stateRef.current.strobePower = 1.0;
  }, [strobeTrigger]);

  useEffect(() => {
    if (thermalTrigger > 0) stateRef.current.thermalPower = 1.0;
  }, [thermalTrigger]);

  useEffect(() => {
    if (signalGlitch) stateRef.current.glitchPower = 1.0;
  }, [signalGlitch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === "undefined") return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false });
    } catch {
      gl = null;
    }
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl!.createShader(type);
      if (!sh) return null;
      gl!.shaderSource(sh, src);
      gl!.compileShader(sh);
      if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(prog, "a_pos");
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uFrost = gl.getUniformLocation(prog, "u_frost");
    const uStorm = gl.getUniformLocation(prog, "u_storm");
    const uThermal = gl.getUniformLocation(prog, "u_thermal");
    const uStrobe = gl.getUniformLocation(prog, "u_strobe");
    const uPurge = gl.getUniformLocation(prog, "u_purge");
    const uAdmit = gl.getUniformLocation(prog, "u_admit");
    const uGlitch = gl.getUniformLocation(prog, "u_glitch");
    const uPulse = gl.getUniformLocation(prog, "u_pulse");

    const onResize = () => {
      // Render atmospheric frost/snow/blaze shader at 0.65x DPR for silky 60fps on Retina GPUs
      const dpr = Math.min(window.devicePixelRatio || 1, 1.0) * 0.65;
      canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
      gl!.viewport(0, 0, canvas.width, canvas.height);
    };
    const onPointerMove = (e: PointerEvent) => {
      stateRef.current.mouseX = e.clientX / Math.max(window.innerWidth, 1);
      stateRef.current.mouseY = 1.0 - e.clientY / Math.max(window.innerHeight, 1);
    };

    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    let rafId = 0;
    let lastTs = performance.now();
    let elapsed = 0;

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      const st = stateRef.current;
      if (!st.motionPaused) {
        elapsed += dt;
        st.strobePower = Math.max(0, st.strobePower - dt * 1.9);
        st.thermalPower = Math.max(0, st.thermalPower - dt * 0.28);
        st.glitchPower = Math.max(0, st.glitchPower - dt * 1.25);
      }

      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.useProgram(prog);
      gl!.enableVertexAttribArray(posLoc);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buf);
      gl!.vertexAttribPointer(posLoc, 2, gl!.FLOAT, false, 0, 0);

      gl!.uniform2f(uRes, canvas.width, canvas.height);
      gl!.uniform1f(uTime, elapsed);
      gl!.uniform2f(uMouse, st.mouseX, st.mouseY);
      gl!.uniform1f(uFrost, st.mode === "lobby" ? 0.92 : 0.72);
      gl!.uniform1f(uStorm, st.night === 3 && st.mode === "booth" ? 1.0 : 0.0);
      gl!.uniform1f(uThermal, st.thermalPower);
      gl!.uniform1f(uStrobe, st.strobePower);
      gl!.uniform1f(uPurge, st.verdictState === "PURGE" ? 1.0 : 0.0);
      gl!.uniform1f(uAdmit, st.verdictState === "ADMIT" ? 1.0 : 0.0);
      gl!.uniform1f(uGlitch, st.glitchPower);
      gl!.uniform1f(uPulse, st.mode === "booth" && st.night !== 3 && st.bpm >= 102 ? Math.min(1, (st.bpm - 98) / 35) : 0.0);

      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      gl!.deleteProgram(prog);
      gl!.deleteShader(vs);
      gl!.deleteShader(fs);
      gl!.deleteBuffer(buf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="webgl-atmosphere-canvas"
      id="webgl-atmosphere"
      aria-hidden="true"
    />
  );
}
