import { describe, expect, it } from 'vitest'
import { BASE, BOX_M, STEP_MS, beamDeg, challengeOk, closestOf, readings, scenario, trace, updates } from './closest'

describe('1.2 closest', () => {
  it('finds the smallest reading, same as Math.min', () => {
    for (let k = -1; k < BASE.length; k++) expect(closestOf(readings(k))).toBe(Math.min(...readings(k)))
  })

  it('no box: closest is 1.6 m after 2 updates (1.8 then 1.6)', () => {
    expect(closestOf(BASE)).toBe(1.6)
    expect(trace(BASE).filter((p) => p.updated).map((p) => p.d)).toEqual([1.8, 1.6])
  })

  it('break it: starting from 0 never updates and returns 0', () => {
    expect(closestOf(readings(4), 'zero')).toBe(0)
    expect(updates(readings(4), 'zero')).toBe(0)
  })

  it('challenge: only the first beam makes closest change exactly once', () => {
    expect(BASE.map((_, k) => challengeOk(k))).toEqual(BASE.map((_, k) => k === 0))
    expect(closestOf(readings(0))).toBe(BOX_M)
  })

  it('beams fan from +45 deg (left) to -45 deg (right)', () => {
    expect(beamDeg(0)).toBe(45)
    expect(beamDeg(BASE.length - 1)).toBe(-45)
  })

  it('scenario: pure, events ascend, end frame holds the returned value and its beam', () => {
    const sc = scenario(6)
    expect(sc.frame(999)).toEqual(sc.frame(999))
    expect(sc.eventsMs).toEqual([...sc.eventsMs!].sort((a, b) => a - b))
    const end = sc.frame(sc.durationMs)
    expect(end.done).toBe(true)
    expect(end.closest).toBe(BOX_M)
    expect(end.best).toBe(6)
    expect(sc.frame(0)).toMatchObject({ pass: 0, best: 0, closest: 1.8, done: false })
    expect(sc.frame(STEP_MS * 2).best).toBe(1)
    expect(scenario(6, 'zero').frame(1e9).best).toBe(-1)
  })
})

describe('1.2 strings', () => {
  it('EN and JA have the same keys and list lengths', async () => {
    const { CLOSEST_STRINGS: S } = await import('./closest.strings')
    expect(Object.keys(S.ja).sort()).toEqual(Object.keys(S.en).sort())
    expect(S.ja.lines).toHaveLength(S.en.lines.length)
    expect(S.ja.glossary).toHaveLength(S.en.glossary.length)
  })
})
