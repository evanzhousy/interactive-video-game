import * as THREE from "three";
import {
  sampleShotBlockingAtTime,
  type CameraBlocking3D,
  type PropBlocking3D,
  type StoryboardShot,
  type WhiteboxRenderMode
} from "./production-board.js";

export interface WhiteboxSnapshotOptions {
  renderMode: WhiteboxRenderMode;
  width?: number;
  height?: number;
  cameraOverride?: Partial<CameraBlocking3D>;
  timeSec?: number;
}

export interface ShotRigBuildOptions {
  timeSec?: number;
  showCamPath?: boolean;
  showFovCone?: boolean;
  showActors?: boolean;
}

export interface StartEndWhiteboxSnapshots {
  clayStart: string | null;
  clayEnd: string | null;
  depthStart: string | null;
  depthEnd: string | null;
  litStart: string | null;
  litEnd: string | null;
}

export interface OutpostSceneHandles {
  staticSet: THREE.Group;
  alertLight: THREE.PointLight;
  snowPoints: THREE.Points;
  snowPosAttr: THREE.BufferAttribute;
  applyRenderMode: (mode: WhiteboxRenderMode) => void;
  dispose: () => void;
}

const ALERT_COLORS: Record<"amber" | "red" | "cyan", number> = {
  amber: 0xeba834,
  red: 0xe04634,
  cyan: 0x5bbad5
};

function disposeMaterial(mat: THREE.Material | THREE.Material[] | undefined): void {
  if (!mat) return;
  if (Array.isArray(mat)) {
    for (const m of mat) m.dispose();
  } else {
    mat.dispose();
  }
}

function disposeGroupChildren(grp: THREE.Group): void {
  while (grp.children.length > 0) {
    const ch = grp.children[0];
    if (!ch) break;
    grp.remove(ch);
    ch.traverse((obj) => {
      if (
        obj instanceof THREE.Mesh ||
        obj instanceof THREE.Line ||
        obj instanceof THREE.LineSegments ||
        obj instanceof THREE.Points
      ) {
        obj.geometry?.dispose?.();
        disposeMaterial(obj.material);
      }
    });
  }
}

function addClayEdgeOverlay(
  mesh: THREE.Mesh,
  parent: THREE.Object3D,
  edgeColor = 0x334155,
  opacity = 0.78
): THREE.LineSegments {
  const edges = new THREE.EdgesGeometry(mesh.geometry);
  const lineMat = new THREE.LineBasicMaterial({
    color: edgeColor,
    transparent: opacity < 1,
    opacity
  });
  const seg = new THREE.LineSegments(edges, lineMat);
  seg.position.copy(mesh.position);
  seg.rotation.copy(mesh.rotation);
  seg.scale.copy(mesh.scale);
  parent.add(seg);
  return seg;
}

