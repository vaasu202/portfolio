// Model geometry and weathered materials extracted from the user's BB-8 HTML.
// Its page, camera, floor, postprocessing, hearts and sound are intentionally excluded.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export function createBB8Model() {
const BODY_R = 2.10;
const HEAD_R = 1.02;
const HEAD_CONTACT_INSET = 0.025;




/* =========================================================
   TEXTURE HELPERS
========================================================= */

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeWeatherTexture(base, dirt, seed = 1) {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const rand = seeded(seed);

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 18000; i++) {
    const g = 205 + Math.floor(rand() * 40);
    ctx.fillStyle = `rgba(${g},${g},${g},${0.006 + rand() * 0.026})`;
    const x = rand() * size;
    const y = rand() * size;
    const s = 0.6 + rand() * 4.5;
    ctx.fillRect(x, y, s, s);
  }

  for (let i = 0; i < 640; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 4 + rand() * 30;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, dirt + '3a');
    grad.addColorStop(1, dirt + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 420; i++) {
    ctx.globalAlpha = 0.02 + rand() * 0.075;
    ctx.strokeStyle = dirt;
    ctx.lineWidth = 0.4 + rand() * 1.3;
    const x = rand() * size;
    const y = rand() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 125, y + (rand() - 0.5) * 24);
    ctx.stroke();
  }

  // fine scratches everywhere
  for (let i = 0; i < 2200; i++) {
    ctx.globalAlpha = 0.018 + rand() * 0.05;
    ctx.strokeStyle = rand() > 0.55 ? dirt : 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 0.25 + rand() * 0.85;
    const x = rand() * size;
    const y = rand() * size;
    const len = 4 + rand() * 24;
    const ang = rand() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len * 0.32);
    ctx.stroke();
  }

  // tiny paint chips
  for (let i = 0; i < 1800; i++) {
    ctx.globalAlpha = 0.018 + rand() * 0.07;
    const w = 0.8 + rand() * 2.5;
    const h = 0.8 + rand() * 2.8;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.22)' : dirt;
    ctx.fillRect(rand() * size, rand() * size, w, h);
  }

  // dusty vertical streaking and oily smudges
  for (let i = 0; i < 420; i++) {
    ctx.globalAlpha = 0.016 + rand() * 0.05;
    ctx.strokeStyle = dirt;
    ctx.lineWidth = 1 + rand() * 3.2;
    const x = rand() * size;
    const y = rand() * size;
    const len = 18 + rand() * 90;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 10, y + len);
    ctx.stroke();
  }

  for (let i = 0; i < 260; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 10 + rand() * 38;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, dirt + '42');
    grad.addColorStop(0.7, dirt + '10');
    grad.addColorStop(1, dirt + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function makeGrayNoise(seed = 2) {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const rand = seeded(seed);

  for (let i = 0; i < img.data.length; i += 4) {
    const v = 125 + Math.floor(rand() * 110);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.2, 2.2);
  return tex;
}

const whiteTex = makeWeatherTexture('#cabaa5', '#5b4633', 18);
const orangeTex = makeWeatherTexture('#c56a2d', '#552f1a', 77);
const metalTex = makeWeatherTexture('#958d84', '#403a34', 136);
const bumpTex = makeGrayNoise(204);

const MAT = {
  white: new THREE.MeshStandardMaterial({
    map: whiteTex,
    bumpMap: bumpTex,
    bumpScale: 0.012,
    color: 0xcfbda8,
    metalness: 0.08,
    roughness: 0.75
  }),

  orange: new THREE.MeshStandardMaterial({
    map: orangeTex,
    bumpMap: bumpTex,
    bumpScale: 0.010,
    color: 0xc56b32,
    metalness: 0.22,
    roughness: 0.60
  }),

  silver: new THREE.MeshStandardMaterial({
    map: metalTex,
    bumpMap: bumpTex,
    bumpScale: 0.008,
    color: 0x958d86,
    metalness: 0.68,
    roughness: 0.50
  }),

  dark: new THREE.MeshStandardMaterial({
    color: 0x171a21,
    metalness: 0.55,
    roughness: 0.35
  }),

  inset: new THREE.MeshStandardMaterial({
    color: 0x090b10,
    metalness: 0.32,
    roughness: 0.58
  }),

  glass: new THREE.MeshPhysicalMaterial({
    color: 0x020305,
    metalness: 0.08,
    roughness: 0.025,
    clearcoat: 1,
    clearcoatRoughness: 0.025
  }),

  blueLight: new THREE.MeshStandardMaterial({
    color: 0xc8deff,
    emissive: 0xb0d0ff,
    emissiveIntensity: 3.8,
    roughness: 0.14
  }),

  redLight: new THREE.MeshStandardMaterial({
    color: 0x36030a,
    emissive: 0xff3152,
    emissiveIntensity: 3.6,
    roughness: 0.18
  }),

  grime: new THREE.MeshStandardMaterial({
    color: 0x4e3d2f,
    metalness: 0.02,
    roughness: 0.98,
    transparent: true,
    opacity: 0.72
  }),


};

/* =========================================================
   GEOMETRY HELPERS
========================================================= */

function add(parent, geo, mat, pos = [0,0,0], rot = [0,0,0]) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  mesh.rotation.set(...rot);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function tangentBasis(normal) {
  const n = normal.clone().normalize();
  const ref = Math.abs(n.y) > 0.92 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const tangentX = new THREE.Vector3().crossVectors(ref, n).normalize();
  const tangentY = new THREE.Vector3().crossVectors(n, tangentX).normalize();
  return { n, tangentX, tangentY };
}

function domeNormal(polar, azimuth) {
  return new THREE.Vector3(
    Math.sin(polar) * Math.sin(azimuth),
    Math.cos(polar),
    Math.sin(polar) * Math.cos(azimuth)
  ).normalize();
}

function sphericalDiskGeometry(radius, normal, angularRadius, segments = 96, rings = 7, offset = 0.018) {
  const { n, tangentX, tangentY } = tangentBasis(normal);
  const vertices = [];
  const indices = [];

  const center = n.clone().multiplyScalar(radius + offset);
  vertices.push(center.x, center.y, center.z);

  for (let r = 1; r <= rings; r++) {
    const theta = angularRadius * (r / rings);
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const tangentDir = tangentX.clone().multiplyScalar(Math.cos(a)).add(tangentY.clone().multiplyScalar(Math.sin(a)));
      const dir = n.clone().multiplyScalar(Math.cos(theta)).add(tangentDir.multiplyScalar(Math.sin(theta))).normalize();
      const p = dir.multiplyScalar(radius + offset);
      vertices.push(p.x, p.y, p.z);
    }
  }

  for (let i = 0; i < segments; i++) indices.push(0, 1 + i, 1 + i + 1);

  const ringSize = segments + 1;
  for (let r = 1; r < rings; r++) {
    const prev = 1 + (r - 1) * ringSize;
    const curr = 1 + r * ringSize;
    for (let i = 0; i < segments; i++) {
      const a = prev + i, b = prev + i + 1, c = curr + i, d = curr + i + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function sphericalAnnulusGeometry(radius, normal, innerAngle, outerAngle, segments = 96, radialSegments = 4, offset = 0.022) {
  const { n, tangentX, tangentY } = tangentBasis(normal);
  const vertices = [];
  const indices = [];
  const ringSize = segments + 1;

  for (let r = 0; r <= radialSegments; r++) {
    const theta = THREE.MathUtils.lerp(innerAngle, outerAngle, r / radialSegments);
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const tangentDir = tangentX.clone().multiplyScalar(Math.cos(a)).add(tangentY.clone().multiplyScalar(Math.sin(a)));
      const dir = n.clone().multiplyScalar(Math.cos(theta)).add(tangentDir.multiplyScalar(Math.sin(theta))).normalize();
      const p = dir.multiplyScalar(radius + offset);
      vertices.push(p.x, p.y, p.z);
    }
  }

  for (let r = 0; r < radialSegments; r++) {
    for (let i = 0; i < segments; i++) {
      const a = r * ringSize + i, b = a + 1, c = (r + 1) * ringSize + i, d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function sphericalRectGeometry(radius, centerNormal, halfWidthAngle, halfHeightAngle, segX = 16, segY = 22, offset = 0.024) {
  const { n, tangentX, tangentY } = tangentBasis(centerNormal);
  const vertices = [];
  const indices = [];

  for (let iy = 0; iy <= segY; iy++) {
    const v = THREE.MathUtils.lerp(-halfHeightAngle, halfHeightAngle, iy / segY);
    for (let ix = 0; ix <= segX; ix++) {
      const u = THREE.MathUtils.lerp(-halfWidthAngle, halfWidthAngle, ix / segX);
      const dir = n.clone()
        .add(tangentX.clone().multiplyScalar(Math.tan(u)))
        .add(tangentY.clone().multiplyScalar(Math.tan(v)))
        .normalize();
      const p = dir.multiplyScalar(radius + offset);
      vertices.push(p.x, p.y, p.z);
    }
  }

  const row = segX + 1;
  for (let iy = 0; iy < segY; iy++) {
    for (let ix = 0; ix < segX; ix++) {
      const a = iy * row + ix, b = a + 1, c = (iy + 1) * row + ix, d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function curvedTubeOnSphere(radius, normal, radialAngleStart, radialAngleEnd, directionAngle, mat, tubeRadius = 0.035, offset = 0.05) {
  const { n, tangentX, tangentY } = tangentBasis(normal);
  const tangentDir = tangentX.clone().multiplyScalar(Math.cos(directionAngle)).add(tangentY.clone().multiplyScalar(Math.sin(directionAngle)));
  const pts = [];

  for (let i = 0; i <= 14; i++) {
    const theta = THREE.MathUtils.lerp(radialAngleStart, radialAngleEnd, i / 14);
    const dir = n.clone().multiplyScalar(Math.cos(theta)).add(tangentDir.clone().multiplyScalar(Math.sin(theta))).normalize();
    pts.push(dir.multiplyScalar(radius + offset));
  }

  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, 48, tubeRadius, 10, false);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/* =========================================================
   BODY DETAIL
========================================================= */

function createBodyPanel(parent, normal, outerAngle = 0.47, rotation = 0) {
  const group = new THREE.Group();
  parent.add(group);

  // closer to BB-8: thinner orange band, stronger metal ring and tighter center proportion
  add(group, sphericalAnnulusGeometry(BODY_R, normal, outerAngle * 0.76, outerAngle, 110, 5, 0.031), MAT.orange);
  add(group, sphericalAnnulusGeometry(BODY_R, normal, outerAngle * 0.72, outerAngle * 0.75, 110, 3, 0.041), MAT.grime);
  add(group, sphericalAnnulusGeometry(BODY_R, normal, outerAngle * 0.69, outerAngle * 0.715, 110, 2, 0.044), MAT.dark);

  add(group, sphericalAnnulusGeometry(BODY_R, normal, outerAngle * 0.36, outerAngle * 0.66, 104, 5, 0.030), MAT.silver);
  add(group, sphericalAnnulusGeometry(BODY_R, normal, outerAngle * 0.33, outerAngle * 0.355, 104, 2, 0.040), MAT.grime);
  add(group, sphericalAnnulusGeometry(BODY_R, normal, outerAngle * 0.30, outerAngle * 0.325, 104, 2, 0.043), MAT.dark);

  add(group, sphericalDiskGeometry(BODY_R, normal, outerAngle * 0.245, 86, 6, 0.039), MAT.white);
  add(group, sphericalDiskGeometry(BODY_R, normal, outerAngle * 0.215, 82, 4, 0.045), MAT.grime);
  add(group, sphericalDiskGeometry(BODY_R, normal, outerAngle * 0.098, 70, 5, 0.052), MAT.dark);

  for (let i = 0; i < 4; i++) {
    const spoke = curvedTubeOnSphere(BODY_R, normal, outerAngle * 0.33, outerAngle * 0.64, rotation + i * Math.PI / 2, MAT.orange, 0.040, 0.056);
    group.add(spoke);
  }

  // grime accents hugging the spoke roots
  for (let i = 0; i < 4; i++) {
    const spokeShadow = curvedTubeOnSphere(BODY_R, normal, outerAngle * 0.31, outerAngle * 0.49, rotation + i * Math.PI / 2, MAT.grime, 0.016, 0.058);
    group.add(spokeShadow);
  }

  const { n, tangentX, tangentY } = tangentBasis(normal);

  // perimeter fasteners, alternating materials as on used prop hardware
  for (let i = 0; i < 8; i++) {
    const a = rotation + (i / 8) * Math.PI * 2;
    const theta = outerAngle * 0.84;
    const tangentDir = tangentX.clone().multiplyScalar(Math.cos(a)).add(tangentY.clone().multiplyScalar(Math.sin(a)));
    const dir = n.clone().multiplyScalar(Math.cos(theta)).add(tangentDir.multiplyScalar(Math.sin(theta))).normalize();
    const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.042, 18, 12), i % 2 ? MAT.dark : MAT.silver);
    bolt.position.copy(dir.multiplyScalar(BODY_R + 0.067));
    bolt.castShadow = true;
    group.add(bolt);
  }

  // tiny seam grime dots between bolts
  for (let i = 0; i < 8; i++) {
    const a = rotation + (i / 8) * Math.PI * 2 + Math.PI / 8;
    const theta = outerAngle * 0.79;
    const tangentDir = tangentX.clone().multiplyScalar(Math.cos(a)).add(tangentY.clone().multiplyScalar(Math.sin(a)));
    const dir = n.clone().multiplyScalar(Math.cos(theta)).add(tangentDir.multiplyScalar(Math.sin(theta))).normalize();
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.018, 14, 10), MAT.grime);
    dot.position.copy(dir.multiplyScalar(BODY_R + 0.060));
    dot.castShadow = true;
    group.add(dot);
  }

  return group;
}

function addBodyPatch(normal, w, h, material, offset = 0.040, segX = 10, segY = 16) {
  return add(bodyPivot, sphericalRectGeometry(BODY_R, normal, w, h, segX, segY, offset), material);
}

function addBodyDisk(normal, angle, material, offset = 0.046, seg = 48, rings = 4) {
  return add(bodyPivot, sphericalDiskGeometry(BODY_R, normal, angle, seg, rings, offset), material);
}

function addBodyBolt(normal, size = 0.018, material = MAT.silver, offset = 0.070) {
  const bolt = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 12), material);
  bolt.position.copy(normal.clone().multiplyScalar(BODY_R + offset));
  bolt.castShadow = true;
  bolt.receiveShadow = true;
  bodyPivot.add(bolt);
  return bolt;
}

function addBodySlotBand(centerNormal, tangentAngle, count = 4, start = -0.16, step = 0.10, w = 0.016, h = 0.050, material = MAT.dark) {
  const { n, tangentX, tangentY } = tangentBasis(centerNormal);
  const dir = tangentX.clone().multiplyScalar(Math.cos(tangentAngle)).add(tangentY.clone().multiplyScalar(Math.sin(tangentAngle)));
  const perp = tangentY.clone().multiplyScalar(Math.cos(tangentAngle)).sub(tangentX.clone().multiplyScalar(Math.sin(tangentAngle)));

  for (let i = 0; i < count; i++) {
    const offsetA = start + i * step;
    const sample = n.clone().add(perp.clone().multiplyScalar(offsetA)).add(dir.clone().multiplyScalar(0.012)).normalize();
    addBodyPatch(sample, w, h, material, 0.048, 4, 8);
  }
}

/* =========================================================
   ROOT + BODY
========================================================= */

const bb8 = new THREE.Group();
bb8.position.set(0, BODY_R, 0);


const bodyPivot = new THREE.Group();
bb8.add(bodyPivot);

add(bodyPivot, new THREE.SphereGeometry(BODY_R, 192, 128), MAT.white);

createBodyPanel(bodyPivot, new THREE.Vector3(0, -0.16, 0.99).normalize(), 0.49, 0.10);
createBodyPanel(bodyPivot, new THREE.Vector3(0.88, 0.30, 0.42).normalize(), 0.43, 0.40);
createBodyPanel(bodyPivot, new THREE.Vector3(-0.86, 0.26, 0.46).normalize(), 0.43, -0.25);
createBodyPanel(bodyPivot, new THREE.Vector3(0.62, -0.68, -0.30).normalize(), 0.40, 0.15);
createBodyPanel(bodyPivot, new THREE.Vector3(-0.60, -0.68, -0.34).normalize(), 0.40, -0.35);
createBodyPanel(bodyPivot, new THREE.Vector3(0.05, 0.22, -1).normalize(), 0.44, 0.20);

for (const cfg of [
  // upper front shoulder accents
  { n: new THREE.Vector3(0.34, 0.74, 0.57).normalize(), w: 0.082, h: 0.21, offset: 0.031 },
  { n: new THREE.Vector3(-0.34, 0.74, 0.57).normalize(), w: 0.082, h: 0.21, offset: 0.031 },

  // narrower side accents
  { n: new THREE.Vector3(0.93, -0.02, -0.30).normalize(), w: 0.062, h: 0.18, offset: 0.032 },
  { n: new THREE.Vector3(-0.93, -0.02, -0.30).normalize(), w: 0.062, h: 0.18, offset: 0.032 },

  // rear upper accent
  { n: new THREE.Vector3(0.04, 0.90, -0.44).normalize(), w: 0.072, h: 0.16, offset: 0.032 },

  // smaller lower body accents
  { n: new THREE.Vector3(0.18, -0.74, 0.64).normalize(), w: 0.050, h: 0.14, offset: 0.033 },
  { n: new THREE.Vector3(-0.18, -0.74, 0.64).normalize(), w: 0.050, h: 0.14, offset: 0.033 }
]) {
  add(bodyPivot, sphericalRectGeometry(BODY_R, cfg.n, cfg.w, cfg.h, 14, 22, cfg.offset), MAT.orange);
  add(bodyPivot, sphericalRectGeometry(BODY_R, cfg.n, cfg.w * 1.08, cfg.h * 1.05, 10, 16, cfg.offset + 0.006), MAT.grime);
}

for (const [x, y, z, r, mat] of [
  [0.60,  0.70,  0.95, 0.14, MAT.dark],
  [-0.66, 0.64,  0.98, 0.11, MAT.silver],
  [0.92, -0.48,  0.60, 0.12, MAT.dark],
  [-0.90,-0.45,  0.62, 0.12, MAT.silver],
  [0.28,  0.92, -0.80, 0.10, MAT.dark],
  [-0.18, -1.05, 0.64, 0.09, MAT.silver],
  [0.84, 0.20, -0.62, 0.09, MAT.dark]
]) {
  const n = new THREE.Vector3(x, y, z).normalize();
  add(bodyPivot, sphericalDiskGeometry(BODY_R, n, r, 48, 4, 0.052), mat);
}

// equatorial trim and latitude details with grime hugged along the edges
add(bodyPivot, new THREE.TorusGeometry(BODY_R * 0.985, 0.018, 18, 220), MAT.silver, [0, 0, 0], [Math.PI / 2, 0, 0]);
add(bodyPivot, new THREE.TorusGeometry(BODY_R * 0.972, 0.006, 12, 220), MAT.grime, [0, 0, 0], [Math.PI / 2, 0, 0]);
add(bodyPivot, new THREE.TorusGeometry(BODY_R * 0.998, 0.006, 12, 220), MAT.grime, [0, 0, 0], [Math.PI / 2, 0, 0]);
add(bodyPivot, new THREE.TorusGeometry(BODY_R * 0.94, 0.010, 14, 180), MAT.dark, [0, 0, 0], [Math.PI / 2, 0, 0]);

for (const y of [0.92, -0.92]) {
  const latR = Math.sqrt(BODY_R * BODY_R - y * y);
  add(bodyPivot, new THREE.TorusGeometry(latR, 0.012, 12, 160), MAT.silver, [0, y, 0], [Math.PI / 2, 0, 0]);
  add(bodyPivot, new THREE.TorusGeometry(latR * 1.006, 0.004, 10, 160), MAT.grime, [0, y, 0], [Math.PI / 2, 0, 0]);
}

for (const cfg of [
  { n: new THREE.Vector3(0.16, 0.52, 0.84).normalize(), w: 0.05, h: 0.16, mat: MAT.dark },
  { n: new THREE.Vector3(-0.18, 0.54, 0.82).normalize(), w: 0.05, h: 0.16, mat: MAT.dark },
  { n: new THREE.Vector3(0.42, 0.14, 0.90).normalize(), w: 0.04, h: 0.13, mat: MAT.silver },
  { n: new THREE.Vector3(-0.42, 0.14, 0.90).normalize(), w: 0.04, h: 0.13, mat: MAT.silver },
  { n: new THREE.Vector3(0.70, 0.50, -0.46).normalize(), w: 0.06, h: 0.13, mat: MAT.dark },
  { n: new THREE.Vector3(-0.72, 0.44, -0.46).normalize(), w: 0.06, h: 0.13, mat: MAT.dark },
  { n: new THREE.Vector3(0.14, -0.36, 0.93).normalize(), w: 0.035, h: 0.12, mat: MAT.silver },
  { n: new THREE.Vector3(-0.14, -0.36, 0.93).normalize(), w: 0.035, h: 0.12, mat: MAT.silver }
]) {
  add(bodyPivot, sphericalRectGeometry(BODY_R, cfg.n, cfg.w, cfg.h, 10, 18, 0.041), cfg.mat);
}

// extra micro-bolts to make the whole shell feel denser
for (const [polar, az, size, mat] of [
  [0.58, 0.26, 0.020, MAT.silver], [0.56, -0.24, 0.020, MAT.silver],
  [1.05, 0.96, 0.018, MAT.dark],   [1.08, -0.96, 0.018, MAT.dark],
  [1.56, 0.22, 0.020, MAT.silver], [1.56, -0.22, 0.020, MAT.silver],
  [1.86, 2.30, 0.018, MAT.dark],   [1.86, -2.30, 0.018, MAT.dark],
  [0.96, 2.74, 0.020, MAT.silver], [0.96, -2.74, 0.020, MAT.silver],
  [2.26, 0.80, 0.018, MAT.dark],   [2.26, -0.80, 0.018, MAT.dark]
]) {
  const n = domeNormal(polar, az);
  const bolt = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 12), mat);
  bolt.position.copy(n.multiplyScalar(BODY_R + 0.072));
  bolt.castShadow = true;
  bolt.receiveShadow = true;
  bodyPivot.add(bolt);
}

