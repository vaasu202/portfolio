import * as THREE from "three";

/** A camera-relative volume: 320 stars, one draw call, no extra canvas or post pass. */
export function createStarTravel() {
  const count = 320, depth = 100;
  const seeds = new Float32Array(count * 3);
  const positions = new Float32Array(count * 6), colors = new Float32Array(count * 6);
  const random = THREE.MathUtils.seededRandom;
  random(1701);
  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2, radius = 5 + Math.sqrt(random()) * 42;
    seeds.set([Math.cos(angle) * radius, Math.sin(angle) * radius, random() * depth], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  const position = new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage);
  const color = new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", position); geometry.setAttribute("color", color);
  const material = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false,
  });
  const lines = new THREE.LineSegments(geometry, material);
  lines.frustumCulled = false; lines.visible = false;
  let distance: number | undefined, intensity = 0, direction = 1;
  return {
    lines,
    get intensity() { return intensity; },
    update(scroll: number, dt: number, paused: boolean) {
      const destination = scroll * 0.045;
      distance ??= destination;
      const previous = distance;
      distance = paused ? destination : THREE.MathUtils.damp(distance, destination, 8, dt);
      const velocity = dt > 0 ? (distance - previous) / dt : 0;
      if (Math.abs(velocity) > 0.1) direction = Math.sign(velocity);
      intensity = paused ? 0 : THREE.MathUtils.damp(intensity, Math.min(1, Math.abs(velocity) / 65), 7, dt);
      lines.visible = intensity > 0.012;
      if (!lines.visible) return;
      material.opacity = intensity * 0.72;
      const length = 0.15 + intensity * 5;
      for (let i = 0; i < count; i++) {
        const x = seeds[i * 3], y = seeds[i * 3 + 1];
        const z = 4 + THREE.MathUtils.euclideanModulo(seeds[i * 3 + 2] - distance, depth);
        const fade = THREE.MathUtils.smoothstep(z, 4, 12) * (1 - THREE.MathUtils.smoothstep(z, 75, 104));
        const j = i * 6;
        positions[j] = positions[j + 3] = x;
        positions[j + 1] = positions[j + 4] = y;
        positions[j + 2] = -z;
        positions[j + 5] = -Math.max(1, z + length * direction);
        // A warm white head tapering into a dim tail, with no hard wrap flashes.
        colors[j] = fade; colors[j + 1] = fade * 0.9; colors[j + 2] = fade * 0.8;
        colors[j + 3] = colors[j + 4] = colors[j + 5] = 0;
      }
      position.needsUpdate = color.needsUpdate = true;
    },
  };
}
