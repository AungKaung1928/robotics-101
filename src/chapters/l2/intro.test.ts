import { describe, expect, it } from 'vitest'
import { introScenario as intro1, CHAPTERS as C1 } from '../l1/intro'
import { LEVEL1_CHAPTERS } from '../l1'
import { LEVEL2_CHAPTERS } from '.'
import { NODE_COUNT, introScenario as intro2, CHAPTERS as C2 } from './intro'

describe('level intros', () => {
  it('one chip per listed chapter', () => {
    expect(C1).toBe(LEVEL1_CHAPTERS.length)
    expect(C2).toBe(LEVEL2_CHAPTERS.length)
  })

  it('level 1: chips light in order, the robot ends stopped before the wall', () => {
    const sc = intro1()
    let last = 0
    for (let t = 0; t <= sc.durationMs; t += 100) { const f = sc.frame(t); expect(f.lit).toBeGreaterThanOrEqual(last); last = f.lit }
    const end = sc.frame(sc.durationMs)
    expect(end.lit).toBe(C1)
    expect(end.drive.decision).toBe('stop')
    expect(end.drive.crashed).toBe(false)
  })

  it('level 2: all nodes working at the end, chips all lit', () => {
    const end = intro2().frame(1e9)
    expect(end.lit).toBe(C2)
    expect(end.graph.working).toHaveLength(NODE_COUNT)
    expect(intro2().frame(0).lit).toBe(1)
  })
})

describe('level intro strings', () => {
  it('EN and JA have the same keys', async () => {
    const { INTRO1_STRINGS: A } = await import('../l1/intro.strings')
    const { INTRO2_STRINGS: B } = await import('./intro.strings')
    for (const S of [A, B]) expect(Object.keys(S.ja).sort()).toEqual(Object.keys(S.en).sort())
  })
})
