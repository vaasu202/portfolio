"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createAgentGuardPolicyGateway } from "@/app/three/createAgentGuardPolicyGateway";

export type ProjectSystemVariant = "guard" | "forecast" | "agents" | "ecg";

type Spring = { value: number; velocity: number; target: number };
type ModelRuntime = {
  activate: (reduceMotion: boolean) => void;
  update: (time: number, dt: number, ambientPaused: boolean) => void;
};

const INTERACTION_TIME_SCALE = 1.75;

const modelCopy: Record<ProjectSystemVariant, { action: string; initial: string; label: string }> = {
  guard: {
    action: "Test a tool call",
    initial: "Policy ready",
    label: "Interactive policy gate. Activate it to simulate a blocked agent tool call.",
  },
  forecast: {
    action: "Change scenario",
    initial: "Baseline demand",
    label: "Interactive demand forecast. Activate it to compare planning scenarios.",
  },
  agents: {
    action: "Route a query",
    initial: "Route idle",
    label: "Interactive multi-agent route. Activate it to trace retrieval, reasoning, and validation.",
  },
  ecg: {
    action: "Scan the signal",
    initial: "Signal ready",
    label: "Interactive ECG signal. Activate it to locate the anomalous region.",
  },
};

const presentation: Record<ProjectSystemVariant, {
  yaw: number;
  pitch: number;
  roll: number;
  fit: number;
  cameraZ: number;
  offsetY: number;
}> = {
  guard: { yaw: -0.08, pitch: -0.04, roll: 0, fit: 3.15, cameraZ: 5.65, offsetY: 0.02 },
  forecast: { yaw: -0.38, pitch: -0.16, roll: -0.025, fit: 3.05, cameraZ: 5.75, offsetY: 0.04 },
  agents: { yaw: -0.2, pitch: -0.09, roll: 0.015, fit: 3.1, cameraZ: 5.7, offsetY: 0.01 },
  ecg: { yaw: -0.06, pitch: -0.04, roll: -0.025, fit: 2.95, cameraZ: 5.7, offsetY: 0.02 },
};

function stepSpring(spring: Spring, dt: number, stiffness = 108, damping = 20) {
  spring.velocity += (spring.target - spring.value) * stiffness * dt;
  spring.velocity *= Math.exp(-damping * dt);
  spring.value += spring.velocity * dt;
}

function disposeScene(scene: THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.Line)) return;
    if (object.geometry) geometries.add(object.geometry);
    const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
    objectMaterials.forEach((material) => materials.add(material));
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

function materials() {
  return {
    dark: new THREE.MeshPhysicalMaterial({
      color: 0x17201b,
      roughness: 0.32,
      metalness: 0.44,
      clearcoat: 0.58,
      clearcoatRoughness: 0.25,
    }),
    mid: new THREE.MeshPhysicalMaterial({
      color: 0x39453d,
      roughness: 0.42,
      metalness: 0.32,
      clearcoat: 0.34,
    }),
    lime: new THREE.MeshPhysicalMaterial({
      color: 0xc8ff42,
      emissive: 0x557712,
      emissiveIntensity: 0.42,
      roughness: 0.28,
      metalness: 0.12,
      clearcoat: 0.72,
      clearcoatRoughness: 0.2,
    }),
    bone: new THREE.MeshPhysicalMaterial({
      color: 0xe8ece2,
      roughness: 0.36,
      metalness: 0.08,
      clearcoat: 0.32,
    }),
  };
}

function cylinderBetween(
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  material: THREE.Material,
) {
  const direction = to.clone().sub(from);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), 10),
    material,
  );
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function buildGuard(model: THREE.Group, setStatus: (value: string) => void): ModelRuntime {
  const gateway = createAgentGuardPolicyGateway(setStatus);
  model.add(gateway.group);
  return {
    activate: gateway.activate,
    update: gateway.update,
  };
}

