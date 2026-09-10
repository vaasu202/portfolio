# Night Gallery demo

Run `npm run dev`, then open http://localhost:3000/night-gallery/.
The original portfolio remains at `/`.

Design read: a cinematic portfolio with an astronomical background, graphite surfaces, warm white typography and restrained copper accents. Glametrix uses its Light, Regular and Bold cuts to give the hero and section titles a sleek geometric silhouette without sacrificing width or legibility. Onest keeps reading text and UI clear, and IBM Plex Mono is reserved for technical labels. Professional experience precedes projects and retains the original company logo dimensions and hover movements.

## Black-hole background and vGPU

The full source of https://vgpu.sh/examples/optimized-black-hole is integrated in `app/night-gallery/black-hole/`, with its MIT notice. The original multi-pass lensing, animated accretion disk, stars and HDR bloom are preserved. The background spans the entire viewport, including behind the floating sidebar. Charcoal project panels, descriptive project tabs, preview dialogs, experience cards and technology surfaces share the theme defined in `celestial.css`.

The vGPU skill is installed at `C:/Users/vsohe/.codex/skills/vgpu/SKILL.md`. The project is locked to vGPU 0.4.0; use its project-local bundled documentation for future API changes. Next.js resolves WGSL imports through the installed loader. Three.js retains the seven models and camera journey; the previous garden environment is no longer mounted.

Rendering follows native display refresh, including 120 Hz. The background uses 0.8 resolution scale with a one-million-pixel ceiling on large displays; existing render targets resize in place. Hidden tabs suspend the background loop, Motion off freezes it, and reduced-motion preferences render a still frame. A locally rendered poster from the same pipeline covers loading and WebGPU failure. Desktop and mobile both use the same background. See `app/night-gallery/black-hole/README.md` for source provenance and implementation details.

Checks: `pnpm run build`, `pnpm run test:gallery`, `pnpm run test:gpu`, and project-local `vgpu check --require-validation` on all nine black-hole WGSL modules. The GPU test reads real pixels, checks finite intermediate HDR passes, confirms deterministic output, and verifies that animation reuses the baked geometry. Diagnostic images and numerical results are in ignored `.tmp/black-hole/`.

## Desktop performance and star travel

The scene keeps a single 1024px key shadow pass, culls hidden exhibits and avoids drawing an empty career scene. Large charcoal panels retain their gradients and highlights without live backdrop blur. A 320-star, camera-relative Three.js volume adds one draw call while scrolling. Both canvases and the header shading span the full viewport, behind the floating navigation. An extended camera frustum preserves the original exhibit alignment. Models, platforms and preview boards use cached bounds and scissor clipping to their owning article/section, so upcoming exhibits never bleed behind the introduction, career or technology stack. Star travel is drawn separately across the entire viewport. Scroll velocity controls trail length and opacity; reverse scrolling reverses their direction and stopping fades the volume completely. The motion toggle also disables star travel.

The background canvas reports submitted frames per second in `data-fps`; this is a rolling RAF/submission rate, not proof of presented GPU frames. Display refresh, browser scheduling and hardware still determine actual FPS. The shader benchmark uses real GPU timestamps: at a reference 1440×900 viewport, 40 warmed samples measured a median 0.40 ms for the full pipeline at 0.8 scale (0.24 ms at 0.6 scale). These isolated timings exclude Three.js and browser composition. Set `NG_BENCHMARK=1` when running `tests/black-hole.test.mjs` to repeat it. Results are written to `.tmp/black-hole/benchmark.json`.

## Interactions

- Navigation combines the supplied AnimatedTopDock glass variant's vertical rail with Sylva's spring magnification, opaque hover tiles, paper active state and cursor-directed specular rim. Sylva's spring constants are retained; the proximity field is rotated onto the rail's vertical axis. On compact screens it becomes a bottom dock.
- Buttons use the supplied LiquidMetalButton GLSL, including dispersion, cursor warping, press ripples, sharp travelling rims and the five-pass composite. The rectangular project-preview buttons use a quiet CSS surface. Other metal controls share one WebGL renderer and paint into local 2D canvases. Idle rims are cached; active controls update at display refresh. Motion off and reduced-motion preferences freeze continuous movement. Native buttons and links remain usable if WebGL is unavailable.
- Drag a model to rotate it. Right-drag or Shift-drag moves it.
- The Kage cursor follows the pointer with the reference's .18 interpolation (normalized for refresh rate). Its 26px ring expands to 52px over interactive elements. It leaves the native pointer usable and switches off for touch, keyboard navigation, reduced motion and Motion off.
- Lucy slowly rotates like a gallery sculpture, the Stormtrooper dances on a continuous loop, and BB-8 patrols its platform with rolling body motion and a tracking head. These autonomous exhibits have no visible control panel. The four project exhibits retain their primary interaction and **3D controls** for rotation, zoom and reset.
- All same-page navigation links travel through the scroll sequence with GSAP ScrollToPlugin. Distance sets the duration (0.75–4.8 seconds), with gradual acceleration and deceleration. Wheel, touch and navigation keys interrupt travel; a new link replaces the previous destination. The URL hash and keyboard focus update on arrival. Motion off and reduced-motion preferences use immediate navigation.
- Existing project previews are displayed in framed 3D exhibits and as clickable thumbnails. The project panels distinguish outcomes, supporting metrics and technologies.
- Your model adjustments persist as you move between exhibits.
- Project previews open in a dialog; Escape closes it.
- Motion off pauses animation and removes animated text transitions.
- Reduced-motion preferences and compact screens use independent model viewers with a flowing layout. Project and BB-8 touch viewers have an explicit Move model / Done moving toggle so normal page scrolling works. Lucy and the dancer respect both reduced-motion preferences and the global motion toggle.

The cinematic layout requires at least 1060px width and 650px height. Models and fonts are stored locally. The demo includes loading/error states and retry controls. External resume/source/contact links preserve the original portfolio content.

## Files

- `app/night-gallery/page.tsx`: content, accessible navigation and text choreography.
- `app/night-gallery/GalleryWorld.tsx`: desktop gallery, camera rig and shared renderer.
- `app/night-gallery/GalleryModel.tsx`: exhibit controls and compact/reduced-motion viewers.
- `app/night-gallery/gallery.css`: scoped layout and typography.
- `app/night-gallery/GalleryDock.tsx`: responsive rail and Sylva hover spring.
- `app/night-gallery/MetalControl.tsx` and `liquidMetal.js`: native controls and the shared material renderer adapted from the supplied reference.
- `public/models/night-gallery/CREDITS.md` and `public/fonts/CREDITS.md`: asset attribution.

Build with `npm run build`; the static demo is exported to `out/night-gallery/`.

The review server can serve that export with `python -m http.server 4173 --bind 127.0.0.1 --directory out`, at http://127.0.0.1:4173/night-gallery/.


BB-8 replaces the electric mouse in this route (the internal exhibit key remains `mouse` to preserve navigation bindings). `app/three/createBB8.js` extracts only the user's supplied model, batches the detailed geometry into 13 meshes, and retains a subtle head motion and a Say hello reaction. The four project camera targets are lowered by 0.75 world units to raise the complete exhibits alongside their descriptions. `tests/bb8.test.mjs` checks geometry, bounds and material batching; it uses a native Canvas implementation, supplied via `BB8_CANVAS_MODULE` or an installed `@napi-rs/canvas`.