export function createOutpostWhiteboxSet(scene: THREE.Scene): OutpostSceneHandles {
  const ambientLight = new THREE.AmbientLight(0x88b4c8, 0.72);
  const dirLight = new THREE.DirectionalLight(0xd9f0fa, 0.9);
  dirLight.position.set(-4, 7, 5);

  const boothWarmLight = new THREE.PointLight(0xeba834, 2.8, 8);
  boothWarmLight.position.set(0, 2.3, 1.8);

  const blizzardRimLight = new THREE.PointLight(0x5bbad5, 3.2, 10);
  blizzardRimLight.position.set(-1.5, 2.6, -3.5);

  const alertLight = new THREE.PointLight(0xeba834, 2.2, 9);
  alertLight.position.set(5.5, 2.2, -0.8);

  scene.add(ambientLight, dirLight, boothWarmLight, blizzardRimLight, alertLight);

  const staticSet = new THREE.Group();
  scene.add(staticSet);

  const litGrid = new THREE.GridHelper(20, 20, 0x2a4858, 0x101c26);
  const clayGrid = new THREE.GridHelper(20, 20, 0x6c7c8c, 0xb6c1cc);
  clayGrid.visible = false;
  staticSet.add(litGrid, clayGrid);

  // Materials for Lit & Clay modes plus Depth override
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
  const litFloorMat = new THREE.MeshStandardMaterial({
    color: 0x060b10,
    roughness: 0.94,
    metalness: 0.18
  });

  const clayMat = new THREE.MeshStandardMaterial({
    color: 0xdce3ea,
    roughness: 0.88,
    metalness: 0.04
  });
  const clayTrimMat = new THREE.MeshStandardMaterial({
    color: 0xc0cbd6,
    roughness: 0.82,
    metalness: 0.08
  });
  const clayGlassMat = new THREE.MeshStandardMaterial({
    color: 0xb5cad8,
    transparent: true,
    opacity: 0.14,
    roughness: 0.25
  });
  const clayFloorMat = new THREE.MeshStandardMaterial({
    color: 0xd0d8e0,
    roughness: 0.95,
    metalness: 0.02
  });

  const depthMaterial = new THREE.MeshDepthMaterial();
  const edgeLineMat = new THREE.LineBasicMaterial({
    color: 0x334155,
    transparent: true,
    opacity: 0.76
  });

  const litBg = new THREE.Color(0x03070b);
  const clayBg = new THREE.Color(0xcfd7e0);
  const depthBg = new THREE.Color(0x000000);
  const litFog = new THREE.FogExp2(0x03070b, 0.045);

  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), litFloorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = -0.005;
  staticSet.add(floorMesh);

  // Blast Window Wall (Z = 0) with Central Viewport Cutout Frame
  const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.8, 0.18), steelMat);
  frameLeft.position.set(-2.3, 1.4, 0);
  const frameRight = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 0.18), steelMat);
  frameRight.position.set(2.1, 1.4, 0);
  const frameSill = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.85, 0.18), steelMat);
  frameSill.position.set(0, 0.425, 0);
  const frameHeader = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 0.18), steelMat);
  frameHeader.position.set(0, 2.575, 0);
  const blastGlass: THREE.Mesh<THREE.BoxGeometry, THREE.Material> = new THREE.Mesh(
    new THREE.BoxGeometry(2.05, 1.52, 0.04),
    cyanGlassMat
  );
  blastGlass.position.set(0, 1.61, 0);
  const sillTrim = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.05, 0.22), amberEdgeMat);
  sillTrim.position.set(0, 0.85, 0);

  // Operator #09 Console Desk (Booth South Side Z = +1.45)
  const consoleDesk = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.78, 0.72), steelMat);
  consoleDesk.position.set(0, 0.39, 1.45);
  const consoleTrim = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 0.48), amberEdgeMat);
  consoleTrim.position.set(0, 0.8, 1.42);

  // Inner Medical Corridor Wall & Airlock Frame (X = +4.2 .. +7.6)
  const corridorDeck = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.04, 7.2), steelMat);
  corridorDeck.position.set(5.9, 0.02, -0.2);
  const airlockDoor = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.5, 1.45), steelMat);
  airlockDoor.position.set(7.2, 1.25, -0.8);
  const airlockSeal = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.52, 0.08), amberEdgeMat);
  airlockSeal.position.set(7.2, 1.26, -0.05);

  const structuralMeshes: THREE.Mesh[] = [
    frameLeft,
    frameRight,
    frameSill,
    frameHeader,
    consoleDesk,
    corridorDeck,
    airlockDoor
  ];
  const trimMeshes: THREE.Mesh[] = [sillTrim, consoleTrim, airlockSeal];
  const edgeLines: THREE.LineSegments[] = [];

  for (const m of [...structuralMeshes, ...trimMeshes, blastGlass]) {
    staticSet.add(m);
    const seg = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), edgeLineMat);
    seg.position.copy(m.position);
    seg.rotation.copy(m.rotation);
    seg.scale.copy(m.scale);
    seg.visible = false;
    edgeLines.push(seg);
    staticSet.add(seg);
  }

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

  const applyRenderMode = (mode: WhiteboxRenderMode) => {
    if (mode === "depth") {
      scene.overrideMaterial = depthMaterial;
      scene.background = depthBg;
      scene.fog = null;
      blastGlass.visible = false;
      snowPoints.visible = false;
      litGrid.visible = false;
      clayGrid.visible = false;
      axisLine.visible = false;
      for (const seg of edgeLines) seg.visible = false;
      floorMesh.material = clayFloorMat;
      return;
    }

    if (mode === "clay") {
      scene.overrideMaterial = null;
      scene.background = clayBg;
      scene.fog = null;
      blastGlass.visible = true;
      blastGlass.material = clayGlassMat;
      floorMesh.material = clayFloorMat;
      for (const m of structuralMeshes) m.material = clayMat;
      for (const m of trimMeshes) m.material = clayTrimMat;
      snowPoints.visible = false;
      litGrid.visible = false;
      clayGrid.visible = true;
      axisLine.visible = true;
      for (const seg of edgeLines) seg.visible = true;
      ambientLight.color.setHex(0xffffff);
      ambientLight.intensity = 0.85;
      dirLight.color.setHex(0xffffff);
      dirLight.intensity = 0.95;
      boothWarmLight.intensity = 0;
      blizzardRimLight.intensity = 0;
      alertLight.intensity = 0;
      return;
    }

    // "lit"
    scene.overrideMaterial = null;
    scene.background = litBg;
    scene.fog = litFog;
    blastGlass.visible = true;
    blastGlass.material = cyanGlassMat;
    floorMesh.material = litFloorMat;
    for (const m of structuralMeshes) m.material = steelMat;
    for (const m of trimMeshes) m.material = amberEdgeMat;
    snowPoints.visible = true;
    litGrid.visible = true;
    clayGrid.visible = false;
    axisLine.visible = true;
    for (const seg of edgeLines) seg.visible = false;
    ambientLight.color.setHex(0x88b4c8);
    ambientLight.intensity = 0.72;
    dirLight.color.setHex(0xd9f0fa);
    dirLight.intensity = 0.9;
    boothWarmLight.intensity = 2.8;
    blizzardRimLight.intensity = 3.2;
    alertLight.intensity = 2.2;
  };

  // Initialize lit defaults cleanly
  applyRenderMode("lit");

  const dispose = () => {
    scene.overrideMaterial = null;
    scene.remove(staticSet, snowPoints, ambientLight, dirLight, boothWarmLight, blizzardRimLight, alertLight);
    disposeGroupChildren(staticSet);
    snowGeo.dispose();
    snowMat.dispose();
    steelMat.dispose();
    amberEdgeMat.dispose();
    cyanGlassMat.dispose();
    litFloorMat.dispose();
    clayMat.dispose();
    clayTrimMat.dispose();
    clayGlassMat.dispose();
    clayFloorMat.dispose();
    depthMaterial.dispose();
    edgeLineMat.dispose();
  };

  return {
    staticSet,
    alertLight,
    snowPoints,
    snowPosAttr,
    applyRenderMode,
    dispose
  };
}