// curated front-facing body arrangement, cleaner and closer to the film prop
addBodyPatch(new THREE.Vector3(0.00, 0.62, 0.78).normalize(), 0.082, 0.040, MAT.dark, 0.046, 8, 5);
addBodyPatch(new THREE.Vector3(0.00, 0.69, 0.72).normalize(), 0.066, 0.032, MAT.orange, 0.043, 7, 5);

// central tall front service plate
addBodyPatch(new THREE.Vector3(-0.02, 0.34, 0.94).normalize(), 0.060, 0.205, MAT.silver, 0.043, 8, 17);
addBodyPatch(new THREE.Vector3(-0.02, 0.34, 0.94).normalize(), 0.068, 0.214, MAT.grime, 0.048, 8, 17);

// narrow side inserts flanking the service plate
addBodyPatch(new THREE.Vector3(-0.16, 0.36, 0.92).normalize(), 0.020, 0.158, MAT.dark, 0.047, 4, 14);
addBodyPatch(new THREE.Vector3(0.14, 0.36, 0.92).normalize(), 0.020, 0.158, MAT.dark, 0.047, 4, 14);

// smaller upper-left and mid-right framed blocks
addBodyPatch(new THREE.Vector3(-0.26, 0.44, 0.86).normalize(), 0.030, 0.112, MAT.silver, 0.046, 5, 11);
addBodyPatch(new THREE.Vector3(0.27, 0.24, 0.91).normalize(), 0.050, 0.096, MAT.dark, 0.046, 6, 10);

