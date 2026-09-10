import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";

// Original procedural masonry. No models or textures from the reference site.
export function createRuins() {
  const ruins = new THREE.Group();
  ruins.name = "Weathered limestone garden";
  let seed = 1847;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = textureCanvas.height = 256;
  const ctx = textureCanvas.getContext("2d")!;
  const pixels = ctx.createImageData(256, 256);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const tone = 160 + random() * 75;
    pixels.data.set([tone, tone, tone, 255], i);
  }
  ctx.putImageData(pixels, 0, 0);
  const grain = new THREE.CanvasTexture(textureCanvas);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(3, 6);
  const patinaCanvas = document.createElement("canvas");
  patinaCanvas.width = patinaCanvas.height = 512;
  const patina = patinaCanvas.getContext("2d")!;
  patina.fillStyle = "#d0ccba"; patina.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 420; i++) {
    const x = random() * 512, y = random() * 512, r = 4 + random() * 85;
    const wash = patina.createRadialGradient(x, y, 0, x, y, r);
    wash.addColorStop(0, i % 3 ? "#66705b10" : "#6c604d16"); wash.addColorStop(1, "#66604400");
    patina.fillStyle = wash; patina.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 14; i++) {
    let x = random() * 512, y = random() * 512;
    patina.beginPath(); patina.moveTo(x, y);
    for (let j = 0; j < 5; j++) { x += (random() - 0.5) * 16; y += random() * 14; patina.lineTo(x, y); }
    patina.lineWidth = 0.6; patina.strokeStyle = "#494b3740"; patina.stroke();
  }
  const weathering = new THREE.CanvasTexture(patinaCanvas);
  weathering.colorSpace = THREE.SRGBColorSpace;
  weathering.wrapS = weathering.wrapT = THREE.RepeatWrapping;
  const stone = new THREE.MeshStandardMaterial({ color: 0xd5d0bb, map: weathering, roughness: 0.94, bumpMap: grain, bumpScale: 0.055 });
  const broken = new THREE.MeshStandardMaterial({ color: 0x9e9c84, roughness: 1, bumpMap: grain, bumpScale: 0.08 });
  const ground = new THREE.MeshStandardMaterial({ color: 0x27382d, map: weathering, roughness: 0.88, metalness: 0.08, bumpMap: grain, bumpScale: 0.055 });
  const add = (parent: THREE.Group, geometry: THREE.BufferGeometry, material = stone) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  // A closed, genuinely fluted shaft with a fractured rim, not a plain cylinder.
  const shaft = (radius: number, height: number, phase: number) => {
    const positions: number[] = [], indices: number[] = [], uvs: number[] = [];
    const sides = 192, rows = 10;
    for (let row = 0; row <= rows; row++) {
      const v = row / rows;
      for (let j = 0; j <= sides; j++) {
        const a = j / sides * Math.PI * 2;
        const flute = 1 - 0.075 * (0.5 + 0.5 * Math.cos(a * 24));
        const r = radius * flute * (1 - v * 0.11 + Math.sin(v * Math.PI) * 0.024);
        const fracture = Math.sin(a * 3 + phase) * 0.21 + Math.sin(a * 7 + phase) * 0.08 + Math.sin(a * 13) * 0.035;
        const y = v * height + Math.pow(v, 8) * fracture;
        positions.push(Math.cos(a) * r, y, Math.sin(a) * r);
        uvs.push(j / sides, v);
        if (row < rows && j < sides) {
          const k = row * (sides + 1) + j;
          indices.push(k, k + sides + 1, k + 1, k + 1, k + sides + 1, k + sides + 2);
        }
      }
    }
    const center = positions.length / 3;
    positions.push(0, height - 0.14, 0);
    uvs.push(0.5, 0.5);
    for (let j = 0; j < sides; j++) indices.push(center, rows * (sides + 1) + j + 1, rows * (sides + 1) + j);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    return geometry;
  };
  const column = (x: number, z: number, height: number, radius: number, lean = 0) => {
    const group = new THREE.Group(); group.position.set(x, -2.49, z); group.rotation.z = lean;
    ruins.add(group);
    const base = add(group, new THREE.BoxGeometry(radius * 2.8, 0.22, radius * 2.8)); base.position.y = 0.11;
    const profile = [[0, 0], [radius * 1.35, 0], [radius * 1.35, 0.07], [radius * 1.2, 0.11], [radius * 1.2, 0.22], [radius, 0.32], [0, 0.32]].map(([r, y]) => new THREE.Vector2(r, y));
    add(group, new THREE.LatheGeometry(profile, 64)).position.y = 0.22;
    add(group, shaft(radius, height, random() * 6)).position.y = 0.54;
    // Fine joints reveal the individual stacked drums.
    for (let y = 1.6; y < height - 0.4; y += 1.45) {
      const seam = add(group, new THREE.TorusGeometry(radius * (1 - y / height * 0.11) * 0.963, 0.012, 4, 64), broken);
      seam.rotation.x = Math.PI / 2; seam.position.y = y + 0.54;
    }
    return group;
  };
  // Hero framing is intentionally asymmetric: a cropped foreground shaft,
  // a fallen drum, two distant survivors and a broken entablature.
  column(4.8, 2.5, 8.7, 0.7, -0.035);
  column(-9.1, 0.7, 4.4, 0.85, 0.045);
  column(3.65, -4.2, 4.8, 0.56, 0.018);
  column(-4.4, -6.8, 7.9, 0.54, -0.028);
  column(6.5, -10, 6.3, 0.58, 0.03);
  column(-1.1, -13.2, 2.3, 0.66, -0.11);
  const fallen = add(ruins, shaft(0.72, 3.2, 2));
  fallen.rotation.set(0.2, 0.4, Math.PI / 2 - 0.1); fallen.position.set(3.4, -1.66, 4.2);
  const lintel = add(ruins, new THREE.BoxGeometry(4.6, 0.46, 1.16));
  lintel.position.set(4.8, -1.95, -4.8); lintel.rotation.set(0.1, -0.5, -0.16);
  const trim = add(ruins, new THREE.BoxGeometry(4.8, 0.1, 1.3));
  trim.position.copy(lintel.position); trim.position.y += 0.26; trim.rotation.copy(lintel.rotation);
  for (let section = 1; section < 8; section++) {
    const z = -section * 18;
    const x = section % 2 ? -6 : 5;
    column(x + 5.6, z + 3, 5 + random() * 4, 0.55 + random() * 0.25, (random() - 0.5) * 0.1);
    column(x - 5.5, z - 5, 2 + random() * 5, 0.6, (random() - 0.5) * 0.16);
    column(x + 3.8, z - 9, 2 + random() * 3, 0.5);
    const drum = add(ruins, shaft(0.5, 2.3, random() * 6));
    drum.rotation.set(0.1, random() * 3, Math.PI / 2); drum.position.set(x + 4.1, -1.96, z - 1);
  }
  // Low fragments sit on the ground; their silhouettes stay out of the copy.
  const rubble = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 110; i++) {
    const z = 5 - random() * 141;
    const x = (random() < 0.5 ? -1 : 1) * (4.5 + random() * 5.5);
    const fragment = add(ruins, rubble, i % 3 ? stone : broken);
    const s = 0.12 + random() * 0.38;
    fragment.scale.set(s * 1.5, s * 0.7, s);
    fragment.rotation.set(random() * 3, random() * 3, random());
    fragment.position.set(x, -2.4 + s * 0.3, z);
  }
  const floor = add(ruins, new THREE.PlaneGeometry(400, 500), ground);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -2.5, -130); floor.castShadow = false;
  const shoreline = new THREE.Shape();
  shoreline.moveTo(-3.1, -2.4);
  shoreline.bezierCurveTo(-4.2, -0.4, -3.3, 2.5, -1.1, 3.1);
  shoreline.bezierCurveTo(0.7, 4.1, 4.7, 2.9, 4.4, 0.4);
  shoreline.bezierCurveTo(4.8, -2.1, 1.8, -4.3, -0.8, -3.5);
  shoreline.bezierCurveTo(-1.9, -3.1, -2.6, -3.3, -3.1, -2.4);
  const pool = new Reflector(new THREE.ShapeGeometry(shoreline, 40), {
    textureWidth: 768, textureHeight: 512, multisample: 0, clipBias: 0.003, color: 0x718174,
    shader: {
      name: "GardenPool",
      uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null } },
      vertexShader: `
        uniform mat4 textureMatrix;
        varying vec4 vUv;
        #include <common>
        #include <logdepthbuf_pars_vertex>
        void main() {
          vUv = textureMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          #include <logdepthbuf_vertex>
        }`,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        varying vec4 vUv;
        #include <logdepthbuf_pars_fragment>
        void main() {
          #include <logdepthbuf_fragment>
          vec2 uv = vUv.xy / vUv.w;
          vec3 reflected = texture2D(tDiffuse, uv).rgb * 0.4;
          reflected += texture2D(tDiffuse, uv + vec2(0.0015, 0.0)).rgb * 0.15;
          reflected += texture2D(tDiffuse, uv - vec2(0.0015, 0.0)).rgb * 0.15;
          reflected += texture2D(tDiffuse, uv + vec2(0.0, 0.0015)).rgb * 0.15;
          reflected += texture2D(tDiffuse, uv - vec2(0.0, 0.0015)).rgb * 0.15;
          gl_FragColor = vec4(mix(vec3(0.035, 0.055, 0.04), reflected, 0.58), 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    },
  });
  const renderReflection = pool.onBeforeRender;
  const reflectedSky = new THREE.Color(0x526052);
  pool.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
    const background = scene.background;
    // The atmosphere is a separate WebGPU canvas; give the reflection a matching
    // horizon rather than reflecting the transparent WebGL clear color as black.
    scene.background = reflectedSky;
    try { renderReflection.call(this, renderer, scene, camera, geometry, material, group); }
    finally { scene.background = background; }
  };
  pool.name = "Entrance reflecting pool";
  pool.rotation.x = -Math.PI / 2; pool.position.set(0.4, -2.435, 0.6);
  ruins.add(pool);
  // Long, imperfect paving slabs lead the eye into the camera journey.
  const slab = new THREE.BoxGeometry(2.7, 0.05, 3.2);
  for (let i = 0; i < 45; i++) {
    const tile = add(ruins, slab, ground);
    tile.position.set(-4.3 + Math.sin(i * 0.45) * 2, -2.49, 8 - i * 3.25);
    tile.rotation.y = Math.sin(i * 5) * 0.025;
  }
  return ruins;
}