function buildHumanoidMannequin(
  actor: StoryboardShot["blocking"]["actors"][number],
  renderMode: WhiteboxRenderMode
): THREE.Group {
  const rig = new THREE.Group();
  rig.position.set(actor.pos[0], actor.pos[1], actor.pos[2]);
  rig.rotation.y = actor.rotY;

  const isClay = renderMode === "clay";
  const isDepth = renderMode === "depth";

  const bodyMat = new THREE.MeshStandardMaterial({
    color: isClay ? 0xdce3ea : actor.color,
    emissive: !isClay && actor.speaking ? actor.color : "#000000",
    emissiveIntensity: !isClay && actor.speaking ? 0.36 : 0,
    roughness: isClay ? 0.88 : 0.45,
    metalness: isClay ? 0.04 : 0.1
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: isClay ? actor.color : 0xeaf6fc,
    emissive: !isClay ? actor.color : "#000000",
    emissiveIntensity: !isClay ? (actor.speaking ? 0.48 : 0.14) : 0,
    roughness: 0.38
  });

  // Non-human special rigs (corridor door / rescue submarine silhouette)
  if (actor.id === "sub") {
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.52, 2.8), bodyMat);
    hull.position.set(0, 0.26, 0);
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.56, 0.92), bodyMat);
    tower.position.set(0, 0.72, 0.25);
    const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.3), accentMat);
    beacon.position.set(0, 1.04, 0.25);
    rig.add(hull, tower, beacon);
    if (isClay) {
      addClayEdgeOverlay(hull, rig);
      addClayEdgeOverlay(tower, rig);
    }
    return rig;
  }

  if (actor.id === "door") {
    const doorSlab = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.35, 1.3), bodyMat);
    doorSlab.position.set(0, 1.175, 0);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 12), accentMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(-0.12, 1.15, 0.25);
    rig.add(doorSlab, handle);
    if (isClay) addClayEdgeOverlay(doorSlab, rig);
    return rig;
  }

  // Articulated humanoid mannequin (~1.72m tall)
  const legGeo = new THREE.CylinderGeometry(0.072, 0.056, 0.82, 10);
  const leftLeg = new THREE.Mesh(legGeo, bodyMat);
  leftLeg.position.set(-0.105, 0.41, 0);
  const rightLeg = new THREE.Mesh(legGeo, bodyMat);
  rightLeg.position.set(0.105, 0.41, 0);

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.19), bodyMat);
  pelvis.position.set(0, 0.86, 0);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.21), bodyMat);
  torso.position.set(0, 1.12, 0);

  const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.22), bodyMat);
  shoulders.position.set(0, 1.32, 0);

  const collarBadge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.23), accentMat);
  collarBadge.position.set(0, 1.35, 0);

  const armGeo = new THREE.CylinderGeometry(0.055, 0.044, 0.56, 10);
  const leftArm = new THREE.Mesh(armGeo, bodyMat);
  leftArm.position.set(-0.28, 1.07, 0.03);
  leftArm.rotation.x = -0.14;
  leftArm.rotation.z = 0.07;

  const rightArm = new THREE.Mesh(armGeo, bodyMat);
  rightArm.position.set(0.28, 1.07, 0.03);
  rightArm.rotation.x = -0.14;
  rightArm.rotation.z = -0.07;

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.1, 10), bodyMat);
  neck.position.set(0, 1.43, 0);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 14, 12), bodyMat);
  head.position.set(0, 1.58, 0);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.06, 0.08), accentMat);
  visor.position.set(0, 1.59, 0.105);

  rig.add(
    leftLeg,
    rightLeg,
    pelvis,
    torso,
    shoulders,
    collarBadge,
    leftArm,
    rightArm,
    neck,
    head,
    visor
  );

  if (isClay) {
    addClayEdgeOverlay(pelvis, rig);
    addClayEdgeOverlay(torso, rig);
    addClayEdgeOverlay(shoulders, rig);
    addClayEdgeOverlay(visor, rig);
    addClayEdgeOverlay(leftLeg, rig, 0x475569, 0.45);
    addClayEdgeOverlay(rightLeg, rig, 0x475569, 0.45);
  }

  if (!isDepth) {
    const baseRing = new THREE.Mesh(
      new THREE.RingGeometry(0.34, actor.speaking ? 0.5 : 0.4, 28),
      new THREE.MeshBasicMaterial({
        color: actor.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: actor.speaking ? 0.92 : 0.5
      })
    );
    baseRing.rotation.x = -Math.PI / 2;
    baseRing.position.y = 0.03;
    rig.add(baseRing);
  }

  return rig;
}

