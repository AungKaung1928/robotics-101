/** 5.3 mascot reaction to one new tool run, from how many faults the model still allows before and after it:
 *  down to exactly one = cheer (fault named); no change while several remain = oops (that tool told nothing new). */
export const dbgReaction = (before: number, after: number): 'cheer' | 'oops' | null =>
  before > 1 && after === 1 ? 'cheer' : before > 1 && after === before ? 'oops' : null
