import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { effect, init, target } from "vgpu/node";

// Explicit GPU check: node --test tests/gallery-atmosphere.test.mjs
// Runs the exact shader served to the browser and checks its camera convention.
test("garden atmosphere renders deterministic pixels and correct camera rays", async () => {
  const source = readFileSync("public/shaders/gallery-atmosphere.wgsl", "utf8");
  const gpu = await init();
  try {
    const helpers = source.slice(0, source.indexOf("struct Camera"));
    const probe = target(gpu, { size: [3, 1] });
    effect(gpu, `${helpers}
      @fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
        let ray = camera_ray(vec2f(uv.x, 0.5), 1.7, 0.344, vec3f(1,0,0), vec3f(0,1,0), vec3f(0,0,-1));
        return vec4f(ray * 0.5 + 0.5, extinction(0.028, 3.6));
      }`).draw(probe);
    const pixels = await probe.read();
    const errors = [];
    for (let i = 0; i < 3; i++) {
      const x = ((i + 0.5) / 3 * 2 - 1) * 1.7 * 0.344;
      const length = Math.hypot(x, 1);
      const expected = [x / length * 0.5 + 0.5, 0.5, -1 / length * 0.5 + 0.5, Math.exp(-0.028 * 3.6)];
      expected.forEach((value, c) => errors.push(Math.abs(value - pixels[i * 4 + c] / 255)));
    }
    assert.ok(Math.max(...errors) <= 2 / 255, "camera ray / extinction extraction exceeds RGBA8 tolerance");
    const output = target(gpu, { size: [640, 360] });
    const fog = effect(gpu, source, { set: { camera: {
      origin: [-2.8, 1.05, 10.3], time: 4, right: [1,0,0], up: [0,1,0],
      forward: [0,0,-1], aspect: 640 / 360, lens: 0.344, debug: 0,
    } } });
    fog.draw(output);
    const first = await output.read();
    fog.draw(output);
    assert.deepEqual(await output.read(), first, "fixed uniforms must produce identical pixels");
    const range = [...first.filter((_, i) => i % 4 !== 3)];
    assert.ok(Math.max(...range.slice(0, 100000)) - Math.min(...range.slice(0, 100000)) > 12, "atmosphere should contain spatial variation");
    assert.ok(first.every((v, i) => i % 4 !== 3 || v === 255), "background must be opaque");
    fog.set({ camera: { origin: [4, 1.05, -30], time: 12 } });
    fog.draw(output);
    const moved = await output.read();
    assert.ok(moved.some((v, i) => Math.abs(v - first[i]) > 2), "world-space atmosphere must react to camera travel");
    mkdirSync(".tmp/gallery-gpu", { recursive: true });
    const { PNG } = createRequire(import.meta.resolve("vgpu"))("pngjs");
    const png = new PNG({ width: 640, height: 360 }); png.data.set(first);
    writeFileSync(".tmp/gallery-gpu/atmosphere.png", PNG.sync.write(png));
    writeFileSync(".tmp/gallery-gpu/validation.json", JSON.stringify({ maxError: Math.max(...errors), tolerance: 2 / 255, deterministic: true, cameraResponsive: true }, null, 2));
  } finally { gpu.dispose(); }
});