function buildPropBlockingRig(prop: PropBlocking3D, renderMode: WhiteboxRenderMode): THREE.Group {
  const grp = new THREE.Group();
  grp.position.set(prop.pos[0], prop.pos[1], prop.pos[2]);
  grp.rotation.y = prop.rotY ?? 0;
  if (prop.scale) {
    grp.scale.set(prop.scale[0], prop.scale[1], prop.scale[2]);
  }

  const isClay = renderMode === "clay";
  const mainMat = new THREE.MeshStandardMaterial({
    color: isClay ? 0xdce3ea : prop.color,
    roughness: isClay ? 0.88 : 0.42,
    metalness: isClay ? 0.05 : 0.35
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: isClay ? prop.color : 0x1e293b,
    emissive: !isClay ? prop.color : "#000000",
    emissiveIntensity: !isClay ? 0.22 : 0,
    roughness: 0.4
  });

  const meshesToEdge: THREE.Mesh[] = [];

  switch (prop.primitive) {
    case "briefcase": {
      const caseBody = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.3, 0.18), mainMat);
      caseBody.position.set(0, 0.15, 0);
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.05), trimMat);
      handle.position.set(0, 0.32, 0);
      const claspL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.19), trimMat);
      claspL.position.set(-0.14, 0.24, 0);
      const claspR = claspL.clone();
      claspR.position.x = 0.14;
      grp.add(caseBody, handle, claspL, claspR);
      meshesToEdge.push(caseBody, handle);
      break;
    }
    case "cylinder": {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.42, 16), mainMat);
      body.position.set(0, 0.21, 0);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.116, 0.116, 0.1, 16), trimMat);
      band.position.set(0, 0.23, 0);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.05, 16), trimMat);
      cap.position.set(0, 0.44, 0);
      grp.add(body, band, cap);
      meshesToEdge.push(body, cap);
      break;
    }
    case "tape": {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.2), mainMat);
      deck.position.set(0, 0.045, 0);
      const reelGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.025, 14);
      const reelL = new THREE.Mesh(reelGeo, trimMat);
      reelL.position.set(-0.07, 0.1, 0);
      const reelR = new THREE.Mesh(reelGeo, trimMat);
      reelR.position.set(0.07, 0.1, 0);
      grp.add(deck, reelL, reelR);
      meshesToEdge.push(deck);
      break;
    }
    case "ledger": {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.025, 0.24), mainMat);
      pad.position.set(0, 0.0125, 0);
      const page = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.015, 0.19), trimMat);
      page.position.set(0, 0.032, 0);
      const keyBow = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.015, 12), trimMat);
      keyBow.position.set(0.08, 0.046, 0.05);
      const keyShaft = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.012, 0.018), trimMat);
      keyShaft.position.set(0.01, 0.046, 0.05);
      grp.add(pad, page, keyBow, keyShaft);
      meshesToEdge.push(pad, page);
      break;
    }
    case "console": {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.13, 0.24), mainMat);
      base.position.set(0, 0.065, 0);
      const dial = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.08), trimMat);
      dial.position.set(-0.06, 0.14, -0.02);
      const pttBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.03, 12), trimMat);
      pttBtn.position.set(0.11, 0.14, 0.04);
      grp.add(base, dial, pttBtn);
      meshesToEdge.push(base, dial);
      break;
    }
    case "box":
    default: {
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.32), mainMat);
      housing.position.set(0, 0.17, 0);
      const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 14), trimMat);
      valve.rotation.x = Math.PI / 2;
      valve.position.set(0, 0.19, 0.18);
      grp.add(housing, valve);
      meshesToEdge.push(housing);
      break;
    }
  }

  if (isClay) {
    for (const m of meshesToEdge) {
      addClayEdgeOverlay(m, grp);
    }
  }

  return grp;
}

