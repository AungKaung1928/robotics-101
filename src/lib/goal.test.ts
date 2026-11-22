import { describe, expect, it } from 'vitest'
import { NAV2 } from '../content/world'
import { driveDistance, minTime, ticksToGoal } from './goal'

const { goalTolerance: tol, maxVelX: v, controllerHz: hz } = NAV2
describe('reaching a goal (0.26 m/s, 20 Hz, 0.25 m tolerance)', () => {
  it('1.3 cm per control tick', () => {
    expect(v / hz).toBeCloseTo(0.013, 9)
  })
  it('a goal inside the tolerance is already reached', () => {
    expect(driveDistance(0.2, tol)).toBe(0)
    expect(ticksToGoal(0.25, tol, v, hz)).toBe(0)
  })
  it('a goal 2.85 m away: 2.6 m to drive, 10 s, 200 ticks', () => {
    expect(minTime(2.85, tol, v)).toBeCloseTo(10, 9)
    expect(ticksToGoal(2.85, tol, v, hz)).toBe(200)
  })
  it('a partial tick still costs a tick', () => {
    expect(ticksToGoal(0.25 + 0.014, tol, v, hz)).toBe(2)
  })
})
