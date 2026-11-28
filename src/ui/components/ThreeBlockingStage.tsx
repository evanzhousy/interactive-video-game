import { Button } from "@ui-sdk/react/button";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { tl } from "../../game/i18n.js";
import {
  resolveAssetByTag,
  sampleShotBlockingAtTime,
  type CameraBlocking3D,
  type StoryboardShot,
  type WhiteboxRenderMode
} from "../../game/production-board.js";
import {
  createOutpostWhiteboxSet,
  rebuildShotBlockingRig,
  renderShotStartEndSnapshots,
  type OutpostSceneHandles
} from "../../game/three-whitebox-renderer.js";
import type { Locale } from "../../game/types.js";

export interface CapturedShotFrame {
  clayDataUrl: string | null;
  clayEndDataUrl?: string | null;
  depthDataUrl: string | null;
  depthEndDataUrl?: string | null;
  litDataUrl: string | null;
  litEndDataUrl?: string | null;
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

type ViewMode = "orbit" | "top" | "follow" | "pov";

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
  const [showFovCone, setShowFovCone] = useState(true);
  const [showCamPath, setShowCamPath] = useState(true);
  const [showActors, setShowActors] = useState(true);
  const [showPipCam, setShowPipCam] = useState(true);
  const [playheadSec, setPlayheadSec] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<0.5 | 1 | 1.5>(1);
  const [isRecordingWebm, setIsRecordingWebm] = useState(false);
  const [webglReady, setWebglReady] = useState(true);
  const [captureSynced, setCaptureSynced] = useState(false);
  const [localCamOverride, setLocalCamOverride] = useState<CameraBlocking3D | undefined>(cameraOverride);

  useEffect(() => {
    setLocalCamOverride(cameraOverride);
  }, [shot.id, cameraOverride]);

  useEffect(() => {
    setIsPlaying(false);
    setPlayheadSec(0);
    playheadRef.current = 0;
  }, [shot.id]);

