import type { Ev } from '../chapters/l4/patrol'
/** 4.4 mascot reaction counters for the first `shown` events (PatrolChapter's k = events shown so far, NOT the Player's t), from the model's own event list (run()): every goal reached
 *  = one cheer, every failed goal = one oops. Mascot reacts when a count rises. */
export const patrolMood = (events: Ev[], shown: number): { cheer: number; oops: number } => {
  let cheer = 0, oops = 0
  for (const e of events.slice(0, Math.max(0, shown))) {
    if (e.kind === 'reached') cheer++
    else if (e.kind === 'failed') oops++ // the noRetry stop comes right after its failure: one oops, not two
  }
  return { cheer, oops }
}