function buildForecast(model: THREE.Group, setStatus: (value: string) => void): ModelRuntime {
  const mat = materials();
  const scenarios = [
    { name: "Baseline demand", values: [0.36, 0.52, 0.48, 0.72, 0.66, 0.88, 0.8] },
    { name: "High demand", values: [0.42, 0.58, 0.7, 0.8, 1.02, 1.12, 1.28] },
    { name: "Capacity constrained", values: [0.44, 0.56, 0.63, 0.68, 0.73, 0.76, 0.78] },
  ];
  const baseY = -0.72;
  const current = [...scenarios[0].values];
  let targets = [...current];
  let scenarioIndex = 0;
  const bars = current.map((height, index) => {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 1, 0.24),
      index === current.length - 1 ? mat.lime : mat.dark,
    );
    bar.position.x = -1.2 + index * 0.4;
    bar.scale.y = height;
    bar.position.y = baseY + height / 2;
    bar.castShadow = true;
    model.add(bar);
    return bar;
  });

  const linePositions = new Float32Array(current.length * 3);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
  const line = new THREE.Line(
    lineGeometry,
    new THREE.LineBasicMaterial({ color: 0xe8ece2 }),
  );
  line.position.z = 0.19;
  model.add(line);

  const base = new THREE.Mesh(new THREE.BoxGeometry(3.02, 0.055, 0.6), mat.mid);
  base.position.y = baseY - 0.04;
  model.add(base);

  const updateGeometry = () => {
    current.forEach((height, index) => {
      bars[index].scale.y = height;
      bars[index].position.y = baseY + height / 2;
      linePositions[index * 3] = bars[index].position.x;
      linePositions[index * 3 + 1] = baseY + height + 0.11;
      linePositions[index * 3 + 2] = 0;
    });
    lineGeometry.attributes.position.needsUpdate = true;
  };
  updateGeometry();

  return {
    activate: (reduceMotion) => {
      scenarioIndex = (scenarioIndex + 1) % scenarios.length;
      targets = [...scenarios[scenarioIndex].values];
      setStatus(scenarios[scenarioIndex].name);
      if (reduceMotion) {
        current.splice(0, current.length, ...targets);
        updateGeometry();
      }
    },
    update: (_time, dt, ambientPaused) => {
      current.forEach((height, index) => {
        current[index] = THREE.MathUtils.damp(height, targets[index], 6.2 / INTERACTION_TIME_SCALE, dt);
      });
      if (!ambientPaused) line.rotation.z = Math.sin(performance.now() * 0.00045) * 0.008;
      updateGeometry();
    },
  };
}

function buildAgents(model: THREE.Group, setStatus: (value: string) => void): ModelRuntime {
  const mat = materials();
  const positions = [
    new THREE.Vector3(-1.05, 0.62, 0),
    new THREE.Vector3(0.98, 0.7, 0.02),
    new THREE.Vector3(1.08, -0.58, 0.04),
    new THREE.Vector3(-1.02, -0.68, 0.02),
  ];
  const labels = [
    "Retrieving context",
    "Reasoning",
    "Reasoning",
    "Validating output",
    "Validating output",
    "Grounded answer",
  ];
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 2), mat.lime);
  core.castShadow = true;
  model.add(core);

  const nodeMaterials = positions.map(() => mat.dark.clone());
  const nodes = positions.map((position, index) => {
    const edge = cylinderBetween(new THREE.Vector3(), position, 0.022, mat.mid);
    model.add(edge);
    const node = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 1), nodeMaterials[index]);
    node.position.copy(position);
    node.castShadow = true;
    model.add(node);
    return node;
  });
  const packet = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), mat.bone);
  packet.visible = false;
  model.add(packet);

  let actionStarted = 0;
  let lastPhase = -1;
  const center = new THREE.Vector3();
  const route = [positions[0], center, positions[1], center, positions[2], center, positions[3]];

  return {
    activate: (reduceMotion) => {
      if (reduceMotion) {
        nodes.forEach((node, index) => {
          (node.material as THREE.MeshPhysicalMaterial).emissive.setHex(index === 3 ? 0x557712 : 0x000000);
          (node.material as THREE.MeshPhysicalMaterial).emissiveIntensity = index === 3 ? 0.72 : 0;
        });
        packet.visible = false;
        setStatus("Grounded answer");
        return;
      }
      actionStarted = performance.now();
      lastPhase = -1;
      packet.visible = true;
      packet.position.copy(positions[0]);
      setStatus(labels[0]);
    },
    update: (_time, _dt, ambientPaused) => {
      if (!ambientPaused) core.rotation.y += 0.01;
      if (!actionStarted) return;
      const elapsed = (performance.now() - actionStarted) / 1000 / INTERACTION_TIME_SCALE;
      const phaseDuration = 0.29;
      const phase = Math.min(route.length - 2, Math.floor(elapsed / phaseDuration));
      const local = Math.min(1, (elapsed - phase * phaseDuration) / phaseDuration);
      packet.position.lerpVectors(route[phase], route[phase + 1], 1 - Math.pow(1 - local, 3));

      nodes.forEach((node, index) => {
        const material = node.material as THREE.MeshPhysicalMaterial;
        const activeNode = phase <= 1 ? 0 : phase <= 3 ? 1 : phase === 4 ? 2 : 3;
        const active = index === activeNode;
        material.emissive.setHex(active ? 0x557712 : 0x000000);
        material.emissiveIntensity = active ? 0.8 : 0;
        node.scale.setScalar(active ? 1.12 : 1);
      });
      if (phase !== lastPhase) {
        lastPhase = phase;
        setStatus(labels[phase]);
      }
      if (elapsed > phaseDuration * (route.length - 1)) {
        actionStarted = 0;
        packet.visible = false;
        setStatus("Grounded answer");
      }
    },
  };
}

