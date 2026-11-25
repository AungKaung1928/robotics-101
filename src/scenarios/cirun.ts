import { SECONDS, STEPS, run, type Push, type Step } from '../chapters/l5/ci'

/**
 * Chapter 5.2 scene: the push runs through ci.yml step by step, each step taking a time proportional to its measured
 * seconds in the real run (ci.SECONDS; 1 real s = SCALE s on screen, at least MIN so a 0-1 s step is still seen).
 * When the failing step ends, every later step turns 'skipped' at once: the red stops the line (ci.run()).
 */
export const SCALE = 0.05, MIN = 0.25
const dur = (st: Step) => Math.max(MIN, SECONDS[st] * SCALE)
export type Look = 'wait' | 'running' | 'success' | 'failure' | 'skipped'
export interface StepAt { look: Look; frac: number; realS: number } // frac 0..1 of a running step; realS = its seconds so far

export const total = (push: Push) => STEPS.filter((st) => run(push)[st] !== 'skipped').reduce((a, st) => a + dur(st), 0)

export function ciAt(push: Push, t: number): Record<Step, StepAt> {
  const res = run(push), end = total(push), out = {} as Record<Step, StepAt>
  let start = 0
  for (const st of STEPS) {
    if (res[st] === 'skipped') { out[st] = t >= end - 1e-9 ? { look: 'skipped', frac: 0, realS: 0 } : { look: 'wait', frac: 0, realS: 0 }; continue }
    const d = dur(st), f = (t - start + 1e-9) / d
    out[st] = f < 0 ? { look: 'wait', frac: 0, realS: 0 } : f < 1 ? { look: 'running', frac: f, realS: Math.floor(f * SECONDS[st]) } : { look: res[st], frac: 1, realS: SECONDS[st] }
    start += d
  }
  return out
}
