import { describe, expect, it } from 'vitest'
import { BENCH } from './bench/result'
import { COMPILE_MS, compile, line, outcome, scenario } from './cpp'

describe('1.4 C++ types', () => {
  it('double keeps 0.5; int silently becomes 0; braces refuse to compile', () => {
    expect(compile('double')).toEqual({ ok: true, value: 0.5 })
    expect(compile('int')).toEqual({ ok: true, value: 0 })
    expect(compile('int{}').ok).toBe(false)
    expect(line('int{}')).toBe('int stop_at{0.5};')
  })

  it('int stop_at = 0.5 is the 1.1 crash: stop_at 0 never fires', () => {
    expect(outcome('int')!.crashed).toBe(true)
    expect(outcome('double')!.crashed).toBe(false)
    expect(outcome('int{}')).toBeNull()
  })

  it('scenario: compile first, then drive or stop at the error', () => {
    expect(scenario('double').frame(COMPILE_MS / 2)).toMatchObject({ phase: 'compile', compiled: 0.5 })
    expect(scenario('int{}').frame(1e9).phase).toBe('error')
    const sc = scenario('int')
    expect(sc.frame(sc.durationMs).drive!.crashed).toBe(true)
    expect(sc.frame(777)).toEqual(sc.frame(777))
  })

  it('bench result is a real measurement: C++ faster than Python on the same 360 readings', () => {
    expect(BENCH.readings).toBe(360)
    expect(BENCH.cppNs).toBeGreaterThan(0)
    expect(BENCH.pyNs / BENCH.cppNs).toBeGreaterThan(5)
  })
})

describe('1.4 strings', () => {
  it('EN and JA have the same keys and list lengths', async () => {
    const { CPP_STRINGS: S } = await import('./cpp.strings')
    expect(Object.keys(S.ja).sort()).toEqual(Object.keys(S.en).sort())
    expect(Object.keys(S.ja.note).sort()).toEqual(Object.keys(S.en.note).sort())
    expect(S.ja.lines).toHaveLength(S.en.lines.length)
    expect(S.ja.glossary).toHaveLength(S.en.glossary.length)
  })
})
