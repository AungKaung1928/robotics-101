import { describe, expect, it } from 'vitest'
import { DEFAULT, JUMP_AT, N, STEP_M, caught, challengeOk, effective, falseAlarms, scenario } from './params'

describe('2.5 parameters', () => {
  it('normal motion per check: 0.26 m/s x 0.5 s = 0.13 m', () => expect(STEP_M).toBeCloseTo(0.13, 9))

  it('default 0.5 m catches the jump with no false alarm', () => {
    expect(caught(DEFAULT)).toBe(true)
    expect(falseAlarms(DEFAULT)).toBe(0)
  })

  it('break it: 0.1 m warns on every normal check', () => {
    expect(falseAlarms(0.1)).toBe(N - 1)
  })

  it('too high misses the jump', () => expect(caught(1.0)).toBe(false))

  it('challenge band is [0.13, 0.8): strict > in the code', () => {
    expect(challengeOk(0.13)).toBe(true) // 0.13 > 0.13 is false
    expect(challengeOk(0.12)).toBe(false)
    expect(challengeOk(0.79)).toBe(true)
    expect(challengeOk(0.8)).toBe(false)
  })

  it('an override beats the default', () => {
    expect(effective('default', 0.2)).toBe(DEFAULT)
    expect(effective('launch', 0.2)).toBe(0.2)
    expect(effective('cli', 0.3)).toBe(0.3)
  })

  it('scenario counts checks and warnings', () => {
    const sc = scenario(DEFAULT)
    expect(sc.frame(0)).toEqual({ done: 0, warns: 0 })
    expect(sc.frame(JUMP_AT * 500).warns).toBe(0)
    expect(sc.frame((JUMP_AT + 1) * 500).warns).toBe(1)
    expect(sc.frame(sc.durationMs)).toEqual({ done: N, warns: 1 })
  })
})

describe('2.5 strings', () => {
  it('EN and JA have the same keys and list lengths', async () => {
    const { PARAMS_STRINGS: S } = await import('./params.strings')
    expect(Object.keys(S.ja).sort()).toEqual(Object.keys(S.en).sort())
    expect(Object.keys(S.ja.sources).sort()).toEqual(Object.keys(S.en.sources).sort())
    expect(S.ja.lines).toHaveLength(S.en.lines.length)
    expect(S.ja.glossary).toHaveLength(S.en.glossary.length)
  })
})
