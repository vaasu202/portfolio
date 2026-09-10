# Optimized Black Hole

Source: https://vgpu.sh/examples/optimized-black-hole/source.md
Downloaded 2026-09-09. Vercel's MIT license is retained in `LICENSE`.

The source shaders, noise-volume generator and multipass pipeline are preserved. Local changes adapt the React host, pause handling, failure fallback, display-synchronized rendering (including 120 Hz), cached target resizing, optional GPU pass timing, and 0.8 render scale with a one-million-pixel ceiling. `next.config.ts` uses the installed vGPU WGSL loader; no shader is fetched at runtime.

The fixed background spans the entire viewport, including beneath the sidebar. WebGPU unavailability falls back to `public/black-hole-poster.png`, rendered locally from this same pipeline. Reduced-motion preferences render one still frame. The existing Three.js renderer independently handles the seven interactive portfolio exhibits above the background.

Validate all nine WGSL modules with the project-local `vgpu check --require-validation`. Run `pnpm run test:gpu` for actual GPU readbacks: deterministic output, event-horizon/disk contrast, finite intermediate HDR passes, animated shading and preservation of the baked geometry. Inspection images and numerical results are written to `.tmp/black-hole/`.
