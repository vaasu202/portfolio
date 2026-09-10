"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { PLYLoader } from "three/addons/loaders/PLYLoader.js";
import { ColladaLoader } from "three/addons/loaders/ColladaLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createStarTravel } from "./createStarTravel";
import { exhibitViewport } from "./exhibitViewport";
import { projects } from "./content";
import { buildRuntime } from "../components/ProjectSystemModel";
import { createBB8Model } from "../three/createBB8";
import type { Exhibit } from "./GalleryModel";

const exhibits: Exhibit[] = ["lucy", "guard", "forecast", "agents", "ecg", "mouse", "trooper"];
const locations = [[0, 0, 0], [-6, 0, -19], [5, 0, -38], [-5, 0, -57], [5, 0, -76], [-4, 0, -95], [4, 0, -114]];
type Runtime = { group: THREE.Group; plinth: THREE.Mesh; loaded: boolean; status: string; failed?: boolean; update?: (time: number, dt: number, paused: boolean) => void; activate?: () => void; light: THREE.SpotLight };

export default function GalleryWorld({ root, paused, onUnavailable, onReady }: { root: RefObject<HTMLElement | null>; paused: boolean; onUnavailable: (failed: boolean) => void; onReady: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pause = useRef(paused);
  useEffect(() => { pause.current = paused; }, [paused]);

  useEffect(() => {
    if (!canvas.current || !root.current) return;
    const surface = canvas.current, page = root.current;
    let disposed = false;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08090c, 0.025);
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: surface, antialias: true, alpha: true }); }
    catch { onUnavailable(true); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture; scene.environmentIntensity = 0.48;
    room.dispose(); pmrem.dispose();
    const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 160);
    scene.add(new THREE.HemisphereLight(0xede8e2, 0x141721, 1.15));
    const sun = new THREE.DirectionalLight(0xffedc6, 1.9);
    sun.position.set(12, 18, -8); sun.target.position.set(0, -2, 0);
    // The key spotlight supplies contact shadows; a second 2048px shadow pass is redundant.
    sun.castShadow = false;
    Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 0.5, far: 70 });
    sun.shadow.normalBias = 0.04; sun.shadow.bias = -0.0002;
    scene.add(sun, sun.target);
    const fill = new THREE.DirectionalLight(0xf5e4d4, 1.4);
    fill.position.set(5, 8, 6); scene.add(fill);
    const galleryLight = new THREE.SpotLight(0xffeed6, 150, 30, Math.PI / 3, 0.85, 1.5);
    galleryLight.castShadow = true;
    galleryLight.shadow.mapSize.set(1024, 1024); galleryLight.shadow.normalBias = 0.03;
    scene.add(galleryLight, galleryLight.target);
    const starTravel = createStarTravel();
    const travelScene = new THREE.Scene();
    camera.add(starTravel.lines); travelScene.add(camera);
    renderer.autoClear = false;
    const hosts = new Map(exhibits.map(variant => [variant, page.querySelector<HTMLElement>(`[data-model="${variant}"]`)]));
    const exhibitBounds = new Map<Exhibit, [number, number]>();
    // All seven exhibits share this renderer and its depth buffer.
    const runtimes = new Map<Exhibit, Runtime>();
    const report = (variant: Exhibit, status?: string) => {
      const r = runtimes.get(variant);
      if (!r || disposed) return;
      if (status) r.status = status;
      window.dispatchEvent(new CustomEvent("gallery-status", { detail: { variant, status: r.status, ready: r.loaded, failed: r.failed } }));
      const host = hosts.get(variant);
      if (host) host.dataset.loaded = String(r.loaded);
    };
    exhibits.forEach((variant, i) => {
      const [x, y, z] = locations[i];
      const group = new THREE.Group(); group.position.set(x, y, z); scene.add(group);
      const plinthProfile = [[0, 0], [2.38, 0], [2.42, 0.035], [2.42, 0.12], [2.36, 0.16], [2.22, 0.3], [2.17, 0.32], [0, 0.32]].map(([r, h]) => new THREE.Vector2(r, h));
      const plinth = new THREE.Mesh(new THREE.LatheGeometry(plinthProfile, 80), new THREE.MeshStandardMaterial({ color: 0x25252a, roughness: 0.35, metalness: 0.65 }));
      plinth.position.set(x, -2.49, z); plinth.receiveShadow = true; scene.add(plinth);
      const light = new THREE.SpotLight(0xffeed6, variant === "lucy" ? 65 : 130, 24, Math.PI / 4, 0.8, 1.5);
      light.position.set(x - 3, 6, z + 4); light.target.position.set(x, 0, z);
      light.shadow.mapSize.set(1024, 1024); light.shadow.normalBias = 0.03;
      runtimes.set(variant, { group, plinth, loaded: false, status: "Preparing exhibit…", light });
    });

    const load = async (variant: Exhibit) => {
      const runtime = runtimes.get(variant)!;
      try {
        let model: THREE.Object3D;
        if (variant === "lucy") {
          const geometry = await new PLYLoader().loadAsync("../models/night-gallery/Lucy100k.ply");
          geometry.computeVertexNormals();
          model = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xd7ceba, roughness: 0.83 }));
          model.rotation.y = Math.PI + 0.18;
          runtime.update = (_t, dt, still) => { if (!still) runtime.group.rotation.y += dt * 0.16; };
        } else if (variant === "trooper") {
          const result = await new ColladaLoader().loadAsync("../models/night-gallery/stormtrooper.dae");
          if (!result) throw new Error("Missing Collada scene");
          model = result.scene;
          const mixer = new THREE.AnimationMixer(model);
          const dance = mixer.clipAction(model.animations[0]);
          dance.setLoop(THREE.LoopRepeat, Infinity).play(); mixer.update(0.1);
          runtime.update = (_t, dt, still) => { if (!still) mixer.update(dt); };
        } else if (variant === "mouse") {
          model = createBB8Model();
          const droid = model.userData.bb8Runtime;
          let mouseTime = 0;
          runtime.update = (_time, dt, still) => { if (!still) { mouseTime += dt; droid.update(mouseTime); } };
          runtime.activate = () => { droid.activate(); report(variant, "BB-8 says hello."); };
        } else {
          const procedural = new THREE.Group();
          const system = buildRuntime(variant, procedural, status => report(variant, status));
          model = procedural;
          runtime.update = (time, dt, still) => { if (!still) system.update(time, dt, false); };
          runtime.activate = () => system.activate(false);
        }
        if (disposed) { release(model); return; }
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
        const centered = new THREE.Group(); centered.add(model); centered.position.copy(center).negate();
        const fitted = new THREE.Group(); fitted.add(centered);
        const project = projects.find(project => project.artifact === variant);
        fitted.scale.setScalar((project ? 3.45 : variant === "lucy" || variant === "trooper" ? 4.2 : 3.7) / Math.max(size.x, size.y, size.z));
        // The platform top is -2.49 + .32. Center the model horizontally and
        // place its measured base on that surface, independently of the artwork.
        if (project || variant === "mouse") fitted.position.set(0, -2.17 + size.y * fitted.scale.y / 2, 0);
        if (variant === "trooper") fitted.rotation.y = Math.PI;
        runtime.group.add(fitted);
        model.traverse(o => { if (o instanceof THREE.Mesh) { o.castShadow = true; o.receiveShadow = true; } });
        runtime.loaded = true; report(variant, variant === "mouse" ? "Autonomous gallery patrol" : "Drag to rotate · right-drag to move");
        if (variant === "lucy") requestAnimationFrame(() => { if (!disposed) onReady(); });
        if (project) {
          // Actual portfolio preview assets become physical exhibits, giving
          // the abstract models context without putting another UI over them.
          const texture = await new THREE.TextureLoader().loadAsync(`../${project.image}`);
          if (disposed) { texture.dispose(); return; }
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
          const aspect = texture.image.width / texture.image.height;
          const width = 4.65, height = 3.1, frameAspect = width / height;
          if (aspect < frameAspect) { texture.repeat.y = aspect / frameAspect; texture.offset.y = (1 - texture.repeat.y) * 0.5; }
          else { texture.repeat.x = frameAspect / aspect; texture.offset.x = (1 - texture.repeat.x) * 0.5; }
          const display = new THREE.Group(); display.position.set(0, -0.45, -2.7);
          const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.13, height + 0.13, 0.14), new THREE.MeshStandardMaterial({ color: 0x65705c, metalness: 0.65, roughness: 0.35 }));
          const picture = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
          picture.position.z = 0.076; display.add(frame, picture); runtime.group.add(display);
        }
      } catch (error) {
        console.error("Gallery exhibit", variant, error);
        if (runtime.loaded) report(variant, "Model ready. Preview artwork unavailable.");
        else { runtime.failed = true; report(variant, "This exhibit could not load. Please retry."); }
      }
    };
    exhibits.forEach(variant => void load(variant));

    // Kage: separate Catmull-Rom position/target curves, tension .42, section
    // center anchors, interpolated focal length, damping 5.2, subtle pointer rig.
    const cameraPoints: THREE.Vector3[] = [], targetPoints: THREE.Vector3[] = [];
    locations.forEach(([x, , z], i) => {
      const side = i === 2 || i === 4 ? 1 : -1;
      cameraPoints.push(new THREE.Vector3(x + side * 3.1, 1.05, z + 10.3));
      targetPoints.push(new THREE.Vector3(x + side * 3.1, i >= 1 && i <= 4 ? -1.1 : 0.15, z));
    });
    const positionCurve = new THREE.CatmullRomCurve3(cameraPoints, false, "catmullrom", 0.42);
    const targetCurve = new THREE.CatmullRomCurve3(targetPoints, false, "catmullrom", 0.42);
    let anchors: number[] = [], smooth = 0, mx = 0, my = 0, pointerX = 0, pointerY = 0, last = performance.now();
    const enteredAt = performance.now();
    let activeExhibit: Exhibit | undefined;
    const p = new THREE.Vector3(), t = new THREE.Vector3();
    const measure = () => {
      const width = surface.clientWidth, height = surface.clientHeight;
      const rail = parseFloat(getComputedStyle(page).getPropertyValue("--ng-rail-space")) || 0;
      renderer.setSize(width, height, false);
      // Extend the original composition to the left instead of recentering it.
      // Stars now cross behind the floating rail; exhibits keep their screen positions.
      camera.setViewOffset(Math.max(1, width - rail), height, -rail, 0, width, height);
      locations.forEach(([x], i) => {
        const side = i === 2 || i === 4 ? 1 : -1;
        cameraPoints[i].x = targetPoints[i].x = x + side * Math.min(3.3, camera.aspect * 1.6);
      });
      anchors = exhibits.map((variant, i) => {
        const host = hosts.get(variant);
        if (!host) return 0;
        const owner = host.closest(".ng-project, section");
        if (owner) {
          const bounds = owner.getBoundingClientRect();
          exhibitBounds.set(variant, [bounds.top + scrollY, bounds.bottom + scrollY]);
        }
        if (i === 0) return 0;
        const rect = host.getBoundingClientRect();
        return rect.top + scrollY + rect.height / 2 - innerHeight / 2;
      });
      for (let i = 1; i < anchors.length; i++) anchors[i] = Math.max(anchors[i], anchors[i - 1] + 1);
    };
    const progressFor = (y: number) => {
      if (y <= 0) return 0;
      for (let i = 0; i < anchors.length - 1; i++) if (y <= anchors[i + 1]) {
        const fraction = (y - anchors[i]) / (anchors[i + 1] - anchors[i]);
        // A composed reading pause at each exhibit, followed by the camera
        // journey. Smoothstep keeps departure and arrival continuous.
        return i + THREE.MathUtils.smoothstep(fraction, i === 0 ? 0 : 0.28, 0.76);
      }
      return anchors.length - 1;
    };
    const resize = new ResizeObserver(measure); resize.observe(page); measure();
    window.addEventListener("resize", measure);
    document.fonts.ready.then(() => { if (!disposed) measure(); });
    const pointer = (event: PointerEvent) => { pointerX = event.clientX / innerWidth * 2 - 1; pointerY = event.clientY / innerHeight * 2 - 1; };
    window.addEventListener("pointermove", pointer, { passive: true });
    let drag: { variant: Exhibit; x: number; y: number; pan: boolean; target: HTMLElement } | undefined;
    const down = (event: PointerEvent) => {
      const host = (event.target as HTMLElement).closest<HTMLElement>("[data-model]");
      if (!host || host.dataset.model === "mouse" || event.button > 2) return;
      drag = { variant: host.dataset.model as Exhibit, x: event.clientX, y: event.clientY, pan: event.button === 2 || event.shiftKey, target: host };
      host.setPointerCapture(event.pointerId); event.preventDefault();
    };
    const move = (event: PointerEvent) => {
      if (!drag) return;
      if (!event.buttons) { drag = undefined; return; }
      const r = runtimes.get(drag.variant)!;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (drag.pan) { r.group.position.x += dx * 0.012; r.group.position.y -= dy * 0.012; }
      else { r.group.rotation.y += dx * 0.009; r.group.rotation.x = THREE.MathUtils.clamp(r.group.rotation.x + dy * 0.006, -1, 1); }
      drag.x = event.clientX; drag.y = event.clientY;
    };
    const up = () => { drag = undefined; };
    const contextMenu = (event: MouseEvent) => { if ((event.target as HTMLElement).closest("[data-model]")) event.preventDefault(); };
    page.addEventListener("pointerdown", down); page.addEventListener("pointermove", move); page.addEventListener("pointerup", up); page.addEventListener("pointercancel", up); page.addEventListener("contextmenu", contextMenu);
    const command = (event: Event) => {
      const { variant, action } = (event as CustomEvent<{ variant: Exhibit; action: string }>).detail;
      const r = runtimes.get(variant); if (!r) return;
      if (action === "status") { report(variant); return; }
      if (action === "retry" && r.failed) { r.failed = false; report(variant, "Preparing exhibit…"); void load(variant); return; }
      if (!r.loaded) return;
      if (action === "left" || action === "right") r.group.rotation.y += action === "left" ? -0.3 : 0.3;
      if (action === "in" || action === "out") r.group.scale.setScalar(THREE.MathUtils.clamp(r.group.scale.x * (action === "in" ? 1.15 : 0.87), 0.55, 1.65));
      if (action === "reset") { r.group.position.fromArray(locations[exhibits.indexOf(variant)]); r.group.rotation.set(0, 0, 0); r.group.scale.setScalar(1); report(variant, "Exhibit reset."); }
      if (action === "activate" && (!pause.current || variant === "lucy")) r.activate?.();
    };
    window.addEventListener("gallery-command", command);
    let animationFrame = 0, hadContent = true, metricsAt = 0;
    const frame = (now: number) => {
      animationFrame = requestAnimationFrame(frame);
      // A RAF timestamp can precede setup's performance.now() when React
      // mounts during the same frame. Negative dt would extrapolate the rig.
      const dt = THREE.MathUtils.clamp((now - last) / 1000, 0, 0.04); last = now;
      if (document.hidden) return;
      const progress = progressFor(scrollY);
      smooth = THREE.MathUtils.clamp(pause.current ? Math.round(progress) : THREE.MathUtils.damp(smooth, progress, 5.2, dt), 0, exhibits.length - 1);
      const u = THREE.MathUtils.clamp(smooth / (exhibits.length - 1), 0, 1);
      positionCurve.getPoint(u, p); targetCurve.getPoint(u, t);
      if (!pause.current) {
        mx = THREE.MathUtils.damp(mx, pointerX, 2.6, dt); my = THREE.MathUtils.damp(my, pointerY, 2.6, dt);
        p.x += mx * 0.32; p.y -= my * 0.18; t.x -= mx * 0.1;
      }
      const travel = Math.sin((smooth % 1) * Math.PI);
      p.y += travel * 1.25;
      // A foreground-to-sculpture dolly with a small rising arc. Scrolling
      // immediately takes over, so the entrance never gates the portfolio.
      const intro = !pause.current && scrollY < 20 ? Math.pow(1 - Math.min(1, (now - enteredAt) / 3400), 3) : 0;
      p.z += intro * 7.5; p.x += intro * 1.5; p.y -= intro * 1.25;
      camera.position.copy(p); camera.lookAt(t);
      camera.rotation.z += Math.sin(smooth * Math.PI) * 0.012 + intro * 0.035;
      camera.fov = 38 + travel * 7 + intro * 4; camera.updateProjectionMatrix();
      fill.position.set(p.x + 5, p.y + 5, p.z + 4); fill.target.position.copy(t); fill.target.updateMatrixWorld();
      sun.position.set(t.x + 12, 18, t.z - 8); sun.target.position.copy(t); sun.target.updateMatrixWorld();
      const left = Math.min(exhibits.length - 2, Math.floor(smooth)), blend = smooth - left;
      const lightA = runtimes.get(exhibits[left])!.light, lightB = runtimes.get(exhibits[left + 1])!.light;
      galleryLight.position.lerpVectors(lightA.position, lightB.position, blend);
      galleryLight.target.position.lerpVectors(lightA.target.position, lightB.target.position, blend);
      galleryLight.intensity = THREE.MathUtils.lerp(lightA.intensity, lightB.intensity, blend);
      fill.intensity = THREE.MathUtils.lerp(left === 0 ? 1.1 : 2.5, 2.5, blend);
      const visible: { variant: Exhibit; runtime: Runtime; top: number; bottom: number }[] = [];
      runtimes.forEach((r, variant) => {
        const distance = Math.abs(exhibits.indexOf(variant) - smooth);
        const bounds = exhibitBounds.get(variant);
        const viewport = bounds && exhibitViewport(bounds[0], bounds[1], scrollY, surface.clientHeight);
        // Camera proximity alone can reveal future models across text-only gaps.
        // Each model, platform and preview is confined to its owning DOM section.
        const shown = Boolean(viewport && distance < 0.85);
        r.group.visible = r.plinth.visible = false;
        if (shown && viewport) visible.push({ variant, runtime: r, top: viewport[0], bottom: viewport[1] });
        const host = hosts.get(variant);
        const active = String(shown && distance < 0.12 && viewport && viewport[0] < surface.clientHeight * 0.5 && viewport[1] > surface.clientHeight * 0.8);
        if (host?.parentElement && host.parentElement.dataset.active !== active) host.parentElement.dataset.active = active;
        if (shown) r.update?.(now, dt, pause.current);
      });
      starTravel.update(scrollY, dt, pause.current);
      const hasContent = visible.length > 0 || starTravel.lines.visible;
      let drawCalls = 0;
      if (hasContent || hadContent) {
        renderer.setScissorTest(false);
        renderer.clear();
        camera.updateMatrixWorld();
        // Stars always cover the full viewport, including beneath the rail.
        if (starTravel.lines.visible) {
          renderer.render(travelScene, camera);
          drawCalls += renderer.info.render.calls;
        }
        for (const { runtime: r, top, bottom } of visible) {
          // At section edges the exhibit scrolls with its section rather than
          // leaving a stationary sculpture visibly sliced by the clipping edge.
          const shift = top > 0 ? top : Math.min(0, bottom - surface.clientHeight);
          if (camera.view) camera.view.offsetY = -shift;
          camera.updateProjectionMatrix();
          renderer.setScissor(0, surface.clientHeight - bottom, surface.clientWidth, bottom - top);
          renderer.setScissorTest(true);
          r.group.visible = r.plinth.visible = true;
          renderer.render(scene, camera);
          drawCalls += renderer.info.render.calls;
          r.group.visible = r.plinth.visible = false;
        }
        if (camera.view) camera.view.offsetY = 0;
        camera.updateProjectionMatrix();
        renderer.setScissorTest(false);
      }
      hadContent = hasContent;
      if (now - metricsAt > 250) {
        surface.dataset.chapter = smooth.toFixed(3);
        surface.dataset.travel = starTravel.intensity.toFixed(3);
        surface.dataset.drawCalls = String(drawCalls);
        surface.dataset.exhibitRegions = JSON.stringify(visible.map(({ variant, top, bottom }) => ({ variant, top, bottom })));
        metricsAt = now;
      }
      const active = exhibits[Math.round(smooth)];
      if (activeExhibit !== active) {
        activeExhibit = active; page.dataset.activeExhibit = active;
        page.querySelectorAll<HTMLAnchorElement>(".ng-work-nav a").forEach(a => {
          if (a.dataset.exhibit === active) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
        });
      }
    };
    animationFrame = requestAnimationFrame(frame);
    return () => {
      disposed = true; cancelAnimationFrame(animationFrame); resize.disconnect();
      window.removeEventListener("resize", measure); window.removeEventListener("pointermove", pointer); window.removeEventListener("gallery-command", command);
      page.removeEventListener("pointerdown", down); page.removeEventListener("pointermove", move); page.removeEventListener("pointerup", up); page.removeEventListener("pointercancel", up); page.removeEventListener("contextmenu", contextMenu);
      release(scene); release(travelScene); environment.dispose(); renderer.dispose();
      if (!surface.isConnected) renderer.forceContextLoss();
    };
  }, [root, onUnavailable, onReady]);
  return <div className="ng-world" aria-hidden="true"><canvas className="ng-world-geometry" ref={canvas} /></div>;
}

function release(root: THREE.Object3D) {
  const geometry = new Set<THREE.BufferGeometry>(), material = new Set<THREE.Material>(), texture = new Set<THREE.Texture>();
  root.traverse(o => {
    if (!(o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.Points)) return;
    geometry.add(o.geometry); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => material.add(m));
  });
  material.forEach(m => Object.values(m).forEach(v => { if (v instanceof THREE.Texture) texture.add(v); }));
  geometry.forEach(g => g.dispose()); material.forEach(m => m.dispose()); texture.forEach(t => t.dispose());
}
