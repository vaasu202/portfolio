import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("exports the complete portfolio as static HTML", async () => {
  const html = await readFile(new URL("../out/index.html", import.meta.url), "utf8");

  assert.match(html, /Vaasu Sohee/);
  assert.match(html, /Portfolio Campaign/);
  assert.match(html, /START CAMPAIGN/);
  assert.match(html, /Portfolio world map/);
  assert.match(html, /CAREER CAMPAIGN/);
  assert.match(html, /SKILL ARMORY/);
  assert.match(html, /PLAYER MANIFESTO/);
  assert.match(html, /Ship <strong>measurable impact\.<\/strong>/i);
  assert.match(html, /VERTICAL INPUT \/\/ HORIZONTAL WORLD/);
  assert.match(html, /encounter-viewport/);
  assert.match(html, /Delta Dental Insurance/);
  assert.match(html, /Ernst &amp; Young/);
  assert.match(html, /Multi-Agent GenAI Retrieval Platform/);
  assert.match(html, /soheevaa@msu\.edu/);
  assert.doesNotMatch(html, /—|&mdash;|&#8212;/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Starter Project/);
});

test("includes the downloadable resume and social preview", async () => {
  await Promise.all([
    access(new URL("../out/resume.pdf", import.meta.url)),
    access(new URL("../out/og.png", import.meta.url)),
    access(new URL("../out/favicon.svg", import.meta.url)),
  ]);
});
