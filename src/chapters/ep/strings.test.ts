import { describe, expect, it } from 'vitest'
import { CHALLENGE_MIN } from './bfs'
import { BFS_STRINGS } from './bfs.strings'
import { LATE_STRINGS } from './late.strings'
import { MIN_ACTED } from './late'

describe.each([['EP1', BFS_STRINGS], ['EP2', LATE_STRINGS]] as const)('%s strings', (_, STR) => {
  it('EN and JA have the same keys and list lengths', () => {
    const { en, ja } = STR as { en: Record<string, unknown>; ja: Record<string, unknown> }
    expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort())
    for (const k of Object.keys(en)) if (Array.isArray(en[k])) expect((ja[k] as unknown[]).length).toBe((en[k] as unknown[]).length)
  })
  it('no interview wording', () => {
    expect(JSON.stringify(STR).toLowerCase()).not.toMatch(/interview|leetcode|面接/)
  })
})

it('challenge text matches the model numbers in both languages', () => {
  for (const l of ['en', 'ja'] as const) {
    expect(BFS_STRINGS[l].challenge).toContain(String(CHALLENGE_MIN))
    expect(LATE_STRINGS[l].challenge).toContain(String(MIN_ACTED))
  }
})
