"use client";

import { useEffect, useRef } from "react";
import { MetalLink, MetalButton } from "./MetalControl";

const links = [
  { id: "entrance", label: "Home", path: "M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9" },
  { id: "career", label: "Career", path: "M4 20V10h4v10M10 20V6h4v14M16 20V3h4v17" },
  { id: "projects", label: "Work", path: "M4 7h16v14H4zM9 7V3h6v4M4 12h16M10 12v3h4v-3" },
  { id: "about", label: "About", path: "M8 7a4 4 0 1 0 8 0 4 4 0 1 0-8 0M4 21v-3a8 8 0 0 1 16 0v3" },
  { id: "contact", label: "Contact", path: "M3 5h18v14H3zM3 6l9 7 9-7" },
];

export default function GalleryDock({ paused, onPause }: { paused: boolean; onPause: () => void }) {
  const dock = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = dock.current;
    if (!root) return;
    const media = matchMedia("(min-width: 1060px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-dock-item]")).map(el => ({ el, w: 0, h: 0, value: 0, velocity: 0, target: 0, angle: 2.4, brightness: 0, targetAngle: 2.4, targetBrightness: 0 }));
    let frame = 0, last = 0, x = 0, y = 0, moved = false, keyboard = false, disposed = false;
    const enabled = () => media.matches && !paused;
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    const rest = () => { items.forEach(s => { s.target = s.targetBrightness = 0; s.el.dataset.near = "false"; }); wake(); };
    function tick(now: number) {
      frame = 0;
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.033); last = now;
      if (moved && !keyboard) {
        const rail = root!.getBoundingClientRect();
        const within = x > rail.left - 44 && x < rail.right + 104 && y > rail.top - 48 && y < rail.bottom + 48;
        // Sylva's smoothstep proximity field, rotated onto Thing 1's vertical axis.
        // Retarget only on input: growing tiles must not chase a stationary pointer.
        const bounds = items.map(s => s.el.getBoundingClientRect());
        items.forEach((s, i) => {
          const r = bounds[i];
          const proximity = within ? clamp(1 - Math.abs(y - r.top - r.height / 2) / 90) : 0;
          s.target = proximity * proximity * (3 - 2 * proximity);
          s.el.dataset.near = String(s.target > 0.08);
          const dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom);
          const distance = Math.hypot(dx, dy), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          s.targetAngle = distance === 0 ? Math.atan2(2 / r.height, -2 / r.width) + (x - cx) / (r.width / 2) * 0.3 + (cy - y) / (r.height / 2) * 0.15 : Math.atan2(cy - y, x - cx);
          const light = clamp(1 - distance / 185);
          s.targetBrightness = light * light * (3 - 2 * light);
        });
        moved = false;
      }
      let moving = false;
      items.forEach(s => {
        // The supplied Sylva spring: stiffness 190, exponential damping 23.
        s.velocity += (s.target - s.value) * 190 * dt;
        s.velocity *= Math.exp(-23 * dt);
        s.value += s.velocity * dt;
        if (Math.abs(s.target - s.value) < 0.001 && Math.abs(s.velocity) < 0.004) { s.value = s.target; s.velocity = 0; } else moving = true;
        const diff = ((s.targetAngle - s.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        s.angle += diff * (1 - Math.exp(-dt * 8));
        s.brightness += (s.targetBrightness - s.brightness) * (1 - Math.exp(-dt * 9));
        if (Math.abs(diff) > 0.001 || Math.abs(s.targetBrightness - s.brightness) > 0.002) moving = true;
        const v = Math.min(Math.max(s.value, 0), 1.08);
        s.el.style.width = `${s.w + Math.min(18, s.w * 0.24) * v}px`;
        s.el.style.height = `${s.h + 16 * v}px`;
        s.el.style.transform = `translateX(${v * 3.5}px)`;
        s.el.style.setProperty("--spec-angle", `${s.angle}rad`);
        s.el.style.setProperty("--spec-bright", String(clamp(s.brightness) * 0.92));
      });
      if (moving) frame = requestAnimationFrame(tick);
    }
    function wake() { if (!frame && enabled()) { last = performance.now(); frame = requestAnimationFrame(tick); } }
    const measure = () => {
      if (disposed) return;
      cancelAnimationFrame(frame); frame = 0;
      items.forEach(s => { s.el.style.width = s.el.style.height = s.el.style.transform = ""; s.el.style.removeProperty("--spec-bright"); s.value = s.velocity = s.target = s.brightness = s.targetBrightness = 0; s.el.dataset.near = "false"; });
      items.forEach(s => { const r = s.el.getBoundingClientRect(); s.w = r.width; s.h = r.height; });
    };
    const pointer = (e: PointerEvent) => { if (!enabled() || e.pointerType === "touch") return; x = e.clientX; y = e.clientY; moved = true; keyboard = false; wake(); };
    const leave = () => { moved = false; keyboard = false; rest(); };
    const focus = (e: FocusEvent) => {
      if (!enabled() || !(e.target instanceof HTMLElement) || !e.target.matches(":focus-visible")) return;
      const index = items.findIndex(s => s.el === e.target);
      if (index < 0) return;
      keyboard = true;
      items.forEach((s, i) => { s.target = i === index ? 1 : Math.abs(i - index) === 1 ? 0.24 : 0; s.targetBrightness = i === index ? 0.9 : 0; s.el.dataset.near = String(s.target > 0.08); }); wake();
    };
    const blur = () => { keyboard = false; rest(); };
    measure(); void document.fonts.ready.then(measure);
    window.addEventListener("resize", measure); media.addEventListener("change", measure);
    window.addEventListener("pointermove", pointer, { passive: true }); document.addEventListener("pointerleave", leave);
    root.addEventListener("focusin", focus); root.addEventListener("focusout", blur);
    return () => {
      disposed = true; cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure); media.removeEventListener("change", measure);
      window.removeEventListener("pointermove", pointer); document.removeEventListener("pointerleave", leave);
      root.removeEventListener("focusin", focus); root.removeEventListener("focusout", blur);
    };
  }, [paused]);

  return <>
    <header className="ng-masthead"><a className="ng-brand" href="#gallery-top">VAASU SOHEE<span>DATA SCIENTIST</span></a><div className="ng-masthead-actions"><MetalLink className="ng-mobile-resume" href="../resume.pdf" target="_blank" rel="noreferrer" aria-label="Open resume"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6" /></svg></MetalLink><MetalButton className="ng-motion" aria-pressed={paused} onClick={onPause}>{paused ? "Motion off" : "Motion on"}<span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span></MetalButton></div></header>
    <aside className="ng-rail" aria-label="Portfolio navigation">
      <a className="ng-rail-mark" href="#gallery-top" aria-label="Vaasu Sohee, home">vs<span aria-hidden="true">.</span></a>
      <span className="ng-rail-rule" aria-hidden="true" />
      <nav ref={dock} className="ng-nav ng-dock" aria-label="Gallery navigation">
        {links.map(link => <a key={link.id} href={link.id === "entrance" ? "#gallery-top" : `#${link.id}`} data-target={link.id} data-dock-item className="ng-dock-item" onClick={() => {
          dock.current?.querySelectorAll("a").forEach(a => { if (a.dataset.target === link.id) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current"); });
        }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={link.path} /></svg><span>{link.label}</span></a>)}
      </nav>
      <span className="ng-rail-rule" aria-hidden="true" />
      <MetalLink className="ng-rail-resume" href="../resume.pdf" target="_blank" rel="noreferrer">Resume <span aria-hidden="true">↗</span></MetalLink>
    </aside>
  </>;
}
