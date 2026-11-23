import { MIN_R, cast, type Seg } from './sense'

/**
 * On-ramp "think": the rule "wall closer than stopAt -> stop", checked once per loop tick while the robot drives at
 * v toward a wall. Stop is instant here (the act scene adds the roll-on). RADIUS = the Burger footprint radius
 * (robot_radius 0.105 m in turtlebot3_navigation2 param/burger.yaml); the sensor sits at the centre. Because the
 * sensor sees nothing under MIN_R (0.12 m), a rule below that never fires and the robot bumps.
 */
export const RADIUS = 0.105, HZ = 10 // m, loop ticks / s

export type ThinkRun = { stopX: number; tStop: number; fired: boolean; bumped: boolean }

/** Run the loop from x0 (m, facing +x, y = 0.5) toward `walls` until the rule fires or the body touches a wall. */
export function thinkRun(stopAt: number, v: number, walls: readonly Seg[], x0 = 0.3, hz = HZ): ThinkRun {
  const contact = (() => { // body front touches the first wall straight ahead (geometry, not the sensor)
    let best = Infinity
    for (const [x1, y1, x2, y2] of walls) if (x1 === x2 && x1 > x0 && Math.min(y1, y2) <= 0.5 && Math.max(y1, y2) >= 0.5) best = Math.min(best, x1)
    return best - RADIUS
  })()
  for (let k = 0; k < 10_000; k++) {
    const x = x0 + (v * k) / hz
    if (x >= contact) return { stopX: contact, tStop: (contact - x0) / v, fired: false, bumped: true }
    const d = cast({ x, y: 0.5 }, 0, walls) // the reading this tick (null = nothing seen)
    if (d !== null && d < stopAt) return { stopX: x, tStop: k / hz, fired: true, bumped: false }
  }
  return { stopX: x0, tStop: 0, fired: false, bumped: false }
}

/** Robot x at time t for a run: drives at v, then holds where it stopped. */
export const thinkX = (r: ThinkRun, v: number, t: number, x0 = 0.3) => Math.min(x0 + v * Math.max(0, t), r.stopX)
export { MIN_R }
