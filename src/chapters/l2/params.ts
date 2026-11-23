import type { Scenario } from '../../anim/contract'
import { NAV2 } from '../../content/world'

/**
 * Chapter 2.5 model: tf_anomaly_detector's max_position_jump parameter (TF-Transform-Explorer
 * src/tf_anomaly_detector.cpp:10-14 declares it, default 0.5 m; :25-26 checks every 500 ms; :74-77 jump > max -> WARN).
 * The drive: the robot moves at Nav2's max speed, so one check sees 0.26 * 0.5 = 0.13 m of normal motion.
 * One illustrative position jump (a relocalization) of JUMP_M at check JUMP_AT; not a logged event.
 */
export const DEFAULT = 0.5
export const CHECK_MS = 500
export const N = 20 // 10 s of checks
export const STEP_M = NAV2.maxVelX * (CHECK_MS / 1000)
export const JUMP_M = 0.8, JUMP_AT = 12

export const steps = () => Array.from({ length: N }, (_, k) => (k === JUMP_AT ? JUMP_M : STEP_M))
export const flagged = (max: number) => steps().map((d) => d > max)
export const falseAlarms = (max: number) => flagged(max).filter((f, k) => f && k !== JUMP_AT).length
export const caught = (max: number) => flagged(max)[JUMP_AT]
/** Challenge: warn about the jump and nothing else. */
export const challengeOk = (max: number) => caught(max) && falseAlarms(max) === 0

export type Source = 'default' | 'launch' | 'cli'
/** ROS 2 parameter value: an override (launch file or command line) wins over the declare_parameter default. */
export const effective = (src: Source, value: number) => (src === 'default' ? DEFAULT : value)

export interface ParamsScene extends Record<string, unknown> { done: number; warns: number }

export function scenario(max: number): Scenario<ParamsScene> {
  const f = flagged(max)
  const durationMs = N * CHECK_MS
  return {
    id: 'l2-params',
    durationMs,
    eventsMs: Array.from({ length: N + 1 }, (_, k) => k * CHECK_MS),
    frame(tMs) {
      const done = Math.min(N, Math.floor(Math.min(Math.max(tMs, 0), durationMs) / CHECK_MS + 1e-9))
      return { done, warns: f.slice(0, done).filter(Boolean).length }
    },
  }
}
