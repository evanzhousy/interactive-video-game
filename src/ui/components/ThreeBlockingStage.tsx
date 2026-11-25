import { Button } from "@ui-sdk/react/button";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { tl } from "../../game/i18n.js";
import {
  resolveAssetByTag,
  type CameraBlocking3D,
  type StoryboardShot,
  type WhiteboxRenderMode
} from "../../game/production-board.js";
import {
  createOutpostWhiteboxSet,
  rebuildShotBlockingRig,
  renderShotWhiteboxSnapshot,
  type OutpostSceneHandles
} from "../../game/three-whitebox-renderer.js";
import type { Locale } from "../../game/types.js";

export interface CapturedShotFrame {
  clayDataUrl: string | null;
  depthDataUrl: string | null;
  litDataUrl: string | null;
  cameraOverride: CameraBlocking3D;
  capturedAt: number;
}

interface Props {
  shot: StoryboardShot;
  lang: Locale;
  motionPaused: boolean;
  cameraOverride?: CameraBlocking3D;
  onChangeCameraOverride?: (shotId: string, nextCam: CameraBlocking3D) => void;
  onCaptureToStoryboard?: (shotId: string, frame: CapturedShotFrame) => void;
}

type ViewMode = "orbit" | "pov";

const ALERT_COLORS: Record<"amber" | "red" | "cyan", number> = {
  amber: 0xeba834,
  red: 0xe04634,
  cyan: 0x5bbad5
};

const LENS_PRESETS: ReadonlyArray<{ mm: number; fov: number; lensLabel: string }> = [
  { mm: 24, fov: 73, lensLabel: "24mm Anamorphic" },
  { mm: 35, fov: 54, lensLabel: "35mm Anamorphic" },
  { mm: 50, fov: 39, lensLabel: "50mm Anamorphic" },
  { mm: 65, fov: 31, lensLabel: "65mm Anamorphic" },
  { mm: 85, fov: 24, lensLabel: "85mm Anamorphic" }
];

const AXIS_CONFIG = [
  { key: "X", idx: 0, min: -10, max: 12, step: 0.1 },
  { key: "Y", idx: 1, min: 0.1, max: 6, step: 0.05 },
  { key: "Z", idx: 2, min: -9, max: 9, step: 0.1 }
] as const;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function cloneCamera(cam: CameraBlocking3D): CameraBlocking3D {
  return {
    ...cam,
    pos: [cam.pos[0], cam.pos[1], cam.pos[2]],
    target: [cam.target[0], cam.target[1], cam.target[2]]
  };
}

function clearGroup(grp: THREE.Group): void {
  while (grp.children.length > 0) {
    const ch = grp.children[0];
    if (!ch) break;
    grp.remove(ch);
    ch.traverse((obj) => {
      if (
        obj instanceof THREE.Mesh ||
        obj instanceof THREE.LineSegments ||
        obj instanceof THREE.Line ||
        obj instanceof THREE.Points
      ) {
        obj.geometry?.dispose?.();
        const m = obj.material;
        if (Array.isArray(m)) m.forEach((mm) => mm.dispose?.());
        else m?.dispose?.();
      }
    });
  }
}

