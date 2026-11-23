import { addBeam, type Grid } from '../lib/grid'

export type Beam = { x: number; y: number; angle: number; range: number }

/**
 * The map mid-scan: a copy of `base` with the first `count` beams of one scan applied in firing order (lib/grid
 * addBeam), so cells turn free / occupied beam by beam as the LiDAR sweep reaches them. `base` is not changed.
 */
export function applyBeams(base: Grid, beams: Beam[], count: number, pHit: number, pFree: number): Grid {
  const g: Grid = { n: base.n, res: base.res, l: base.l.slice() }
  const k = Math.min(Math.max(Math.floor(count), 0), beams.length)
  for (let i = 0; i < k; i++) addBeam(g, beams[i].x, beams[i].y, beams[i].angle, beams[i].range, pHit, pFree)
  return g
}

/** Cells no longer unknown (log-odds moved off 0). */
export function knownCells(g: Grid): number {
  let n = 0
  for (const l of g.l) if (l !== 0) n++
  return n
}
