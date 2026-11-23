import { describe, expect, it } from 'vitest'
import { bfs, bfsTimeline, layerAt, pathTo, robotAt, toggleCell, tracedCells } from './bfs'

const parse = (rows: string[]) => ({ w: rows[0].length, h: rows.length, blocked: rows.join('').split('').map((c) => c === '#') })

describe('EP1 BFS', () => {
  it('on an empty grid the layer is the Manhattan distance', () => {
    const { w, h, blocked } = parse(['.....', '.....', '.....', '.....'])
    const r = bfs(w, h, blocked, 0)
    for (let i = 0; i < w * h; i++) expect(r.dist[i]).toBe((i % w) + Math.floor(i / w))
  })
  it('discovery order never goes back a layer (the wavefront property)', () => {
    const { w, h, blocked } = parse(['..#....', '..#.##.', '....#..', '.##.#..', '.......'])
    const r = bfs(w, h, blocked, 0)
    for (let k = 1; k < r.order.length; k++) expect(r.dist[r.order[k]]).toBeGreaterThanOrEqual(r.dist[r.order[k - 1]])
    expect(r.order.length).toBe(blocked.filter((b) => !b).length) // all free cells connected here
  })
  it('walls force a detour; path is shortest, 4-connected, avoids walls', () => {
    const { w, h, blocked } = parse(['..#..', '..#..', '.....'])
    const r = bfs(w, h, blocked, 0), goal = 4 // top-right
    expect(r.dist[goal]).toBe(8) // down 2, right 4, up 2
    const p = pathTo(r, goal)
    expect(p.length).toBe(9)
    expect(p[0]).toBe(0)
    for (let k = 1; k < p.length; k++) {
      const a = p[k - 1], b = p[k]
      expect(Math.abs((a % w) - (b % w)) + Math.abs(Math.floor(a / w) - Math.floor(b / w))).toBe(1)
      expect(blocked[b]).toBe(false)
    }
  })
  it('unreachable goal: dist −1, empty path; blocked start explores nothing', () => {
    const { w, h, blocked } = parse(['.#.', '##.', '...'])
    expect(pathTo(bfs(w, h, blocked, 0), 8)).toEqual([])
    expect(bfs(w, h, blocked, 1).order).toEqual([])
  })
  it('timeline: front reaches the goal at `found`, parents traced back by `traced`, robot ends on the goal', () => {
    const tl = bfsTimeline(8, 0.25, 0.3, 0.05)
    expect(tl.found).toBeCloseTo(2, 12)
    expect(tl.traced).toBeCloseTo(2.4, 12)
    expect(tl.end).toBeCloseTo(2.4 + 8 * 0.3, 12)
    expect(tl.events).toEqual([0, tl.found, tl.traced, tl.end])
    expect(layerAt(tl.found, 0.25, 8)).toBe(8)
    expect(layerAt(99, 0.25, 8)).toBe(8)
    expect(tracedCells(tl.found - 0.01, tl.found, 0.05, 9)).toBe(0)
    expect(tracedCells(tl.found, tl.found, 0.05, 9)).toBe(1) // the goal itself
    expect(tracedCells(tl.traced, tl.found, 0.05, 9)).toBe(9) // back to the start
    expect(robotAt(tl.traced - 0.01, tl.traced, 0.3, 9)).toBe(0) // waits for the trace
    expect(robotAt(tl.end, tl.traced, 0.3, 9)).toBeCloseTo(8, 12)
    expect(robotAt(99, tl.traced, 0.3, 9)).toBe(8)
  })
  it('toggleCell: flips a cell, never walls the start or goal, ignores out-of-range, leaves the input untouched', () => {
    const b = [false, false, true, false]
    expect(toggleCell(b, 1, 0, 3)).toEqual([false, true, true, false])
    expect(toggleCell(b, 2, 0, 3)).toEqual([false, false, false, false])
    expect(toggleCell(b, 0, 0, 3)).toBe(b)
    expect(toggleCell(b, 3, 0, 3)).toBe(b)
    expect(toggleCell(b, 9, 0, 3)).toBe(b)
    expect(b).toEqual([false, false, true, false])
  })
})
