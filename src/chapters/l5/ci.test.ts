import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PUSHES, SECONDS, STEPS, green, run, secondsToVerdict } from './ci'
import { CI_STRINGS } from './ci.strings'

const keys = (o: object): string[] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? keys(v).map((x) => `${k}.${x}`) : [k]))

describe('5.2 CI model (TF-Transform-Explorer ci.yml, run 45131404756)', () => {
  it('a clean push is green: every step passes', () => {
    expect(green('clean')).toBe(true)
    expect(PUSHES.filter(green)).toEqual(['clean'])
  })
  it('a C++ typo fails colcon build and skips colcon test + figure (runs 44913660184, 44913361997)', () => {
    expect(run('syntax')).toMatchObject({ rosdep: 'success', build: 'failure', test: 'skipped', figure: 'skipped' })
  })
  it('a failing test fails colcon test only after a good build (run 44841612440)', () => {
    expect(run('test')).toMatchObject({ build: 'success', test: 'failure', figure: 'skipped' })
  })
  it('exactly one failure per red push, never a success after it', () => {
    for (const p of PUSHES) {
      const r = STEPS.map((s) => run(p)[s])
      expect(r.filter((x) => x === 'failure').length).toBe(p === 'clean' ? 0 : 1)
      const f = r.indexOf('failure')
      if (f >= 0) expect(r.slice(f + 1).every((x) => x === 'skipped')).toBe(true)
    }
  })
  it('step seconds add up: 117 s of steps in the 125 s run; a build failure is known after 91 s', () => {
    expect(STEPS.reduce((a, s) => a + SECONDS[s], 0)).toBe(117)
    expect(secondsToVerdict('syntax')).toBe(91)
  })
  it('cited workflow lines say what the model says (local copy of the repo)', () => {
    const path = `${process.env.HOME}/personal/TF-Transform-Explorer/.github/workflows/ci.yml`
    let yml: string
    try { yml = readFileSync(path, 'utf8') } catch { return } // repo not on this machine: CI skips the cross-check
    const ln = yml.split('\n')
    expect(ln[12]).toContain('container: ros:humble')
    expect(ln[30]).toContain('colcon build --event-handlers')
    expect(ln[34]).toContain('colcon test --event-handlers')
    expect(ln[40]).toContain('git diff --exit-code docs/tf_tree.svg')
  })
  it('EN and JA have the same keys', () => {
    expect(keys(CI_STRINGS.ja)).toEqual(keys(CI_STRINGS.en))
  })
})
