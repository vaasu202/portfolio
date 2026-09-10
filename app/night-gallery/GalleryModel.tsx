"use client";

import { MetalButton } from "./MetalControl";

import { useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";
import { ColladaLoader } from "three/addons/loaders/ColladaLoader.js";
import { buildRuntime, type ProjectSystemVariant } from "@/app/components/ProjectSystemModel";
import { createBB8Model } from "@/app/three/createBB8";

export type Exhibit = ProjectSystemVariant | "lucy" | "trooper" | "mouse";
const actions: Record<Exhibit, string> = {
  lucy: "Move the light", trooper: "Play a dance", mouse: "Say hello",
  guard: "Test a tool call", forecast: "Change scenario", agents: "Route a query", ecg: "Scan the signal",
};
const names: Record<Exhibit, string> = {
  lucy: "Lucy sculpture", trooper: "Dancing Stormtrooper", mouse: "BB-8 astromech",
  guard: "AgentGuard policy gateway", forecast: "Demand forecast", agents: "Multi-agent system", ecg: "ECG signal",
};

function dispose(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Points)) return;
    geometries.add(child.geometry);
    (Array.isArray(child.material) ? child.material : [child.material]).forEach(m => materials.add(m));
  });
  materials.forEach(m => Object.values(m).forEach(v => { if (v instanceof THREE.Texture) textures.add(v); }));
  geometries.forEach(g => g.dispose()); textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose());
}

