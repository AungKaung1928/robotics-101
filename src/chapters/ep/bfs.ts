import type { Scenario } from '../../anim/contract'

/** EP1: breadth-first search on an occupancy grid. Pure model, no DOM. */
export type Cell = [number, number] // [x, y], y down
export type Order = 'queue' | 'stack'

export const W = 10
export const H = 7
export const START: Cell = [0, 3]
export const GOAL: Cell = [9, 3]
/** '#' = occupied, '.' = free. A wall the robot must go around. */
export const MAP = [
  '..........',
  '...###....',
  '.....#....',
  '.....#....',
  '.....#....',
  '..........',
  '..........',
]
export const STEP_MS = 120
/** Challenge: add walls until the shortest path is at least this many steps, and still exists. */
export const CHALLENGE_MIN = 21

export const key = (c: Cell) => c[1] * W + c[0]
export const cellOf = (k: number): Cell => [k % W, Math.floor(k / W)]
export const initialWalls = (): Set<number> => {
  const s = new Set<number>()
  MAP.forEach((row, y) => [...row].forEach((ch, x) => ch === '#' && s.add(key([x, y]))))
  return s
}

/** 4-connected neighbours in a fixed order: up, right, down, left. */
export function neighbours([x, y]: Cell, walls: Set<number>): Cell[] {
  const out: Cell[] = []
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
    const n: Cell = [x + dx, y + dy]
    if (n[0] >= 0 && n[0] < W && n[1] >= 0 && n[1] < H && !walls.has(key(n))) out.push(n)
  }
  return out
}

export interface Search {
  /** Cells in the order they were taken out (popped). */
  popped: number[]
  /** Pop index at which each cell was put in (start: 0). */
  pushedAt: Map<number, number>
  /** Steps from start along the parent chain, per reached cell. */
  dist: Map<number, number>
  /** Start..goal, or null when the goal cannot be reached. */
  path: number[] | null
  maxQueue: number
}

/** Mark a cell seen when it is put in (so it is never queued twice). 'stack' takes the newest out: not shortest. */
export function search(walls: Set<number>, order: Order = 'queue', start = START, goal = GOAL): Search {
  const s = key(start), g = key(goal)
  const parent = new Map<number, number>()
  const dist = new Map([[s, 0]])
  const pushedAt = new Map([[s, 0]])
  const popped: number[] = []
  const q = [s]
  let head = 0, maxQueue = 1
  while (head < q.length) {
    const k = order === 'queue' ? q[head++] : q.pop()!
    popped.push(k)
    if (k === g) break
    for (const n of neighbours(cellOf(k), walls)) {
      const nk = key(n)
      if (dist.has(nk)) continue
      dist.set(nk, dist.get(k)! + 1)
      parent.set(nk, k)
      pushedAt.set(nk, popped.length)
      q.push(nk)
    }
    maxQueue = Math.max(maxQueue, q.length - (order === 'queue' ? head : 0))
  }
  let path: number[] | null = null
  if (dist.has(g)) {
    path = [g]
    while (path[0] !== s) path.unshift(parent.get(path[0])!)
  }
  return { popped, pushedAt, dist, path, maxQueue }
}

export const steps = (r: Search) => (r.path ? r.path.length - 1 : null)
export const inGoal = (r: Search) => r.path !== null && r.path.length - 1 >= CHALLENGE_MIN

export type CellState = 'free' | 'queued' | 'done' | 'path'
export interface BfsScene extends Record<string, unknown> {
  k: number
  states: Map<number, CellState>
  current: number | null
  showPath: boolean
}

/** Frame k shows the first k pops; after the last pop the path lights up. */
export function scenario(walls: Set<number>, order: Order = 'queue'): Scenario<BfsScene> & { result: Search } {
  const r = search(walls, order)
  const n = r.popped.length
  return {
    id: 'ep1-bfs',
    result: r,
    durationMs: (n + 2) * STEP_MS,
    eventsMs: Array.from({ length: n + 1 }, (_, i) => i * STEP_MS),
    frame: (tMs) => {
      const k = Math.max(0, Math.min(n, Math.floor(tMs / STEP_MS)))
      const states = new Map<number, CellState>()
      const popIdx = new Map(r.popped.map((c, i) => [c, i]))
      for (const [c, at] of r.pushedAt) {
        const p = popIdx.get(c)
        if (p !== undefined && p < k) states.set(c, 'done')
        else if (at <= k) states.set(c, 'queued')
      }
      const showPath = k >= n && r.path !== null
      if (showPath) r.path!.forEach((c) => states.set(c, 'path'))
      return { k, states, current: k > 0 ? r.popped[k - 1] : null, showPath }
    },
  }
}
