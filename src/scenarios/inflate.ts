/**
 * Costmap inflation as a scenario. Nav2's InflationLayer fills cells outward from the obstacle in order of distance
 * (inflation_layer.cpp: cells queued in distance bins, nearest bin first), so the playhead is a distance front moving
 * from 0 to the inflation radius; a cell shows its cost once the front has reached it.
 */

/** Front distance (m) at playhead t of a scenario lasting `end` s that grows linearly to `radius`. */
export function inflateFront(t: number, end: number, radius: number): number {
  return Math.min(Math.max(t / end, 0), 1) * radius
}

/** Step events: obstacle cells only (0), inscribed ring done (robot radius reached), inflation radius reached (end). */
export function inflateEvents(end: number, inscribed: number, radius: number): number[] {
  return [0, (end * inscribed) / radius, end]
}

/** Cost cells revealed so far by kind, for the caption / log: lethal, inscribed, inflated (> 0), total. */
export function inflateCounts(ds: number[], front: number, cost: (d: number) => number, lethal = 254, inscribed = 253) {
  let L = 0, I = 0, F = 0
  for (const d of ds) {
    if (d > front + 1e-9) continue
    const c = cost(d)
    if (c === lethal) L++
    else if (c === inscribed) I++
    else if (c > 0) F++
  }
  return { lethal: L, inscribed: I, inflated: F, total: L + I + F }
}