// front slot stacks, intentionally placed rather than evenly procedural
addBodySlotBand(new THREE.Vector3(-0.31, 0.14, 0.94).normalize(), 0.0, 5, -0.16, 0.078, 0.012, 0.042, MAT.dark);
addBodySlotBand(new THREE.Vector3(0.34, 0.08, 0.93).normalize(), 0.0, 4, -0.12, 0.084, 0.011, 0.040, MAT.silver);

// lower-right vent bank and lower-left framed notch
addBodyPatch(new THREE.Vector3(0.30, -0.04, 0.95).normalize(), 0.028, 0.118, MAT.dark, 0.047, 4, 12);
addBodyPatch(new THREE.Vector3(-0.34, -0.08, 0.93).normalize(), 0.040, 0.082, MAT.dark, 0.046, 5, 8);
addBodyPatch(new THREE.Vector3(-0.34, -0.08, 0.93).normalize(), 0.052, 0.094, MAT.silver, 0.042, 6, 8);

// front panel cutlines, cleaner and less random
for (const cfg of [
  { n: new THREE.Vector3(0.30, 0.80, 0.50).normalize(), w: 0.018, h: 0.090, mat: MAT.dark, off: 0.046 },
  { n: new THREE.Vector3(-0.30, 0.80, 0.50).normalize(), w: 0.018, h: 0.090, mat: MAT.dark, off: 0.046 },
  { n: new THREE.Vector3(0.54, 0.66, 0.34).normalize(), w: 0.015, h: 0.082, mat: MAT.silver, off: 0.046 },
  { n: new THREE.Vector3(-0.54, 0.66, 0.34).normalize(), w: 0.015, h: 0.082, mat: MAT.silver, off: 0.046 },
  { n: new THREE.Vector3(0.56, 0.00, 0.83).normalize(), w: 0.014, h: 0.110, mat: MAT.dark, off: 0.046 },
  { n: new THREE.Vector3(-0.56, 0.00, 0.83).normalize(), w: 0.014, h: 0.110, mat: MAT.dark, off: 0.046 },
  { n: new THREE.Vector3(0.12, -0.74, 0.65).normalize(), w: 0.018, h: 0.090, mat: MAT.dark, off: 0.046 },
  { n: new THREE.Vector3(-0.12, -0.74, 0.65).normalize(), w: 0.018, h: 0.090, mat: MAT.dark, off: 0.046 },
  { n: new THREE.Vector3(0.64, 0.52, -0.48).normalize(), w: 0.017, h: 0.092, mat: MAT.dark, off: 0.046 },
  { n: new THREE.Vector3(-0.64, 0.52, -0.48).normalize(), w: 0.017, h: 0.092, mat: MAT.dark, off: 0.046 },
  { n: new THREE.Vector3(0.04, 0.08, -0.99).normalize(), w: 0.024, h: 0.132, mat: MAT.silver, off: 0.045 }
]) {
  addBodyPatch(cfg.n, cfg.w, cfg.h, cfg.mat, cfg.off, 4, 10);
}

