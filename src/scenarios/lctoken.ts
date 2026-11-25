import type { State } from '../chapters/l5b/lifecycle'

/**
 * Chapter 5.5 scene: one token = the node. It sits on the box of the node's state and springs to the next box when a
 * transition from lifecycle.step() / raiseError() / onError() succeeds; a rejected transition (model returns null)
 * leaves it where it is and wobbles the box. Box geometry = LifecycleChapter's figure (4 boxes 155 apart, ErrorProcessing below).
 */
export const X0 = 20, PITCH = 155, BOX_W = 140, TOP_Y = 20, BOX_H = 44
export const EP = { x: X0 + 1.5 * PITCH - 15, y: 110, w: 170 }
const ROW: Partial<Record<State, number>> = { unconfigured: 0, inactive: 1, active: 2, finalized: 3 }

/** Token centre: on the top edge of the state's box (a badge riding the box). */
export function tokenAt(s: State): { x: number; y: number } {
  if (s === 'errorprocessing') return { x: EP.x + EP.w / 2, y: EP.y }
  return { x: X0 + ROW[s]! * PITCH + BOX_W / 2, y: TOP_Y }
}

/** What the reader sees after asking for a change: the token moves (next state) or the box wobbles (rejected). */
export const reaction = (from: State, next: State | null): { at: State; wobble: boolean } =>
  next ? { at: next, wobble: false } : { at: from, wobble: true }
