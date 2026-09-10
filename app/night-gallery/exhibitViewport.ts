/** The part of an exhibit's own article/section currently on screen. */
export function exhibitViewport(top: number, bottom: number, scroll: number, height: number): [number, number] | null {
  const start = Math.max(0, top - scroll);
  const end = Math.min(height, bottom - scroll);
  return end > start ? [start, end] : null;
}
