import type { Scenario } from '../../anim/contract'
import { LIDAR } from '../../content/world'

/**
 * Chapter 1.3 model: ROS calls on_scan() once per message, one call at a time (single-threaded executor).
 * Messages that arrive while it runs wait in a queue of `depth`; when it is full the oldest is dropped (KEEP_LAST).
 * Simplified: no transport delay, callback time is fixed.
 */
export const PERIOD_MS = 1000 / LIDAR.hz // one scan every 200 ms
export const DEPTH = 10 // create_subscription(LaserScan, 'scan', cb, 10)
export const N = 30 // 6 s of scans
export const STEP = 10 // slider step (ms)

export interface Msg { k: number; arriveMs: number; startMs: number | null; endMs: number | null; dropped: boolean; goneMs: number | null }

export function simulate(workMs: number, depth = DEPTH, n = N, periodMs = PERIOD_MS): Msg[] {
  const msgs: Msg[] = Array.from({ length: n }, (_, k) => ({ k, arriveMs: k * periodMs, startMs: null, endMs: null, dropped: false, goneMs: null }))
  const queue: Msg[] = []
  let free = 0
  const runWaiting = (until: number) => {
    while (queue.length && Math.max(free, queue[0].arriveMs) <= until) {
      const m = queue.shift()!
      m.startMs = Math.max(free, m.arriveMs)
      m.endMs = free = m.startMs + workMs
    }
  }
  for (const m of msgs) {
    runWaiting(m.arriveMs)
    queue.push(m)
    if (queue.length > depth) Object.assign(queue.shift()!, { dropped: true, goneMs: m.arriveMs })
  }
  runWaiting(Infinity)
  return msgs
}

/** Oldest data the callback ever acted on: start time minus arrival time (ms). */
export const maxAgeMs = (ms: Msg[]) => Math.max(0, ...ms.filter((m) => m.startMs !== null).map((m) => m.startMs! - m.arriveMs))
export const dropped = (ms: Msg[]) => ms.filter((m) => m.dropped).length
export const keepsUp = (workMs: number) => maxAgeMs(simulate(workMs)) === 0
/** Challenge: the slowest callback (slider step) that never makes a message wait. */
export const challengeOk = (workMs: number) => keepsUp(workMs) && !keepsUp(workMs + STEP)

export interface CallbackScene extends Record<string, unknown> {
  arrived: number; done: number; running: number | null; waiting: number; dropped: number
}

/** Scenario: the 6 s of scans plus the time to finish the queue; counts at any instant. */
export function scenario(workMs: number): Scenario<CallbackScene> {
  const ms = simulate(workMs)
  const durationMs = Math.max(N * PERIOD_MS, ...ms.map((m) => m.endMs ?? 0))
  return {
    id: 'l1-callback',
    durationMs,
    eventsMs: [...new Set([0, ...ms.map((m) => m.arriveMs), durationMs])].sort((a, b) => a - b),
    frame(tMs) {
      const t = Math.min(Math.max(tMs, 0), durationMs)
      const arrived = ms.filter((m) => m.arriveMs <= t)
      const done = arrived.filter((m) => m.endMs !== null && m.endMs <= t).length
      const running = arrived.find((m) => m.startMs !== null && m.startMs <= t && t < m.endMs!)?.k ?? null
      const gone = arrived.filter((m) => m.goneMs !== null && m.goneMs <= t).length
      const waiting = arrived.length - done - (running === null ? 0 : 1) - gone
      return { arrived: arrived.length, done, running, waiting, dropped: gone }
    },
  }
}

