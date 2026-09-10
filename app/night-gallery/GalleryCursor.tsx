"use client";

import { useEffect, useRef } from "react";

export default function GalleryCursor({ paused }: { paused: boolean }) {
  const cursor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const dot = cursor.current;
    const page = dot?.closest(".night-gallery");
    if (!dot || !page) return;
    const media = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let x = 0, y = 0, tx = 0, ty = 0, frame = 0, last = 0, visible = false;
    const hide = () => { visible = false; dot.style.opacity = "0"; cancelAnimationFrame(frame); frame = 0; };
    const tick = (now: number) => {
      // Kage's .18 pointer interpolation, normalized for different refresh rates.
      const follow = 1 - Math.pow(0.82, Math.min((now - last) / 16.667, 3));
      last = now; x += (tx - x) * follow; y += (ty - y) * follow;
      dot.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.1 ? requestAnimationFrame(tick) : 0;
    };
    const move = (event: PointerEvent) => {
      if (paused || !media.matches || event.pointerType !== "mouse" || !(event.target instanceof Element) || !page.contains(event.target) || event.target.closest("dialog")) { hide(); return; }
      tx = event.clientX; ty = event.clientY;
      if (!visible) { x = tx; y = ty; visible = true; dot.style.opacity = "1"; }
      dot.classList.toggle("is-active", !!event.target.closest("a,button,summary,[data-model]"));
      if (!frame) { last = performance.now(); frame = requestAnimationFrame(tick); }
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide); window.addEventListener("keydown", hide);
    media.addEventListener("change", hide);
    return () => {
      hide(); window.removeEventListener("pointermove", move); document.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide); window.removeEventListener("keydown", hide); media.removeEventListener("change", hide);
    };
  }, [paused]);
  return <div className="ng-cursor" ref={cursor} aria-hidden="true"><span /></div>;
}
