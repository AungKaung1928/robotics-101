/** Side of the Arena viewBox in metres (-5.4 .. 5.4); keep in step with components/Arena.tsx. */
export const VIEW = 10.8

type Box = { left: number; top: number; width: number; height: number }

/** Pointer position on the Arena SVG → world metres (y up), snapped to `step` and clamped to ±`lim`.
 *  The SVG scales its square viewBox to fit and centres it (preserveAspectRatio default 'xMidYMid meet'). */
export function arenaPoint(clientX: number, clientY: number, box: Box, step = 0.05, lim = 4.5): { x: number; y: number } {
  const scale = Math.min(box.width, box.height) / VIEW
  const cx = box.left + box.width / 2
  const cy = box.top + box.height / 2
  const snap = (v: number) => Math.min(lim, Math.max(-lim, Math.round(v / step) * step)) + 0 // + 0 turns -0 into 0
  return { x: snap((clientX - cx) / scale), y: snap(-(clientY - cy) / scale) }
}
