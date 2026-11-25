import { describe, expect, it } from 'vitest'
import { nearestTurn, spokeDeg } from './portspoke'
import { LDS } from '../chapters/l5/port'

describe('5.1 spoke across the scan seam', () => {
  it('last ray -> ray 0 jumps ~360° in spokeDeg, nearestTurn makes it one ray step', () => {
    const n = Math.round((2 * Math.PI) / LDS.inc)
    const a = spokeDeg(LDS, n - 1), b = spokeDeg(LDS, 0)
    expect(Math.abs(b - a)).toBeGreaterThan(300)
    const step = Math.abs(nearestTurn(a, b) - a)
    expect(step).toBeCloseTo((LDS.inc * 180) / Math.PI, 6)
  })
  it('keeps the direction: result differs from target by whole turns only', () => {
    for (const [p, t] of [[10, 350], [-170, 175], [725, 0], [0, 0]]) {
      const r = nearestTurn(p, t)
      expect(Math.abs(r - p)).toBeLessThanOrEqual(180)
      expect(((r - t) % 360 + 360) % 360).toBeCloseTo(0, 9)
    }
  })
})
