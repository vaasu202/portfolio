"use client";

import { useEffect, useRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";
import { attachMetal } from "./liquidMetal";

function MetalSurface() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const surface = canvas.current;
    if (!surface || !surface.parentElement) return;
    return attachMetal(surface, surface.parentElement);
  }, []);
  return <canvas ref={canvas} className="ng-metal-fx" aria-hidden="true" />;
}

export function MetalButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={`ng-metal ${className}`}>{!className.split(" ").includes("ng-preview-card") && <MetalSurface />}<span className="ng-metal-label">{children}</span></button>;
}

export function MetalLink({ children, className = "", ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} className={`ng-metal ${className}`}><MetalSurface /><span className="ng-metal-label">{children}</span></a>;
}
