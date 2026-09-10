import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import * as vgpu from "vgpu/node";

test("upstream black-hole pipeline renders, preserves baked geometry, and animates shading", async () => {
  const requireVgpu = createRequire(import.meta.resolve("vgpu"));
  const { resolveShader } = requireVgpu("@vgpu/wgsl/runtime");
  const { PNG } = requireVgpu("pngjs");
  const dir = resolve("app/night-gallery/black-hole");
  mkdirSync(".tmp/black-hole", { recursive: true });
  let pipeline = readFileSync(`${dir}/pipeline.ts`, "utf8");
  for (const match of [...pipeline.matchAll(/import (\w+) from "\.\/(\w+)\.wgsl";/g)]) {
    const result = await resolveShader({ entry: `${dir}/${match[2]}.wgsl` });
    pipeline = pipeline.replace(match[0], `const ${match[1]} = ${JSON.stringify(result.wgsl)};`);
  }
  pipeline = pipeline.replace('"./noise-volume.mjs"', JSON.stringify(pathToFileURL(`${dir}/noise-volume.mjs`).href));
  const transpile = text => ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
  writeFileSync(".tmp/black-hole/pipeline.mjs", transpile(pipeline));
  writeFileSync(".tmp/black-hole/settings.mjs", transpile(readFileSync(`${dir}/settings.ts`, "utf8")));
  const p = await import(pathToFileURL(resolve(".tmp/black-hole/pipeline.mjs")));
  const { defaultHeroSettings } = await import(pathToFileURL(resolve(".tmp/black-hole/settings.mjs")));
  const benchmark = process.env.NG_BENCHMARK === "1";
  const gpu = await vgpu.init(benchmark ? { requiredFeatures: ["timestamp-query"] } : {});
  try {
    const output = vgpu.target(gpu, { size: [960, 640] });
    const targets = p.createTargets(vgpu, gpu, output.size);
    const effects = p.createEffects(vgpu, gpu);
    const settings = defaultHeroSettings();
    p.setBindings(effects, targets); p.setPostUniforms(effects, targets, settings);
    p.setBakeUniforms(effects, targets, settings); p.setShadeUniforms(effects, targets, settings, 8, 0);
    await p.prewarm(effects, targets, output);
    vgpu.frame(gpu, frame => p.renderChain(frame, effects, targets, output, true));
    const first = await output.read();
    const baked = await targets.gbuffer.read();
    const png = new PNG({ width: 960, height: 640 }); png.data.set(first);
    writeFileSync(".tmp/black-hole/frame.png", PNG.sync.write(png));
    let low = 255, high = 0;
    first.forEach((v, i) => { if (i % 4 !== 3) { low = Math.min(low, v); high = Math.max(high, v); } else assert.equal(v, 255); });
    assert.ok(high - low > 180, "event horizon and bright disk must both be visible");
    const passes = {};
    for (const key of ["scene", "bloom0", "bloom1", "bloom2"]) {
      const values = await targets[key].readFloats();
      assert.ok(values.every(Number.isFinite), `${key} must contain finite HDR values`);
      const nonzero = values.filter((v, i) => i % 4 !== 3 && v > 0.001).length;
      assert.ok(nonzero > 0, `${key} contributes to the image`);
      passes[key] = { finite: true, nonzero };
      const view = vgpu.target(gpu, { size: targets[key].size });
      vgpu.effect(gpu, `@group(0) @binding(0) var src: texture_2d<f32>;
        @fragment fn fs_main(@builtin(position) pixel: vec4f) -> @location(0) vec4f {
          let c = textureLoad(src, vec2i(pixel.xy), 0).rgb;
          return vec4f(pow(c / (vec3f(1) + c), vec3f(1.0 / 2.2)), 1);
        }`, { set: { src: targets[key] } }).draw(view);
      const dump = new PNG({ width: view.size[0], height: view.size[1] }); dump.data.set(await view.read());
      writeFileSync(`.tmp/black-hole/${key}.png`, PNG.sync.write(dump));
    }
    vgpu.frame(gpu, frame => p.renderChain(frame, effects, targets, output, false));
    assert.deepEqual(await output.read(), first, "same uniforms produce identical output");
    p.setShadeUniforms(effects, targets, settings, 12, 0);
    vgpu.frame(gpu, frame => p.renderChain(frame, effects, targets, output, false));
    const second = await output.read();
    assert.ok(second.some((v, i) => Math.abs(v - first[i]) > 10), "disk shading animates");
    assert.deepEqual(await targets.gbuffer.read(), baked, "animation reuses the cached ray traversal");
    writeFileSync(".tmp/black-hole/validation.json", JSON.stringify({ range: [low,high], passes, deterministic: true, animation: true, bakedGeometryPreserved: true }, null, 2));
    p.resizeTargets(targets, [480, 320]);
    assert.deepEqual(targets.gbuffer.size, [480, 320]);
    assert.deepEqual(targets.bloom2.size, [60, 40]);
    p.setBindings(effects, targets); p.setPostUniforms(effects, targets, settings);
    p.setBakeUniforms(effects, targets, settings); p.setShadeUniforms(effects, targets, settings, 12, 0);
    vgpu.frame(gpu, frame => p.renderChain(frame, effects, targets, output, true));
    assert.ok((await targets.scene.readFloats()).every(Number.isFinite), "resized MRT attachments remain valid after rebind");
    if (benchmark) {
      const timer = vgpu.timer(gpu);
      let samples = [];
      timer.onResults(spans => samples.push(spans));
      const results = [];
      for (const scale of [0.8, 0.6]) {
        const size = [Math.round(1440 * scale), Math.round(900 * scale)];
        const sceneTargets = p.createTargets(vgpu, gpu, size);
        const screen = vgpu.target(gpu, { size });
        p.setBindings(effects, sceneTargets); p.setPostUniforms(effects, sceneTargets, settings);
        p.setBakeUniforms(effects, sceneTargets, settings);
        p.setShadeUniforms(effects, sceneTargets, settings, 8, 0);
        vgpu.frame(gpu, frame => p.renderChain(frame, effects, sceneTargets, screen, true));
        await gpu.settled();
        samples = [];
        for (let i = 0; i < 45; i++) {
          p.setShadeUniforms(effects, sceneTargets, settings, 8 + i / 60, 0);
          vgpu.frame(gpu, frame => p.renderChain(frame, effects, sceneTargets, screen, false, timer));
          await gpu.settled();
        }
        const steady = samples.slice(5);
        const median = values => values.sort((a,b) => a-b)[Math.floor(values.length / 2)];
        results.push({ scale, size, samples: steady.length,
          totalGpuMs: median(steady.map(row => Object.values(row).reduce((a,b) => a+b, 0))),
          passes: Object.fromEntries(Object.keys(steady[0]).map(key => [key, median(steady.map(row => row[key]))])) });
        p.destroyTargets(sceneTargets);
      }
      writeFileSync(".tmp/black-hole/benchmark.json", JSON.stringify(results, null, 2));
      console.log(JSON.stringify(results));
    }
  } finally { gpu.dispose(); }
});
