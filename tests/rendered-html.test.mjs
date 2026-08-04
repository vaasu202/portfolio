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
  assert.match(html, /Ship/i);
  assert.match(html, /measurable impact\./i);
  assert.match(html, /IMPACT SYSTEM/);
  assert.match(html, /Scroll through the proof/);
  assert.doesNotMatch(html, /VERTICAL INPUT|SCROLL TO TRAVERSE|encounter-viewport/);
  assert.match(html, /Delta Dental Insurance/);
  assert.match(html, /Ernst &amp; Young/);
  assert.match(html, /logos\/delta-dental\.jpg/);
  assert.match(html, /logos\/ey\.svg/);
  assert.match(html, /logos\/exodrone-systems\.png/);
  assert.match(html, /logos\/niit-technologies\.svg/);
  assert.match(html, /Multi-Agent GenAI Retrieval Platform/);
  assert.match(html, /AgentGuard/);
  assert.match(html, /runtime security gateway/i);
  assert.match(html, /github\.com\/vaasu202\/agentguard/);
  assert.match(html, /projects\/agentguard-demo\.png/);
  assert.match(html, /projects\/demand-capacity-forecast\.png/);
  assert.match(html, /projects\/multi-agent-rag\.png/);
  assert.match(html, /projects\/ecg-anomaly-detection\.png/);
  assert.match(html, /soheevaa@msu\.edu/);
  assert.doesNotMatch(html, /—|&mdash;|&#8212;/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Starter Project/);
});

test("includes the downloadable resume and social preview", async () => {
  await Promise.all([
    access(new URL("../out/resume.pdf", import.meta.url)),
    access(new URL("../out/og.png", import.meta.url)),
    access(new URL("../out/teddy-bear.svg", import.meta.url)),
    access(new URL("../out/projects/agentguard-demo.png", import.meta.url)),
    access(new URL("../out/projects/demand-capacity-forecast.png", import.meta.url)),
    access(new URL("../out/projects/multi-agent-rag.png", import.meta.url)),
    access(new URL("../out/projects/ecg-anomaly-detection.png", import.meta.url)),
    access(new URL("../out/logos/delta-dental.jpg", import.meta.url)),
    access(new URL("../out/logos/ey.svg", import.meta.url)),
    access(new URL("../out/logos/exodrone-systems.png", import.meta.url)),
    access(new URL("../out/logos/niit-technologies.svg", import.meta.url)),
  ]);
});