export function rebuildShotBlockingRig(
  dynamicGroup: THREE.Group,
  camRigGroup: THREE.Group,
  shot: StoryboardShot,
  renderMode: WhiteboxRenderMode,
  cameraOverride?: Partial<CameraBlocking3D>,
  rigOpts?: ShotRigBuildOptions
): void {
  disposeGroupChildren(dynamicGroup);
  disposeGroupChildren(camRigGroup);

  const timeSec = rigOpts?.timeSec ?? 0;
  const sampled = sampleShotBlockingAtTime(shot, timeSec, cameraOverride);

  if (rigOpts?.showActors !== false) {
    for (const actor of sampled.actors) {
      dynamicGroup.add(buildHumanoidMannequin(actor, renderMode));
    }
  }

  for (const prop of shot.blocking.props ?? []) {
    dynamicGroup.add(buildPropBlockingRig(prop, renderMode));
  }

  // Build Cinema Camera Body & Viewing Frustum Pyramid at sampled timestamp
  const pos = sampled.camera.pos;
  const target = sampled.camera.target;
  const fov = sampled.camera.fov;

  const camPos = new THREE.Vector3(pos[0], pos[1], pos[2]);
  const camTgt = new THREE.Vector3(target[0], target[1], target[2]);

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

  if (rigOpts?.showFovCone !== false) {
    const dist = Math.max(1.2, Math.min(4.2, camPos.distanceTo(camTgt)));
    const halfH = Math.tan(THREE.MathUtils.degToRad(fov / 2)) * dist;
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
  }
  camRigGroup.add(camContainer);

  const tgtSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xe04634, wireframe: true })
  );
  tgtSphere.position.copy(camTgt);
  camRigGroup.add(tgtSphere);

  // Camera & Actor Path Splines + Cheat Point markers
  if (rigOpts?.showCamPath !== false) {
    const beats = shot.blocking.beats;
    if (beats && beats.length > 0) {
      for (const beat of beats) {
        const pts: THREE.Vector3[] = [];
        const samples = 14;
        for (let i = 0; i <= samples; i++) {
          const t = beat.startSec + ((beat.endSec - beat.startSec) * i) / samples;
          const s = sampleShotBlockingAtTime(shot, t, cameraOverride);
          pts.push(new THREE.Vector3(s.camera.pos[0], s.camera.pos[1], s.camera.pos[2]));
        }
        const pathGeo = new THREE.BufferGeometry().setFromPoints(pts);
        camRigGroup.add(
          new THREE.Line(
            pathGeo,
            new THREE.LineBasicMaterial({ color: beat.color, transparent: true, opacity: 0.92 })
          )
        );

        if (beat.cheatPoint) {
          const cp = beat.cheatPoint.pos;
          const diamond = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.16, 0),
            new THREE.MeshBasicMaterial({ color: 0xe04634, wireframe: true })
          );
          diamond.position.set(cp[0], cp[1], cp[2]);
          camRigGroup.add(diamond);

          const cpRing = new THREE.Mesh(
            new THREE.RingGeometry(0.18, 0.24, 20),
            new THREE.MeshBasicMaterial({
              color: 0xeba834,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.88
            })
          );
          cpRing.rotation.x = -Math.PI / 2;
          cpRing.position.set(cp[0], 0.04, cp[2]);
          camRigGroup.add(cpRing);
        }

        if (rigOpts?.showActors !== false && beat.actorOverrides) {
          for (const ov of beat.actorOverrides) {
            const actorPts = [
              new THREE.Vector3(ov.startPos[0], 0.05, ov.startPos[2]),
              new THREE.Vector3(ov.endPos[0], 0.05, ov.endPos[2])
            ];
            camRigGroup.add(
              new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(actorPts),
                new THREE.LineBasicMaterial({ color: 0x49b882, transparent: true, opacity: 0.55 })
              )
            );
          }
        }
      }
    } else if (shot.blocking.endCamera || shot.motionPreset !== "static") {
      const pts: THREE.Vector3[] = [];
      const samples = 10;
      for (let i = 0; i <= samples; i++) {
        const t = (shot.durationSec * i) / samples;
        const s = sampleShotBlockingAtTime(shot, t, cameraOverride);
        pts.push(new THREE.Vector3(s.camera.pos[0], s.camera.pos[1], s.camera.pos[2]));
      }
      camRigGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0x5bbad5, transparent: true, opacity: 0.78 })
        )
      );
    }
  }
}

