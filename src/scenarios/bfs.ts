/**
 * EP1: breadth-first search on an occupancy grid, as a scenario. BFS visits cells in layers of equal step count
 * (CLRS 3rd ed. §22.2: every vertex at distance k is discovered before any at k + 1), so the playhead is a layer
 * index: the wavefront at time t is the set of cells whose distance equals the current layer. 4-connected, row-major.
 */

export type BfsResult = { dist: Int32Array; parent: Int32Array; order: number[] }

/** BFS from `start` over free cells (`blocked[i]` true = occupied). dist −1 = unreachable; order = discovery order. */
export function bfs(w: number, h: number, blocked: boolean[], start: number): BfsResult {
  const dist = new Int32Array(w * h).fill(-1), parent = new Int32Array(w * h).fill(-1), order: number[] = []
  if (blocked[start]) return { dist, parent, order }
  dist[start] = 0
  const q = [start]
  for (let head = 0; head < q.length; head++) {
    const c = q[head], x = c % w, y = (c - x) / w
    order.push(c)
    for (const [nx, ny] of [[x + 1, y], [x, y + 1], [x - 1, y], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
      const n = ny * w + nx
      if (blocked[n] || dist[n] >= 0) continue
      dist[n] = dist[c] + 1
      parent[n] = c
      q.push(n)
    }
  }
  return { dist, parent, order }
}

/** Cells from start to `goal` by following parents back; empty when the goal was never reached. */
export function pathTo(r: BfsResult, goal: number): number[] {
  if (r.dist[goal] < 0) return []
  const p = [goal]
  while (r.parent[p[p.length - 1]] >= 0) p.push(r.parent[p[p.length - 1]])
  return p.reverse()
}

/** Timeline: one layer every `layerS` s until the goal's layer, then the robot drives the path at `cellS` s per cell. */
export function bfsTimeline(goalDist: number, layerS: number, cellS: number) {
  const found = Math.max(goalDist, 0) * layerS
  return { found, end: found + Math.max(goalDist, 0) * cellS, events: [0, found, found + Math.max(goalDist, 0) * cellS] }
}

/** Wavefront layer shown at time t (cells with dist ≤ layer are explored, dist = layer is the front). */
export const layerAt = (t: number, layerS: number, goalDist: number) => Math.min(Math.max(Math.floor(t / layerS), 0), goalDist)

/** Robot position along the path at time t, as a fractional cell index (0 = start); held at 0 until found. */
export function robotAt(t: number, found: number, cellS: number, pathLen: number): number {
  return Math.min(Math.max((t - found) / cellS, 0), Math.max(pathLen - 1, 0))
}
