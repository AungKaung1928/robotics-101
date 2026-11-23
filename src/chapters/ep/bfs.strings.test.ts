import { describe, expect, it } from 'vitest'
import { CHALLENGE_MIN } from './bfs'
import { BFS_STRINGS } from './bfs.strings'

describe('EP1 strings', () => {
  it('EN and JA have the same keys and list lengths', () => {
    const { en, ja } = BFS_STRINGS
    expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort())
    for (const k of Object.keys(en) as (keyof typeof en)[]) if (Array.isArray(en[k])) expect((ja[k] as unknown[]).length).toBe((en[k] as unknown[]).length)
  })
  it('challenge text matches the model number in both languages', () => {
    expect(BFS_STRINGS.en.challenge).toContain(String(CHALLENGE_MIN))
    expect(BFS_STRINGS.ja.challenge).toContain(String(CHALLENGE_MIN))
  })
  it('no interview wording', () => {
    expect(JSON.stringify(BFS_STRINGS).toLowerCase()).not.toMatch(/interview|leetcode|面接/)
  })
})