interface SnapshotRendererCache {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  handles: OutpostSceneHandles;
  dynamicGroup: THREE.Group;
  camRigGroup: THREE.Group;
  width: number;
  height: number;
}

let snapshotCache: SnapshotRendererCache | null = null;

function getOrCreateSnapshotCache(width: number, height: number): SnapshotRendererCache | null {
  if (typeof document === "undefined") return null;

  if (snapshotCache) {
    if (snapshotCache.width !== width || snapshotCache.height !== height) {
      snapshotCache.renderer.setSize(width, height, false);
      snapshotCache.camera.aspect = width / height;
      snapshotCache.width = width;
      snapshotCache.height = height;
    }
    return snapshotCache;
  }

  try {
    const probeCanvas = document.createElement("canvas");
    const gl = probeCanvas.getContext("webgl2") || probeCanvas.getContext("webgl");
    if (!gl) return null;

    const renderer = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(1);
    renderer.setSize(width, height, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.25, 30);
    const handles = createOutpostWhiteboxSet(scene);

    const dynamicGroup = new THREE.Group();
    const camRigGroup = new THREE.Group();
    camRigGroup.visible = false;
    scene.add(dynamicGroup, camRigGroup);

    snapshotCache = {
      renderer,
      scene,
      camera,
      handles,
      dynamicGroup,
      camRigGroup,
      width,
      height
    };
    return snapshotCache;
  } catch {
    return null;
  }
}

