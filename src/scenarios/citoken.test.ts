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
