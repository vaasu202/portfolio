import { effect, frame, init, surface } from "vgpu";
import type { PerspectiveCamera } from "three";

export async function createAtmosphere(canvas: HTMLCanvasElement, signal: AbortSignal) {
  const response = await fetch("../shaders/gallery-atmosphere.wgsl", { signal });
  if (!response.ok) throw new Error(`Atmosphere shader: ${response.status}`);
  const source = await response.text();
  const gpu = await init();
  try {
    if (signal.aborted) throw new DOMException("Unmounted", "AbortError");
    const output = surface(gpu, canvas, { dpr: 0.7, format: "bgra8unorm", label: "Garden atmosphere" });
    const fog = effect(gpu, source, { label: "World-space garden mist", set: { camera: {
      origin: [0, 1, 10], time: 0, right: [1, 0, 0], lens: 0.344,
      up: [0, 1, 0], aspect: 1, forward: [0, 0, -1], debug: 0,
    } } });
    // vgpu 0.4 resolves live surface attachments only within a frame. Pre-warm
    // against the format signature instead of acquiring the swapchain early.
    await fog.compile({ colors: ["bgra8unorm"] });
    if (signal.aborted) throw new DOMException("Unmounted", "AbortError");
    let failed = false;
    gpu.onError(error => { failed = true; canvas.dataset.renderer = "fallback"; console.warn("Atmosphere fallback", error); });
    let rendered = false;
    return {
      draw(time: number, camera: PerspectiveCamera) {
        if (failed) return;
        const m = camera.matrixWorld.elements;
        // Read the actual camera basis, including entrance roll and pointer sway.
        fog.set({ camera: {
          origin: [m[12], m[13], m[14]], time,
          right: [m[0], m[1], m[2]], up: [m[4], m[5], m[6]], forward: [-m[8], -m[9], -m[10]],
          lens: Math.tan(camera.fov * Math.PI / 360), aspect: camera.aspect,
        } });
        frame(gpu, current => current.pass(output, fog));
        if (!rendered) { rendered = true; canvas.dataset.renderer = "vgpu-webgpu"; }
      },
      dispose() { gpu.dispose(); },
    };
  } catch (error) { gpu.dispose(); throw error; }
}
