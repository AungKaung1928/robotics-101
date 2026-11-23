import { describe, expect, it } from 'vitest'
import { BOUNCY, CALM, PRESS, springAt } from './spring'
import { springStep, stepData } from './useSpring'

const run = (s: typeof PRESS, dt: number, T: number) => {
  let x = 1, v = 0
  const out: number[] = []
  for (let t = 0; t < T - 1e-12; t += dt) { [x, v] = springStep(x, v, 0, dt, s); out.push(x) }
  return out
}

describe('springStep', () => {
  it('stepping frame by frame matches the closed form (1e-6) at 60 and 30 fps, so JS and CSS springs agree', () => {
    for (const s of [PRESS, BOUNCY]) for (const fps of [60, 30]) {
      const xs = run(s, 1 / fps, 1)
      xs.forEach((x, i) => expect(Math.abs(x - springAt((i + 1) / fps, s, 1))).toBeLessThan(1e-6))
    }
  })
  it('keeps velocity when the target moves mid-flight (no sudden stop)', () => {
    let [x, v] = springStep(0, 0, 1, 1 / 60, PRESS)
    for (let i = 0; i < 5; i++) [x, v] = springStep(x, v, 1, 1 / 60, PRESS)
    const [, v2] = springStep(x, v, 2, 1e-4, PRESS)
    expect(v2).toBeCloseTo(v, 0)
  })
  it('stays stable at 30 fps and settles', () => {
    for (const s of [PRESS, BOUNCY]) {
      const xs = run(s, 1 / 30, 3)
      expect(Math.max(...xs.map(Math.abs))).toBeLessThan(1.2)
      expect(Math.abs(xs.at(-1)!)).toBeLessThan(1e-3)
    }
  })
  it('moves towards a target that is not 0', () => {
    const [x] = springStep(0, 0, 2, 1 / 60, PRESS)
    expect(x).toBeGreaterThan(0)
    expect(x).toBeLessThan(2)
  })
})

describe('CALM (default for data marks)', () => {
  it('from rest it never passes the target and arrives within 0.6 s (retargeting: see stepData)', () => {
    expect(Math.min(...Array.from({ length: 120 }, (_, i) => springAt(i / 120, CALM, 1)))).toBeGreaterThanOrEqual(0)
    expect(Math.abs(springAt(0.6, CALM, 1))).toBeLessThan(0.01)
  })
})

describe('stepData (data marks)', () => {
  it('retargeted 1 -> 0.5 mid-flight: never past 0.5, never further from it than where it was', () => {
    for (const n of [3, 6, 10, 15]) {
      let x = 0, v = 0
      for (let i = 0; i < n; i++) [x, v] = stepData(x, v, 1, 1 / 60, CALM)
      let prevGap = Math.abs(x - 0.5)
      const side = Math.sign(x - 0.5)
      for (let i = 0; i < 120; i++) {
        ;[x, v] = stepData(x, v, 0.5, 1 / 60, CALM)
        const gap = Math.abs(x - 0.5)
        expect(gap).toBeLessThanOrEqual(prevGap + 1e-12)
        if (gap > 1e-12) expect(Math.sign(x - 0.5)).toBe(side)
        prevGap = gap
      }
      expect(prevGap).toBeLessThan(1e-3)
    }
  })
})
