import type { State } from '../chapters/l5b/lifecycle'
/** 5.5 mascot reaction to one transition press: the model's next state (null = rejected) decides it.
 *  Reaching active from another state = cheer (the node now does its work); a rejected transition or a failing
 *  callback (the node falls into ErrorProcessing) = oops. */
export const lcReaction = (from: State, next: State | null): 'cheer' | 'oops' | null =>
  next === null || (next === 'errorprocessing' && from !== 'errorprocessing') ? 'oops' : next === 'active' && from !== 'active' ? 'cheer' : null

/** 5.5 executor pick, from the model's late-tick counts before and after: down to 0 = cheer (challenge solved),
 *  more late ticks than before = oops (the pick made the control loop worse). */
export const exReaction = (lateBefore: number, lateAfter: number): 'cheer' | 'oops' | null =>
  lateBefore > 0 && lateAfter === 0 ? 'cheer' : lateAfter > lateBefore ? 'oops' : null
