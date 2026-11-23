/**
 * Predict before reveal: the reader marks where they think something will land before the answer plays (Hohman et
 * al., Communicating with Interactive Articles, Distill 2020: interactive articles can prompt self-reflection).
 * The figure then shows guess, truth and the gap between them; `close` is for the chapter (e.g. Mascot cheer).
 */
export type Pt = [number, number]
export type Verdict = { gap: number; close: boolean }

/** Distance from guess to truth (figure units) and whether it is within `tol`. */
export function judge(guess: Pt, truth: Pt, tol: number): Verdict {
  const gap = Math.hypot(guess[0] - truth[0], guess[1] - truth[1])
  return { gap, close: gap <= tol }
}

/** Seconds the gap line takes to reach the truth. */
export const REVEAL_S = 0.4

/** Where the gap line is drawn at `t` s after reveal: from the guess toward the truth over `dur` s (ease-out). */
export function gapLine(guess: Pt, truth: Pt, t: number, dur = REVEAL_S): Pt {
  const u = Math.min(Math.max(t / dur, 0), 1), e = 1 - (1 - u) ** 3
  return [guess[0] + (truth[0] - guess[0]) * e, guess[1] + (truth[1] - guess[1]) * e]
}

/**
 * Keyboard placement of the guess (pointer: click): arrows move it by `step` (Shift: 5 steps) inside `box`
 * [xmin, ymin, xmax, ymax]; `yUp` for map frames, where ArrowUp means +y. Returns null for keys that are not ours.
 */
export function nudgeGuess(g: Pt, key: string, shift: boolean, step: number, box: [number, number, number, number], yUp = false): Pt | null {
  const d = step * (shift ? 5 : 1), up = yUp ? d : -d
  const m: Record<string, Pt> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, up], ArrowDown: [0, -up] }
  if (!m[key]) return null
  const clamp = (v: number, lo: number, hi: number) => +Math.min(Math.max(v, lo), hi).toFixed(10)
  return [clamp(g[0] + m[key][0], box[0], box[2]), clamp(g[1] + m[key][1], box[1], box[3])]
}