export function renderShotWhiteboxSnapshot(
  shot: StoryboardShot,
  opts: WhiteboxSnapshotOptions
): string | null {
  const width = Math.max(64, Math.round(opts.width ?? 640));
  const height = Math.max(64, Math.round(opts.height ?? 360));
  const cache = getOrCreateSnapshotCache(width, height);
  if (!cache) return null;

  try {
    const { renderer, scene, camera, handles, dynamicGroup, camRigGroup } = cache;
    const timeSec = opts.timeSec ?? 0;
    const sampled = sampleShotBlockingAtTime(shot, timeSec, opts.cameraOverride);

    handles.alertLight.color.setHex(ALERT_COLORS[shot.blocking.alertLight]);
    handles.applyRenderMode(opts.renderMode);
    rebuildShotBlockingRig(dynamicGroup, camRigGroup, shot, opts.renderMode, opts.cameraOverride, {
      timeSec,
      showCamPath: false,
      showFovCone: false
    });
    camRigGroup.visible = false;

    const pos = sampled.camera.pos;
    const target = sampled.camera.target;
    const fov = sampled.camera.fov;

    camera.position.set(pos[0], pos[1], pos[2]);
    camera.fov = fov;
    camera.aspect = width / height;
    camera.near = opts.renderMode === "depth" ? 0.3 : 0.25;
    camera.far = opts.renderMode === "depth" ? 14 : 30;
    camera.updateProjectionMatrix();
    camera.lookAt(target[0], target[1], target[2]);

    renderer.render(scene, camera);
    return renderer.domElement.toDataURL("image/png");
  } catch {
    return null;
  }
}

/**
 * Renders Start (t=0) and End (t=durationSec) Clay/Depth/Lit white-box snapshots for FL2VA keyframe workflows.
 */
export function renderShotStartEndSnapshots(
  shot: StoryboardShot,
  opts?: {
    width?: number;
    height?: number;
    startCameraOverride?: Partial<CameraBlocking3D>;
  }
): StartEndWhiteboxSnapshots {
  const width = opts?.width ?? 640;
  const height = opts?.height ?? 360;
  const endTime = Math.max(0, shot.durationSec);
  return {
    clayStart: renderShotWhiteboxSnapshot(shot, {
      renderMode: "clay",
      width,
      height,
      cameraOverride: opts?.startCameraOverride,
      timeSec: 0
    }),
    clayEnd: renderShotWhiteboxSnapshot(shot, {
      renderMode: "clay",
      width,
      height,
      cameraOverride: opts?.startCameraOverride,
      timeSec: endTime
    }),
    depthStart: renderShotWhiteboxSnapshot(shot, {
      renderMode: "depth",
      width,
      height,
      cameraOverride: opts?.startCameraOverride,
      timeSec: 0
    }),
    depthEnd: renderShotWhiteboxSnapshot(shot, {
      renderMode: "depth",
      width,
      height,
      cameraOverride: opts?.startCameraOverride,
      timeSec: endTime
    }),
    litStart: renderShotWhiteboxSnapshot(shot, {
      renderMode: "lit",
      width,
      height,
      cameraOverride: opts?.startCameraOverride,
      timeSec: 0
    }),
    litEnd: renderShotWhiteboxSnapshot(shot, {
      renderMode: "lit",
      width,
      height,
      cameraOverride: opts?.startCameraOverride,
      timeSec: endTime
    })
  };
}
