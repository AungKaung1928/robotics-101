import { describe, expect, it } from 'vitest'
import { FAILS, challengeOk, correct, options, url } from './fieldfail'

describe('5.6 failures', () => {
  it('each card offers 3 different causes, one of them right', () => {
    FAILS.forEach((f, i) => {
      const o = options(i)
      expect(new Set(o).size).toBe(3)
      expect(o.filter((p) => correct(i, p))).toEqual([f.id])
    })
  })
  it('the right answer moves between positions', () => {
    const pos = FAILS.map((f, i) => options(i).indexOf(f.id))
    expect(new Set(pos).size).toBe(3)
  })
  it('links point at the cited line', () => expect(url(FAILS[5])).toBe('https://github.com/AungKaung1928/moveit_pickplace_demo/blob/main/README.md#L42'))
  it('challenge needs every card right on the first try', () => {
    const all = Object.fromEntries(FAILS.map((f) => [f.id, true]))
    expect(challengeOk(all)).toBe(true)
    expect(challengeOk({ ...all, beam: false })).toBe(false)
  })
})

describe('5.6 strings', () => {
  it('EN and JA have the same keys and one text per failure', async () => {
    const { FIELDFAIL_STRINGS: S } = await import('./fieldfail.strings')
    expect(Object.keys(S.ja).sort()).toEqual(Object.keys(S.en).sort())
    for (const l of [S.en, S.ja]) expect(Object.keys(l.fails).sort()).toEqual(FAILS.map((f) => f.id).sort())
    for (const id of FAILS.map((f) => f.id)) expect(Object.keys(S.ja.fails[id]).sort()).toEqual(Object.keys(S.en.fails[id]).sort())
    expect(S.ja.glossary).toHaveLength(S.en.glossary.length)
  })
})
