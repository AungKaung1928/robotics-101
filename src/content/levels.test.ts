import { describe, expect, it } from 'vitest'
import { LEVEL_BODY, LEVELS, levelPage, readingIndex } from './levels'

describe('levelPage', () => {
  it('opens a Level 1 chapter with its number and neighbours', () => {
    const p = levelPage('#/1/closest')
    expect(p?.num).toBe('1.2')
    expect(p?.prev?.id).toBe('decide')
    expect(p?.next?.id).toBe('callback')
  })
  it('neighbours cross levels; first chapter has no prev; wrong level, unknown id, patrol chapters → null', () => {
    expect(levelPage('#/0/loop')?.prev).toBeNull()
    expect(levelPage('#/1/decide')?.prev?.id).toBe('pipe')
    expect(levelPage('#/1/shell')?.next?.id).toBe('scan')
    expect(levelPage('#/2/decide')).toBeNull()
    expect(levelPage('#/1/nope')).toBeNull()
    expect(levelPage('#/4/grid')).toBeNull()
  })
  it('every listed new-level chapter has a body', () => {
    for (const c of LEVELS.slice(0, 3).flat()) expect(LEVEL_BODY[c.id], c.id).toBeDefined()
  })
})

describe('readingIndex', () => {
  it('orders pages across levels; plain and level routes agree; overview is -1', () => {
    expect(readingIndex('#/1/closest')).toBe(3)
    expect(readingIndex('#/scan')).toBe(readingIndex('#/3/scan'))
    expect(readingIndex('#/4/grid/7')).toBeGreaterThan(readingIndex('#/3/scan?t=0.1'))
    expect(readingIndex('#/')).toBe(-1)
  })
})