// small inspection ports placed with a more intentional front read
addBodyDisk(new THREE.Vector3(0.40, -0.22, 0.89).normalize(), 0.032, MAT.silver, 0.051, 34, 4);
addBodyDisk(new THREE.Vector3(-0.40, -0.24, 0.88).normalize(), 0.028, MAT.dark, 0.051, 32, 4);
addBodyDisk(new THREE.Vector3(0.02, 0.18, 0.98).normalize(), 0.020, MAT.dark, 0.050, 28, 4);

// tiny circular inspection ports and seams
for (const [x, y, z, r, mat] of [
  [0.22, 0.76, 0.62, 0.028, MAT.dark],
  [-0.22, 0.76, 0.62, 0.028, MAT.dark],
  [0.48, 0.36, 0.80, 0.026, MAT.silver],
  [-0.48, 0.36, 0.80, 0.026, MAT.silver],
  [0.62, -0.08, 0.76, 0.024, MAT.dark],
  [-0.62, -0.08, 0.76, 0.024, MAT.dark],
  [0.16, -0.62, 0.76, 0.022, MAT.silver],
  [-0.16, -0.62, 0.76, 0.022, MAT.silver],
  [0.72, 0.42, -0.40, 0.023, MAT.dark],
  [-0.72, 0.42, -0.40, 0.023, MAT.dark]
]) {
  addBodyDisk(new THREE.Vector3(x, y, z).normalize(), r, mat, 0.052, 32, 4);
}

