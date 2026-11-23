import { describe, expect, it } from 'vitest'
import { BOUNCY, PRESS, springAt } from './spring'
import { springStep } from './useSpring'

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
