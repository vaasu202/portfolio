import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createBB8Model } from "../app/three/createBB8.js";

// Optional native Canvas implementation for exercising the supplied weather textures in Node.
test("BB-8 retains detailed geometry, batches materials, and has no scene/UI extras", async () => {
  const { createCanvas } = await import(process.env.BB8_CANVAS_MODULE || "@napi-rs/canvas");
  const originalDocument = globalThis.document;
  globalThis.document = { createElement(tag) { assert.equal(tag, "canvas"); return createCanvas(1, 1); } };
  let model;
  try {
    model = createBB8Model();
    model.updateMatrixWorld(true);
    const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    assert.ok(size.y > 5.8 && size.y < 6.1, "body, dome and antenna proportions are preserved");
    let meshes = 0, triangles = 0;
    model.traverse(child => {
      assert.ok(!child.isCamera && !child.isLight, "only the supplied model is included");
      if (!child.isMesh) return;
      meshes++;
      const positions = child.geometry.attributes.position;
      assert.ok(positions.array.every(Number.isFinite));
      assert.ok(child.geometry.index.array.every(index => index < positions.count));
      triangles += child.geometry.index.count / 3;
    });
    assert.ok(meshes <= 18, "static details share material batches instead of hundreds of draw calls");
    assert.ok(triangles > 100000, "the detailed supplied model is retained");
    const start = model.position.clone();
    model.userData.bb8Runtime.update(1);
    assert.ok(model.position.distanceTo(start) > 0.2, "the autonomous droid travels around its plinth");
    assert.ok(model.children.some(child => Math.abs(child.rotation.x) + Math.abs(child.rotation.z) > 0.01), "the body rolls with its travel");
    model.userData.bb8Runtime.activate();
    model.userData.bb8Runtime.update(1.2);
    assert.ok(model.children.every(child => Number.isFinite(child.rotation.x)));
    console.log({ meshes, triangles, height: size.y });
  } finally {
    globalThis.document = originalDocument;
    const materials = new Set(), textures = new Set();
    model?.traverse(child => { if (child.isMesh) { child.geometry.dispose(); materials.add(child.material); } });
    materials.forEach(material => { Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); }); material.dispose(); });
    textures.forEach(texture => texture.dispose());
  }
});
