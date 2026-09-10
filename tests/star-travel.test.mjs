import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

test("star travel follows scrolling at 60/120 Hz, reverses, and settles without motion", async () => {
  mkdirSync(".tmp/star-travel", { recursive: true });
  writeFileSync(".tmp/star-travel/runtime.mjs", ts.transpileModule(
    readFileSync("app/night-gallery/createStarTravel.ts", "utf8"),
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }
  ).outputText);
  const { createStarTravel } = await import(pathToFileURL(resolve(".tmp/star-travel/runtime.mjs")));
  const intensities = [];
  for (const fps of [60, 120]) {
    const field = createStarTravel();
    field.update(0, 1 / fps, false);
    assert.equal(field.lines.visible, false);
    for (let i = 1; i <= fps; i++) field.update(i / fps * 1600, 1 / fps, false);
    assert.ok(field.intensity > 0.85);
    intensities.push(field.intensity);
    const vertices = field.lines.geometry.getAttribute("position").array;
    assert.ok(vertices.every(Number.isFinite));
    assert.ok(vertices[5] < vertices[2], "forward trail recedes from its head");
    for (let i = 1; i <= fps; i++) field.update(1600 - i / fps * 1600, 1 / fps, false);
    assert.ok(vertices[5] > vertices[2], "reverse travel reverses the trail");
    for (let i = 0; i < fps * 3; i++) field.update(0, 1 / fps, false);
    assert.equal(field.lines.visible, false, "reading has no extra star draw call");
    field.update(3000, 1 / fps, true);
    assert.equal(field.lines.visible, false);
    assert.equal(field.intensity, 0);
    field.lines.geometry.dispose(); field.lines.material.dispose();
  }
  assert.ok(Math.abs(intensities[0] - intensities[1]) < 0.02, "motion is time based, not frame based");
});


test("exhibits cannot draw outside their own section, including across text-only gaps", async () => {
  mkdirSync(".tmp/star-travel", { recursive: true });
  writeFileSync(".tmp/star-travel/viewport.mjs", ts.transpileModule(
    readFileSync("app/night-gallery/exhibitViewport.ts", "utf8"),
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }
  ).outputText);
  const { exhibitViewport } = await import(pathToFileURL(resolve(".tmp/star-travel/viewport.mjs")));
  // Hero ends at 900; the introduction/career fills 900–4000.
  assert.equal(exhibitViewport(0, 900, 1200, 900), null);
  assert.equal(exhibitViewport(4000, 5200, 1200, 900), null);
  // Toolkit fills 9000–10300; the about mascot starts after it.
  assert.equal(exhibitViewport(10300, 11500, 9100, 900), null);
  assert.deepEqual(exhibitViewport(10300, 11500, 9700, 900), [600, 900]);
  assert.deepEqual(exhibitViewport(7800, 9000, 8700, 900), [0, 300]);
  assert.deepEqual(exhibitViewport(4000, 5200, 4100, 900), [0, 900]);
  assert.equal(exhibitViewport(4000, 5200, 5200, 900), null);
});
