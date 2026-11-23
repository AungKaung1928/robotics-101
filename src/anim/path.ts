/**
 * Moving a dot along a cubic Bézier at an honest speed. The curve parameter u is not distance: control points bunch
 * u near the ends, so a dot driven by u slows and speeds up on its own. arcPoint maps a distance fraction to the
 * point, so easing is applied to distance travelled (and a constant rate looks constant).
 */
export type Cubic = readonly [x1: number, y1: number, c1x: number, c1y: number, c2x: number, c2y: number, x2: number, y2: number]

export function cubicPoint(c: Cubic, u: number): [number, number] {
  const q = 1 - u, a = q * q * q, b = 3 * q * q * u, d = 3 * q * u * u, e = u * u * u
  return [a * c[0] + b * c[2] + d * c[4] + e * c[6], a * c[1] + b * c[3] + d * c[5] + e * c[7]]
}

/** Cumulative chord length at u = k / n, k = 0 … n (a polyline of n pieces approximates the curve). */
export function arcTable(c: Cubic, n = 96): number[] {
  const out = [0]
  let [px, py] = cubicPoint(c, 0)
  for (let k = 1; k <= n; k++) {
    const [x, y] = cubicPoint(c, k / n)
    out.push(out[k - 1] + Math.hypot(x - px, y - py))
    px = x; py = y
  }
  return out
}

/** Point at fraction `s` (0 … 1) of the curve's length. Pass a cached arcTable when drawing many dots per frame. */
export function arcPoint(c: Cubic, s: number, table = arcTable(c)): [number, number] {
  const n = table.length - 1, want = Math.min(Math.max(s, 0), 1) * table[n]
  let lo = 0, hi = n
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (table[m] < want) lo = m; else hi = m }
  const seg = table[hi] - table[lo], f = seg > 0 ? (want - table[lo]) / seg : 0
  return cubicPoint(c, (lo + f) / n)
}
