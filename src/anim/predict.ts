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
