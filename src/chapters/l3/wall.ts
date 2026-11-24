import type { Scenario } from '../../anim/contract'

/**
 * Chapter 3.2 model: the PD wall follower of turtlebot3-wall-follower, one straight wall on the right.
 * Gains and limits: config/wall_following_params.yaml:8-31. Control law: wall_follower_controller.py:326-357
 * (look-ahead error, filtered derivative, clamp, slow down in sharp turns, 0.05 m/s floor); too close: :320-323.
 * On a straight wall the two-beam estimate (:268-286) returns the true distance d and heading alpha, so the
 * model uses them directly. Kinematics: d' = -v sin(alpha), alpha' = omega (alpha > 0 = heading into the wall).
 */
export const P = {
  desired: 0.5, forward: 0.18, maxW: 1.0, kp: 2.0, kd: 0.6, lookahead: 0.3,
  wallMin: 0.28, wallLost: 1.2, dt: 0.05, alphaMax: 1.0,
} as const
export const KP_RANGE = [0.1, 5.0] as const // _get_validated_param('kp', 0.1, 5.0), controller.py:95
export const START_D = 1.0
export const N = 300 // 15 s at 20 Hz

export interface Tick { d: number; alpha: number; w: number; v: number; mode: 'follow' | 'tooClose' | 'lost' | 'spun' }

export function run(kp: number, lookahead: number = P.lookahead, n: number = N): Tick[] {
  let d = START_D, alpha = 0, prev = 0, fd = 0
  const out: Tick[] = []
  for (let k = 0; k < n; k++) {
    let w: number, v: number, mode: Tick['mode'] = 'follow'
    if (d > P.wallLost) { out.push({ d, alpha, w: 0, v: 0, mode: 'lost' }); continue }
    // Past 1 rad the two-beam estimate is clamped (:285) and this straight-wall model no longer holds: stop here.
    if (Math.abs(alpha) > P.alphaMax || out.at(-1)?.mode === 'spun') { out.push({ d, alpha, w: 0, v: 0, mode: 'spun' }); continue }
    if (d < P.wallMin) { mode = 'tooClose'; v = 0.08; w = -0.6 } else {
      const err = d - lookahead * Math.sin(alpha) - P.desired
      fd = 0.7 * fd + 0.3 * ((err - prev) / P.dt)
      prev = err
      w = Math.max(-P.maxW, Math.min(kp * err + P.kd * fd, P.maxW))
      v = P.forward
      if (Math.abs(w) > 0.3) v *= 1 - (Math.abs(w) / P.maxW) * 0.7
      v = Math.max(0.05, v)
    }
    out.push({ d, alpha, w, v, mode })
    d -= v * Math.sin(alpha) * P.dt
    alpha += w * P.dt
  }
  return out
}

export const closest = (ts: Tick[]) => Math.min(...ts.map((t) => t.d))
export const tooCloseTicks = (ts: Tick[]) => ts.filter((t) => t.mode === 'tooClose').length
/** First time (s) after which |d - desired| stays within 0.05 m; null if never. */
export function settleS(ts: Tick[]): number | null {
  let last = -1
  ts.forEach((t, k) => { if (Math.abs(t.d - P.desired) > 0.05) last = k })
  return last === ts.length - 1 ? null : (last + 1) * P.dt
}
/** Challenge: settle within 10 s, never enter the too-close branch, never leave the model's 1 rad range. */
export const spun = (ts: Tick[]) => ts.some((t) => t.mode === 'spun')
export const challengeOk = (ts: Tick[]) => { const s = settleS(ts); return s !== null && s <= 10 && tooCloseTicks(ts) === 0 && !spun(ts) }

export interface WallScene extends Record<string, unknown> { k: number; tick: Tick }
export function scenario(ts: Tick[]): Scenario<WallScene> {
  const durationMs = ts.length * P.dt * 1000
  return {
    id: 'l3-wall', durationMs,
    frame(tMs) { const k = Math.min(ts.length - 1, Math.max(0, Math.floor(tMs / (P.dt * 1000)))); return { k, tick: ts[k] } },
  }
}
