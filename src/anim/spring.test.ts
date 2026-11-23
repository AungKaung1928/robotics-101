import { describe, expect, it } from 'vitest'
import { BOUNCY, PRESS, WOBBLE, settleTime, springAt, springEasing, springFrom } from './spring'

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

describe('springEasing', () => {
  it('linear() from 0 to 1 with the overshoot of the spring, short enough for a button', () => {
    const { easing, ms } = springEasing(PRESS)
    const v = easing.slice(7, -1).split(', ').map(Number)
    expect(v).toHaveLength(41)
    expect(v[0]).toBe(0)
    expect(v[40]).toBe(1)
    expect(Math.max(...v)).toBeGreaterThan(1.1) // ζ = 0.5 overshoots by e^(-π/√3) ≈ 16 %
    expect(Math.max(...v)).toBeLessThan(1.2)
    expect(ms).toBeGreaterThan(150)
    expect(ms).toBeLessThan(500)
  })
})

describe('springFrom (Motion visualDuration + bounce)', () => {
  it('bounce 0 is critically damped, and BOUNCY is visualDuration 2π/24 s with bounce 0.65', () => {
    const crit = springFrom(0.3, 0)
    expect(crit.c * crit.c).toBeCloseTo(4 * crit.k, 6)
    const b = springFrom((2 * Math.PI) / 24, 0.65)
    expect(b.k).toBeCloseTo(BOUNCY.k, 9)
    expect(b.c).toBeCloseTo(BOUNCY.c, 9)
  })
  it('Motion\'s layout example (0.2 s, bounce 0.2) overshoots a little and settles in well under a second', () => {
    const s = springFrom(0.2, 0.2)
    const min = Math.min(...Array.from({ length: 400 }, (_, i) => springAt(i / 400, s, 1)))
    expect(min).toBeLessThan(0)
    expect(min).toBeGreaterThan(-0.05)
    expect(settleTime(s, 1)).toBeLessThan(0.6)
  })
})
