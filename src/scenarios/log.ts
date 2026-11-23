import { currentStep } from '../anim/motion'

export type RowState = 'done' | 'now' | 'later'

/** State of each event-log row at playhead `t` (row times ascending): already happened, the latest one, or still to come. */
export function rowStates(times: number[], t: number): RowState[] {
  const here = currentStep(times, t)
  return times.map((_, i) => (i < here ? 'done' : i === here ? 'now' : 'later'))
}
