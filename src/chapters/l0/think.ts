// Level 0 "think": the 1.1 rule (same model, same numbers, same figure), shown without code.
import { STEP_M, run } from '../l1/decide'

export { GOAL, SCAN_HZ, SPEED, STEP_M, START_M, run, scenario } from '../l1/decide'
export const RULE_M = 0.5 // the rule the page opens with, as in 1.1

/** Largest whole-centimetre rule that still lets the robot touch the wall (the model says 2 cm: last check is 2.4 cm out). */
export function largestBumpCm(): number {
  let worst = -1
  for (let cm = 0; cm <= 100; cm++) if (run(cm / 100).crashed) worst = cm
  return worst
}

/** Distance driven between two checks, in cm (5.2 at 0.26 m/s and 5 checks per second). */
export const blindCm = () => Math.round(STEP_M * 1000) / 10
