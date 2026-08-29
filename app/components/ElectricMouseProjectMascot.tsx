"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  createElectricMouseMascotLookDevLights,
  createElectricMouseMascotModel,
  type ElectricMouseMascotRuntime,
} from "@/app/three/createElectricMouseMascot";

type SpringAxis = { value: number; velocity: number; target: number };

function advanceSpring(axis: SpringAxis, dt: number, stiffness = 112, damping = 19) {
  axis.velocity += (axis.target - axis.value) * stiffness * dt;
  axis.velocity *= Math.exp(-damping * dt);
  axis.value += axis.velocity * dt;
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) value.dispose();
      });
      material.dispose();
    });
  });
}

export function ElectricMouseProjectMascot() {
  const hostRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      host.dataset.webgl = "unavailable";
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
    camera.position.set(0, 0.12, 7.35);
    camera.lookAt(0, 0, 0);

    const model = createElectricMouseMascotModel({ includeSpeechBubble: false });
    const runtime = model.userData.electricMouseMascotRuntime as ElectricMouseMascotRuntime;
    const normalizedModel = new THREE.Group();
    normalizedModel.name = "ElectricMouseNormalizedModel";
    normalizedModel.add(model);
    const stage = new THREE.Group();
    stage.name = "ProjectsHeadingMascotStage";
    stage.add(normalizedModel);
    scene.add(stage);
    scene.add(createElectricMouseMascotLookDevLights());

    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    normalizedModel.position.copy(center).multiplyScalar(-1);
    normalizedModel.position.y += 0.02;
    stage.scale.setScalar(3.25 / Math.max(size.y, 0.001));

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1.12, 48),
      new THREE.ShadowMaterial({ color: 0x172019, opacity: 0.18 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.56;
    ground.receiveShadow = true;
    scene.add(ground);

    const yaw: SpringAxis = { value: 0.12, velocity: 0, target: 0.12 };
    const pitch: SpringAxis = { value: -0.035, velocity: 0, target: -0.035 };
    let pointerId: number | null = null;
    let pointerStart = { x: 0, y: 0 };
    let pointerPrevious = { x: 0, y: 0 };
    let dragged = false;
    let visible = true;
    let ambientPaused = document.documentElement.dataset.motion3d === "paused";
    let frame = 0;
    let previousTime = performance.now();

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 260 ? 7.9 : 7.35;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => { visible = entry?.isIntersecting ?? true; },
      { rootMargin: "160px" },
    );
    visibilityObserver.observe(host);

    const onPointerDown = (event: PointerEvent) => {
      pointerId = event.pointerId;
      pointerStart = { x: event.clientX, y: event.clientY };
      pointerPrevious = pointerStart;
      dragged = false;
      canvas.setPointerCapture(event.pointerId);
      host.dataset.dragging = "true";
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const dx = event.clientX - pointerPrevious.x;
      const dy = event.clientY - pointerPrevious.y;
      pointerPrevious = { x: event.clientX, y: event.clientY };
      dragged ||= Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5;
      yaw.target = THREE.MathUtils.clamp(yaw.target + dx * 0.008, -0.46, 0.62);
      pitch.target = THREE.MathUtils.clamp(pitch.target + dy * 0.005, -0.16, 0.14);
    };

    const releasePointer = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      pointerId = null;
      host.dataset.dragging = "false";
    };

    const onActivate = () => {
      if (dragged) return;
      ambientPaused = !ambientPaused;
      document.documentElement.dataset.motion3d = ambientPaused ? "paused" : "running";
      host.setAttribute("aria-pressed", String(ambientPaused));
      host.setAttribute(
        "aria-label",
        ambientPaused ? "Resume ambient 3D motion" : "Pause ambient 3D motion",
      );
      if (statusRef.current) statusRef.current.textContent = ambientPaused ? "Paused" : "On";
      window.dispatchEvent(new CustomEvent("portfolio-3d-motion", { detail: { paused: ambientPaused } }));
      if (!ambientPaused && !reduceMotion) runtime.triggerElectric();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", releasePointer);
    canvas.addEventListener("pointercancel", releasePointer);
    host.addEventListener("click", onActivate);

    const render = (time: number) => {
      frame = window.requestAnimationFrame(render);
      if (!visible) {
        previousTime = time;
        return;
      }
      const dt = Math.min(0.033, Math.max(0.001, (time - previousTime) / 1000));
      previousTime = time;
      if (pointerId === null) {
        yaw.target += (0.12 - yaw.target) * Math.min(1, dt * 0.75);
        pitch.target += (-0.035 - pitch.target) * Math.min(1, dt * 0.75);
      }
      advanceSpring(yaw, dt);
      advanceSpring(pitch, dt);
      stage.rotation.y = yaw.value;
      stage.rotation.x = pitch.value;
      if (!reduceMotion && !ambientPaused) runtime.update((time / 1000) % 4.55);
      renderer.render(scene, camera);
    };
    frame = window.requestAnimationFrame(render);
    host.dataset.webgl = "ready";

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", releasePointer);
      canvas.removeEventListener("pointercancel", releasePointer);
      host.removeEventListener("click", onActivate);
      disposeObject(scene);
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, []);

  return (
    <div className="project-mascot-control">
      <button
        ref={hostRef}
        type="button"
        className="project-mascot"
        aria-label="Pause ambient 3D motion"
        aria-pressed="false"
        data-dragging="false"
      >
        <canvas ref={canvasRef} aria-hidden="true" />
        <span className="project-mascot-fallback">3D control unavailable</span>
      </button>
      <p><span>Ambient 3D</span><strong ref={statusRef} aria-live="polite">On</strong></p>
    </div>
  );
}
