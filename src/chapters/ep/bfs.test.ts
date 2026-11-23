import { describe, expect, it } from 'vitest'
import { CHALLENGE_MIN, GOAL, NEAR, START, W, H, cellCost, cellOf, dijkstra, initialWalls, inGoal, key, nearWall, neighbours, pathCost, scenario, search, steps } from './bfs'

const manhattan = (a: number, b: number) => { const [ax, ay] = cellOf(a), [bx, by] = cellOf(b); return Math.abs(ax - bx) + Math.abs(ay - by) }

/** Independent check: shortest length by repeated relaxation (Bellman-Ford, all edges 1). */
function bellman(walls: Set<number>): number | null {
  const d: number[] = Array.from({ length: W * H }, () => Infinity); d[key(START)] = 0
  for (let i = 0; i < W * H; i++) for (let c = 0; c < W * H; c++) if (d[c] < Infinity && !walls.has(c))
    for (const n of neighbours(cellOf(c), walls)) d[key(n)] = Math.min(d[key(n)], d[c] + 1)
  return d[key(GOAL)] === Infinity ? null : d[key(GOAL)]
}

describe('EP1 BFS', () => {
  it('empty grid: shortest path = Manhattan distance (9 steps)', () => {
    expect(steps(search(new Set()))).toBe(9)
  })

  it('default map: path goes around the wall, same length as an independent Bellman-Ford check', () => {
    const w = initialWalls()
    const r = search(w)
    expect(steps(r)).toBe(bellman(w))
    expect(steps(r)).toBe(13)
    // every step moves to a free 4-neighbour
    for (let i = 1; i < r.path!.length; i++) {
      expect(manhattan(r.path![i - 1], r.path![i])).toBe(1)
      expect(w.has(r.path![i])).toBe(false)
    }
  })

  it('pops cells in non-decreasing distance order (the queue is what makes it shortest)', () => {
    const r = search(initialWalls())
    const d = r.popped.map((c) => r.dist.get(c)!)
    for (let i = 1; i < d.length; i++) expect(d[i]).toBeGreaterThanOrEqual(d[i - 1])
  })

  it('break it: a stack instead of a queue still finds a path, but a longer one', () => {
    const w = initialWalls()
    const q = steps(search(w, 'queue'))!, s = steps(search(w, 'stack'))!
    expect(s).toBeGreaterThan(q)
  })

  it('walled-off goal: no path, every reachable cell visited once', () => {
    const w = initialWalls()
    for (const y of [2, 3, 4]) w.add(key([8, y]))
    w.add(key([9, 2])); w.add(key([9, 4]))
    const r = search(w)
    expect(r.path).toBeNull()
    expect(new Set(r.popped).size).toBe(r.popped.length)
    expect(inGoal(r)).toBe(false)
  })

  it('challenge is reachable: two walls, gaps at opposite ends, force a zig-zag', () => {
    const w = initialWalls()
    for (const y of [0, 5]) w.add(key([5, y])) // x=5 open only at the bottom row
    for (const y of [1, 2, 3, 4, 5, 6]) w.add(key([7, y])) // x=7 open only at the top row
    expect(steps(search(w))).toBe(bellman(w))
    expect(steps(search(w))).toBeGreaterThanOrEqual(CHALLENGE_MIN)
    expect(inGoal(search(w))).toBe(true)
    expect(inGoal(search(initialWalls()))).toBe(false)
  })

  it('scenario: frame 0 shows only the start queued; last frame shows the path; frames are pure', () => {
    const sc = scenario(initialWalls())
    const f0 = sc.frame(0)
    expect([...f0.states]).toEqual([[key(START), 'queued']])
    const end = sc.frame(sc.durationMs)
    expect(end.showPath).toBe(true)
    expect([...end.states.values()].filter((v) => v === 'path')).toHaveLength(14)
    expect(sc.frame(600)).toEqual(sc.frame(600))
    expect(sc.eventsMs!.at(-1)!).toBeLessThanOrEqual(sc.durationMs)
  })
})

describe('EP1 costmap step (Dijkstra)', () => {
  /** Independent check: Bellman-Ford with the same cell costs. */
  function bellmanCost(walls: Set<number>, near: number): number {
    const d: number[] = Array.from({ length: W * H }, () => Infinity); d[key(START)] = 0
    for (let i = 0; i < W * H; i++) for (let c = 0; c < W * H; c++) if (d[c] < Infinity && !walls.has(c))
      for (const n of neighbours(cellOf(c), walls)) d[key(n)] = Math.min(d[key(n)], d[c] + cellCost(key(n), walls, near))
    return d[key(GOAL)]
  }

  it('all costs equal (near = 0): Dijkstra finds the same 13-step length as BFS', () => {
    const w = initialWalls()
    expect(steps(dijkstra(w, 0))).toBe(13)
  })

  it('with cost near walls: cheapest cost matches Bellman-Ford and beats the BFS path under the same costs', () => {
    const w = initialWalls()
    const d = dijkstra(w)
    expect(pathCost(d.path!, w)).toBe(bellmanCost(w, NEAR))
    expect(d.dist.get(key(GOAL))).toBe(pathCost(d.path!, w))
    expect(pathCost(d.path!, w)).toBeLessThan(pathCost(search(w).path!, w))
    expect([steps(d), pathCost(d.path!, w), pathCost(search(w).path!, w)]).toEqual([15, 15, 41]) // numbers quoted on the page
  })

  it('the cheap path keeps away from walls: fewer wall-touching cells than the BFS path, at the price of more steps', () => {
    const w = initialWalls()
    const touching = (p: number[]) => p.filter((k) => nearWall(k, w)).length
    const d = dijkstra(w).path!, b = search(w).path!
    expect(touching(d)).toBeLessThan(touching(b))
    expect(d.length).toBeGreaterThan(b.length)
  })

  it('scenario in cost mode ends on the Dijkstra path', () => {
    const w = initialWalls()
    const sc = scenario(w, 'cost')
    expect(sc.result.path).toEqual(dijkstra(w).path)
    expect(sc.frame(sc.durationMs).showPath).toBe(true)
  })
})
