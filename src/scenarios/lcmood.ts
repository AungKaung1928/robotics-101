import type { State } from '../chapters/l5b/lifecycle'
/** 5.5 mascot reaction to one transition press: the model's next state (null = rejected) decides it.
 *  Reaching active from another state = cheer (the node now does its work); a rejected transition or a failing
 *  callback (the node falls into ErrorProcessing) = oops. */
export const lcReaction = (from: State, next: State | null): 'cheer' | 'oops' | null =>
  next === null || (next === 'errorprocessing' && from !== 'errorprocessing') ? 'oops' : next === 'active' && from !== 'active' ? 'cheer' : null
