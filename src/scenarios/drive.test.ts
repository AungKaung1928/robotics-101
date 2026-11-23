import { describe, expect, it } from 'vitest'
import { NAV2 } from '../content/world'
import { driveDistance, minTimeAccel } from '../lib/goal'
import { driveProfile } from './drive'

describe('driveProfile', () => {
  it('trapezoid: ends at the drive distance at minTimeAccel, stopped, speed never above the limit', () => {
    const p = driveProfile(4, 0.25, 0.26, 0.5)
    expect(p.T).toBeCloseTo(minTimeAccel(4, 0.25, 0.26, 0.5), 12)
    expect(p.at(p.T).s).toBeCloseTo(driveDistance(4, 0.25), 9)
    expect(p.at(p.T).v).toBeCloseTo(0, 12)
    expect(p.events).toHaveLength(4)
    let prev = -1
    for (let t = 0; t <= p.T; t += p.T / 500) {
      const { s, v } = p.at(t)
      expect(v).toBeLessThanOrEqual(0.26 + 1e-12)
      expect(s).toBeGreaterThanOrEqual(prev - 1e-12) // never drives backwards
      prev = s
    }
  })
  it('position and speed are continuous at the phase changes', () => {
    const p = driveProfile(4, 0.25, 0.26, 0.5)
    for (const e of p.events.slice(1, -1)) {
      expect(p.at(e - 1e-7).s).toBeCloseTo(p.at(e + 1e-7).s, 6)
      expect(p.at(e - 1e-7).v).toBeCloseTo(p.at(e + 1e-7).v, 5)
    }
  })
  it('short drive is a triangle: no cruise event, peak below the limit, still ends at L', () => {
    const p = driveProfile(0.3, 0.25, 0.26, 0.5) // 0.05 m to drive
    expect(p.events).toHaveLength(3)
    expect(p.vPeak).toBeLessThan(0.26)
    expect(p.at(p.T).s).toBeCloseTo(0.05, 9)
    expect(p.T).toBeCloseTo(minTimeAccel(0.3, 0.25, 0.26, 0.5), 12)
  })
  it('his Nav2 numbers (0.26 m/s, 2.5 m/s², 0.25 m tolerance), 4 m goal: 0.104 s to full speed out of 14.53 s', () => {
    const p = driveProfile(4, NAV2.goalTolerance, NAV2.maxVelX, NAV2.accLimX)
    expect(p.events[1]).toBeCloseTo(0.26 / 2.5, 12)
    expect(p.T).toBeCloseTo(3.75 / 0.26 + 0.26 / 2.5, 9)
    expect(p.T).toBeCloseTo(14.527, 3)
  })
})