export default function GalleryModel({ variant, paused, progress, cinematic = false }: { variant: Exhibit; paused: boolean; progress: RefObject<Record<Exhibit, number>>; cinematic?: boolean }) {
  const ambient = variant === "lucy" || variant === "trooper";
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const command = useRef<(action: string) => void>(() => {});
  const pausedRef = useRef(paused);
  const [status, setStatus] = useState("Preparing exhibit…");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [interactive, setInteractive] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    if (!host.current || !canvas.current) return;
    const element = host.current;
    const surface = canvas.current;
    if (cinematic) {
      const receive = (event: Event) => {
        const detail = (event as CustomEvent).detail;
        if (detail.variant !== variant) return;
        setStatus(detail.status);
        setReady(detail.ready);
        setFailed(detail.failed ?? false);
      };
      window.addEventListener("gallery-status", receive);
      command.current = action => window.dispatchEvent(new CustomEvent("gallery-command", { detail: { variant, action } }));
      command.current("status");
      return () => { window.removeEventListener("gallery-status", receive); command.current = () => {}; };
    }
    let dead = false, started = false, visible = false, cleanup = () => {};
    const report = (text: string) => { if (!dead) setStatus(text); };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");

    const start = async () => {
      element.dataset.loaded = "false";
      let renderer: THREE.WebGLRenderer;
      try { renderer = new THREE.WebGLRenderer({ canvas: surface, alpha: true, antialias: true }); }
      catch { if (!dead) { setReady(false); setFailed(true); report("3D is unavailable in this browser."); } return; }
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = variant === "lucy" ? 0.95 : 1.15;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
      const controls = new OrbitControls(camera, surface);
      controls.enableDamping = !reduced.matches;
      controls.dampingFactor = 0.085;
      controls.enableZoom = false; // Wheel scroll always remains page navigation.
      controls.minPolarAngle = 0.35;
      controls.maxPolarAngle = Math.PI * 0.72;
      controls.enabled = variant !== "mouse" && matchMedia("(pointer: fine)").matches;
      if (!controls.enabled) surface.style.touchAction = "pan-y";
      const target = new THREE.Vector3(0, 0.1, 0);
      const reset = () => {
        const aspect = element.clientWidth / Math.max(1, element.clientHeight);
        camera.position.set(0.4, 0.65, aspect < 0.8 ? 10.8 : 8.4);
        controls.target.copy(target); controls.update();
      };
      reset();
      scene.add(new THREE.HemisphereLight(0xe5eddb, 0x101d16, variant === "lucy" ? 0.65 : 1.85));
      const key = new THREE.SpotLight(0xffecd0, variant === "lucy" ? 55 : 95, 30, Math.PI / 5, 0.9, 1.5);
      key.position.set(-3.5, 6, 4);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.bias = -0.001;
      key.shadow.normalBias = 0.025;
      key.target.position.set(0, 0, 0);
      scene.add(key, key.target);
      const fill = new THREE.DirectionalLight(0xb6c7ae, variant === "lucy" ? 0.8 : 2.6);
      fill.position.set(3, 2, -2); scene.add(fill);
      const front = new THREE.DirectionalLight(0xe5e6df, variant === "lucy" ? 0.65 : 1.5);
      front.position.set(1, 1, 5); scene.add(front);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.28 }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = -2.12; floor.receiveShadow = true; scene.add(floor);
      const stage = new THREE.Group(); scene.add(stage);
      let mixer: THREE.AnimationMixer | undefined;
      let runtime: ReturnType<typeof buildRuntime> | undefined;
      let droid: { update(time: number): void; activate(): void } | undefined;
      let elapsed = 0, lightTarget = -3.5, lastTime = performance.now();
      let manuallyMoved = false;
      controls.addEventListener("start", () => { manuallyMoved = true; });
      const resize = new ResizeObserver(() => {
        const w = Math.max(1, element.clientWidth), h = Math.max(1, element.clientHeight);
        renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      });
      resize.observe(element);
      command.current = action => {
        if (action === "reset") { reset(); manuallyMoved = false; return; }
        if (action === "interact") {
          controls.enabled = !controls.enabled;
          surface.style.touchAction = controls.enabled ? "none" : "pan-y";
          setInteractive(controls.enabled); return;
        }
        if (action === "in" || action === "out") {
          manuallyMoved = true;
          const offset = camera.position.clone().sub(controls.target);
          offset.setLength(THREE.MathUtils.clamp(offset.length() * (action === "in" ? 0.82 : 1.22), 4.5, 15));
          camera.position.copy(controls.target).add(offset); controls.update(); return;
        }
        if (action === "left" || action === "right") {
          manuallyMoved = true;
          const offset = camera.position.clone().sub(controls.target);
          offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), action === "left" ? -0.25 : 0.25);
          camera.position.copy(controls.target).add(offset); controls.update(); return;
        }
        if (action === "activate") {
          if (variant === "lucy") { lightTarget *= -1; report("Light moved across the sculpture."); }
          else if (droid) { droid.activate(); report("BB-8 says hello."); }
          else runtime?.activate(reduced.matches);
        }
      };
      renderer.setAnimationLoop(time => {
        const dt = THREE.MathUtils.clamp((time - lastTime) / 1000, 0, 0.04); lastTime = time;
        if (!visible || document.hidden) return;
        const still = pausedRef.current || reduced.matches;
        if (!still && variant === "lucy") stage.rotation.y += dt * 0.16;
        if (!still && !manuallyMoved && variant !== "lucy") {
          const chapter = progress.current[variant];
          stage.rotation.y = THREE.MathUtils.damp(stage.rotation.y, (chapter - 0.5) * 0.38, 4, dt);
          const dolly = 1 + Math.sin(chapter * Math.PI) * 0.055;
          stage.scale.setScalar(THREE.MathUtils.damp(stage.scale.x, dolly, 4, dt));
        }
        if (!still) {
          elapsed += dt;
          droid?.update(elapsed);
          key.position.x = THREE.MathUtils.damp(key.position.x, lightTarget, 3, dt);
        } else key.position.x = lightTarget;
        if (!still) mixer?.update(dt);
        if (!pausedRef.current) runtime?.update(elapsed * 1000, dt, still);
        controls.update(); renderer.render(scene, camera);
      });
      cleanup = () => {
        renderer.setAnimationLoop(null); resize.disconnect(); controls.dispose();
        mixer?.stopAllAction(); if (mixer) mixer.uncacheRoot(mixer.getRoot());
        dispose(scene); renderer.dispose();
        // Keep a connected canvas reusable during React effect replay/HMR.
        if (!surface.isConnected) renderer.forceContextLoss();
        command.current = () => {};
      };

      try {
        let model: THREE.Object3D;
        if (variant === "lucy") {
          const geometry = await new PLYLoader().loadAsync("../models/night-gallery/Lucy100k.ply");
          if (dead) { geometry.dispose(); return; }
          geometry.computeVertexNormals();
          model = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xd7ceba, roughness: 0.83, metalness: 0.02 }));
          model.rotation.y = Math.PI;
        } else if (variant === "trooper") {
          const manager = new THREE.LoadingManager();
          let textureFailed = false;
          manager.onError = () => { textureFailed = true; };
          const collada = await new ColladaLoader(manager).loadAsync("../models/night-gallery/stormtrooper.dae");
          if (!collada) throw new Error("The Collada file did not contain a scene.");
          model = collada.scene;
          if (dead) { dispose(model); return; }
          if (textureFailed) report("Model loaded; a texture could not load.");
          // Keep ColladaLoader's up-axis correction; rotate a parent after fitting.
          mixer = new THREE.AnimationMixer(model);
          const clip = model.animations[0];
          if (clip) { mixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play(); mixer.update(0.1); }
        } else if (variant === "mouse") {
          model = createBB8Model();
          droid = model.userData.bb8Runtime;
        } else {
          const group = new THREE.Group();
          runtime = buildRuntime(variant, group, report); model = group;
        }
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const fit = variant === "lucy" || variant === "trooper" ? 4.2 : 3.6;
        const normalized = new THREE.Group(); normalized.add(model);
        normalized.position.copy(center).multiplyScalar(-1);
        const wrapper = new THREE.Group(); wrapper.add(normalized);
        wrapper.scale.setScalar(fit / Math.max(size.x, size.y, size.z, 0.001));
        if (variant === "trooper") wrapper.rotation.y = Math.PI;
        if (variant === "lucy") wrapper.rotation.y = 0.18;
        model.traverse(child => { if (child instanceof THREE.Mesh) { child.castShadow = true; child.receiveShadow = true; } });
        stage.add(wrapper);
        if (variant === "lucy") { key.position.x = -3.5; lightTarget = 3.5; }
        if (!dead) { setReady(true); report(variant === "mouse" ? "Autonomous gallery patrol" : "Drag to explore"); element.dataset.loaded = "true"; }
      } catch (error) {
        console.error("Gallery model:", variant, error);
        if (!dead) { setFailed(true); report("This exhibit could not load. Please retry."); }
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !started) { started = true; void start(); }
    }, { rootMargin: "200px" });
    observer.observe(element);
    return () => { dead = true; observer.disconnect(); cleanup(); };
  }, [variant, attempt, progress, cinematic]);

  const autonomous = ambient || variant === "mouse";
  return <div className={`ng-exhibit ng-exhibit-${variant}`}>
    <div className="ng-model-surface" ref={host} data-model={variant}>
      <canvas key={attempt} ref={canvas} role="img" aria-label={autonomous ? `3D ${names[variant]}. Automatic gallery animation; use Motion off to pause.` : `Interactive 3D ${names[variant]}. Use the rotation and zoom buttons below.`} />
      {!ready && <div className="ng-model-loading" role="status">{failed ? "Exhibit unavailable" : "Preparing the light…"}{failed && <MetalButton onClick={() => { setFailed(false); if (cinematic) command.current("retry"); else setAttempt(a => a + 1); }}>Retry exhibit</MetalButton>}</div>}
    </div>
    {!autonomous && <div className="ng-model-tools">
      <div className="ng-model-caption"><span>{names[variant]}</span><MetalButton className="ng-controls-toggle" aria-expanded={toolsOpen} aria-controls={`ng-controls-${variant}`} onClick={() => setToolsOpen(open => !open)}>{toolsOpen ? "Close controls −" : "3D controls +"}</MetalButton></div>
      <div className="ng-model-primary"><MetalButton className="ng-model-action" disabled={!ready || paused} onClick={() => command.current("activate")}>{actions[variant]} <span aria-hidden="true">↗</span></MetalButton><MetalButton className="ng-touch-control" aria-pressed={interactive} onClick={() => command.current("interact")}>{interactive ? "Done moving" : "Move model"}</MetalButton></div>
      <div className="ng-model-buttons" id={`ng-controls-${variant}`} role="group" aria-label={`${names[variant]} controls`} hidden={!toolsOpen}>
        <MetalButton aria-label={`Rotate ${names[variant]} left`} disabled={!ready} onClick={() => command.current("left")}>←</MetalButton>
        <MetalButton aria-label={`Rotate ${names[variant]} right`} disabled={!ready} onClick={() => command.current("right")}>→</MetalButton>
        <MetalButton aria-label={`Zoom into ${names[variant]}`} disabled={!ready} onClick={() => command.current("in")}>+</MetalButton>
        <MetalButton aria-label={`Zoom out of ${names[variant]}`} disabled={!ready} onClick={() => command.current("out")}>−</MetalButton>
        <MetalButton disabled={!ready} onClick={() => command.current("reset")}>Reset</MetalButton>
        <span className="ng-drag-hint">Drag to rotate. Right-drag to move.</span>
      </div>
      <span key={status} className="ng-model-status" aria-live="polite">{status}</span>
    </div>}
  </div>;
}