// extra micro seam fasteners
for (const [polar, az, size, mat] of [
  [0.72, 0.16, 0.014, MAT.silver], [0.72, -0.16, 0.014, MAT.silver],
  [0.82, 0.58, 0.014, MAT.dark],   [0.82, -0.58, 0.014, MAT.dark],
  [1.12, 0.44, 0.014, MAT.silver], [1.12, -0.44, 0.014, MAT.silver],
  [1.30, 1.18, 0.014, MAT.dark],   [1.30, -1.18, 0.014, MAT.dark],
  [1.62, 0.92, 0.014, MAT.silver], [1.62, -0.92, 0.014, MAT.silver],
  [1.92, 2.70, 0.014, MAT.dark],   [1.92, -2.70, 0.014, MAT.dark]
]) {
  addBodyBolt(domeNormal(polar, az), size, mat, 0.073);
}

// localized edge grime around major body seams and panel edges
for (const cfg of [
  { n: new THREE.Vector3(0.38, 0.72, 0.55).normalize(), w: 0.090, h: 0.220 },
  { n: new THREE.Vector3(-0.38, 0.72, 0.55).normalize(), w: 0.090, h: 0.220 },
  { n: new THREE.Vector3(0.92, -0.02, -0.30).normalize(), w: 0.066, h: 0.18 },
  { n: new THREE.Vector3(-0.92, -0.02, -0.30).normalize(), w: 0.066, h: 0.18 },
  { n: new THREE.Vector3(0.05, 0.90, -0.44).normalize(), w: 0.074, h: 0.16 },
  { n: new THREE.Vector3(0.00, 0.34, 0.94).normalize(), w: 0.072, h: 0.20 },
  { n: new THREE.Vector3(0.27, 0.24, 0.91).normalize(), w: 0.056, h: 0.10 },
  { n: new THREE.Vector3(-0.34, -0.08, 0.93).normalize(), w: 0.052, h: 0.09 },
  { n: new THREE.Vector3(0.16, -0.74, 0.64).normalize(), w: 0.056, h: 0.15 },
  { n: new THREE.Vector3(-0.16, -0.74, 0.64).normalize(), w: 0.056, h: 0.15 }
]) {
  addBodyPatch(cfg.n, cfg.w, cfg.h, MAT.grime, 0.050, 8, 16);
}

