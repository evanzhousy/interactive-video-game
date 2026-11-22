import { Button } from "@ui-sdk/react/button";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { tl } from "../../game/i18n.js";
import type { StoryboardShot } from "../../game/production-board.js";
import type { Locale } from "../../game/types.js";

interface Props {
  shot: StoryboardShot;
  lang: Locale;
  motionPaused: boolean;
}

type ViewMode = "orbit" | "pov";

const ALERT_COLORS: Record<"amber" | "red" | "cyan", number> = {
  amber: 0xeba834,
  red: 0xe04634,
  cyan: 0x5bbad5
};

export function ThreeBlockingStage({ shot, lang, motionPaused }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("orbit");
  const [webglReady, setWebglReady] = useState(true);

  const viewModeRef = useRef<ViewMode>(viewMode);
  viewModeRef.current = viewMode;
  const motionPausedRef = useRef(motionPaused);
  motionPausedRef.current = motionPaused;

  const orbitRef = useRef({
    yaw: -0.68,
    pitch: 0.42,
    distance: 9.2,
    dragging: false,
    lastX: 0,
    lastY: 0
  });

  const activeShotRef = useRef(shot);
  activeShotRef.current = shot;

  // Trigger scene rebuild of actor & camera rigs cleanly whenever `shot` changes
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const camRigGroupRef = useRef<THREE.Group | null>(null);
  const alertLightRef = useRef<THREE.PointLight | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      const testCanvas = document.createElement("canvas");
      const gl = testCanvas.getContext("webgl2") || testCanvas.getContext("webgl");
      if (!gl) {
        setWebglReady(false);
        return;
      }
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
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
    host.innerHTML = "";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x03070b, 0.045);

    const camera = new THREE.PerspectiveCamera(48, initW / initH, 0.1, 60);

    // Architectural Lighting (Polar Cyan Exterior + Sodium Amber Booth)
    scene.add(new THREE.AmbientLight(0x88b4c8, 0.72));
    const dirLight = new THREE.DirectionalLight(0xd9f0fa, 0.9);
    dirLight.position.set(-4, 7, 5);
    scene.add(dirLight);

    const boothWarmLight = new THREE.PointLight(0xeba834, 2.8, 8);
    boothWarmLight.position.set(0, 2.3, 1.8);
    scene.add(boothWarmLight);

    const blizzardRimLight = new THREE.PointLight(0x5bbad5, 3.2, 10);
    blizzardRimLight.position.set(-1.5, 2.6, -3.5);
    scene.add(blizzardRimLight);

    const alertLight = new THREE.PointLight(0xeba834, 2.2, 9);
    alertLight.position.set(5.5, 2.2, -0.8);
    scene.add(alertLight);
    alertLightRef.current = alertLight;

    // Outpost 0 Static Physical Architecture Set
    const staticSet = new THREE.Group();
    scene.add(staticSet);

    const grid = new THREE.GridHelper(20, 20, 0x2a4858, 0x101c26);
    staticSet.add(grid);

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x101922,
      roughness: 0.72,
      metalness: 0.45
    });
    const amberEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xeba834,
      emissive: 0x6b4408,
      roughness: 0.35
    });
    const cyanGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x5bbad5,
      transparent: true,
      opacity: 0.24,
      roughness: 0.12,
      metalness: 0.1
    });

    // Blast Window Wall (Z = 0) with Central Viewport Cutout Frame
    const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.8, 0.18), steelMat);
    frameLeft.position.set(-2.3, 1.4, 0);
    const frameRight = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 0.18), steelMat);
    frameRight.position.set(2.1, 1.4, 0);
    const frameSill = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.85, 0.18), steelMat);
    frameSill.position.set(0, 0.425, 0);
    const frameHeader = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 0.18), steelMat);
    frameHeader.position.set(0, 2.575, 0);
    const blastGlass = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.52, 0.04), cyanGlassMat);
    blastGlass.position.set(0, 1.61, 0);
    staticSet.add(frameLeft, frameRight, frameSill, frameHeader, blastGlass);

    // Amber window sill bezel highlights Z=0 glass plane cleanly
    const sillTrim = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.05, 0.22), amberEdgeMat);
    sillTrim.position.set(0, 0.85, 0);
    staticSet.add(sillTrim);

    // Operator #09 Console Desk (Booth South Side Z = +1.45)
    const consoleDesk = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.78, 0.72), steelMat);
    consoleDesk.position.set(0, 0.39, 1.45);
    const consoleTrim = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 0.48), amberEdgeMat);
    consoleTrim.position.set(0, 0.8, 1.42);
    staticSet.add(consoleDesk, consoleTrim);

    // Inner Medical Corridor Wall & Airlock Frame (X = +4.2 .. +7.6)
    const corridorDeck = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.04, 7.2), steelMat);
    corridorDeck.position.set(5.9, 0.02, -0.2);
    const airlockDoor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.5, 1.45), steelMat);
    airlockDoor.position.set(7.2, 1.25, -0.8);
    const airlockSeal = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.52, 0.08), amberEdgeMat);
    airlockSeal.position.set(7.2, 1.26, -0.05);
    staticSet.add(corridorDeck, airlockDoor, airlockSeal);

    // 180-Degree Continuity Axis Line along Z=0
    const axisPts = [new THREE.Vector3(-4.5, 0.03, 0), new THREE.Vector3(4.5, 0.03, 0)];
    const axisGeo = new THREE.BufferGeometry().setFromPoints(axisPts);
    const axisLine = new THREE.Line(
      axisGeo,
      new THREE.LineDashedMaterial({ color: 0xeba834, dashSize: 0.25, gapSize: 0.14 })
    );
    axisLine.computeLineDistances();
    staticSet.add(axisLine);

    // Outer Blizzard Drifting 3D Snow Particles (Z < 0)
    const snowCount = 240;
    const snowPositions = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount; i++) {
      snowPositions[i * 3] = (Math.random() - 0.5) * 9.5;
      snowPositions[i * 3 + 1] = Math.random() * 3.4;
      snowPositions[i * 3 + 2] = -0.35 - Math.random() * 6.5;
    }
    const snowGeo = new THREE.BufferGeometry();
    const snowPosAttr = new THREE.BufferAttribute(snowPositions, 3);
    snowGeo.setAttribute("position", snowPosAttr);
    const snowMat = new THREE.PointsMaterial({
      color: 0xbde6f5,
      size: 0.06,
      transparent: true,
      opacity: 0.72
    });
    const snowPoints = new THREE.Points(snowGeo, snowMat);
    scene.add(snowPoints);

    // Dynamic groups for Actors & Camera Frustum Rig (rebuilt cleanly per shot)
    const dynamicGroup = new THREE.Group();
    const camRigGroup = new THREE.Group();
    scene.add(dynamicGroup);
    scene.add(camRigGroup);
    dynamicGroupRef.current = dynamicGroup;
    camRigGroupRef.current = camRigGroup;

    // Resize & Orbit Input
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

    const animate = () => {
      const curShot = activeShotRef.current;

      // Drift blizzard particles outside window
      if (!motionPausedRef.current) {
        for (let i = 0; i < snowCount; i++) {
          const xi = i * 3;
          const yi = xi + 1;
          const nx = (snowPositions[xi] ?? 0) + 0.022;
          const ny = (snowPositions[yi] ?? 0) - 0.009;
          snowPositions[xi] = nx > 4.75 ? -4.75 : nx;
          snowPositions[yi] = ny < 0 ? 3.4 : ny;
        }
        snowPosAttr.needsUpdate = true;
      }

      if (viewModeRef.current === "pov") {
        camRigGroup.visible = false;
        const [cx, cy, cz] = curShot.blocking.camera.pos;
        const [tx, ty, tz] = curShot.blocking.camera.target;
        desiredCamPos.set(cx, cy, cz);
        camera.position.lerp(desiredCamPos, motionPausedRef.current ? 1 : 0.14);
        lookTarget.lerp(new THREE.Vector3(tx, ty, tz), motionPausedRef.current ? 1 : 0.14);
        if (Math.abs(camera.fov - curShot.blocking.camera.fov) > 0.2) {
          camera.fov += (curShot.blocking.camera.fov - camera.fov) * 0.18;
          camera.updateProjectionMatrix();
        }
        camera.lookAt(lookTarget);
      } else {
        camRigGroup.visible = true;
        const { yaw, pitch, distance } = orbitRef.current;
        const centerTarget =
          curShot.blocking.zone === "inner_corridor"
            ? new THREE.Vector3(5.4, 1.2, -0.4)
            : new THREE.Vector3(0.2, 1.15, 0.1);
        desiredCamPos.set(
          centerTarget.x + Math.sin(yaw) * Math.cos(pitch) * distance,
          centerTarget.y + Math.sin(pitch) * distance,
          centerTarget.z + Math.cos(yaw) * Math.cos(pitch) * distance
        );
        camera.position.lerp(desiredCamPos, motionPausedRef.current ? 1 : 0.16);
        lookTarget.lerp(centerTarget, motionPausedRef.current ? 1 : 0.16);
        if (Math.abs(camera.fov - 48) > 0.2) {
          camera.fov += (48 - camera.fov) * 0.16;
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

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
          obj.geometry?.dispose?.();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose?.());
          else m?.dispose?.();
        }
      });
      renderer?.dispose();
      dynamicGroupRef.current = null;
      camRigGroupRef.current = null;
      alertLightRef.current = null;
    };
  }, []);

  // Update 3D Actors & Cinema Camera Frustum Rig cleanly when `shot` changes
  useEffect(() => {
    const dynamicGroup = dynamicGroupRef.current;
    const camRigGroup = camRigGroupRef.current;
    const alertLight = alertLightRef.current;
    if (!dynamicGroup || !camRigGroup) return;

    const clearGroup = (grp: THREE.Group) => {
      while (grp.children.length > 0) {
        const ch = grp.children[0]!;
        grp.remove(ch);
        ch.traverse((obj) => {
          if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Line) {
            obj.geometry?.dispose?.();
            const m = obj.material;
            if (Array.isArray(m)) m.forEach((mm) => mm.dispose?.());
            else m?.dispose?.();
          }
        });
      }
    };

    clearGroup(dynamicGroup);
    clearGroup(camRigGroup);

    if (alertLight) {
      alertLight.color.setHex(ALERT_COLORS[shot.blocking.alertLight]);
    }

    // Build Character Blocking Rigs
    for (const actor of shot.blocking.actors) {
      const rig = new THREE.Group();
      rig.position.set(actor.pos[0], actor.pos[1], actor.pos[2]);
      rig.rotation.y = actor.rotY;

      const mat = new THREE.MeshStandardMaterial({
        color: actor.color,
        emissive: actor.speaking ? actor.color : "#000000",
        emissiveIntensity: actor.speaking ? 0.38 : 0,
        roughness: 0.45
      });

      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 1.15, 16), mat);
      torso.position.y = 0.72;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), mat);
      head.position.y = 1.48;
      const nose = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.14, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, 1.48, 0.18);

      const baseRing = new THREE.Mesh(
        new THREE.RingGeometry(0.32, actor.speaking ? 0.48 : 0.39, 24),
        new THREE.MeshBasicMaterial({
          color: actor.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: actor.speaking ? 0.92 : 0.48
        })
      );
      baseRing.rotation.x = -Math.PI / 2;
      baseRing.position.y = 0.04;

      rig.add(torso, head, nose, baseRing);
      dynamicGroup.add(rig);
    }

    // Build Cinema Camera Body & Viewing Frustum Pyramid
    const [cx, cy, cz] = shot.blocking.camera.pos;
    const [tx, ty, tz] = shot.blocking.camera.target;
    const camPos = new THREE.Vector3(cx, cy, cz);
    const camTgt = new THREE.Vector3(tx, ty, tz);

    const camContainer = new THREE.Group();
    camContainer.position.copy(camPos);
    camContainer.lookAt(camTgt);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.2, 0.36),
      new THREE.MeshStandardMaterial({ color: 0x1e2832, metalness: 0.7, roughness: 0.3 })
    );
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.09, 0.22, 16),
      new THREE.MeshStandardMaterial({ color: 0xeba834, metalness: 0.8, roughness: 0.2 })
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.24;
    camContainer.add(body, lens);

    // Wireframe FOV Frustum Cone extending halfway toward target
    const dist = Math.max(1.2, Math.min(4.2, camPos.distanceTo(camTgt)));
    const halfH = Math.tan(THREE.MathUtils.degToRad(shot.blocking.camera.fov / 2)) * dist;
    const halfW = halfH * (16 / 9);
    const o = new THREE.Vector3(0, 0, 0.28);
    const tlPt = new THREE.Vector3(-halfW, halfH, dist);
    const trPt = new THREE.Vector3(halfW, halfH, dist);
    const blPt = new THREE.Vector3(-halfW, -halfH, dist);
    const brPt = new THREE.Vector3(halfW, -halfH, dist);

    const frustumPts = [
      o, tlPt, o, trPt, o, blPt, o, brPt,
      tlPt, trPt, trPt, brPt, brPt, blPt, blPt, tlPt
    ];
    const frustumGeo = new THREE.BufferGeometry().setFromPoints(frustumPts);
    const frustumLines = new THREE.LineSegments(
      frustumGeo,
      new THREE.LineBasicMaterial({ color: 0xeba834, transparent: true, opacity: 0.85 })
    );
    camContainer.add(frustumLines);
    camRigGroup.add(camContainer);

    // Target Reticle Sphere
    const tgtSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xe04634, wireframe: true })
    );
    tgtSphere.position.copy(camTgt);
    camRigGroup.add(tgtSphere);
  }, [shot]);

  return (
    <div className="three-stage-wrap">
      <div className="three-toolbar">
        <div className="three-toolbar-meta">
          <span className="fmv-code-badge">{shot.shotCode}</span>
          <span className="three-lens-badge">{shot.blocking.camera.lensLabel} · FOV {shot.blocking.camera.fov}°</span>
        </div>

        <div className="three-mode-switch" role="group" aria-label="3D Viewport Camera Mode">
          <Button
            type="button"
            className={`ctrl-btn ${viewMode === "orbit" ? "amber" : ""}`}
            onClick={() => setViewMode("orbit")}
          >
            {tl({ zh: "导演全局调度 (可拖拽)", en: "DIRECTOR ORBIT (DRAG)", ja: "全体俯瞰 (ドラッグ)" }, lang)}
          </Button>
          <Button
            type="button"
            id="btn-three-pov"
            className={`ctrl-btn ${viewMode === "pov" ? "amber" : ""}`}
            onClick={() => setViewMode("pov")}
          >
            {tl({ zh: "实拍机位预览 (POV)", en: "CAMERA LENS POV", ja: "カメラ実写視点" }, lang)}
          </Button>
        </div>
      </div>

      <div className="three-canvas-host" ref={hostRef} aria-label="Three.js 3D Cinematography Blocking Stage">
        {!webglReady ? (
          <div className="three-fallback-card">
            <div className="section-kicker">3D BLOCKING TELEMETRY // {shot.shotCode}</div>
            <p>{tl(shot.blocking.camera.axisNote, lang)}</p>
          </div>
        ) : null}
      </div>

      <div className="three-telemetry-footer">
        <div className="three-telem-chip">
          <span className="telem-k">CAM XYZ</span>
          <span className="telem-v">
            [{shot.blocking.camera.pos.map((n) => n.toFixed(2)).join(", ")}]
          </span>
        </div>
        <div className="three-telem-chip">
          <span className="telem-k">AIM XYZ</span>
          <span className="telem-v">
            [{shot.blocking.camera.target.map((n) => n.toFixed(2)).join(", ")}]
          </span>
        </div>
        <div className="three-telem-chip wide">
          <span className="telem-k">{tl({ zh: "180° 轴线与走位", en: "180° AXIS & BLOCKING", ja: "軸線と動線" }, lang)}</span>
          <span className="telem-v">{tl(shot.blocking.camera.axisNote, lang)}</span>
        </div>
      </div>
    </div>
  );
}
