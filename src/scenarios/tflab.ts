import { CALM, settleTime, springAt } from '../anim/spring'
import { apply, compose, type TF } from '../lib/tf2d'

/**
 * TF debugging lab: the laser sees a straight wall, but the points are drawn through base_link -> laser with an error
 * (wrong mounting yaw, or a stale robot pose while turning). Points land off the wall; the fix springs the error to 0
 * with CALM (critically damped: the points never pass the true wall, so no frame shows a false fix).
 */

/** Map-frame points of laser hits `pts` (laser frame) through map->base `base` and base->laser `mount`. */
export function toMap(base: TF, mount: TF, pts: [number, number][]): [number, number][] {
  const T = compose(base, mount)
  return pts.map((p) => apply(T, p))
}

/** Yaw error (rad) of a transform that is `age` s old while the robot turns at `w` rad/s. */
export const staleYaw = (w: number, age: number) => w * age

/** Mean distance (m) of points to the wall x = wallX: the number the learner watches go to 0. */
export function wallResidual(pts: [number, number][], wallX: number): number {
  return pts.reduce((s, [x]) => s + Math.abs(x - wallX), 0) / Math.max(pts.length, 1)
}

/** Yaw error at time `t` s after the fix is applied (before: err0). */
export const fixedYaw = (err0: number, t: number) => (t <= 0 ? err0 : springAt(t, CALM, err0))

/** Seconds until the yaw error is within `eps` rad of 0 after the fix. */
export const fixSettle = (err0: number, eps = 1e-3) => settleTime(CALM, err0, 0, eps)

export type Mood = 'dizzy' | 'curious' | 'happy'

/** Mascot state from the residual: dizzy while points are clearly off, curious while the fix moves them, happy when on. */
export function tfMood(residual: number, before: number, tol = 0.01): Mood {
  if (residual <= tol) return 'happy'
  return residual < before - tol ? 'curious' : 'dizzy'
}
