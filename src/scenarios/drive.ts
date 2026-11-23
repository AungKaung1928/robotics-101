import { driveDistance, minTimeAccel } from '../lib/goal'

/**
 * Drive to the goal on the trapezoid speed profile of lib/goal minTimeAccel: accelerate at `accel` to `speed`,
 * cruise, brake at `accel`, stop on entering the tolerance circle. Short drives never reach `speed` (triangle).
 */
export function driveProfile(d: number, tolerance: number, speed: number, accel: number) {
  const L = driveDistance(d, tolerance)
  const T = minTimeAccel(d, tolerance, speed, accel)
  const vPeak = Math.min(speed, Math.sqrt(L * accel)) // triangle peak: L = vPeak² / a
  const tUp = vPeak / accel, tDown = T - tUp
  /** Distance driven (m) and speed (m/s) at time t, clamped to [0, T]. */
  const at = (t: number) => {
    const c = Math.min(Math.max(t, 0), T)
    if (c <= tUp) return { s: 0.5 * accel * c * c, v: accel * c }
    if (c <= tDown) return { s: 0.5 * vPeak * tUp + vPeak * (c - tUp), v: vPeak }
    const r = T - c
    return { s: L - 0.5 * accel * r * r, v: accel * r }
  }
  return { L, T, vPeak, events: tDown - tUp > 1e-9 ? [0, tUp, tDown, T] : [0, tUp, T], at }
}
