/** Cells in a square map of side `size` m at `res` m per cell. */
export function cellCount(size: number, res: number): number {
  const n = Math.round(size / res)
  return n * n
}

/** Log-odds of a probability, and back (Thrun, Burgard, Fox, Probabilistic Robotics, ch 9). */
export const logOdds = (p: number) => Math.log(p / (1 - p))
export const prob = (l: number) => 1 / (1 + Math.exp(-l))

/**
 * One occupancy update of a cell from an unknown (0.5) prior: add the inverse sensor model's log-odds
 * (above 0.5 for the hit cell, below for cells the beam passed through). The model probabilities are a choice,
 * not a sensor spec.
 */
export function update(l: number, pModel: number): number {
  return l + logOdds(pModel)
}

/** A square log-odds grid centred on the map origin: n x n cells of `res` m, row-major from (-size/2, -size/2). */
export type Grid = { n: number; res: number; l: Float32Array }

export function makeGrid(size: number, res: number): Grid {
  const n = Math.round(size / res)
  return { n, res, l: new Float32Array(n * n) }
}

/** Index of the cell holding point (x, y), or -1 outside the grid. */
export function cellAt(g: Grid, x: number, y: number): number {
  const i = Math.floor(x / g.res + g.n / 2), j = Math.floor(y / g.res + g.n / 2)
  return i < 0 || j < 0 || i >= g.n || j >= g.n ? -1 : j * g.n + i
}

/**
 * Add one beam: cells it passes through get the free update, the cell of the hit the occupied one. Sampling every
 * half cell along the beam visits each crossed cell at least once (a cell can be visited twice; it is updated once).
 * A beam with no return (range Infinity) changes nothing: a choice, so missing returns never clear the map.
 */
export function addBeam(g: Grid, x: number, y: number, angle: number, range: number, pHit: number, pFree: number) {
  if (range === Infinity) return
  const hit = cellAt(g, x + range * Math.cos(angle), y + range * Math.sin(angle))
  const seen = new Set<number>([hit])
  for (let t = 0; t < range; t += g.res / 2) {
    const c = cellAt(g, x + t * Math.cos(angle), y + t * Math.sin(angle))
    if (c >= 0 && !seen.has(c)) {
      seen.add(c)
      g.l[c] = update(g.l[c], pFree)
    }
  }
  if (hit >= 0) g.l[hit] = update(g.l[hit], pHit)
}
