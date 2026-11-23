import { describe, expect, it } from 'vitest'
import { BOUNCY, WOBBLE, settleTime, springAt } from './spring'

describe('springAt', () => {
  it('starts at x0 and ends at rest', () => {
    for (const s of [BOUNCY, WOBBLE, { k: 100, c: 20 }, { k: 100, c: 40 }]) {
      expect(springAt(0, s, 1)).toBeCloseTo(1, 12)
      expect(Math.abs(springAt(10, s, 1))).toBeLessThan(1e-4)
    }
  })
  it('starts with velocity v0 (numerical derivative at 0)', () => {
    for (const s of [BOUNCY, { k: 100, c: 20 }, { k: 100, c: 40 }]) {
      const h = 1e-6
      expect((springAt(h, s, 0.5, 3) - springAt(0, s, 0.5, 3)) / h).toBeCloseTo(3, 3)
    }
  })
  it('satisfies x\'\' = -k x - c x\' (finite differences)', () => {
    for (const s of [BOUNCY, { k: 100, c: 20 }, { k: 100, c: 40 }]) {
      const h = 1e-4, t = 0.13
      const x = springAt(t, s, 1, -2), xp = springAt(t + h, s, 1, -2), xm = springAt(t - h, s, 1, -2)
      expect((xp - 2 * x + xm) / (h * h)).toBeCloseTo(-s.k * x - s.c * ((xp - xm) / (2 * h)), 1)
    }
  })
  it('under-damped overshoots past 0, critically damped never does', () => {
    const ts = Array.from({ length: 400 }, (_, i) => i / 200)
    expect(Math.min(...ts.map((t) => springAt(t, BOUNCY, 1)))).toBeLessThan(-0.1)
    expect(Math.min(...ts.map((t) => springAt(t, { k: 100, c: 20 }, 1)))).toBeGreaterThanOrEqual(0)
  })
})

describe('settleTime', () => {
  it('after it, the spring stays within eps', () => {
    for (const s of [BOUNCY, WOBBLE]) {
      const T = settleTime(s, 1, 0, 0.01)
      for (let t = T; t < T + 2; t += 0.005) expect(Math.abs(springAt(t, s, 1))).toBeLessThanOrEqual(0.01)
      expect(T).toBeLessThan(1.5) // a reaction is over in well under 1.5 s
    }
  })
})
