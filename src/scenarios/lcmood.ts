import type { State } from '../chapters/l5b/lifecycle'
/** 5.5 mascot reaction to one transition press: the model's next state (null = rejected) decides it.
 *  Reaching active from another state = cheer (the node now does its work); a rejected transition = oops. */
export const lcReaction = (from: State, next: State | null): 'cheer' | 'oops' | null =>
  next === null ? 'oops' : next === 'active' && from !== 'active' ? 'cheer' : null
