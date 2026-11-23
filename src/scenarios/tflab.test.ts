import { describe, expect, it } from 'vitest'
import { fixSettle, fixedYaw, staleYaw, tfMood, toMap, wallResidual } from './tflab'

// Robot at the origin facing +x, laser 0.1 m ahead on base_link, wall at map x = 2.
const BASE = { x: 0, y: 0, yaw: 0 }
const MOUNT = { x: 0.1, y: 0, yaw: 0 }
const WALL = 2
const ys = [-0.6, -0.3, 0, 0.3, 0.6]
const hits = ys.map((y): [number, number] => [WALL - MOUNT.x, y]) // what the laser measures, in its own frame
const residualAt = (yawErr: number) => wallResidual(toMap(BASE, { ...MOUNT, yaw: yawErr }, hits), WALL)

describe('tf lab', () => {
  it('correct mount puts every hit on the wall', () => {
    expect(residualAt(0)).toBeLessThan(1e-12)
  })
  it('a 10° mounting error moves points off the wall by r·sin(err)-sized amounts', () => {
    const e = (10 * Math.PI) / 180
    const r = residualAt(e)
    // point (1.9, y) rotated by e: x = 0.1 + 1.9 cos e - y sin e; mean |x - 2| over symmetric y
    const exp = ys.reduce((s, y) => s + Math.abs(0.1 + 1.9 * Math.cos(e) - y * Math.sin(e) - WALL), 0) / ys.length
    expect(r).toBeCloseTo(exp, 12)
    expect(r).toBeGreaterThan(0.05)
  })
  it('stale transform: 0.1 s old at 1 rad/s = 0.1 rad error, same picture as a wrong mount', () => {
    expect(staleYaw(1, 0.1)).toBeCloseTo(0.1, 12)
    expect(residualAt(staleYaw(1, 0.1))).toBeCloseTo(residualAt(0.1), 12)
  })
  it('fix: error falls monotonically to 0 and never crosses (no frame shows the wall on the wrong side)', () => {
    const e0 = 0.2
    const T = fixSettle(e0)
    let prev = e0
    for (let i = 1; i <= 120; i++) {
      const y = fixedYaw(e0, (i / 120) * T)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(prev + 1e-12)
      prev = y
    }
    expect(Math.abs(fixedYaw(e0, T))).toBeLessThanOrEqual(1e-3)
    expect(fixedYaw(e0, -1)).toBe(e0)
    expect(T).toBeGreaterThan(0.8) // slow enough to follow
    expect(T).toBeLessThan(1.5)
  })
  it('mood: dizzy before, curious while improving, happy on the wall', () => {
    const before = residualAt(0.2)
    expect(tfMood(before, before)).toBe('dizzy')
    expect(tfMood(residualAt(fixedYaw(0.2, 0.1)), before)).toBe('curious')
    expect(tfMood(residualAt(fixedYaw(0.2, fixSettle(0.2))), before)).toBe('happy')
  })
})
