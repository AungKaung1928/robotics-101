import { describe, expect, it } from 'vitest'
import { JOBS, LAYERS, score, scenario, working } from './tools'
import { TOOLS_STRINGS } from './tools.strings'

describe('tools', () => {
  it('removing Linux stops everything; removing Python stops ROS 2 only; removing C++ stops nothing else', () => {
    expect(working(null).size).toBe(LAYERS.length)
    expect(working('linux').size).toBe(0)
    expect([...working('python')].sort()).toEqual(['cpp', 'linux', 'terminal'])
    expect([...working('cpp')].sort()).toEqual(['linux', 'python', 'ros', 'terminal'])
  })
  it('challenge: solved only when every job has its tool', () => {
    expect(score({})).toBe(0)
    expect(score({ install: 'terminal', idea: 'python', fast: 'cpp', connect: 'ros' })).toBe(JOBS.length)
    expect(score({ install: 'terminal', idea: 'cpp', fast: 'python', connect: 'ros' })).toBe(2)
  })
  it('the stack lands bottom-up, eased, and ends complete', () => {
    const sc = scenario()
    expect(sc.frame(0)).toEqual({ shown: 1, drop: 0 })
    expect(sc.frame(sc.durationMs)).toEqual({ shown: LAYERS.length, drop: 1 })
    expect(sc.frame(-5).shown).toBe(1)
    expect(sc.frame(200).drop).toBeLessThan(0.25) // eased: slow start
  })
  it('EN and JA have the same keys, one name per layer and one line per job', () => {
    expect(Object.keys(TOOLS_STRINGS.ja).sort()).toEqual(Object.keys(TOOLS_STRINGS.en).sort())
    for (const l of ['en', 'ja'] as const) {
      expect(Object.keys(TOOLS_STRINGS[l].names).sort()).toEqual(LAYERS.map((x) => x.id).sort())
      expect(Object.keys(TOOLS_STRINGS[l].why).sort()).toEqual(LAYERS.map((x) => x.id).sort())
      expect(Object.keys(TOOLS_STRINGS[l].jobs).sort()).toEqual(JOBS.map((j) => j.id).sort())
    }
  })
})
