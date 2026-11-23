import { describe, expect, it } from 'vitest'
import { bfs, bfsTimeline, layerAt, pathTo, robotAt } from './bfs'

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
  it('timeline: front reaches the goal layer at `found`, robot starts then and ends on the goal', () => {
    const tl = bfsTimeline(8, 0.25, 0.3)
    expect(tl.found).toBeCloseTo(2, 12)
    expect(tl.end).toBeCloseTo(2 + 8 * 0.3, 12)
    expect(layerAt(0, 0.25, 8)).toBe(0)
    expect(layerAt(tl.found, 0.25, 8)).toBe(8)
    expect(layerAt(99, 0.25, 8)).toBe(8)
    expect(robotAt(1, tl.found, 0.3, 9)).toBe(0)
    expect(robotAt(tl.end, tl.found, 0.3, 9)).toBeCloseTo(8, 12)
    expect(robotAt(99, tl.found, 0.3, 9)).toBe(8)
  })
})
