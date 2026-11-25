import { describe, expect, it } from 'vitest'
import { LEVEL_BODY, LEVELS, courseNeighbour, keyPage, levelPage, readingIndex } from './levels'
import { parseRoute } from '../lib/route'

describe('levelPage', () => {
  it('opens a Level 1 chapter with its number and neighbours', () => {
    const p = levelPage('#/1/closest')
    expect(p?.num).toBe('1.2')
    expect(p?.prev?.id).toBe('decide')
    expect(p?.next?.id).toBe('callback')
  })
  it('neighbours cross levels; first chapter has no prev; wrong level, unknown id, patrol chapters → null', () => {
    expect(levelPage('#/0/meet')?.prev).toBeNull()
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

describe('courseNeighbour', () => {
  /** The page App renders for a Next link: a level chapter, or one of the 7 patrol chapters. */
  const opens = (hash: string) => levelPage(hash)?.meta.id ?? (parseRoute(hash) as { id?: string }).id

  it('Next from 0.1 visits every chapter once in course order, reaches Level 5, and Back walks it home', () => {
    const all = LEVELS.flat()
    const seen = [all[0].id]
    for (let c = courseNeighbour(all[0].id, 1); c; c = courseNeighbour(c.id, 1)) {
      expect(opens(`#/${c.level}/${c.id}`)).toBe(c.id)
      seen.push(c.id)
    }
    expect(seen).toEqual(all.map((c) => c.id))
    expect(all[all.length - 1].level).toBe(5)
    const back = [all[all.length - 1].id]
    for (let c = courseNeighbour(back[0], -1); c; c = courseNeighbour(c.id, -1)) back.push(c.id)
    expect(back.reverse()).toEqual(seen)
  })
  it('patrol chapters follow the course, not the old waypoint order', () => {
    expect(courseNeighbour('scan', 1)?.id).toBe('wall')
    expect(courseNeighbour('goal', 1)?.id).toBe('patrol')
    expect(courseNeighbour('bringup', 1)?.level).toBe(5)
    expect(courseNeighbour('nope', 1)).toBeNull()
  })
})

describe('keyPage (keyboard in App.tsx)', () => {
  it('arrows step through the course on chapter pages, same as the Next/Back links', () => {
    const n = courseNeighbour('scan', 1)!, p = courseNeighbour('scan', -1)!
    expect(keyPage('ArrowRight', '#/scan')).toBe(`${n.level}/${n.id}`)
    expect(keyPage('ArrowLeft', '#/3/scan')).toBe(`${p.level}/${p.id}`)
  })
  it('arrows also work on chapters outside the 7 patrol routes (wall, patrol, Level 5)', () => {
    for (const c of LEVELS.flat().slice(1, -1)) {
      const n = courseNeighbour(c.id, 1)!, p = courseNeighbour(c.id, -1)!
      expect(keyPage('ArrowRight', `#/${c.level}/${c.id}`)).toBe(`${n.level}/${n.id}`)
      expect(keyPage('ArrowLeft', `#/${c.level}/${c.id}`)).toBe(`${p.level}/${p.id}`)
    }
    expect(parseRoute('#/3/wall').page).toBe('overview') // why the old Route-based version did nothing there
  })
  it('arrows do nothing on the overview; other keys do nothing', () => {
    expect(keyPage('ArrowRight', '#/')).toBeNull()
    expect(keyPage('ArrowRight', '')).toBeNull()
    expect(keyPage('a', '#/scan')).toBeNull()
  })
  it('arrows do nothing past either end of the course', () => {
    const all = LEVELS.flat(), a = all[0], z = all[all.length - 1]
    expect(keyPage('ArrowLeft', `#/${a.level}/${a.id}`)).toBeNull()
    expect(keyPage('ArrowRight', `#/${z.level}/${z.id}`)).toBeNull()
  })
  it('number keys still open a waypoint', () => {
    expect(keyPage('5', '#/scan')).toBe('grid')
  })
})
