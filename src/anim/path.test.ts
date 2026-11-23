import { describe, expect, it } from 'vitest'
import { arcPoint, arcTable, cubicPoint, type Cubic } from './path'

// 2.2 topics wires (TopicsChapter on branch levels): publisher -> slam_toolbox, and the /cmd_vel return loop.
const WIRE: Cubic = [185, 150, 275, 150, 355, 40, 445, 40]
const CMD: Cubic = [445, 132, 325, 202, 305, 232, 185, 162]
const steps = (pt: (s: number) => [number, number], n = 20) => Array.from({ length: n }, (_, k) => {
  const [a, b] = pt(k / n), [c, d] = pt((k + 1) / n)
  return Math.hypot(c - a, d - b)
})

describe('arcPoint', () => {
  it('lands exactly on both ends', () => {
    expect(arcPoint(WIRE, 0)).toEqual([185, 150])
    const [x, y] = arcPoint(WIRE, 1)
    expect(x).toBeCloseTo(445, 9)
    expect(y).toBeCloseTo(40, 9)
  })
  it('equal distance fractions give equal steps on the curve (within 1 %), on both wires', () => {
    for (const c of [WIRE, CMD]) {
      const t = arcTable(c), st = steps((s) => arcPoint(c, s, t))
      expect(Math.max(...st) / Math.min(...st)).toBeLessThan(1.01)
    }
  })
  it('the raw parameter does not: measured fastest / slowest step 1.13 on the slam wire, 1.88 on /cmd_vel', () => {
    const ratio = (c: Cubic) => { const st = steps((u) => cubicPoint(c, u)); return Math.max(...st) / Math.min(...st) }
    expect(ratio(WIRE)).toBeCloseTo(1.128, 2)
    expect(ratio(CMD)).toBeCloseTo(1.881, 2)
  })
})
