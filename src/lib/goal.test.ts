import { describe, expect, it } from 'vitest'
import { NAV2 } from '../content/world'
import { driveDistance, minTime, minTimeAccel, ticksToGoal } from './goal'

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

describe('with his acceleration limit (2.5 m/s²)', () => {
  const a = NAV2.accLimX
  it('full speed after 0.104 s, so 2.6 m takes 10.104 s (0.104 s over the no-acceleration bound)', () => {
    expect(NAV2.maxVelX / a).toBeCloseTo(0.104, 12)
    expect(minTimeAccel(2.85, tol, v, a)).toBeCloseTo(10.104, 9)
  })
  it('a short move never reaches full speed: triangle profile', () => {
    // drive 0.02 m < v²/a = 0.027 m
    expect(minTimeAccel(0.27, tol, v, a)).toBeCloseTo(2 * Math.sqrt(0.02 / a), 9)
  })
  it('heading tolerance 0.25 rad is 14.3°', () => {
    expect((NAV2.yawGoalTolerance * 180) / Math.PI).toBeCloseTo(14.3, 1)
  })
})

describe('progress checker', () => {
  it('0.5 m within 10 s; at 0.26 m/s that takes 1.9 s', () => {
    expect(NAV2.progressRadius / NAV2.maxVelX).toBeCloseTo(1.923, 3)
    expect(NAV2.progressRadius / NAV2.maxVelX).toBeLessThan(NAV2.progressTime)
  })
})
