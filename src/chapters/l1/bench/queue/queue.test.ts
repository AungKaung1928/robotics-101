import { describe, expect, it } from 'vitest'
import { dropped, maxAgeMs, simulate } from '../../callback'
import { QUEUE_RUNS } from './result'

/** The 1.3 page model against real rclpy (run.sh, ROS 2 Humble): drops within 1, oldest data within 250 ms (transport
 * delay and how the 5 Hz timer lines up with the first callback move a run by one message; 400 ms gave 5 and 6). */
describe('1.3 queue model == measured rclpy runs (result.ts)', () => {
  it.each(QUEUE_RUNS)('callback $workMs ms', ({ workMs, dropped: realDrop, maxAgeMs: realAge }) => {
    const m = simulate(workMs)
    expect(Math.abs(dropped(m) - realDrop)).toBeLessThanOrEqual(1)
    expect(Math.abs(maxAgeMs(m) - realAge)).toBeLessThanOrEqual(250)
  })
})