export function ThreeBlockingStage({
  shot,
  lang,
  motionPaused,
  cameraOverride,
  onChangeCameraOverride,
  onCaptureToStoryboard
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  const [renderMode, setRenderMode] = useState<WhiteboxRenderMode>("clay");
  const [viewMode, setViewMode] = useState<ViewMode>("orbit");
  const [showSafeFrame, setShowSafeFrame] = useState(true);
  const [webglReady, setWebglReady] = useState(true);
  const [captureSynced, setCaptureSynced] = useState(false);
  const [localCamOverride, setLocalCamOverride] = useState<CameraBlocking3D | undefined>(cameraOverride);

  useEffect(() => {
    setLocalCamOverride(cameraOverride);
  }, [shot.id, cameraOverride]);

  const effectiveCam: CameraBlocking3D = localCamOverride ?? shot.blocking.camera;

  const renderModeRef = useRef<WhiteboxRenderMode>(renderMode);
  renderModeRef.current = renderMode;
  const viewModeRef = useRef<ViewMode>(viewMode);
  viewModeRef.current = viewMode;
  const motionPausedRef = useRef(motionPaused);
  motionPausedRef.current = motionPaused;
  const activeShotRef = useRef(shot);
  activeShotRef.current = shot;
  const effectiveCamRef = useRef<CameraBlocking3D>(effectiveCam);
  effectiveCamRef.current = effectiveCam;

  const orbitRef = useRef({
    yaw: -0.68,
    pitch: 0.42,
    distance: 9.2,
    dragging: false,
    lastX: 0,
    lastY: 0
  });

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const outpostHandlesRef = useRef<OutpostSceneHandles | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const camRigGroupRef = useRef<THREE.Group | null>(null);
  const syncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const mount = canvasMountRef.current;
    if (!host || !mount) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      const testCanvas = document.createElement("canvas");
      const gl = testCanvas.getContext("webgl2") || testCanvas.getContext("webgl");
      if (!gl) {
        setWebglReady(false);
        return;
      }
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance"
      });
    } catch {
      setWebglReady(false);
      return;
    }

    setWebglReady(true);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x03070b, 1);
    const initW = Math.max(320, host.clientWidth || 720);
    const initH = Math.max(260, host.clientHeight || 420);
    renderer.setSize(initW, initH);
    renderer.domElement.className = "three-blocking-canvas";
    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, initW / initH, 0.25, 24);

    const outpostHandles = createOutpostWhiteboxSet(scene);
    outpostHandles.applyRenderMode(renderModeRef.current);

    const dynamicGroup = new THREE.Group();
    const camRigGroup = new THREE.Group();
    scene.add(dynamicGroup);
    scene.add(camRigGroup);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    outpostHandlesRef.current = outpostHandles;
    dynamicGroupRef.current = dynamicGroup;
    camRigGroupRef.current = camRigGroup;

    const resizeObs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(280, Math.round(entry.contentRect.width));
        const h = Math.max(240, Math.round(entry.contentRect.height));
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer?.setSize(w, h);
      }
    });
    resizeObs.observe(host);

    const domEl = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      if (viewModeRef.current !== "orbit") return;
      orbitRef.current.dragging = true;
      orbitRef.current.lastX = e.clientX;
      orbitRef.current.lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!orbitRef.current.dragging || viewModeRef.current !== "orbit") return;
      const dx = e.clientX - orbitRef.current.lastX;
      const dy = e.clientY - orbitRef.current.lastY;
      orbitRef.current.lastX = e.clientX;
      orbitRef.current.lastY = e.clientY;
      orbitRef.current.yaw -= dx * 0.008;
      orbitRef.current.pitch = Math.max(0.12, Math.min(1.25, orbitRef.current.pitch + dy * 0.007));
    };
    const onPointerUp = () => {
      orbitRef.current.dragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      if (viewModeRef.current !== "orbit") return;
      e.preventDefault();
      orbitRef.current.distance = Math.max(
        3.5,
        Math.min(16, orbitRef.current.distance + e.deltaY * 0.006)
      );
    };

    domEl.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    domEl.addEventListener("wheel", onWheel, { passive: false });

    let rafId = 0;
    const lookTarget = new THREE.Vector3(0, 1.2, 0);
    const desiredCamPos = new THREE.Vector3();
    const desiredTarget = new THREE.Vector3();

    const animate = () => {
      const curShot = activeShotRef.current;
      const curCam = effectiveCamRef.current;
      const snowAttr = outpostHandles.snowPosAttr;

      if (!motionPausedRef.current && snowAttr) {
        for (let i = 0; i < snowAttr.count; i++) {
          const nx = snowAttr.getX(i) + 0.022;
          const ny = snowAttr.getY(i) - 0.009;
          snowAttr.setX(i, nx > 4.75 ? -4.75 : nx);
          snowAttr.setY(i, ny < 0 ? 3.4 : ny);
        }
        snowAttr.needsUpdate = true;
      }

      if (viewModeRef.current === "pov") {
        camRigGroup.visible = false;
        const [cx, cy, cz] = curCam.pos;
        const [tx, ty, tz] = curCam.target;
        desiredCamPos.set(cx, cy, cz);
        desiredTarget.set(tx, ty, tz);
        const lerpAlpha = motionPausedRef.current ? 1 : 0.16;
        camera.position.lerp(desiredCamPos, lerpAlpha);
        lookTarget.lerp(desiredTarget, lerpAlpha);
        if (Math.abs(camera.fov - curCam.fov) > 0.15) {
          camera.fov += (curCam.fov - camera.fov) * (motionPausedRef.current ? 1 : 0.22);
          camera.updateProjectionMatrix();
        }
        camera.lookAt(lookTarget);
      } else {
        camRigGroup.visible = true;
        const { yaw, pitch, distance } = orbitRef.current;
        if (curShot.blocking.zone === "inner_corridor") {
          desiredTarget.set(5.4, 1.2, -0.4);
        } else {
          desiredTarget.set(0.2, 1.15, 0.1);
        }
        desiredCamPos.set(
          desiredTarget.x + Math.sin(yaw) * Math.cos(pitch) * distance,
          desiredTarget.y + Math.sin(pitch) * distance,
          desiredTarget.z + Math.cos(yaw) * Math.cos(pitch) * distance
        );
        const lerpAlpha = motionPausedRef.current ? 1 : 0.16;
        camera.position.lerp(desiredCamPos, lerpAlpha);
        lookTarget.lerp(desiredTarget, lerpAlpha);
        if (Math.abs(camera.fov - 48) > 0.15) {
          camera.fov += (48 - camera.fov) * (motionPausedRef.current ? 1 : 0.18);
          camera.updateProjectionMatrix();
        }
        camera.lookAt(lookTarget);
      }

      renderer?.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObs.disconnect();
      domEl.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      domEl.removeEventListener("wheel", onWheel);

      clearGroup(dynamicGroup);
      clearGroup(camRigGroup);
      outpostHandles.dispose();
      renderer?.dispose();
      domEl.remove();

      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      outpostHandlesRef.current = null;
      dynamicGroupRef.current = null;
      camRigGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const dynamicGroup = dynamicGroupRef.current;
    const camRigGroup = camRigGroupRef.current;
    const outpostHandles = outpostHandlesRef.current;
    if (!dynamicGroup || !camRigGroup || !outpostHandles) return;

    outpostHandles.alertLight.color.setHex(ALERT_COLORS[shot.blocking.alertLight]);
    rebuildShotBlockingRig(dynamicGroup, camRigGroup, shot, renderMode, effectiveCam);
    outpostHandles.applyRenderMode(renderMode);
  }, [shot, renderMode, effectiveCam]);

  const commitCameraOverride = (nextCam: CameraBlocking3D) => {
    setLocalCamOverride(nextCam);
    onChangeCameraOverride?.(shot.id, nextCam);
  };

  const handleSelectLens = (preset: { mm: number; fov: number; lensLabel: string }) => {
    const nextCam = cloneCamera(effectiveCam);
    nextCam.fov = preset.fov;
    nextCam.lensLabel = preset.lensLabel;
    commitCameraOverride(nextCam);
  };

  const handleAxisChange = (field: "pos" | "target", axisIdx: 0 | 1 | 2, nextVal: number) => {
    const nextCam = cloneCamera(effectiveCam);
    nextCam[field][axisIdx] = round2(nextVal);
    commitCameraOverride(nextCam);
  };

  const handleResetCamera = () => {
    const defaultCam = cloneCamera(shot.blocking.camera);
    setLocalCamOverride(undefined);
    onChangeCameraOverride?.(shot.id, defaultCam);
  };

  const handleCaptureToStoryboard = () => {
    let clayDataUrl = renderShotWhiteboxSnapshot(shot, {
      renderMode: "clay",
      width: 640,
      height: 360,
      cameraOverride: effectiveCam
    });
    let depthDataUrl = renderShotWhiteboxSnapshot(shot, {
      renderMode: "depth",
      width: 640,
      height: 360,
      cameraOverride: effectiveCam
    });
    let litDataUrl = renderShotWhiteboxSnapshot(shot, {
      renderMode: "lit",
      width: 640,
      height: 360,
      cameraOverride: effectiveCam
    });

    const fallbackLiveUrl = (() => {
      try {
        const renderer = rendererRef.current;
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        if (!renderer) return null;
        if (scene && camera) renderer.render(scene, camera);
        return renderer.domElement.toDataURL("image/png");
      } catch {
        return null;
      }
    })();

    if (renderMode === "clay" && !clayDataUrl) clayDataUrl = fallbackLiveUrl;
    if (renderMode === "depth" && !depthDataUrl) depthDataUrl = fallbackLiveUrl;
    if (renderMode === "lit" && !litDataUrl) litDataUrl = fallbackLiveUrl;

    const frame: CapturedShotFrame = {
      clayDataUrl,
      depthDataUrl,
      litDataUrl,
      cameraOverride: cloneCamera(effectiveCam),
      capturedAt: Date.now()
    };

    onCaptureToStoryboard?.(shot.id, frame);
    setCaptureSynced(true);
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = window.setTimeout(() => {
      setCaptureSynced(false);
    }, 2400);
  };

  const boundAssets = (shot.boundAssetTags ?? [])
    .map((tag) => resolveAssetByTag(tag))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="three-stage-wrap">
      <div className="three-toolbar">
        <div className="three-toolbar-meta">
          <span className="fmv-code-badge">{shot.shotCode}</span>
          <span className="three-lens-badge">
            {effectiveCam.lensLabel} · FOV {effectiveCam.fov}°
          </span>
        </div>

        <div className="three-mode-switch" role="group" aria-label="White-Box Render Mode">
          <Button
            type="button"
            id="btn-three-mode-clay"
            className={`ctrl-btn ${renderMode === "clay" ? "amber" : ""}`}
            onClick={() => setRenderMode("clay")}
          >
            {tl({ zh: "白模 Clay", en: "Clay", ja: "白模 Clay" }, lang)}
          </Button>
          <Button
            type="button"
            id="btn-three-mode-depth"
            className={`ctrl-btn ${renderMode === "depth" ? "amber" : ""}`}
            onClick={() => setRenderMode("depth")}
          >
            {tl({ zh: "深度图 Depth", en: "Depth", ja: "深度 Depth" }, lang)}
          </Button>
          <Button
            type="button"
            id="btn-three-mode-lit"
            className={`ctrl-btn ${renderMode === "lit" ? "amber" : ""}`}
            onClick={() => setRenderMode("lit")}
          >
            {tl({ zh: "光影 Lit", en: "Lit", ja: "照明 Lit" }, lang)}
          </Button>
        </div>

        <div className="three-mode-switch" role="group" aria-label="3D Viewport Camera Mode">
          <Button
            type="button"
            className={`ctrl-btn ${viewMode === "orbit" ? "amber" : ""}`}
            onClick={() => setViewMode("orbit")}
          >
            {tl({ zh: "导演全局调度 (Orbit)", en: "Director Orbit", ja: "全体俯瞰 (Orbit)" }, lang)}
          </Button>
          <Button
            type="button"
            id="btn-three-pov"
            className={`ctrl-btn ${viewMode === "pov" ? "amber" : ""}`}
            onClick={() => setViewMode("pov")}
          >
            {tl({ zh: "实拍机位取景 (POV)", en: "Camera POV", ja: "実写視点 (POV)" }, lang)}
          </Button>
          <Button
            type="button"
            id="btn-three-safeframe"
            className={`ctrl-btn ${showSafeFrame ? "amber" : ""}`}
            aria-pressed={showSafeFrame}
            onClick={() => setShowSafeFrame((prev) => !prev)}
          >
            {tl({ zh: "安全框 16:9 / 2.39:1", en: "Safe Frame 2.39:1", ja: "安全枠 2.39:1" }, lang)}
          </Button>
        </div>

        <div className="three-capture-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Button
            type="button"
            id="btn-capture-whitebox"
            className="ctrl-btn amber"
            onClick={handleCaptureToStoryboard}
          >
            {tl(
              {
                zh: "📸 拍摄此 3D 机位到分镜板",
                en: "📸 Capture 3D POV to Storyboard",
                ja: "📸 3Dカメラを絵コンテへ撮影"
              },
              lang
            )}
          </Button>
          {captureSynced ? (
            <span
              className="three-capture-badge"
              style={{
                padding: "3px 8px",
                fontSize: "0.72rem",
                fontFamily: "var(--font-mono)",
                color: "var(--safe-text)",
                background: "var(--safe-soft)",
                border: "1px solid var(--safe-admit)"
              }}
            >
              {tl({ zh: "已同步至分镜板 ✓", en: "Synced to Storyboard ✓", ja: "絵コンテに同期済 ✓" }, lang)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Director Camera Tuning Bar */}
      <div
        className="three-tuning-bar"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "8px 12px",
          borderBottom: "1px solid rgba(235, 168, 52, 0.2)",
          background: "rgba(9, 14, 20, 0.92)",
          fontFamily: "var(--font-mono)"
        }}
      >
        <div
          className="three-lens-presets"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}
        >
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
            <span style={{ fontSize: "0.68rem", color: "var(--amber-bright)", letterSpacing: "0.06em" }}>
              {tl({ zh: "焦段预设 LENS", en: "LENS PRESETS", ja: "焦点距離" }, lang)}
            </span>
            {LENS_PRESETS.map((preset) => {
              const active =
                Math.round(effectiveCam.fov) === preset.fov ||
                effectiveCam.lensLabel.includes(`${preset.mm}mm`);
              return (
                <Button
                  key={preset.mm}
                  type="button"
                  className={`ctrl-btn ${active ? "amber" : ""}`}
                  style={{ padding: "3px 8px", fontSize: "0.72rem" }}
                  onClick={() => handleSelectLens(preset)}
                >
                  {preset.mm}mm
                </Button>
              );
            })}
          </div>

          <Button
            type="button"
            id="btn-three-reset-cam"
            className="ctrl-btn"
            style={{ padding: "3px 10px", fontSize: "0.72rem" }}
            onClick={handleResetCamera}
          >
            {tl({ zh: "↺ 重置默认机位", en: "↺ Reset Default Camera", ja: "↺ デフォルトへ戻す" }, lang)}
          </Button>
        </div>

        <div
          className="three-xyz-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "8px 14px"
          }}
        >
          {(
            [
              { field: "pos", label: "CAM POS" },
              { field: "target", label: "AIM TGT" }
            ] as const
          ).map(({ field, label }) => (
            <div
              key={field}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                padding: "6px 8px",
                background: "rgba(15, 22, 29, 0.85)",
                borderLeft: "2px solid var(--amber-crt)"
              }}
            >
              <span style={{ fontSize: "0.62rem", color: "var(--amber-bright)", letterSpacing: "0.08em" }}>
                {label}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {AXIS_CONFIG.map((axis) => {
                  const val = effectiveCam[field][axis.idx];
                  const sliderMin = Math.min(axis.min, Math.floor(val - 3));
                  const sliderMax = Math.max(axis.max, Math.ceil(val + 3));
                  return (
                    <label
                      key={axis.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.7rem",
                        color: "var(--text-primary)",
                        flex: "1 1 110px"
                      }}
                    >
                      <span style={{ color: "var(--frost-cyan)", width: "12px" }}>{axis.key}</span>
                      <Button
                        type="button"
                        className="ctrl-btn"
                        style={{ padding: "1px 5px", fontSize: "0.68rem", lineHeight: 1.2 }}
                        aria-label={`${label} ${axis.key} -0.25`}
                        onClick={() => handleAxisChange(field, axis.idx, val - 0.25)}
                      >
                        -
                      </Button>
                      <input
                        type="range"
                        min={sliderMin}
                        max={sliderMax}
                        step={axis.step}
                        value={val}
                        aria-label={`${label} ${axis.key}`}
                        style={{ flex: "1 1 56px", minWidth: "52px" }}
                        onChange={(e) => handleAxisChange(field, axis.idx, Number(e.target.value))}
                      />
                      <Button
                        type="button"
                        className="ctrl-btn"
                        style={{ padding: "1px 5px", fontSize: "0.68rem", lineHeight: 1.2 }}
                        aria-label={`${label} ${axis.key} +0.25`}
                        onClick={() => handleAxisChange(field, axis.idx, val + 0.25)}
                      >
                        +
                      </Button>
                      <span style={{ minWidth: "36px", textAlign: "right", color: "var(--text-secondary)" }}>
                        {val.toFixed(2)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="three-canvas-host" ref={hostRef} aria-label="Three.js 3D Cinematography Blocking Stage">
        <div
          ref={canvasMountRef}
          className="three-canvas-mount"
          style={{ position: "absolute", inset: 0 }}
        />

        {viewMode === "pov" && showSafeFrame && webglReady ? (
          <div
            className="three-safeframe-overlay"
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 2,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            {/* Top 2.39:1 Anamorphic Letterbox Crop */}
            <div
              style={{
                height: "12.8%",
                background: "rgba(3, 7, 11, 0.56)",
                borderBottom: "1px dashed rgba(235, 168, 52, 0.72)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                padding: "4px 12px",
                fontFamily: "var(--font-mono)",
                fontSize: "0.64rem",
                color: "var(--amber-bright)"
              }}
            >
              <span>POV // 16:9 SAFE · 2.39:1 ANAMORPHIC</span>
              <span>{effectiveCam.lensLabel} · FOV {effectiveCam.fov}°</span>
            </div>

            {/* Middle 16:9 Action Safe + Rule of Thirds Grid */}
            <div
              style={{
                position: "relative",
                flex: "1 1 auto",
                margin: "0 4%",
                borderLeft: "1px solid rgba(158, 198, 212, 0.36)",
                borderRight: "1px solid rgba(158, 198, 212, 0.36)"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "33.33%",
                  left: 0,
                  right: 0,
                  borderTop: "1px solid rgba(158, 198, 212, 0.28)"
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "66.67%",
                  left: 0,
                  right: 0,
                  borderTop: "1px solid rgba(158, 198, 212, 0.28)"
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "33.33%",
                  top: 0,
                  bottom: 0,
                  borderLeft: "1px solid rgba(158, 198, 212, 0.28)"
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "66.67%",
                  top: 0,
                  bottom: 0,
                  borderLeft: "1px solid rgba(158, 198, 212, 0.28)"
                }}
              />
              {/* Center Reticle */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: "16px",
                  height: "16px",
                  transform: "translate(-50%, -50%)",
                  border: "1px solid rgba(235, 168, 52, 0.72)"
                }}
              />
            </div>

            {/* Bottom 2.39:1 Anamorphic Letterbox Crop */}
            <div
              style={{
                height: "12.8%",
                background: "rgba(3, 7, 11, 0.56)",
                borderTop: "1px dashed rgba(235, 168, 52, 0.72)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                padding: "4px 12px",
                fontFamily: "var(--font-mono)",
                fontSize: "0.62rem",
                color: "var(--frost-cyan)"
              }}
            >
              <span>REC // {renderMode.toUpperCase()} PASS</span>
            </div>
          </div>
        ) : null}

        {!webglReady ? (
          <div className="three-fallback-card" style={{ position: "relative", zIndex: 3 }}>
            <div className="section-kicker">3D BLOCKING TELEMETRY // {shot.shotCode}</div>
            <p>{tl(effectiveCam.axisNote, lang)}</p>
          </div>
        ) : null}
      </div>

      <div className="three-telemetry-footer">
        <div className="three-telem-chip">
          <span className="telem-k">CAM XYZ</span>
          <span className="telem-v">
            [{effectiveCam.pos.map((n) => n.toFixed(2)).join(", ")}]
          </span>
        </div>
        <div className="three-telem-chip">
          <span className="telem-k">AIM XYZ</span>
          <span className="telem-v">
            [{effectiveCam.target.map((n) => n.toFixed(2)).join(", ")}]
          </span>
        </div>
        <div className="three-telem-chip wide">
          <span className="telem-k">{tl({ zh: "180° 轴线与走位", en: "180° AXIS & BLOCKING", ja: "軸線と動線" }, lang)}</span>
          <span className="telem-v">{tl(effectiveCam.axisNote, lang)}</span>
        </div>
        {boundAssets.length > 0 ? (
          <div className="three-telem-chip wide">
            <span className="telem-k">{tl({ zh: "绑定公共资产", en: "BOUND ASSETS", ja: "紐付け資産" }, lang)}</span>
            <span className="telem-v" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {boundAssets.map((asset) => (
                <span key={asset.tag} style={{ color: "var(--frost-cyan)" }}>
                  {asset.tag} ({tl(asset.name, lang)})
                </span>
              ))}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
