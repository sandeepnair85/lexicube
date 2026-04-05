/**
 * Three.js Rubik's cube renderer with drag-on-face interaction.
 * Uses screen-space projection of cube axes for robust drag detection.
 */

import * as THREE from 'three';

const STEP = 1.08;
const HALF = 0.5;

const FACE_COLORS = [
  0xFFD500, 0xFFFFFF, 0x009B48, 0x0045AD, 0xFF5900, 0xB90000,
];

const DARK_BODY = 0x1a1a1a;

function buildStickerMap() {
  const map = {};
  const fp = {
    U: [[-1,1,-1],[0,1,-1],[1,1,-1],[-1,1,0],[0,1,0],[1,1,0],[-1,1,1],[0,1,1],[1,1,1]],
    D: [[-1,-1,1],[0,-1,1],[1,-1,1],[-1,-1,0],[0,-1,0],[1,-1,0],[-1,-1,-1],[0,-1,-1],[1,-1,-1]],
    F: [[-1,1,1],[0,1,1],[1,1,1],[-1,0,1],[0,0,1],[1,0,1],[-1,-1,1],[0,-1,1],[1,-1,1]],
    B: [[1,1,-1],[0,1,-1],[-1,1,-1],[1,0,-1],[0,0,-1],[-1,0,-1],[1,-1,-1],[0,-1,-1],[-1,-1,-1]],
    L: [[-1,1,-1],[-1,1,0],[-1,1,1],[-1,0,-1],[-1,0,0],[-1,0,1],[-1,-1,-1],[-1,-1,0],[-1,-1,1]],
    R: [[1,1,1],[1,1,0],[1,1,-1],[1,0,1],[1,0,0],[1,0,-1],[1,-1,1],[1,-1,0],[1,-1,-1]],
  };
  const off = { U: 0, D: 9, F: 18, B: 27, L: 36, R: 45 };
  for (const [face, positions] of Object.entries(fp)) {
    for (let i = 0; i < 9; i++) {
      const [x, y, z] = positions[i];
      map[`${x},${y},${z},${face}`] = off[face] + i;
    }
  }
  return map;
}

const STICKER_MAP = buildStickerMap();

