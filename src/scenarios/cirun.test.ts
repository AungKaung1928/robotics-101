import { describe, expect, it } from 'vitest'
import { PUSHES, SECONDS, STEPS, run } from '../chapters/l5/ci'
import { MIN, SCALE, ciAt, total } from './cirun'

describe('ci run scene', () => {
  it('end frame equals ci.run() for every push', () => {
    for (const p of PUSHES) for (const st of STEPS) expect(ciAt(p, total(p))[st].look).toBe(run(p)[st])
  })
  it('at most one step runs at a time, and nothing is shown at t=0 except the first step starting', () => {
    for (const p of PUSHES) for (let t = 0; t < total(p) - 1e-6; t += 0.05) expect(STEPS.filter((st) => ciAt(p, t)[st].look === 'running').length).toBe(1)
    expect(ciAt('clean', 0).container.look).toBe('running')
  })
  it('build takes the most screen time, in proportion to its measured 61 s', () => {
    const at = (t: number) => STEPS.find((st) => ciAt('clean', t)[st].look === 'running')
    let n = 0
    for (let t = 0; t < total('clean'); t += 0.01) if (at(t) === 'build') n++
    expect(n * 0.01).toBeCloseTo(Math.max(MIN, SECONDS.build * SCALE), 1)
  })
  it('a red step stops the line: later steps wait while it runs, then all turn skipped at once', () => {
    const p = PUSHES.find((x) => run(x).build === 'failure')!
    expect(ciAt(p, total(p) - 0.01).test.look).toBe('wait')
    expect(ciAt(p, total(p)).test.look).toBe('skipped')
  })
})
