// Nav2 costmap cost values (docs.nav2.org, Costmap2D; nav2_costmap_2d/cost_values.hpp).
export const LETHAL = 254
export const INSCRIBED = 253

/**
 * Nav2 InflationLayer::computeCost for a cell at distance d (m) from the nearest obstacle:
 * 254 on the obstacle, 253 inside the inscribed radius, else trunc(252 * exp(-k (d - r))), 0 beyond the
 * inflation radius.
 */
export function inflationCost(d: number, k: number, inscribed: number, inflationRadius: number): number {
  if (d <= 0) return LETHAL
  if (d <= inscribed) return INSCRIBED
  if (d > inflationRadius) return 0
  return Math.trunc((INSCRIBED - 1) * Math.exp(-k * (d - inscribed)))
}

/** Distance (m) from point (px, py) to a rotated box (centre x, y; size w x h; yaw); 0 inside. */
export function distToBox(px: number, py: number, b: { x: number; y: number; w: number; h: number; yaw: number }): number {
  const c = Math.cos(-b.yaw), s = Math.sin(-b.yaw)
  const lx = c * (px - b.x) - s * (py - b.y), ly = s * (px - b.x) + c * (py - b.y)
  const dx = Math.max(Math.abs(lx) - b.w / 2, 0), dy = Math.max(Math.abs(ly) - b.h / 2, 0)
  return Math.hypot(dx, dy)
}

/** cost_scaling_factor k at which the cost just inside the inflation radius falls to `edgeCost` (from 252 e^(−k(r−r_i)) = edgeCost). */
export function kForEdgeCost(edgeCost: number, inscribed: number, inflationRadius: number): number {
  return Math.log((INSCRIBED - 1) / edgeCost) / (inflationRadius - inscribed)
}
