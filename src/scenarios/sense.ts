/**
 * On-ramp "sense": one distance beam, then the same beam spinning (a 2D LiDAR). The TurtleBot3 Burger's LDS-01
 * measures 0.12 to 3.5 m (ROBOTIS e-Manual, LDS-01 spec); outside that, or with the sensor covered, there is no number.
 */
export const MIN_R = 0.12, MAX_R = 3.5 // m
export type Seg = readonly [number, number, number, number] // x1, y1, x2, y2 in m
export type Pt = { x: number; y: number }

/** Distance along the beam from `o` at angle `a` (rad) to the nearest wall, or null when nothing is in range. */
export function cast(o: Pt, a: number, walls: readonly Seg[], covered = false): number | null {
  return castWall(o, a, walls, covered)?.d ?? null
}

/** Like cast(), plus which wall (index into `walls`) the beam hit: links a scan point back to the thing it came from. */
export function castWall(o: Pt, a: number, walls: readonly Seg[], covered = false): { d: number; i: number } | null {
  if (covered) return null
  const dx = Math.cos(a), dy = Math.sin(a)
  let best = Infinity, hit = -1
  for (const [i, [x1, y1, x2, y2]] of walls.entries()) {
    const ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex
    if (Math.abs(den) < 1e-12) continue
    const t = ((x1 - o.x) * ey - (y1 - o.y) * ex) / den, u = ((x1 - o.x) * dy - (y1 - o.y) * dx) / den
    if (t > 0 && u >= 0 && u <= 1 && t < best) { best = t; hit = i }
  }
  return best >= MIN_R && best <= MAX_R ? { d: best, i: hit } : null
}

/** A room with one wall the reader can move (its x in m): the single-beam step. */
export function room(wallX: number): Seg[] {
  return [[0, 0, 1.5, 0], [1.5, 0, 1.5, 1], [1.5, 1, 0, 1], [0, 1, 0, 0], [wallX, 0.3, wallX, 0.7]]
}

/**
 * Hits of a beam spinning at `rate` rev/s, `t` s in: one reading every `step` rad of sweep, each fading out over one
 * turn (o = 1 just measured, 0 one turn old). The beam's own angle is the last reading's.
 */
export function sweep(o: Pt, walls: readonly Seg[], t: number, rate: number, step = Math.PI / 90, covered = false): (Pt & { o: number; w: number })[] {
  const swept = 2 * Math.PI * rate * t, n = Math.floor(swept / step), first = Math.max(0, n - Math.round((2 * Math.PI) / step) + 1)
  const out: (Pt & { o: number; w: number })[] = []
  for (let k = first; k <= n; k++) {
    const a = k * step, h = castWall(o, a, walls, covered)
    if (h) out.push({ x: o.x + h.d * Math.cos(a), y: o.y + h.d * Math.sin(a), o: 1 - (swept - a) / (2 * Math.PI), w: h.i })
  }
  return out
}