// seam grime dots close to selected utility rectangles
for (const [polar, az, size] of [
  [0.68, 0.48, 0.012], [0.68, -0.48, 0.012],
  [0.96, 0.72, 0.012], [0.96, -0.72, 0.012],
  [1.26, 0.20, 0.011], [1.26, -0.20, 0.011],
  [1.72, 0.82, 0.011], [1.72, -0.82, 0.011]
]) {
  addBodyBolt(domeNormal(polar, az), size, MAT.grime, 0.072);
}

// heavier worn-out zones for a stronger movie-used finish
for (const cfg of [
  { n: new THREE.Vector3(0.00, -0.26, 0.96).normalize(), w: 0.11, h: 0.26 },
  { n: new THREE.Vector3(0.26, -0.44, 0.86).normalize(), w: 0.10, h: 0.20 },
  { n: new THREE.Vector3(-0.26, -0.44, 0.86).normalize(), w: 0.10, h: 0.20 },
  { n: new THREE.Vector3(0.58, -0.22, 0.78).normalize(), w: 0.07, h: 0.18 },
  { n: new THREE.Vector3(-0.58, -0.22, 0.78).normalize(), w: 0.07, h: 0.18 },
  { n: new THREE.Vector3(0.10, -0.84, 0.52).normalize(), w: 0.08, h: 0.18 },
  { n: new THREE.Vector3(-0.10, -0.84, 0.52).normalize(), w: 0.08, h: 0.18 }
]) {
  addBodyPatch(cfg.n, cfg.w, cfg.h, MAT.grime, 0.054, 10, 18);
}

// extra dirty seam nodes along the lower shell
for (const [polar, az] of [
  [1.36, 0.28], [1.36, -0.28],
  [1.52, 0.74], [1.52, -0.74],
  [1.76, 1.04], [1.76, -1.04],
  [2.04, 0.42], [2.04, -0.42]
]) {
  addBodyBolt(domeNormal(polar, az), 0.013, MAT.grime, 0.074);
}

/* =========================================================
   HEAD
========================================================= */

const headRig = new THREE.Group();
bb8.add(headRig);

const head = new THREE.Group();
headRig.add(head);

add(head, new THREE.CylinderGeometry(0.94, 0.88, 0.20, 128), MAT.silver, [0, -0.085, 0]);
add(head, new THREE.CylinderGeometry(0.87, 0.87, 0.035, 128), MAT.dark, [0, -0.185, 0]);
add(head, new THREE.CylinderGeometry(0.96, 0.96, 0.16, 128, 1, true), MAT.orange, [0, 0.01, 0]);
add(head, new THREE.SphereGeometry(HEAD_R, 168, 104, 0, Math.PI * 2, 0, Math.PI / 2), MAT.white, [0, 0, 0]);

function addHeadPatch(normal, w, h, material, offset = 0.024, segX = 16, segY = 20) {
  return add(head, sphericalRectGeometry(HEAD_R, normal, w, h, segX, segY, offset), material);
}

function addHeadDisk(normal, angle, material, offset = 0.03, seg = 56, rings = 5) {
  return add(head, sphericalDiskGeometry(HEAD_R, normal, angle, seg, rings, offset), material);
}

function addHeadBolt(normal, size = 0.030, material = MAT.silver, offset = 0.06) {
  const bolt = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 12), material);
  bolt.position.copy(normal.clone().multiplyScalar(HEAD_R + offset));
  bolt.castShadow = true;
  bolt.receiveShadow = true;
  head.add(bolt);
  return bolt;
}

