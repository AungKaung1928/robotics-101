import type { Scenario } from '../../anim/contract'
import { LIDAR, NAV2 } from '../../content/world'

/** Chapter 1.1 model: one value (the front distance) and one decision (stop or go), run once per LiDAR scan. */
export type Decision = 'stop' | 'go'
export type Compare = '<' | '>'

export const START_M = 2.0 // front of the robot to the wall at t = 0
export const SPEED = NAV2.maxVelX // m/s when it goes
export const SCAN_HZ = LIDAR.hz // one new distance, so one decision, per scan
export const STEP_M = SPEED / SCAN_HZ // distance driven between two decisions
export const GOAL: [number, number] = [0.2, 0.3] // challenge: stop with the front in this band (m)

/** The page's version of the Python `if distance < stop_at:`. `op` is '>' only in break-it mode. */
export function decide(distance: number, stopAt: number, op: Compare = '<'): Decision {
  return (op === '<' ? distance < stopAt : distance > stopAt) ? 'stop' : 'go'
}

export interface Tick { tS: number; distance: number; decision: Decision }
export interface Run { ticks: Tick[]; final: number; crashed: boolean; stopS: number }

/** Drive toward the wall, deciding at every scan; ends at the first 'stop' or when the front touches the wall. */
export function run(stopAt: number, op: Compare = '<'): Run {
  const ticks: Tick[] = []
  for (let k = 0; ; k++) {
    const distance = Math.max(0, START_M - k * STEP_M)
    const tS = k / SCAN_HZ
    if (distance <= 1e-9) return { ticks, final: 0, crashed: true, stopS: (START_M / SPEED) }
    const decision = decide(distance, stopAt, op)
    ticks.push({ tS, distance, decision })
    if (decision === 'stop') return { ticks, final: distance, crashed: false, stopS: tS }
  }
}

export const inGoal = (r: Run) => !r.crashed && r.final >= GOAL[0] && r.final <= GOAL[1]

export interface DecideScene extends Record<string, unknown> {
  distance: number; tick: number; decision: Decision; moving: boolean; crashed: boolean
}

/** Scenario: the same run, drawn at any time; 1 s of rest after the stop so the end frame is readable. */
export function scenario(stopAt: number, op: Compare = '<'): Scenario<DecideScene> {
  const r = run(stopAt, op)
  const durationMs = Math.round((r.stopS + 1) * 1000)
  return {
    id: 'l1-decide',
    durationMs,
    eventsMs: [...r.ticks.map((k) => Math.round(k.tS * 1000)), ...(r.crashed ? [Math.round(r.stopS * 1000)] : [])],
    frame(tMs) {
      const t = Math.min(Math.max(tMs, 0), durationMs) / 1000
      const tick = Math.min(r.ticks.length - 1, Math.floor(t * SCAN_HZ + 1e-9))
      const now = r.ticks[tick]
      const moving = now.decision === 'go' && t < r.stopS
      const distance = moving ? Math.max(0, now.distance - (t - now.tS) * SPEED) : r.final
      return { distance, tick, decision: now.decision, moving, crashed: r.crashed && t >= r.stopS }
    },
  }
}