function buildEcg(model: THREE.Group, setStatus: (value: string) => void): ModelRuntime {
  const mat = materials();
  const values = [0, 0.03, -0.03, 0.02, 0.06, -0.04, 0.17, 0.78, -0.62, 0.24, 0.05, 0, -0.04, 0.03, 0];
  const points = values.map((value, index) => new THREE.Vector3(-1.55 + (index / (values.length - 1)) * 3.1, value, 0));
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.08);
  const signal = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, 0.035, 8, false), mat.bone);
  signal.castShadow = true;
  model.add(signal);

  const frame = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.018, 8, 64), mat.mid);
  frame.scale.y = 0.62;
  frame.position.z = -0.12;
  model.add(frame);

  const anomalyPoint = curve.getPointAt(0.53);
  const marker = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 10, 36), mat.lime);
  marker.position.copy(anomalyPoint);
  marker.position.z = 0.08;
  marker.visible = false;
  model.add(marker);

  const scanner = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), mat.lime);
  scanner.visible = false;
  model.add(scanner);

  let actionStarted = 0;
  let localized = false;
  const localize = () => {
    marker.visible = true;
    marker.scale.setScalar(1.12);
    scanner.visible = false;
    setStatus("Anomaly localized");
  };

  return {
    activate: (reduceMotion) => {
      localized = false;
      if (reduceMotion) {
        actionStarted = 0;
        localize();
        return;
      }
      marker.visible = false;
      scanner.visible = true;
      actionStarted = performance.now();
      setStatus("Scanning signal");
    },
    update: (_time, _dt, ambientPaused) => {
      if (!ambientPaused) frame.rotation.z += 0.0014;
      if (!actionStarted) return;
      const elapsed = (performance.now() - actionStarted) / 1000 / INTERACTION_TIME_SCALE;
      const progress = Math.min(1, elapsed / 1.05);
      scanner.position.copy(curve.getPointAt(progress));
      scanner.position.z = 0.1;
      if (progress >= 0.53 && !localized) {
        localized = true;
        marker.visible = true;
        setStatus("Anomaly localized");
      }
      if (localized) {
        const pulse = 1 + Math.max(0, Math.sin((elapsed - 0.53) * 18)) * Math.exp(-(elapsed - 0.53) * 3) * 0.22;
        marker.scale.setScalar(pulse);
      }
      if (progress >= 1) {
        actionStarted = 0;
        scanner.visible = false;
        marker.scale.setScalar(1);
      }
    },
  };
}

function buildRuntime(
  variant: ProjectSystemVariant,
  model: THREE.Group,
  setStatus: (value: string) => void,
) {
  if (variant === "guard") return buildGuard(model, setStatus);
  if (variant === "forecast") return buildForecast(model, setStatus);
  if (variant === "agents") return buildAgents(model, setStatus);
  return buildEcg(model, setStatus);
}

