import { describe, expect, it } from 'vitest'
import { BRAKE, blindM, rollOnM, rollOnS, tooFast, wheels } from './act'
import { body, TOP_SPEED } from './move'

describe('act model', () => {
  it('two numbers -> two wheel speeds, and back again (move.body)', () => {
    for (const [v, w] of [[0.1, 0], [0.1, 0.5], [0, -1], [0.2, 1.2]]) {
      const k = wheels(v, w), b = body(k.left, k.right)
      expect(b.v).toBeCloseTo(v); expect(b.w).toBeCloseTo(w)
    }
    expect(wheels(0, 1).left).toBeCloseTo(-0.08) // turn on the spot: opposite wheels
  })
  it('a wheel over the top speed is flagged', () => {
    expect(tooFast(TOP_SPEED, 0)).toBe(false)
    expect(tooFast(TOP_SPEED, 0.5)).toBe(true)
  })
  it('at top speed it rolls on about 1 cm in 0.09 s after stop, and drives 4.4 cm between checks', () => {
    expect(BRAKE).toBe(2.5)
    expect(rollOnM(TOP_SPEED) * 100).toBeCloseTo(0.968, 2)
    expect(rollOnS(TOP_SPEED)).toBeCloseTo(0.088, 3)
    expect(blindM(TOP_SPEED) * 100).toBeCloseTo(4.4, 5)
  })
})
