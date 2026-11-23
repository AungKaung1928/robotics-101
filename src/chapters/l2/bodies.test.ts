import { describe, expect, it } from 'vitest'
import { BODIES } from './bodies'
import { LEVEL1_CHAPTERS } from '../l1'
import { LEVEL2_CHAPTERS } from '.'

describe('Level 1-2 chapter lists', () => {
  it('every listed chapter has a body, ids are unique, titles are set in both languages', () => {
    const all = [...LEVEL1_CHAPTERS, ...LEVEL2_CHAPTERS]
    expect(new Set(all.map((c) => c.id)).size).toBe(all.length)
    expect(Object.keys(BODIES).sort()).toEqual(all.map((c) => c.id).sort())
    for (const c of all) expect(c.titleEn && c.titleJa).toBeTruthy()
    expect(LEVEL1_CHAPTERS.every((c) => c.level === 1) && LEVEL2_CHAPTERS.every((c) => c.level === 2)).toBe(true)
  })
})
