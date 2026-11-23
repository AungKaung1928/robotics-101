import { describe, expect, it } from 'vitest'
import { PIPE, found, reach, scenario } from './pipe'
import { PIPE_STRINGS } from './pipe.strings'

describe('pipe', () => {
  it('a healthy stack passes the scan to the controller; a broken program is the last that gets it', () => {
    expect(reach(null)).toBe(PIPE.length - 1)
    expect(reach(1)).toBe(1)
  })
  it('the scenario stops at the broken program', () => {
    const sc = scenario(2)
    expect(sc.frame(sc.durationMs).at).toBe(2)
    expect(sc.frame(sc.durationMs).arrived).toBe(true)
    expect(sc.frame(0).at).toBe(0)
  })
  it('challenge: only the broken program counts', () => {
    expect(found(2, 2)).toBe(true)
    expect(found(2, 3)).toBe(false)
    expect(found(2, null)).toBe(false)
  })
  it('EN and JA have the same keys and one name per program', () => {
    expect(Object.keys(PIPE_STRINGS.ja).sort()).toEqual(Object.keys(PIPE_STRINGS.en).sort())
    for (const l of ['en', 'ja'] as const) expect(Object.keys(PIPE_STRINGS[l].names).sort()).toEqual(PIPE.map((p) => p.id).sort())
  })
})
