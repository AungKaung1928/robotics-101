import { describe, expect, it } from 'vitest'
import { PUSHES, STEPS, run } from '../chapters/l5/ci'
import { ciToken, total } from './cirun'

describe('5.2 commit token', () => {
  it('never moves backwards and stays on the bar', () => {
    for (const p of PUSHES) {
      let last = -1
      for (let t = 0; t <= total(p) + 0.1; t += 0.02) { const { pos } = ciToken(p, t); expect(pos).toBeGreaterThanOrEqual(last - 1e-9); expect(pos).toBeLessThanOrEqual(STEPS.length); last = pos }
    }
  })
  it('end frame: stops right after the red step (ci.run()), or crosses the whole bar on a clean push', () => {
    for (const p of PUSHES) {
      const res = run(p), red = STEPS.findIndex((st) => res[st] === 'failure'), end = ciToken(p, total(p))
      expect(end).toEqual(red >= 0 ? { pos: red + 1, look: 'failure' } : { pos: STEPS.length, look: 'success' })
    }
  })
})

describe('5.2 token x on the bar', () => {
  it('sits on the fill front while running and on the red step right edge at the end', async () => {
    const { ciAt, tokenX } = await import('./cirun')
    for (const p of PUSHES) {
      for (let t = 0; t < total(p) - 1e-6; t += 0.05) {
        const i = STEPS.findIndex((st) => ciAt(p, t)[st].look === 'running'), f = ciAt(p, t)[STEPS[i]].frac
        expect(tokenX(ciToken(p, t))).toBeCloseTo(i * 70 + 2 + 64 * f, 6) // same front as the ci-fill rect
      }
      const red = STEPS.findIndex((st) => run(p)[st] === 'failure'), last = red >= 0 ? red : STEPS.length - 1
      expect(tokenX(ciToken(p, total(p)))).toBe(last * 70 + 66)
    }
  })
})