function addLensAssembly(normal, outerR, innerR, depth = 0.11, innerMat = MAT.glass) {
  const axisY = new THREE.Vector3(0, 1, 0);

  const outerRing = new THREE.Mesh(new THREE.CylinderGeometry(outerR, outerR, depth, 72), MAT.dark);
  outerRing.quaternion.setFromUnitVectors(axisY, normal);
  outerRing.position.copy(normal.clone().multiplyScalar(HEAD_R + 0.060));
  outerRing.castShadow = true;
  outerRing.receiveShadow = true;
  head.add(outerRing);

  const silverTrim = new THREE.Mesh(new THREE.CylinderGeometry(outerR * 0.82, outerR * 0.82, depth * 0.4, 72), MAT.silver);
  silverTrim.quaternion.setFromUnitVectors(axisY, normal);
  silverTrim.position.copy(normal.clone().multiplyScalar(HEAD_R + 0.098));
  silverTrim.castShadow = true;
  silverTrim.receiveShadow = true;
  head.add(silverTrim);

  const innerLens = new THREE.Mesh(new THREE.CylinderGeometry(innerR, innerR, depth * 0.55, 72), innerMat);
  innerLens.quaternion.setFromUnitVectors(axisY, normal);
  innerLens.position.copy(normal.clone().multiplyScalar(HEAD_R + 0.145));
  innerLens.castShadow = true;
  innerLens.receiveShadow = true;
  head.add(innerLens);

  return { normal, outerRing, silverTrim, innerLens };
}

/* head panels */
addHeadPatch(domeNormal(0.78, 0.0), 0.100, 0.31, MAT.orange, 0.025, 16, 26);
addHeadPatch(domeNormal(0.80, -0.47), 0.11, 0.18, MAT.orange, 0.026, 14, 18);
addHeadPatch(domeNormal(0.80,  0.47), 0.11, 0.18, MAT.orange, 0.026, 14, 18);

for (const n of [
  domeNormal(0.50, -0.56),
  domeNormal(0.42, -0.24),
  domeNormal(0.42,  0.24),
  domeNormal(0.50,  0.56)
]) addHeadPatch(n, 0.035, 0.13, MAT.silver, 0.028, 8, 14);

addHeadPatch(domeNormal(1.06, -1.02), 0.16, 0.18, MAT.orange, 0.026, 16, 18);
addHeadPatch(domeNormal(1.06,  1.02), 0.16, 0.18, MAT.orange, 0.026, 16, 18);
addHeadPatch(domeNormal(0.92, -1.34), 0.12, 0.14, MAT.silver, 0.029, 12, 14);
addHeadPatch(domeNormal(0.92,  1.34), 0.12, 0.14, MAT.silver, 0.029, 12, 14);
addHeadPatch(domeNormal(0.58, Math.PI), 0.11, 0.26, MAT.orange, 0.025, 14, 20);
addHeadPatch(domeNormal(0.84, 2.56), 0.09, 0.16, MAT.orange, 0.025, 10, 14);
addHeadPatch(domeNormal(0.84, -2.56), 0.09, 0.16, MAT.orange, 0.025, 10, 14);

for (const n of [
  domeNormal(0.42, 2.72),
  domeNormal(0.36, Math.PI),
  domeNormal(0.42, -2.72)
]) addHeadPatch(n, 0.05, 0.11, MAT.silver, 0.028, 8, 12);

for (const az of [-0.82, -0.36, 0.36, 0.82, 2.72, -2.72]) {
  const p = new THREE.Vector3(Math.sin(az) * 0.86, 0.17, Math.cos(az) * 0.86).normalize();
  addHeadPatch(p, 0.055, 0.085, MAT.white, 0.032, 8, 10);
}

addHeadDisk(domeNormal(0.20, 0.18), 0.11, MAT.silver, 0.032, 48, 4);
addHeadDisk(domeNormal(0.20, 0.18), 0.06, MAT.dark, 0.040, 40, 4);
addHeadPatch(domeNormal(0.86, 0.0), 0.16, 0.07, MAT.silver, 0.030, 10, 8);

for (const n of [
  domeNormal(0.98, -0.72),
  domeNormal(0.98,  0.72),
  domeNormal(1.05, -0.48),
  domeNormal(1.05,  0.48)
]) addHeadPatch(n, 0.045, 0.05, MAT.silver, 0.032, 8, 8);

/* optics */
const mainEyeNormal = domeNormal(0.60, 0.0);
const secondaryEyeNormal = domeNormal(0.90, 0.42);
const redIndicatorNormal = domeNormal(0.93, -0.44);

addLensAssembly(mainEyeNormal, 0.27, 0.17, 0.15, MAT.glass);
addLensAssembly(secondaryEyeNormal, 0.115, 0.070, 0.11, MAT.blueLight);
addLensAssembly(redIndicatorNormal, 0.080, 0.046, 0.09, MAT.redLight);

const mainPupil = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.045, 48), MAT.inset);
mainPupil.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), mainEyeNormal);
mainPupil.position.copy(mainEyeNormal.clone().multiplyScalar(HEAD_R + 0.18));
mainPupil.castShadow = true;
mainPupil.receiveShadow = true;
head.add(mainPupil);

for (const [polar, az, r] of [
  [0.95, -0.16, 0.030],
  [0.96,  0.18, 0.028],
  [0.76,  0.72, 0.034],
  [0.73, -0.70, 0.028]
]) {
  const n = domeNormal(polar, az);
  addLensAssembly(n, r * 1.5, r, 0.05, MAT.silver);
}

addHeadPatch(domeNormal(0.63, 0.0), 0.20, 0.11, MAT.dark, 0.034, 14, 10);

for (let i = 0; i < 4; i++) {
  addHeadPatch(domeNormal(0.70 + i * 0.045, -0.22), 0.022, 0.045, MAT.dark, 0.036, 4, 8);
}

