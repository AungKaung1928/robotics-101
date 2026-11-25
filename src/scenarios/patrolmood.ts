import type { Ev } from '../chapters/l4/patrol'
/** 4.4 mascot reaction counters at playhead step k, from the model's own event list (run()): every goal reached
 *  = one cheer, every failed goal and an early stop (no retries left) = one oops. Mascot reacts when a count rises. */
export const patrolMood = (events: Ev[], k: number): { cheer: number; oops: number } => {
  let cheer = 0, oops = 0
  for (const e of events.slice(0, Math.max(0, k))) {
    if (e.kind === 'reached') cheer++
    else if (e.kind === 'failed' || (e.kind === 'stop' && e.why === 'noRetry')) oops++
  }
  return { cheer, oops }
}
