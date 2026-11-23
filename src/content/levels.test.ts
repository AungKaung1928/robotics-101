import { describe, expect, it } from 'vitest'
import { LEVEL_BODY, LEVELS, levelPage } from './levels'

describe('levelPage', () => {
  it('opens a Level 1 chapter with its number and neighbours', () => {
    const p = levelPage('#/1/closest')
    expect(p?.num).toBe('1.2')
    expect(p?.prev?.id).toBe('decide')
    expect(p?.next?.id).toBe('callback')
  })
  it('first chapter has no prev; wrong level, unknown id, patrol chapters → null', () => {
    expect(levelPage('#/1/decide')?.prev).toBeNull()
    expect(levelPage('#/2/decide')).toBeNull()
    expect(levelPage('#/1/nope')).toBeNull()
    expect(levelPage('#/4/grid')).toBeNull()
  })
  it('every listed new-level chapter has a body', () => {
    for (const c of LEVELS.slice(0, 3).flat()) expect(LEVEL_BODY[c.id], c.id).toBeDefined()
  })
})
