import type { Scenario } from '../../anim/contract'
import { LIDAR, NAV2 } from '../../content/world'
import { easeInOut } from '../../lib/timeline'
import { decide, type Decision } from '../l1/decide'

export const START_M = 1.0 // front of the robot to the wall at t = 0 (page choice)
export const STOP_AT = 0.5 // stop when the wall is closer than this (page choice)
export const SPEED = NAV2.maxVelX // m/s while it goes
export const HZ = LIDAR.hz // one sense → think → act loop per LiDAR scan
export const MAX_BLIND_M = 0.1 // challenge: drive at most this far between two looks (m)
export const PHASE_S = 1.2 // the page shows one loop in 1.2 s; the real loop takes 1 / hz

export type Stage = 'sense' | 'think' | 'act'
export interface LoopTick { seen: number | null; used: number; decision: Decision; front: number }
export interface LoopRun { ticks: LoopTick[]; final: number; crashed: boolean }

/**
 * Sense → think → act, once per loop at `hz`: read the wall distance, decide stop or go, drive SPEED / hz.
 * `blindFrom` = the loop index from which the sensor returns nothing; think keeps using the last value it had.
 */
export function loopRun(hz: number, blindFrom = Infinity): LoopRun {
  const ticks: LoopTick[] = []
  let front = START_M, last = front
  for (let i = 0; i < 1000; i++) {
    const seen = i >= blindFrom ? null : front
    const used = seen ?? last
    last = used
    const decision = decide(used, STOP_AT)
    ticks.push({ seen, used, decision, front })
    if (decision === 'stop') return { ticks, final: front, crashed: false }
    front -= SPEED / hz
    if (front <= 0) return { ticks, final: 0, crashed: true }
  }
  return { ticks, final: front, crashed: false }
}

/** Distance driven between two looks at the sensor (m). */
export const blindM = (hz: number) => SPEED / hz

const blindOk = (hz: number) => blindM(hz) <= MAX_BLIND_M + 1e-9

/** Challenge: the slowest whole-number rate at which the robot drives at most MAX_BLIND_M without looking. */
export const inGoal = (hz: number) => blindOk(hz) && !blindOk(hz - 1)

export interface LoopScene extends Record<string, unknown> { tick: number; stage: Stage; front: number; t: LoopTick }

/** One loop per PHASE_S: first third sense, then think, then act (the robot glides, eased, if the decision was go). */
export function scenario(r: LoopRun, hz: number): Scenario<LoopScene> {
  const n = r.ticks.length
  return {
    id: 'l0-loop',
    durationMs: n * PHASE_S * 1000,
    eventsMs: Array.from({ length: n + 1 }, (_, i) => i * PHASE_S * 1000),
    frame(tMs) {
      const x = Math.max(0, Math.min(n - 1e-9, tMs / 1000 / PHASE_S))
      const tick = Math.floor(x), ph = x - tick
      const t = r.ticks[tick]
      const stage: Stage = ph < 1 / 3 ? 'sense' : ph < 2 / 3 ? 'think' : 'act'
      const step = t.decision === 'go' ? Math.min(SPEED / hz, t.front) : 0
      const front = stage === 'act' ? t.front - step * easeInOut((ph - 2 / 3) * 3) : t.front
      return { tick, stage, front, t }
    },
  }
}
