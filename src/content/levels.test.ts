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
    expect(levelPage('#/1/decide')?.prev).toBe(LEVELS[0].at(-1))
    expect(levelPage('#/1/shell')?.next?.id).toBe('nodes')
    expect(levelPage('#/2/drive')?.next?.id).toBe('scan')
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
    expect(readingIndex('#/1/closest')).toBe(LEVELS[0].length + 1)
    expect(readingIndex('#/scan')).toBe(readingIndex('#/3/scan'))
    expect(readingIndex('#/4/grid/7')).toBeGreaterThan(readingIndex('#/3/scan?t=0.1'))
    expect(readingIndex('#/')).toBe(-1)
  })
})

describe('Engineering Practice track', () => {
  it('#/ep/<id> opens EP chapters numbered EP1, EP2 with neighbours inside the track only', () => {
    const a = levelPage('#/ep/bfs'), b = levelPage('#/ep/late')
    expect([a?.num, a?.prev, a?.next?.id]).toEqual(['EP1', null, 'late'])
    expect([b?.num, b?.prev?.id, b?.next]).toEqual(['EP2', 'bfs', null])
    expect(levelPage('#/ep/nope')).toBeNull()
  })
  it('stays outside the numbered levels (never a prerequisite in reading order)', () => {
    expect(LEVELS.flat().some((c) => c.id === 'bfs' || c.id === 'late')).toBe(false)
    expect(readingIndex('#/ep/bfs')).toBe(-1)
  })
})
