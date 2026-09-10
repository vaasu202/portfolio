import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("makes Night Gallery the portfolio entry point", async () => {
  const root = await readFile(new URL("../out/index.html", import.meta.url), "utf8");
  const gallery = await readFile(new URL("../out/night-gallery/index.html", import.meta.url), "utf8");

  assert.match(root, /http-equiv="refresh" content="0; url=\/Portfolio\/night-gallery\/"/);
  assert.match(root, /location\.replace\("\/Portfolio\/night-gallery\/"\)/);
  assert.match(gallery, /Vaasu Sohee/);
  assert.match(gallery, /Delta Dental Insurance/);
  assert.match(gallery, /Security gateway for AI agents/);
  assert.match(gallery, /Multi-agent retrieval platform/);
  assert.match(gallery, /Published clinical ML research/);
  assert.match(gallery, /mailto:vsohee@gmail\.com/);
  assert.doesNotMatch(gallery, /soheevaa@msu\.edu|Original portfolio/);
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
