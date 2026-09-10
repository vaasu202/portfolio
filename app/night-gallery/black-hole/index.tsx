"use client";

import { useEffect, useRef, useState } from "react";
import { createRenderer } from "./renderer";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Standalone host for the optimized black-hole renderer formerly used by the homepage. */
export function BlackHoleBackground({ paused, onReady }: { paused: boolean; onReady?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const pause = useRef(paused);
  useEffect(() => { pause.current = paused; }, [paused]);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const renderer = createRenderer({ canvas, isPaused: () => pause.current || reduced.matches });
    void renderer.ready.then(() => {
      if (!cancelled) {
        setIsReady(true);
        onReady?.();
      }
    }).catch(error => {
      canvas.dataset.renderer = "fallback";
      console.warn("Black-hole background unavailable", error);
      if (!cancelled) onReady?.();
    });
    return () => {
      cancelled = true;
      renderer.dispose();
    };
  }, [onReady]);

  return (
    <div className="ng-black-hole" aria-hidden="true" style={{ backgroundImage: `url("${basePath}/black-hole-poster.png")` }}>
      <canvas
        ref={canvasRef}
        data-ready={isReady}
        data-renderer="loading"
      />
    </div>
  );
}

export default BlackHoleBackground;
