import { BOUNCY, springAt } from '../anim/spring'
import { TRACK, poseAt, type Pose2 } from './diffdrive'

/**
 * On-ramp "act": the decision is two numbers, forward speed v (m/s) and turn speed w (rad/s); the wheels get
 * vl = v − w·L/2, vr = v + w·L/2. Nothing stops at once: after "stop" both wheels slow down together at `decel`
 * (m/s², the faster wheel's), so the robot rolls on along the same arc. `decel` comes from the chapter: no default.
 */
export const wheels = (v: number, w: number) => ({ vl: v - (w * TRACK) / 2, vr: v + (w * TRACK) / 2 })

/** Time to stop after the stop command: the faster wheel's speed / decel. */
export const brakeTime = (v: number, w: number, decel: number) => { const { vl, vr } = wheels(v, w); return Math.max(Math.abs(vl), Math.abs(vr)) / decel }

/** Wheel-speed progress (s of full-speed driving) at time t when stop is commanded at tStop: linear ramp down after. */
export function progress(t: number, tStop: number, tb: number): number {
  if (t <= tStop) return Math.max(0, t)
  const u = Math.min(t - tStop, tb)
  return tStop + u - (tb > 0 ? (u * u) / (2 * tb) : 0)
}

export type ActFrame = { pose: Pose2; ghost: Pose2; rollOn: number; speed: number; rolled: { l: number; r: number } }

/** One frame: the pose, the ghost where an instant stop would have left it, the extra distance rolled (centre), speed share. */
export function actAt(v: number, w: number, tStop: number, decel: number, t: number): ActFrame {
  const { vl, vr } = wheels(v, w), tb = brakeTime(v, w, decel), p = progress(t, tStop, tb)
  const speed = t <= tStop ? 1 : Math.max(0, 1 - (t - tStop) / tb)
  return { pose: poseAt(vl, vr, p), ghost: poseAt(vl, vr, Math.min(t, tStop)), rollOn: Math.abs(v) * (p - Math.min(t, tStop)), speed, rolled: { l: vl * p, r: vr * p } }
}

const LEAN = 0.07, LEAN_IN = 0.08 // stretch while braking, s to lean in
/**
 * Squash and stretch for the stop: 1 while driving; while the wheels brake the body stretches forward (inertia), easing
 * in over LEAN_IN s; when it has stopped it springs back past 1 (a small squash) and settles (BOUNCY spring).
 */
export function brakeStretch(v: number, w: number, tStop: number, decel: number, t: number): number {
  const tb = brakeTime(v, w, decel), end = tStop + tb
  if (t <= tStop || tb === 0) return 1
  if (t < end) return 1 + LEAN * Math.min(1, (t - tStop) / LEAN_IN)
  return 1 + springAt(t - end, BOUNCY, LEAN * Math.min(1, tb / LEAN_IN))
}