for (const n of [
  domeNormal(0.72, -0.86),
  domeNormal(0.72,  0.86),
  domeNormal(1.14, -0.18),
  domeNormal(1.14,  0.18),
  domeNormal(0.58, -1.34),
  domeNormal(0.58,  1.34)
]) addHeadBolt(n, 0.022, MAT.silver, 0.065);

// additional concentric trim around the lit optics
add(head, sphericalDiskGeometry(HEAD_R, secondaryEyeNormal, 0.055, 50, 4, 0.156), MAT.dark);
add(head, sphericalDiskGeometry(HEAD_R, redIndicatorNormal, 0.040, 44, 4, 0.150), MAT.dark);

// extra forehead banding and side seam density
for (const n of [
  domeNormal(0.58, -0.95), domeNormal(0.58, -0.74), domeNormal(0.58, 0.74), domeNormal(0.58, 0.95),
  domeNormal(0.48, -1.55), domeNormal(0.48, 1.55),
  domeNormal(0.98, -1.72), domeNormal(0.98, 1.72)
]) {
  addHeadPatch(n, 0.030, 0.090, MAT.silver, 0.032, 6, 10);
}

// cheek vent stacks
for (const az of [-1.16, 1.16]) {
  for (let i = 0; i < 4; i++) {
    addHeadPatch(domeNormal(1.08 + i * 0.05, az), 0.018, 0.040, MAT.dark, 0.036, 4, 8);
  }
}

// subtle panel interruptions on rear dome
for (const n of [
  domeNormal(0.70, 2.96), domeNormal(0.70, -2.96),
  domeNormal(0.96, 2.82), domeNormal(0.96, -2.82),
  domeNormal(0.30, 2.30), domeNormal(0.30, -2.30)
]) {
  addHeadDisk(n, 0.032, MAT.dark, 0.038, 32, 4);
}

// dense micro fasteners around the dome
for (const [polar, az, size, mat] of [
  [0.52, -1.18, 0.016, MAT.silver], [0.52, 1.18, 0.016, MAT.silver],
  [0.66, -2.24, 0.016, MAT.dark],   [0.66, 2.24, 0.016, MAT.dark],
  [0.86, -2.76, 0.017, MAT.silver], [0.86, 2.76, 0.017, MAT.silver],
  [1.08, -0.92, 0.016, MAT.dark],   [1.08, 0.92, 0.016, MAT.dark],
  [1.12, -2.02, 0.016, MAT.silver], [1.12, 2.02, 0.016, MAT.silver]
]) {
  addHeadBolt(domeNormal(polar, az), size, mat, 0.066);
}

/* antennae */
add(head, new THREE.CylinderGeometry(0.055, 0.065, 0.11, 32), MAT.dark, [-0.19, 0.94, -0.05]);
add(head, new THREE.CylinderGeometry(0.045, 0.055, 0.10, 32), MAT.silver, [0.14, 0.91, -0.03]);

add(head, new THREE.CylinderGeometry(0.016, 0.016, 0.74, 18), MAT.dark, [-0.19, 1.34, -0.05]);
add(head, new THREE.CylinderGeometry(0.010, 0.010, 0.54, 18), MAT.silver, [0.14, 1.20, -0.03]);

add(head, new THREE.SphereGeometry(0.027, 18, 12), MAT.dark, [-0.19, 1.72, -0.05]);
add(head, new THREE.SphereGeometry(0.020, 18, 12), MAT.silver, [0.14, 1.48, -0.03]);

for (const n of [domeNormal(0.38, 2.25), domeNormal(0.38, -2.25), domeNormal(1.10, Math.PI)]) {
  addHeadBolt(n, 0.024, MAT.dark, 0.064);
}

/* head attached to body surface */
headRig.position.set(0, BODY_R - HEAD_CONTACT_INSET, 0);


  // Hundreds of static detail meshes become a small set of material batches.
  // The head remains independent so its gallery animation is preserved.
  batch(bodyPivot); batch(head);
  bb8.name = "BB-8";
  let reactionAt = -100, elapsed = 0;
  bb8.userData.bb8Runtime = {
    update(time) {
      elapsed = time;
      const reaction = Math.max(0, 1 - (time - reactionAt) / 2.2);
      // A quiet patrol keeps the droid alive while staying inside the plinth.
      const travelX = Math.sin(time * 0.58) * 0.8;
      const travelZ = Math.sin(time * 0.33) * 0.28;
      bb8.position.set(travelX, BODY_R, travelZ);
      bb8.rotation.y = Math.sin(time * 0.26) * 0.12;
      bodyPivot.rotation.z = -travelX / BODY_R;
      bodyPivot.rotation.x = travelZ / BODY_R;
      headRig.rotation.y = Math.sin(time * 0.65) * 0.22 - bb8.rotation.y;
      headRig.rotation.z = Math.sin(time * 1.1) * 0.025 + Math.sin((time - reactionAt) * 7) * reaction * 0.12;
      headRig.rotation.x = Math.sin(time * 0.9) * 0.015;
    },
    activate() { reactionAt = elapsed; },
  };
  return bb8;
}

function batch(root) {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const groups = new Map(), originals = new Set();
  root.traverse(child => {
    if (!child.isMesh) return;
    const geometry = child.geometry.clone();
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, child.matrixWorld));
    if (!geometry.getAttribute("uv")) geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(geometry.getAttribute("position").count * 2), 2));
    if (!geometry.index) geometry.setIndex(Array.from({length: geometry.getAttribute("position").count}, (_,i) => i));
    if (!groups.has(child.material)) groups.set(child.material, []);
    groups.get(child.material).push(geometry);
    originals.add(child.geometry);
  });
  root.clear();
  for (const [material, geometries] of groups) {
    const merged = mergeGeometries(geometries, false);
    if (!merged) throw new Error("BB-8 detail geometry could not be merged");
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
    geometries.forEach(geometry => geometry.dispose());
  }
  originals.forEach(geometry => geometry.dispose());
}
