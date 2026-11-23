/**
 * Inline scrubbable number (Bret Victor's reactive documents, worrydream.com/ExplorableExplanations, 2011): drag
 * sideways or use the keys to change a number inside the prose. Values snap to `step` and stay in [min, max].
 */
export type ScrubRange = { min: number; max: number; step: number; px?: number } // px = pointer pixels per step

const snap = (v: number, r: ScrubRange) => {
  const n = Math.round((v - r.min) / r.step)
  const out = r.min + n * r.step
  return Math.min(Math.max(+out.toFixed(10), r.min), r.max)
}

/** Value after dragging `dx` px from a drag that started at `v0`. */
export const scrubValue = (v0: number, dx: number, r: ScrubRange) => snap(v0 + (dx / (r.px ?? 6)) * r.step, r)

/** Value after a key press (arrows ±1 step, with Shift ±10, PageUp/Down ±10, Home/End = min/max); null = not ours. */
export function scrubKey(v: number, key: string, shift: boolean, r: ScrubRange): number | null {
  const big = shift ? 10 : 1
  switch (key) {
    case 'ArrowRight': case 'ArrowUp': return snap(v + big * r.step, r)
    case 'ArrowLeft': case 'ArrowDown': return snap(v - big * r.step, r)
    case 'PageUp': return snap(v + 10 * r.step, r)
    case 'PageDown': return snap(v - 10 * r.step, r)
    case 'Home': return r.min
    case 'End': return r.max
    default: return null
  }
}
