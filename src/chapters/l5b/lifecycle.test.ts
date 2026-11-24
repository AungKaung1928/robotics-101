import { describe, expect, it } from 'vitest'
import { late, processes, starts, step, worstDelay } from './lifecycle'

describe('5.5 lifecycle', () => {
  it('happy path: configure, activate, deactivate, cleanup', () => {
    expect(step('unconfigured', 'configure')).toBe('inactive')
    expect(step('inactive', 'activate')).toBe('active')
    expect(step('active', 'deactivate')).toBe('inactive')
    expect(step('inactive', 'cleanup')).toBe('unconfigured')
  })
  it('invalid transitions are rejected', () => {
    expect(step('unconfigured', 'activate')).toBeNull()
    expect(step('active', 'cleanup')).toBeNull()
    expect(step('finalized', 'configure')).toBeNull()
  })
  it('shutdown from any live state ends in finalized', () => {
    for (const s of ['unconfigured', 'inactive', 'active'] as const) expect(step(s, 'shutdown')).toBe('finalized')
  })
  it('only active processes data', () => {
    expect(processes('active')).toBe(true)
    expect(processes('inactive')).toBe(false)
  })
})

describe('5.5 executors', () => {
  it('single-threaded: ticks due at 300, 400, 500 wait until 600; worst delay 300 ms', () => {
    expect(starts('single').slice(2, 6)).toEqual([600, 600, 600, 600])
    expect(late('single')).toBe(3)
    expect(worstDelay('single')).toBe(300)
  })
  it('multi-threaded with the default group: just as late (mutually exclusive)', () => {
    expect(starts('multi_default')).toEqual(starts('single'))
  })
  it('multi-threaded with separate groups: every tick on time', () => {
    expect(late('multi_groups')).toBe(0)
    expect(worstDelay('multi_groups')).toBe(0)
  })
})

describe('5.5 strings', () => {
  it('EN and JA have the same keys and list lengths', async () => {
    const { LIFECYCLE_STRINGS: S } = await import('./lifecycle.strings')
    expect(Object.keys(S.ja).sort()).toEqual(Object.keys(S.en).sort())
    expect(Object.keys(S.ja.states).sort()).toEqual(Object.keys(S.en.states).sort())
    expect(Object.keys(S.ja.execs).sort()).toEqual(Object.keys(S.en.execs).sort())
    expect(S.ja.glossary).toHaveLength(S.en.glossary.length)
  })
})
