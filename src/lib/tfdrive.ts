import { compose, type TF } from './tf2d'

/**
 * The TF chapter's scenario: base_footprint drives an arc in odom while odom drifts from the map. SLAM corrects
 * map → odom only when it processes a scan, i.e. after every `minTravel` metres; in between, the robot drawn through
 * the chain slides off by the drift accrued, then snaps back. The anomaly detector compares base_link between checks.
 */
export type Drive = {
  start: TF // base_footprint in odom at t = 0
  speed: number // m/s
  turn: number // rad over the whole drive
  duration: number // s
  drift: TF // odom's total drift from the map by the end of the drive
  minTravel: number // m driven between SLAM corrections
  missUntil: number // break it: SLAM processes no scan before this time (s); 0 = healthy
}

/** base_footprint in odom at time t (constant speed and turn rate). */
export function footAt(d: Drive, t: number): TF {
  const w = d.turn / d.duration, s = Math.min(Math.max(t, 0), d.duration), { x, y, yaw } = d.start
  if (Math.abs(w) < 1e-9) return { x: x + d.speed * s * Math.cos(yaw), y: y + d.speed * s * Math.sin(yaw), yaw }
  const r = d.speed / w
  return { x: x + r * (Math.sin(yaw + w * s) - Math.sin(yaw)), y: y - r * (Math.cos(yaw + w * s) - Math.cos(yaw)), yaw: yaw + w * s }
}

/** True map → odom at t: drift grows linearly over the drive. */
export function driftAt(d: Drive, t: number): TF {
  const f = Math.min(Math.max(t, 0), d.duration) / d.duration
  return { x: d.drift.x * f, y: d.drift.y * f, yaw: d.drift.yaw * f }
}

/** Times SLAM corrects map → odom: every minTravel of driving, none before missUntil. */
export function corrections(d: Drive): number[] {
  const every = d.minTravel / d.speed, out: number[] = []
  for (let c = every; c <= d.duration + 1e-9; c += every) if (c >= d.missUntil - 1e-9) out.push(Math.round(c * 1000) / 1000)
  return out
}

/** map → odom as SLAM last published it at t (its value at the last correction; identity before the first). */
export function slamAt(d: Drive, t: number): TF {
  const last = corrections(d).filter((c) => c <= t + 1e-9).pop()
  return last === undefined ? { x: 0, y: 0, yaw: 0 } : driftAt(d, last)
}

/** map → base_footprint through the chain SLAM publishes. */
export function mapFootAt(d: Drive, t: number): TF {
  return compose(slamAt(d, t), footAt(d, t))
}

/** The detector's jump at the last check before t: how far base_footprint moved in the map since the check before. */
export function checkJump(d: Drive, t: number, period: number): number {
  const c = Math.floor(t / period + 1e-9) * period
  if (c < period) return 0
  const a = mapFootAt(d, c - period), b = mapFootAt(d, c)
  return Math.hypot(b.x - a.x, b.y - a.y)
}
