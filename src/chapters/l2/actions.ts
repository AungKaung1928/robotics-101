import type { Scenario } from '../../anim/contract'
import { NAV2 } from '../../content/world'

/**
 * Chapter 2.4 model: one NavigateToPose action goal, as ros2-patrol-project's patrol_controller.py sends it.
 * Goal -> accepted -> feedback (distance_remaining) -> result. Cancel -> CANCELED. Unreachable goal -> ABORTED,
 * then the patrol retries the same point up to max_retries (config/patrol_points.yaml:49) and skips it.
 * Simplified: straight drive at max speed, feedback drawn every FEEDBACK_MS (not Nav2's real rate).
 */
export const STATUS = { SUCCEEDED: 4, CANCELED: 5, ABORTED: 6 } as const // action_msgs/msg/GoalStatus
export type Status = keyof typeof STATUS
export const MAX_RETRIES = 3
export const ACCEPT_MS = 300, FEEDBACK_MS = 500, ABORT_MS = 1200, RETRY_WAIT_MS = 2000 // time.sleep(2.0) before a retry
export const SPEED = NAV2.maxVelX
export const TOL = NAV2.goalTolerance

export type Ev =
  | { tMs: number; kind: 'goal'; attempt: number }
  | { tMs: number; kind: 'accepted' }
  | { tMs: number; kind: 'feedback'; remaining: number }
  | { tMs: number; kind: 'result'; status: Status }
  | { tMs: number; kind: 'skip' }

/** Every message of one waypoint, in time order. cancelAtMs: the reader pressed Cancel then (null = never). */
export function run(distance: number, reachable: boolean, cancelAtMs: number | null): Ev[] {
  const evs: Ev[] = []
  if (!reachable) {
    let t = 0
    for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      evs.push({ tMs: t, kind: 'goal', attempt }, { tMs: t + ACCEPT_MS, kind: 'accepted' }, { tMs: t + ABORT_MS, kind: 'result', status: 'ABORTED' })
      t += ABORT_MS + RETRY_WAIT_MS
    }
    evs.push({ tMs: t - RETRY_WAIT_MS, kind: 'skip' })
    return evs
  }
  evs.push({ tMs: 0, kind: 'goal', attempt: 1 }, { tMs: ACCEPT_MS, kind: 'accepted' })
  const doneMs = ACCEPT_MS + (Math.max(0, distance - TOL) / SPEED) * 1000
  for (let t = ACCEPT_MS + FEEDBACK_MS; t < doneMs; t += FEEDBACK_MS) {
    if (cancelAtMs !== null && t > cancelAtMs) break
    evs.push({ tMs: t, kind: 'feedback', remaining: remainingAt(distance, t) })
  }
  if (cancelAtMs !== null && cancelAtMs < doneMs) evs.push({ tMs: Math.max(cancelAtMs, ACCEPT_MS), kind: 'result', status: 'CANCELED' })
  else evs.push({ tMs: doneMs, kind: 'result', status: 'SUCCEEDED' })
  return evs
}

/** distance_remaining at t (ms) for a straight drive starting at ACCEPT_MS. */
export const remainingAt = (distance: number, tMs: number) => Math.max(0, distance - (Math.max(0, tMs - ACCEPT_MS) / 1000) * SPEED)

/** Challenge: on a goal 2 m or more away, cancel once the feedback says less than 1 m is left. */
export function challengeOk(evs: Ev[], distance: number): boolean {
  if (distance < 2) return false
  const res = evs.find((e) => e.kind === 'result')
  if (!res || res.kind !== 'result' || res.status !== 'CANCELED') return false
  const fb = evs.filter((e) => e.kind === 'feedback').at(-1)
  return !!fb && fb.kind === 'feedback' && fb.remaining < 1
}

export interface ActionScene extends Record<string, unknown> { seen: Ev[]; robot: number }

export function scenario(distance: number, reachable: boolean, cancelAtMs: number | null): Scenario<ActionScene> {
  const evs = run(distance, reachable, cancelAtMs)
  const durationMs = evs.at(-1)!.tMs + 600
  const stopMs = evs.find((e) => e.kind === 'result')!.tMs
  return {
    id: 'l2-actions',
    durationMs,
    eventsMs: [...new Set(evs.map((e) => e.tMs).filter((t) => t <= durationMs))],
    frame(tMs) {
      const t = Math.min(Math.max(tMs, 0), durationMs)
      const moved = reachable ? distance - remainingAt(distance, Math.min(t, stopMs)) : 0
      return { seen: evs.filter((e) => e.tMs <= t), robot: moved }
    },
  }
}
