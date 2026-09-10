// Browser lifecycle for the baked black-hole pipeline. VGPU stays dynamically imported.

import type { Frame, Gpu, Surface } from "vgpu";

type VgpuApi = typeof import("vgpu");

import {
  createEffects,
  createTargets,
  resizeTargets,
  prewarm,
  renderChain,
  setBakeUniforms,
  setBindings,
  setPostUniforms,
  setShadeUniforms,
  type Effects,
  type Targets,
} from "./pipeline";
import { defaultHeroSettings } from "./settings";

const SCENE_YAW_TAU_S = 0.325;

const MAX_FRAME_DT_S = 0.1;

// Follow the display's RAF cadence (including 120 Hz); a second fixed-rate
// gate causes judder when the two clocks don't divide evenly.
const RENDER_SCALE = 0.8;
const MAX_RENDER_PIXELS = 1_000_000;
const MOBILE_QUERY = "(max-width: 767px)";

interface RendererOptions {
  canvas: HTMLCanvasElement;
  isPaused?: () => boolean;
}

type RenderSize = { width: number; height: number };

export function createRenderer({ canvas, isPaused = () => false }: RendererOptions) {
  const settings = defaultHeroSettings();
  const desktopLayout = {
    centerX: settings.centerX,
    centerY: settings.centerY,
    cameraRoll: settings.cameraRoll,
    mouseYaw: settings.mouseYaw,
    centerFade: settings.centerFade,
  };
  const mobileQuery = window.matchMedia(MOBILE_QUERY);
  const applyResponsiveLayout = () => {
    Object.assign(
      settings,
      mobileQuery.matches
        ? {
            centerX: 0,
            centerY: 0,
            cameraRoll: 0,
            mouseYaw: 0,
            centerFade: 1,
          }
        : desktopLayout
    );
  };
  applyResponsiveLayout();
  const bloomScale = Math.min(Math.max(window.devicePixelRatio, 1), 2) / 2;
  settings.bloom.radius *= bloomScale;
  settings.bloom.strength *= bloomScale;

  let disposed = false;

  let api: VgpuApi | undefined;
  let gpu: Gpu | undefined;
  let surface: Surface | undefined;
  let effects: Effects | undefined;
  let targets: Targets | undefined;
  let loop: { stop(): void } | undefined;
  let observer: ResizeObserver | undefined;
  let intersection: IntersectionObserver | undefined;
  let documentVisible =
    typeof document === "undefined" ? true : !document.hidden;
  let canvasIntersecting = true;

  let started = false;
  let animationTime = 0;
  let lastFrameAt: number | undefined;
  let resizeFrame = 0;
  let pendingSize: RenderSize | undefined;
  let forceBake = true;
  let pointerXNormalized = 0;
  let currentSceneYaw = 0;
  let lastYawAt: number | undefined;

  const onLayoutChange = () => {
    applyResponsiveLayout();
    forceBake = true;
  };
  mobileQuery.addEventListener("change", onLayoutChange);

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const width = Math.max(window.innerWidth, 1);
    pointerXNormalized = Math.min(
      1,
      Math.max(-1, (event.clientX / width) * 2 - 1)
    );
  };

  const recenterPointer = () => {
    pointerXNormalized = 0;
  };
  const onPointerOut = (event: PointerEvent) => {
    if (event.relatedTarget === null) recenterPointer();
  };
  const onVisibilityChange = () => {
    if (document.hidden) recenterPointer();
    documentVisible = !document.hidden;
    reconcileLoop();
  };

  function reconcileLoop(): void {
    if (!started || !gpu || !api) return;
    const shouldRun = !disposed && documentVisible && canvasIntersecting;
    if (shouldRun === Boolean(loop)) return;
    if (shouldRun) {
      lastFrameAt = undefined;
      lastYawAt = undefined;
      loop = startDisplayLoop(api, gpu);
    } else {
      loop?.stop();
      loop = undefined;
    }
  }

  function startDisplayLoop(vgpu: VgpuApi, activeGpu: Gpu): { stop(): void } {
    let stopped = false;

    let sampleAt = performance.now(), sampleFrames = 0, sampleEncodeMs = 0;
    const tick = (timestamp: number): void => {
      if (stopped) return;
      try {
        // Paused scenes retain their last canvas frame without GPU submission.
        if (!isPaused() || forceBake) {
          const encodeAt = performance.now();
          vgpu.frame(activeGpu, renderFrame);
          sampleEncodeMs += performance.now() - encodeAt;
          sampleFrames++;
        } else { lastFrameAt = timestamp; lastYawAt = timestamp; }
        if (timestamp - sampleAt >= 1000) {
          canvas.dataset.fps = (sampleFrames * 1000 / (timestamp - sampleAt)).toFixed(1);
          canvas.dataset.encodeMs = (sampleEncodeMs / Math.max(1, sampleFrames)).toFixed(2);
          sampleAt = timestamp; sampleFrames = 0; sampleEncodeMs = 0;
        }
      } catch (error) { handleFailure(error); }
      if (!stopped) frameHandle = requestAnimationFrame(tick);
    };
    let frameHandle = requestAnimationFrame(tick);
    return {
      stop(): void {
        stopped = true;
        cancelAnimationFrame(frameHandle);
      },
    };
  }

  const advanceAnimationTime = (now: number): number => {
    animationTime +=
      lastFrameAt === undefined ? 0 : Math.min(MAX_FRAME_DT_S, Math.max(0, (now - lastFrameAt) / 1000));
    lastFrameAt = now;
    return animationTime;
  };

  const renderFrame = (frame: Frame): void => {
    if (disposed || !effects || !targets || !surface) return;
    const now = clockMs();
    if (isPaused()) {
      lastFrameAt = now;
      lastYawAt = now;
      if (!forceBake) return;
    }
    const runBake = forceBake;
    forceBake = false;
    if (runBake) setBakeUniforms(effects, targets, settings);
    setShadeUniforms(
      effects,
      targets,
      settings,
      advanceAnimationTime(now),
      advanceSceneYaw(now)
    );
    renderChain(frame, effects, targets, surface, runBake);
    if (canvas.dataset.renderer !== "vgpu-webgpu") canvas.dataset.renderer = "vgpu-webgpu";
  };

  const advanceSceneYaw = (now: number): number => {
    if (settings.mouseYaw <= 0) {
      currentSceneYaw = 0;
      lastYawAt = now;
      return 0;
    }
    const dt =
      lastYawAt === undefined
        ? 0
        : Math.min(Math.max((now - lastYawAt) / 1000, 0), MAX_FRAME_DT_S);
    lastYawAt = now;
    const target = pointerXNormalized * Math.max(0, settings.mouseYaw);
    currentSceneYaw +=
      (target - currentSceneYaw) * (1 - Math.exp(-dt / SCENE_YAW_TAU_S));
    return currentSceneYaw;
  };

  const applyResize = () => {
    resizeFrame = 0;
    const size = pendingSize;
    pendingSize = undefined;
    if (disposed || !size || !gpu || !api || !effects || !targets || !surface)
      return;
    try {
      const dimensions: [number, number] = [Math.round(size.width), Math.round(size.height)];
      if (targets.scene.size[0] === dimensions[0] && targets.scene.size[1] === dimensions[1]) return;
      surface.resize(dimensions);
      resizeTargets(targets, dimensions);
      setBindings(effects, targets);
      setPostUniforms(effects, targets, settings);
      forceBake = true;
    } catch (error) {
      handleFailure(error);
    }
  };
  const resize = (size: RenderSize) => {
    if (disposed || size.width <= 0 || size.height <= 0) return;
    pendingSize = size;
    if (!resizeFrame) resizeFrame = requestAnimationFrame(applyResize);
  };

  const renderSize = (): [number, number] => {
    const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight);
    const scale = Math.min(RENDER_SCALE, Math.sqrt(MAX_RENDER_PIXELS / (width * height)));
    return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
  };
  const measure = () => {
    const [width, height] = renderSize();
    resize({ width, height });
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    loop?.stop();
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    observer?.disconnect();
    intersection?.disconnect();
    if (typeof window !== "undefined") {
      mobileQuery.removeEventListener("change", onLayoutChange);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("blur", recenterPointer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
    gpu?.dispose();
  };

  const initialize = async () => {
    const vgpu = await import("vgpu");
    const { init } = vgpu;
    if (disposed) return;
    const nextGpu = await init();
    if (disposed) {
      nextGpu.dispose();
      return;
    }
    gpu = nextGpu;
    api = vgpu;
    gpu.onError(error => { canvas.dataset.renderer = "fallback"; dispose(); console.warn("Black-hole background unavailable", error); });
    surface = vgpu.surface(gpu, canvas, { size: renderSize(), autoResize: false, alphaMode: "opaque" });
    canvas.dataset.frameRate = "display-native";
    effects = createEffects(vgpu, gpu);
    targets = createTargets(vgpu, gpu, surface.size);
    setBindings(effects, targets);
    setPostUniforms(effects, targets, settings);
    await prewarm(effects, targets, surface);
    if (disposed) return;
    observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(canvas);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    window.addEventListener("blur", recenterPointer);
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (typeof IntersectionObserver !== "undefined") {
      intersection = new IntersectionObserver(
        (entries) => {
          canvasIntersecting =
            entries[entries.length - 1]?.isIntersecting ?? canvasIntersecting;
          reconcileLoop();
        },
        { threshold: 0 }
      );
      intersection.observe(canvas);
    }
    measure();
    started = true;
    documentVisible = !document.hidden;
    reconcileLoop();
  };

  function handleFailure(error: unknown): void {
    canvas.dataset.renderer = "fallback";
    dispose();
    console.warn("Black-hole background unavailable", error);
  }

  const ready = initialize().catch((error: unknown) => {
    if (disposed) return;
    handleFailure(error);
  });

  return { ready, dispose };
}

function clockMs(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}