function createStickerTexture(letter, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
  ctx.beginPath();
  ctx.roundRect(4, 4, 120, 120, 14);
  ctx.fill();
  if (letter) {
    const isLight = (color === 0xFFD500 || color === 0xFFFFFF);
    ctx.fillStyle = isLight ? '#222' : '#fff';
    ctx.font = 'bold 68px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 2;
    ctx.fillText(letter, 64, 66);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function snapGrid(v) { return Math.round(v / STEP); }

const FACE_DEFS = [
  { face: 'U', nx: 0, ny: 1, nz: 0 },
  { face: 'D', nx: 0, ny: -1, nz: 0 },
  { face: 'F', nx: 0, ny: 0, nz: 1 },
  { face: 'B', nx: 0, ny: 0, nz: -1 },
  { face: 'L', nx: -1, ny: 0, nz: 0 },
  { face: 'R', nx: 1, ny: 0, nz: 0 },
];

export function createCube3D(container, onMoveCallback) {
  const width = Math.min(460, window.innerWidth - 32);
  const height = Math.min(400, width * 0.85);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x121213);

  const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
  camera.position.set(5, 4, 5.5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvasEl = renderer.domElement;
  canvasEl.className = 'cube-canvas';

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const d1 = new THREE.DirectionalLight(0xffffff, 0.7);
  d1.position.set(4, 8, 4);
  scene.add(d1);
  const d2 = new THREE.DirectionalLight(0xffffff, 0.3);
  d2.position.set(-4, 2, -4);
  scene.add(d2);

  const cubeGroup = new THREE.Group();
  scene.add(cubeGroup);
  cubeGroup.rotation.x = -0.45;
  cubeGroup.rotation.y = -0.55;

  // Build cubies
  const stickerMeshes = new Array(54).fill(null);
  const bodyMat = new THREE.MeshStandardMaterial({ color: DARK_BODY, roughness: 0.5 });
  const bodyGeom = new THREE.BoxGeometry(0.97, 0.97, 0.97);
  const stickerGeom = new THREE.PlaneGeometry(0.85, 0.85);

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.set(x * STEP, y * STEP, z * STEP);
        body.userData = { type: 'body', cubiePos: [x, y, z] };
        cubeGroup.add(body);

        for (const { face, nx, ny, nz } of FACE_DEFS) {
          if ((nx === 1 && x !== 1) || (nx === -1 && x !== -1)) continue;
          if ((ny === 1 && y !== 1) || (ny === -1 && y !== -1)) continue;
          if ((nz === 1 && z !== 1) || (nz === -1 && z !== -1)) continue;
          const key = `${x},${y},${z},${face}`;
          const si = STICKER_MAP[key];
          if (si === undefined) continue;
          const mat = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.05 });
          const sticker = new THREE.Mesh(stickerGeom, mat);
          sticker.position.set(x*STEP+nx*(HALF+0.005), y*STEP+ny*(HALF+0.005), z*STEP+nz*(HALF+0.005));
          if (ny === 1) sticker.rotation.x = -Math.PI / 2;
          if (ny === -1) sticker.rotation.x = Math.PI / 2;
          if (nx === 1) sticker.rotation.y = Math.PI / 2;
          if (nx === -1) sticker.rotation.y = -Math.PI / 2;
          if (nz === -1) sticker.rotation.y = Math.PI;
          sticker.userData = { type: 'sticker', stateIndex: si, cubiePos: [x, y, z], face };
          stickerMeshes[si] = sticker;
          cubeGroup.add(sticker);
        }
      }
    }
  }

  // Snap positions after animation to prevent drift
  function snapAllPositions() {
    cubeGroup.children.forEach(obj => {
      if (!obj.userData.cubiePos) return;
      const gx = snapGrid(obj.position.x);
      const gy = snapGrid(obj.position.y);
      const gz = snapGrid(obj.position.z);
      obj.userData.cubiePos = [gx, gy, gz];
      if (obj.userData.type === 'body') {
        obj.position.set(gx * STEP, gy * STEP, gz * STEP);
        obj.rotation.set(0, 0, 0);
      }
      if (obj.userData.type === 'sticker') {
        const sn = getStickerNormal(obj);
        if (sn) {
          obj.position.set(gx*STEP+sn.nx*(HALF+0.005), gy*STEP+sn.ny*(HALF+0.005), gz*STEP+sn.nz*(HALF+0.005));
          obj.rotation.set(0, 0, 0);
          if (sn.ny === 1) obj.rotation.x = -Math.PI / 2;
          if (sn.ny === -1) obj.rotation.x = Math.PI / 2;
          if (sn.nx === 1) obj.rotation.y = Math.PI / 2;
          if (sn.nx === -1) obj.rotation.y = -Math.PI / 2;
          if (sn.nz === -1) obj.rotation.y = Math.PI;
          obj.userData.face = sn.face;

          // Rebuild stickerMeshes mapping: this mesh is now at a new state index
          const key = `${gx},${gy},${gz},${sn.face}`;
          const newIndex = STICKER_MAP[key];
          if (newIndex !== undefined) {
            obj.userData.stateIndex = newIndex;
            stickerMeshes[newIndex] = obj;
          }
        }
      }
    });
  }

  function getStickerNormal(sticker) {
    const wn = new THREE.Vector3(0, 0, 1);
    wn.applyQuaternion(sticker.getWorldQuaternion(new THREE.Quaternion()));
    wn.applyQuaternion(cubeGroup.getWorldQuaternion(new THREE.Quaternion()).invert());
    const ax = Math.abs(wn.x), ay = Math.abs(wn.y), az = Math.abs(wn.z);
    if (ay >= ax && ay >= az) return wn.y > 0 ? { face:'U',nx:0,ny:1,nz:0 } : { face:'D',nx:0,ny:-1,nz:0 };
    if (ax >= ay && ax >= az) return wn.x > 0 ? { face:'R',nx:1,ny:0,nz:0 } : { face:'L',nx:-1,ny:0,nz:0 };
    return wn.z > 0 ? { face:'F',nx:0,ny:0,nz:1 } : { face:'B',nx:0,ny:0,nz:-1 };
  }

  // Render
  let needsRender = true;
  function requestRender() { needsRender = true; }
  (function loop() {
    if (needsRender) { renderer.render(scene, camera); needsRender = false; }
    requestAnimationFrame(loop);
  })();

  function updateLetters(state, colorState) {
    for (let i = 0; i < 54; i++) {
      if (!stickerMeshes[i]) continue;
      const tex = createStickerTexture(state[i], FACE_COLORS[colorState[i]]);
      stickerMeshes[i].material.map = tex;
      stickerMeshes[i].material.color.setHex(0xffffff);
      stickerMeshes[i].material.needsUpdate = true;
    }
    requestRender();
  }

  // ========== INTERACTION: Screen-space projection approach ==========
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let interaction = null;
  let animating = false;

  function getPointerNDC(e) {
    const rect = canvasEl.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function hitTest(e) {
    getPointerNDC(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(cubeGroup.children, false);
    for (const hit of hits) {
      if (hit.object.userData.type === 'sticker') {
        return { face: hit.object.userData.face, cubiePos: hit.object.userData.cubiePos };
      }
    }
    return null;
  }

  /**
   * Project a cube-local 3D vector to screen-space direction (pixels).
   */
  function projectDir(localVec) {
    const a = new THREE.Vector3(0, 0, 0).applyMatrix4(cubeGroup.matrixWorld).project(camera);
    const b = localVec.clone().applyMatrix4(cubeGroup.matrixWorld).project(camera);
    const rect = canvasEl.getBoundingClientRect();
    return {
      x: (b.x - a.x) * rect.width / 2,
      y: -(b.y - a.y) * rect.height / 2, // flip Y: screen Y is inverted
    };
  }

  /**
   * For each face, define the two drag axes and what move they produce.
   * Each axis: { dir: Vector3 in cube-local space, getMove(cubiePos, sign) => moveString }
   */
  function getAxesForFace(face) {
    switch (face) {
      case 'U': return [
        { dir: new THREE.Vector3(1, 0, 0), getMove: (p, s) => pickLayer('z', p[2], face, s) },
        { dir: new THREE.Vector3(0, 0, 1), getMove: (p, s) => pickLayer('x', p[0], face, s) },
      ];
      case 'D': return [
        { dir: new THREE.Vector3(1, 0, 0), getMove: (p, s) => pickLayer('z', p[2], face, -s) },
        { dir: new THREE.Vector3(0, 0, 1), getMove: (p, s) => pickLayer('x', p[0], face, -s) },
      ];
      case 'F': return [
        { dir: new THREE.Vector3(1, 0, 0), getMove: (p, s) => pickLayer('y', p[1], face, -s) },
        { dir: new THREE.Vector3(0, 1, 0), getMove: (p, s) => pickLayer('x', p[0], face, s) },
      ];
      case 'B': return [
        { dir: new THREE.Vector3(1, 0, 0), getMove: (p, s) => pickLayer('y', p[1], face, s) },
        { dir: new THREE.Vector3(0, 1, 0), getMove: (p, s) => pickLayer('x', p[0], face, -s) },
      ];
      case 'R': return [
        { dir: new THREE.Vector3(0, 0, 1), getMove: (p, s) => pickLayer('y', p[1], face, s) },
        { dir: new THREE.Vector3(0, 1, 0), getMove: (p, s) => pickLayer('z', p[2], face, -s) },
      ];
      case 'L': return [
        { dir: new THREE.Vector3(0, 0, 1), getMove: (p, s) => pickLayer('y', p[1], face, -s) },
        { dir: new THREE.Vector3(0, 1, 0), getMove: (p, s) => pickLayer('z', p[2], face, s) },
      ];
    }
    return [];
  }

  function pickLayer(axis, val, face, sign) {
    if (axis === 'x') {
      if (val === -1) return sign > 0 ? "L'" : "L";
      if (val === 1)  return sign > 0 ? "R" : "R'";
      return sign > 0 ? "M'" : "M"; // middle X layer (M follows L direction)
    }
    if (axis === 'y') {
      if (val === 1)  return sign > 0 ? "U" : "U'";
      if (val === -1) return sign > 0 ? "D'" : "D";
      return sign > 0 ? "E'" : "E"; // middle Y layer (E follows D direction)
    }
    if (axis === 'z') {
      if (val === 1)  return sign > 0 ? "F" : "F'";
      if (val === -1) return sign > 0 ? "B'" : "B";
      return sign > 0 ? "S" : "S'"; // middle Z layer (S follows F direction)
    }
    return null;
  }

  function determineMoveFromScreenDrag(face, cubiePos, screenDx, screenDy) {
    const axes = getAxesForFace(face);
    let bestDot = 0, bestMove = null;

    for (const { dir, getMove } of axes) {
      const proj = projectDir(dir);
      const len = Math.sqrt(proj.x * proj.x + proj.y * proj.y);
      if (len < 0.01) continue;
      const dot = (proj.x / len) * screenDx + (proj.y / len) * screenDy;
      if (Math.abs(dot) > Math.abs(bestDot)) {
        bestDot = dot;
        bestMove = getMove(cubiePos, dot > 0 ? 1 : -1);
      }
    }
    return bestMove;
  }

  // Pointer events
  canvasEl.addEventListener('pointerdown', (e) => {
    if (animating) return;
    canvasEl.setPointerCapture(e.pointerId);
    const hit = hitTest(e);
    if (hit) {
      interaction = { type: 'face', face: hit.face, cubiePos: hit.cubiePos, sx: e.clientX, sy: e.clientY, resolved: false };
    } else {
      interaction = { type: 'orbit', lx: e.clientX, ly: e.clientY };
    }
  });

  canvasEl.addEventListener('pointermove', (e) => {
    if (!interaction) return;
    if (interaction.type === 'orbit') {
      const dx = e.clientX - interaction.lx, dy = e.clientY - interaction.ly;
      interaction.lx = e.clientX; interaction.ly = e.clientY;
      cubeGroup.rotation.y += dx * 0.008;
      cubeGroup.rotation.x = Math.max(-1.2, Math.min(1.2, cubeGroup.rotation.x + dy * 0.008));
      requestRender();
    }
    if (interaction.type === 'face' && !interaction.resolved) {
      const dx = e.clientX - interaction.sx, dy = e.clientY - interaction.sy;
      if (dx * dx + dy * dy > 144) { // 12px threshold
        interaction.resolved = true;
        const move = determineMoveFromScreenDrag(interaction.face, interaction.cubiePos, dx, dy);
        if (move && onMoveCallback) onMoveCallback(move);
      }
    }
  });

  canvasEl.addEventListener('pointerup', () => { interaction = null; });
  canvasEl.style.touchAction = 'none';
  canvasEl.style.cursor = 'grab';

  // ========== ANIMATION ==========
  function animateMove(move, stateAfter, colorStateAfter, duration = 200) {
    return new Promise(resolve => {
      animating = true;
      const isPrime = move.endsWith("'");
      const faceName = isPrime ? move.slice(0, -1) : move;
      const baseAngle = isPrime ? Math.PI / 2 : -Math.PI / 2;
      const axisVecs = { U:[0,1,0], D:[0,1,0], E:[0,1,0], F:[0,0,1], B:[0,0,1], S:[0,0,1], L:[1,0,0], R:[1,0,0], M:[1,0,0] };
      const rev = { D:1, B:1, L:1, M:1, E:1 };
      const finalAngle = rev[faceName] ? -baseAngle : baseAngle;
      const axis = new THREE.Vector3(...axisVecs[faceName]);
      const filters = {
        U:p=>p[1]===1, D:p=>p[1]===-1, E:p=>p[1]===0,
        F:p=>p[2]===1, B:p=>p[2]===-1, S:p=>p[2]===0,
        L:p=>p[0]===-1, R:p=>p[0]===1, M:p=>p[0]===0,
      };
      const filter = filters[faceName];

      const layerObjects = [];
      cubeGroup.children.forEach(c => { if (c.userData.cubiePos && filter(c.userData.cubiePos)) layerObjects.push(c); });

      const pivot = new THREE.Group();
      cubeGroup.add(pivot);
      for (const obj of layerObjects) pivot.attach(obj);

      const t0 = performance.now();
      (function tick() {
        const t = Math.min((performance.now() - t0) / duration, 1);
        const e = 1 - Math.pow(1 - t, 3);
        pivot.quaternion.identity();
        pivot.rotateOnAxis(axis, finalAngle * e);
        requestRender();
        if (t < 1) { requestAnimationFrame(tick); return; }
        for (const obj of [...pivot.children]) cubeGroup.attach(obj);
        pivot.removeFromParent();
        snapAllPositions();
        updateLetters(stateAfter, colorStateAfter);
        animating = false;
        resolve();
      })();
    });
  }

  // DOM
  const wrapperDiv = document.createElement('div');
  wrapperDiv.className = 'cube-viewport';
  wrapperDiv.appendChild(canvasEl);
  container.appendChild(wrapperDiv);

  window.addEventListener('resize', () => {
    const w = Math.min(460, window.innerWidth - 32);
    const h = Math.min(400, w * 0.85);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    requestRender();
  });

  return { element: wrapperDiv, updateLetters, animateMove, requestRender, setAnimating(v) { animating = v; } };
}