  const effectiveCam: CameraBlocking3D = localCamOverride ?? shot.blocking.camera;
  const sampledFrame = sampleShotBlockingAtTime(shot, playheadSec, effectiveCam);

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
  const showFovConeRef = useRef(showFovCone);
  showFovConeRef.current = showFovCone;
  const showCamPathRef = useRef(showCamPath);
  showCamPathRef.current = showCamPath;
  const showActorsRef = useRef(showActors);
  showActorsRef.current = showActors;
  const showPipCamRef = useRef(showPipCam);
  showPipCamRef.current = showPipCam;
  const playheadRef = useRef(playheadSec);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const playbackRateRef = useRef(playbackRate);
  playbackRateRef.current = playbackRate;
  const recordingStopCbRef = useRef<(() => void) | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const orbitRef = useRef({
    yaw: -0.68,
    pitch: 0.42,
    distance: 9.2,
    topHeight: 13.0,
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
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
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
    const camera = new THREE.PerspectiveCamera(48, initW / initH, 0.25, 32);
    const pipCamera = new THREE.PerspectiveCamera(45, 16 / 9, 0.25, 30);

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
      if (viewModeRef.current === "orbit") {
        e.preventDefault();
        orbitRef.current.distance = Math.max(
          3.5,
          Math.min(16, orbitRef.current.distance + e.deltaY * 0.006)
        );
      } else if (viewModeRef.current === "top") {
        e.preventDefault();
        orbitRef.current.topHeight = Math.max(
          6,
          Math.min(24, orbitRef.current.topHeight + e.deltaY * 0.008)
        );
      }
    };

    domEl.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    domEl.addEventListener("wheel", onWheel, { passive: false });

    let rafId = 0;
    let lastNow = performance.now();
    let lastUiSyncNow = 0;
    const lookTarget = new THREE.Vector3(0, 1.2, 0);
    const desiredCamPos = new THREE.Vector3();
    const desiredTarget = new THREE.Vector3();
    const followForward = new THREE.Vector3();

    const animate = (now: number) => {
      const dt = Math.min(0.1, Math.max(0, (now - lastNow) / 1000));
      lastNow = now;

      const curShot = activeShotRef.current;
      const curCam = effectiveCamRef.current;
      const snowAttr = outpostHandles.snowPosAttr;

      if (isPlayingRef.current) {
        const nextT = playheadRef.current + dt * playbackRateRef.current;
        if (nextT >= curShot.durationSec) {
          if (recordingStopCbRef.current) {
            playheadRef.current = curShot.durationSec;
            setPlayheadSec(curShot.durationSec);
            isPlayingRef.current = false;
            setIsPlaying(false);
            const stopCb = recordingStopCbRef.current;
            recordingStopCbRef.current = null;
            stopCb();
          } else {
            playheadRef.current = 0;
          }
        } else {
          playheadRef.current = nextT;
        }
        rebuildShotBlockingRig(dynamicGroup, camRigGroup, curShot, renderModeRef.current, curCam, {
          timeSec: playheadRef.current,
          showCamPath: showCamPathRef.current,
          showFovCone: showFovConeRef.current,
          showActors: showActorsRef.current
        });
        if (now - lastUiSyncNow > 55) {
          lastUiSyncNow = now;
          setPlayheadSec(playheadRef.current);
        }
      }

      if (!motionPausedRef.current && snowAttr) {
        for (let i = 0; i < snowAttr.count; i++) {
          const nx = snowAttr.getX(i) + 0.022;
          const ny = snowAttr.getY(i) - 0.009;
          snowAttr.setX(i, nx > 4.75 ? -4.75 : nx);
          snowAttr.setY(i, ny < 0 ? 3.4 : ny);
        }
        snowAttr.needsUpdate = true;
      }

      const sampled = sampleShotBlockingAtTime(curShot, playheadRef.current, curCam);
      const [cx, cy, cz] = sampled.camera.pos;
      const [tx, ty, tz] = sampled.camera.target;
      const snapAlpha = motionPausedRef.current || isPlayingRef.current ? 1 : 0.18;

      if (viewModeRef.current === "pov") {
        camRigGroup.visible = false;
        desiredCamPos.set(cx, cy, cz);
        desiredTarget.set(tx, ty, tz);
        camera.position.lerp(desiredCamPos, snapAlpha);
        lookTarget.lerp(desiredTarget, snapAlpha);
        if (Math.abs(camera.fov - sampled.camera.fov) > 0.15) {
          camera.fov += (sampled.camera.fov - camera.fov) * (snapAlpha === 1 ? 1 : 0.24);
          camera.updateProjectionMatrix();
        }
        camera.lookAt(lookTarget);
      } else if (viewModeRef.current === "top") {
        camRigGroup.visible = true;
        const centerX = curShot.blocking.zone === "inner_corridor" ? 3.1 : 0.0;
        const centerZ = curShot.blocking.zone === "vestibule" ? -1.4 : 0.0;
        desiredCamPos.set(centerX, orbitRef.current.topHeight, centerZ + 0.01);
        desiredTarget.set(centerX, 0, centerZ);
        camera.position.lerp(desiredCamPos, 0.22);
        lookTarget.lerp(desiredTarget, 0.22);
        if (Math.abs(camera.fov - 46) > 0.15) {
          camera.fov += (46 - camera.fov) * 0.22;
          camera.updateProjectionMatrix();
        }
        camera.lookAt(lookTarget);
      } else if (viewModeRef.current === "follow") {
        camRigGroup.visible = true;
        desiredTarget.set(tx, ty, tz);
        followForward.set(tx - cx, ty - cy, tz - cz);
        if (followForward.lengthSq() < 0.001) {
          followForward.set(0, 0, -1);
        } else {
          followForward.normalize();
        }
        desiredCamPos.set(
          cx - followForward.x * 2.6,
          cy + 1.15,
          cz - followForward.z * 2.6
        );
        camera.position.lerp(desiredCamPos, snapAlpha);
        lookTarget.lerp(desiredTarget, snapAlpha);
        if (Math.abs(camera.fov - 52) > 0.15) {
          camera.fov += (52 - camera.fov) * 0.2;
          camera.updateProjectionMatrix();
        }
        camera.lookAt(lookTarget);
      } else {
        camRigGroup.visible = true;
        const { yaw, pitch, distance } = orbitRef.current;
        if (curShot.blocking.zone === "inner_corridor") {
          desiredTarget.set(3.4, 1.2, 0.2);
        } else {
          desiredTarget.set(0.1, 1.15, -0.3);
        }
        desiredCamPos.set(
          desiredTarget.x + Math.sin(yaw) * Math.cos(pitch) * distance,
          desiredTarget.y + Math.sin(pitch) * distance,
          desiredTarget.z + Math.cos(yaw) * Math.cos(pitch) * distance
        );
        camera.position.lerp(desiredCamPos, motionPausedRef.current ? 1 : 0.16);
        lookTarget.lerp(desiredTarget, motionPausedRef.current ? 1 : 0.16);
        if (Math.abs(camera.fov - 48) > 0.15) {
          camera.fov += (48 - camera.fov) * (motionPausedRef.current ? 1 : 0.18);
          camera.updateProjectionMatrix();
        }
        camera.lookAt(lookTarget);
      }

      const canvasW = domEl.clientWidth || renderer.domElement.width;
      const canvasH = domEl.clientHeight || renderer.domElement.height;
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, canvasW, canvasH);
      renderer.render(scene, camera);

      // Picture-in-Picture live Cam POV viewfinder when inspecting in Orbit/Top/Follow
      if (viewModeRef.current !== "pov" && showPipCamRef.current && !recordingStopCbRef.current) {
        const pipW = Math.max(120, Math.round(canvasW * 0.28));
        const pipH = Math.max(68, Math.round((pipW * 9) / 16));
        const margin = 12;
        if (canvasW > pipW + margin * 2 && canvasH > pipH + margin * 2) {
          const pipX = canvasW - pipW - margin;
          const pipY = canvasH - pipH - margin;
          const prevRigVis = camRigGroup.visible;
          camRigGroup.visible = false;
          pipCamera.position.set(cx, cy, cz);
          pipCamera.fov = sampled.camera.fov;
          pipCamera.aspect = pipW / pipH;
          pipCamera.near = renderModeRef.current === "depth" ? 0.3 : 0.25;
          pipCamera.far = renderModeRef.current === "depth" ? 14 : 30;
          pipCamera.updateProjectionMatrix();
          pipCamera.lookAt(tx, ty, tz);

          renderer.setScissorTest(true);
          renderer.setViewport(pipX, pipY, pipW, pipH);
          renderer.setScissor(pipX, pipY, pipW, pipH);
          renderer.clearDepth();
          renderer.render(scene, pipCamera);
          renderer.setScissorTest(false);
          renderer.setViewport(0, 0, canvasW, canvasH);
          camRigGroup.visible = prevRigVis;
        }
      }

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

    playheadRef.current = playheadSec;
    outpostHandles.alertLight.color.setHex(ALERT_COLORS[shot.blocking.alertLight]);
    rebuildShotBlockingRig(dynamicGroup, camRigGroup, shot, renderMode, effectiveCam, {
      timeSec: playheadSec,
      showCamPath,
      showFovCone,
      showActors
    });
    outpostHandles.applyRenderMode(renderMode);
  }, [shot, renderMode, effectiveCam, playheadSec, showCamPath, showFovCone, showActors]);

  const handleScrubTime = (nextSec: number) => {
    const clamped = Math.max(0, Math.min(shot.durationSec, nextSec));
    setIsPlaying(false);
    isPlayingRef.current = false;
    playheadRef.current = clamped;
    setPlayheadSec(clamped);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }
    if (playheadRef.current >= shot.durationSec - 0.05) {
      playheadRef.current = 0;
      setPlayheadSec(0);
    }
    isPlayingRef.current = true;
    setIsPlaying(true);
  };

  const handleCyclePlaybackRate = () => {
    setPlaybackRate((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 0.5 : 1));
  };

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
    const snaps = renderShotStartEndSnapshots(shot, {
      width: 640,
      height: 360,
      startCameraOverride: effectiveCam
    });
    let clayDataUrl = snaps.clayStart;
    let depthDataUrl = snaps.depthStart;
    let litDataUrl = snaps.litStart;

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
      clayEndDataUrl: snaps.clayEnd,
      depthDataUrl,
      depthEndDataUrl: snaps.depthEnd,
      litDataUrl,
      litEndDataUrl: snaps.litEnd,
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

  const handleRecordPrevizWebm = () => {
    const renderer = rendererRef.current;
    if (!renderer || isRecordingWebm) return;
    const canvas = renderer.domElement as HTMLCanvasElement & {
      captureStream?: (fps?: number) => MediaStream;
    };
    if (typeof MediaRecorder === "undefined" || typeof canvas.captureStream !== "function") {
      return;
    }

    const prevView = viewMode;
    const chunks: BlobPart[] = [];
    const stream = canvas.captureStream(24);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };
    recorder.onstop = () => {
      setIsRecordingWebm(false);
      setViewMode(prevView);
      viewModeRef.current = prevView;
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${shot.shotCode.toLowerCase()}-previz-${renderMode}.webm`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      mediaRecorderRef.current = null;
    };

    setViewMode("pov");
    viewModeRef.current = "pov";
    playheadRef.current = 0;
    setPlayheadSec(0);
    setIsRecordingWebm(true);
    recordingStopCbRef.current = () => {
      if (recorder.state !== "inactive") recorder.stop();
    };
    recorder.start(120);
    isPlayingRef.current = true;
    setIsPlaying(true);
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
            {sampledFrame.camera.lensLabel} · FOV {Math.round(sampledFrame.camera.fov)}°
          </span>
          {shot.pipelineRoute ? (
            <span className="three-route-badge">
              {shot.pipelineRoute === "v2v_whitebox" ? "V2V WHITEBOX" : "FL2VA KEYFRAMES"}
            </span>
          ) : null}
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
            {tl({ zh: "Orbit 3D", en: "Orbit 3D", ja: "Orbit 3D" }, lang)}
          </Button>
          <Button
            type="button"
            id="btn-three-top"
            className={`ctrl-btn ${viewMode === "top" ? "amber" : ""}`}
            onClick={() => setViewMode("top")}
          >
            {tl({ zh: "俯视轴线 Top Map", en: "Top Map", ja: "俯瞰 Top Map" }, lang)}
          </Button>
          <Button
            type="button"
            id="btn-three-follow"
            className={`ctrl-btn ${viewMode === "follow" ? "amber" : ""}`}
            onClick={() => setViewMode("follow")}
          >
            {tl({ zh: "跟随 Follow Rig", en: "Follow Rig", ja: "追従 Follow" }, lang)}
          </Button>
          <Button
            type="button"
            id="btn-three-pov"
            className={`ctrl-btn ${viewMode === "pov" ? "amber" : ""}`}
            onClick={() => setViewMode("pov")}
          >
            {tl({ zh: "机位 Cam POV", en: "Cam POV", ja: "視点 Cam POV" }, lang)}
          </Button>
          <Button
            type="button"
            id="btn-three-safeframe"
            className={`ctrl-btn ${showSafeFrame ? "amber" : ""}`}
            aria-pressed={showSafeFrame}
            onClick={() => setShowSafeFrame((prev) => !prev)}
          >
            {tl({ zh: "安全框 2.39:1", en: "Safe Frame", ja: "安全枠" }, lang)}
          </Button>
        </div>

        <div className="three-capture-group" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <Button
            type="button"
            id="btn-capture-whitebox"
            className="ctrl-btn amber"
            onClick={handleCaptureToStoryboard}
          >
            {tl(
              {
                zh: "📸 导出首尾白模帧到分镜",
                en: "📸 Capture Start+End to Storyboard",
                ja: "📸 首尾フレームを絵コンテへ"
              },
              lang
            )}
          </Button>
          <Button
            type="button"
            id="btn-export-previz-webm"
            className={`ctrl-btn ${isRecordingWebm ? "amber" : ""}`}
            disabled={!webglReady || isRecordingWebm}
            onClick={handleRecordPrevizWebm}
          >
            {isRecordingWebm
              ? tl({ zh: "⏺ 录制白膜中...", en: "⏺ Recording WebM...", ja: "⏺ 録画中..." }, lang)
              : tl({ zh: "🎥 导出白膜视频", en: "🎥 Export WebM", ja: "🎥 白模動画出力" }, lang)}
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
              {tl({ zh: "首尾帧已同步 ✓", en: "Start+End Synced ✓", ja: "首尾同期済 ✓" }, lang)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Layer Toggles + Beat Timeline Bar */}
      <div className="three-timeline-bar">
        <div className="three-timeline-controls">
          <Button
            type="button"
            id="btn-three-play"
            className={`ctrl-btn ${isPlaying ? "amber" : ""}`}
            onClick={handleTogglePlay}
          >
            {isPlaying
              ? tl({ zh: "⏸ 暂停", en: "⏸ Pause", ja: "⏸ 停止" }, lang)
              : tl({ zh: "▶ 预演播放", en: "▶ Play", ja: "▶ 再生" }, lang)}
          </Button>
          <Button type="button" className="ctrl-btn" onClick={handleCyclePlaybackRate}>
            {playbackRate}x
          </Button>
          <span className="three-time-readout">
            {playheadSec.toFixed(1)}s / {shot.durationSec.toFixed(1)}s
          </span>
          <input
            type="range"
            className="three-timeline-slider"
            min={0}
            max={shot.durationSec}
            step={0.05}
            value={playheadSec}
            aria-label="Pre-viz Timeline Scrubber"
            onChange={(e) => handleScrubTime(Number(e.target.value))}
          />
          <Button type="button" className="ctrl-btn" onClick={() => handleScrubTime(0)}>
            {tl({ zh: "首帧", en: "Start", ja: "先頭" }, lang)}
          </Button>
          <Button type="button" className="ctrl-btn" onClick={() => handleScrubTime(shot.durationSec)}>
            {tl({ zh: "尾帧", en: "End", ja: "末尾" }, lang)}
          </Button>
        </div>

        <div className="three-layer-toggles">
          <Button
            type="button"
            className={`ctrl-btn ${showFovCone ? "amber" : ""}`}
            onClick={() => setShowFovCone((v) => !v)}
          >
            + FovCone
          </Button>
          <Button
            type="button"
            className={`ctrl-btn ${showCamPath ? "amber" : ""}`}
            onClick={() => setShowCamPath((v) => !v)}
          >
            + Cam Path
          </Button>
          <Button
            type="button"
            className={`ctrl-btn ${showActors ? "amber" : ""}`}
            onClick={() => setShowActors((v) => !v)}
          >
            + Actors
          </Button>
          <Button
            type="button"
            className={`ctrl-btn ${showPipCam ? "amber" : ""}`}
            onClick={() => setShowPipCam((v) => !v)}
          >
            + PiP POV
          </Button>
        </div>

        {shot.blocking.beats && shot.blocking.beats.length > 0 ? (
          <div className="three-beat-strip">
            <div className="three-beat-pills">
              {shot.blocking.beats.map((beat, idx) => {
                const isActive = sampledFrame.activeBeatIndex === idx;
                return (
                  <button
                    key={beat.id}
                    type="button"
                    data-beat-id={beat.id}
                    className={`three-beat-pill ${isActive ? "active" : ""}`}
                    style={{ borderColor: beat.color }}
                    onClick={() => handleScrubTime(beat.startSec)}
                  >
                    <span className="three-beat-dot" style={{ backgroundColor: beat.color }} />
                    <span>{tl(beat.label, lang)}</span>
                    <span className="three-beat-span">
                      {(beat.endSec - beat.startSec).toFixed(0)}s
                    </span>
                  </button>
                );
              })}
            </div>
            {sampledFrame.activeBeat ? (
              <div className="three-beat-note">
                <span>
                  <strong>BEAT {sampledFrame.activeBeatIndex + 1}:</strong>{" "}
                  {tl(sampledFrame.activeBeat.rigNote, lang)}
                </span>
                {sampledFrame.activeBeat.cheatPoint ? (
                  <span className="three-cheat-badge">
                    ◆ {tl(sampledFrame.activeBeat.cheatPoint.label, lang)} @{" "}
                    {sampledFrame.activeBeat.cheatPoint.atSec.toFixed(1)}s
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
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

        {viewMode !== "pov" && showPipCam && webglReady && !isRecordingWebm ? (
          <div className="three-pip-frame" aria-hidden="true">
            <div className="three-pip-header">
              <span>CAM 1 · 16:9 LIVE POV</span>
              <span>{Math.round(sampledFrame.camera.fov)}°</span>
            </div>
          </div>
        ) : null}

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
            [{sampledFrame.camera.pos.map((n) => n.toFixed(2)).join(", ")}]
          </span>
        </div>
        <div className="three-telem-chip">
          <span className="telem-k">AIM XYZ</span>
          <span className="telem-v">
            [{sampledFrame.camera.target.map((n) => n.toFixed(2)).join(", ")}]
          </span>
        </div>
        <div className="three-telem-chip wide">
          <span className="telem-k">{tl({ zh: "180° 轴线与走位", en: "180° AXIS & BLOCKING", ja: "軸線と動線" }, lang)}</span>
          <span className="telem-v">{tl(sampledFrame.camera.axisNote, lang)}</span>
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
