import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("gallery navigation resolves without JavaScript and retains local assets", async () => {
  const html = await readFile(new URL("../out/night-gallery/index.html", import.meta.url), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) {
    assert.equal(ids.filter(id => id === target).length, 1, `Unique destination for #${target}`);
  }
  assert.match(html, /aria-label="Gallery navigation"/);
  assert.match(html, /aria-label="Open resume"/);
  assert.match(html, /class="ng-hero-type"/);
  assert.match(html, /class="ng-type-caret"/);
  assert.ok(html.indexOf('id="career"') < html.indexOf('id="projects"'), "Experience precedes projects");
  assert.equal((html.match(/class="mission-card /g) ?? []).length, 5);
  assert.equal((html.match(/aria-haspopup="dialog"/g) ?? []).length, 4);
  assert.match(html, /mailto:vsohee@gmail.com/);
  assert.doesNotMatch(html, /Original portfolio/);
  assert.match(html, /tel:\+15174907865/);
  assert.match(html, /https:\/\/www\.linkedin\.com\/in\/vaasu-sohee\//);
  assert.match(html, /https:\/\/github\.com\/vaasu202/);
  assert.match(html, /href="\.\.\/resume\.pdf"/);
  await Promise.all([
    "models/night-gallery/Lucy100k.ply", "models/night-gallery/stormtrooper.dae",
    "models/night-gallery/Stormtrooper_D.jpg", "resume.pdf",
    "fonts/glametrix-light.otf", "fonts/glametrix-regular.otf", "fonts/glametrix-bold.otf",
    "fonts/onest-variable.ttf", "fonts/ibm-plex-mono-regular.ttf",
    "fonts/ibm-plex-mono-medium.ttf", "fonts/ibm-plex-mono-semibold.ttf", "black-hole-poster.png",
  ].map(path => access(new URL(`../out/${path}`, import.meta.url))));
});
