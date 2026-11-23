/**
 * Two-wheel (differential) drive, the TurtleBot3 Burger's. Geometry from the OpenCR firmware header
 * turtlebot3_burger.h: WHEEL_RADIUS 0.033 m, WHEEL_SEPARATION 0.160 m (wheel circumference 0.207 m = 2π·0.033).
 * Forward speed v = (vr + vl) / 2, turn rate ω = (vr − vl) / L; constant wheel speeds give an exact arc.
 */
export const WHEEL_R = 0.033, TRACK = 0.16 // m

export type Pose2 = { x: number; y: number; th: number } // m, m, rad (th = 0 faces +x, counter-clockwise positive)

/**
 * Pose after `t` s at wheel ground speeds vl, vr (m/s) from `p0`. `slip` (0..1) = share of the LEFT wheel's turning
 * that does not reach the floor (a wet patch): the wheel still spins at vl, the robot only gets (1 − slip)·vl.
 */
export function poseAt(vl: number, vr: number, t: number, slip = 0, p0: Pose2 = { x: 0, y: 0, th: 0 }): Pose2 {
  const l = vl * (1 - slip), v = (vr + l) / 2, w = (vr - l) / TRACK, th = p0.th + w * t
  if (Math.abs(w) < 1e-9) return { x: p0.x + v * t * Math.cos(p0.th), y: p0.y + v * t * Math.sin(p0.th), th }
  return { x: p0.x + (v / w) * (Math.sin(th) - Math.sin(p0.th)), y: p0.y - (v / w) * (Math.cos(th) - Math.cos(p0.th)), th }
}

/** Distance each wheel has turned through (its own spin, slip or not): drives the tread stripes. */
export const rolled = (vl: number, vr: number, t: number) => ({ l: vl * t, r: vr * t })

/** Path from 0 to t as points every dt s (the trail drawn behind the robot); always ends exactly at t. */
export function trail(vl: number, vr: number, t: number, slip = 0, dt = 0.05): Pose2[] {
  const n = Math.max(0, Math.floor(t / dt)), pts = Array.from({ length: n + 1 }, (_, i) => poseAt(vl, vr, i * dt, slip))
  if (n * dt < t) pts.push(poseAt(vl, vr, t, slip))
  return pts
}

/** Point under a wheel (side +1 = left, −1 = right) for a pose: where a skid mark is laid down. */
export const wheelPoint = (p: Pose2, side: 1 | -1) => ({ x: p.x - side * (TRACK / 2) * Math.sin(p.th), y: p.y + side * (TRACK / 2) * Math.cos(p.th) })