export function ProjectSystemModel({ variant }: { variant: ProjectSystemVariant }) {
  const hostRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const activateRef = useRef<(() => void) | null>(null);
  const draggedRef = useRef(false);
    const copy = modelCopy[variant];
  const view = presentation[variant];

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const status = statusRef.current;
    if (!host || !canvas || !status) return;

    let initialized = false;
    let teardown = () => {};
    const initialize = () => {
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
        return () => {};
      }

      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
      camera.position.set(0, 0.04, view.cameraZ);
      camera.lookAt(0, 0, 0);

      const stage = new THREE.Group();
      const normalized = new THREE.Group();
      const model = new THREE.Group();
      normalized.add(model);
      stage.add(normalized);
      scene.add(stage);
      const setStatus = (value: string) => { status.textContent = value; };
      const runtime = buildRuntime(variant, model, setStatus);

      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      normalized.position.copy(center).multiplyScalar(-1);
      normalized.position.y += view.offsetY;
      stage.scale.setScalar(view.fit / Math.max(size.x, size.y, 0.001));
      stage.rotation.set(view.pitch, view.yaw, view.roll);

      scene.add(new THREE.HemisphereLight(0xeaf2e9, 0x121913, 1.65));
      const key = new THREE.DirectionalLight(0xffffff, 3.8);
      key.position.set(3.5, 4.2, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xc8ff42, 2.2);
      rim.position.set(-4, 1, 3);
      scene.add(rim);

      const yaw: Spring = { value: view.yaw, velocity: 0, target: view.yaw };
      const pitch: Spring = { value: view.pitch, velocity: 0, target: view.pitch };
      let pointerId: number | null = null;
      let pointerStart = { x: 0, y: 0 };
      let pointerPrevious = { x: 0, y: 0 };
      let visible = true;
      let ambientPaused = document.documentElement.dataset.motion3d === "paused";
      let frame = 0;
      let previousTime = performance.now();

      const resize = () => {
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.45));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.position.z = width < 150 ? view.cameraZ + 0.35 : view.cameraZ;
        camera.updateProjectionMatrix();
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();

      const visibilityObserver = new IntersectionObserver(
        ([entry]) => { visible = entry?.isIntersecting ?? true; },
        { rootMargin: "180px" },
      );
      visibilityObserver.observe(host);

      const onAmbientMotion = (event: Event) => {
        ambientPaused = Boolean((event as CustomEvent<{ paused: boolean }>).detail?.paused);
      };
      window.addEventListener("portfolio-3d-motion", onAmbientMotion);

      const onPointerDown = (event: PointerEvent) => {
        pointerId = event.pointerId;
        pointerStart = { x: event.clientX, y: event.clientY };
        pointerPrevious = pointerStart;
        draggedRef.current = false;
        canvas.setPointerCapture(event.pointerId);
        host.dataset.dragging = "true";
      };
      const onPointerMove = (event: PointerEvent) => {
        if (pointerId !== event.pointerId) return;
        const dx = event.clientX - pointerPrevious.x;
        const dy = event.clientY - pointerPrevious.y;
        pointerPrevious = { x: event.clientX, y: event.clientY };
        draggedRef.current ||= Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5;
        yaw.target = THREE.MathUtils.clamp(yaw.target + dx * 0.009, -0.72, 0.48);
        pitch.target = THREE.MathUtils.clamp(pitch.target + dy * 0.006, -0.3, 0.18);
      };
      const releasePointer = (event: PointerEvent) => {
        if (pointerId !== event.pointerId) return;
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
        pointerId = null;
        host.dataset.dragging = "false";
      };
      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove);
      canvas.addEventListener("pointerup", releasePointer);
      canvas.addEventListener("pointercancel", releasePointer);

      activateRef.current = () => runtime.activate(reduceMotion);
      const render = (time: number) => {
        frame = window.requestAnimationFrame(render);
        if (!visible) {
          previousTime = time;
          return;
        }
        const dt = Math.min(0.033, Math.max(0.001, (time - previousTime) / 1000));
        previousTime = time;
        if (pointerId === null) {
          yaw.target += (view.yaw - yaw.target) * Math.min(1, dt * 0.65);
          pitch.target += (view.pitch - pitch.target) * Math.min(1, dt * 0.65);
        }
        stepSpring(yaw, dt);
        stepSpring(pitch, dt);
        stage.rotation.y = yaw.value;
        stage.rotation.x = pitch.value;
        stage.rotation.z = view.roll;
        runtime.update(time, dt, ambientPaused || reduceMotion);
        renderer.render(scene, camera);
      };
      frame = window.requestAnimationFrame(render);
      host.dataset.webgl = "ready";

      return () => {
        activateRef.current = null;
        window.cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        visibilityObserver.disconnect();
        window.removeEventListener("portfolio-3d-motion", onAmbientMotion);
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", releasePointer);
        canvas.removeEventListener("pointercancel", releasePointer);
        disposeScene(scene);
        renderer.dispose();
        renderer.forceContextLoss();
      };
    };

    const startObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !initialized) {
          initialized = true;
          teardown = initialize();
          startObserver.disconnect();
        }
      },
      { rootMargin: "360px" },
    );
    startObserver.observe(host);
    return () => {
      startObserver.disconnect();
      teardown();
    };
  }, [variant, view]);

  return (
    <button
      ref={hostRef}
      type="button"
      className={`project-system-model project-system-${variant}`}
      aria-label={copy.label}
      data-webgl="loading"
      data-dragging="false"
      onClick={() => {
        if (!draggedRef.current) activateRef.current?.();
      }}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      <span ref={statusRef} className="project-system-status" aria-live="polite">{copy.initial}</span>
      <strong>{copy.action}</strong>
      <span className="project-system-fallback">3D unavailable</span>
    </button>
  );
}
