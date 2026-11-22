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
