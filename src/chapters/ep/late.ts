import type { Scenario } from '../../anim/contract'

/** EP2: a 10 Hz sensor stream over Wi-Fi where some messages arrive late. Pure model, no DOM. */
export const PERIOD_MS = 100
/** Network delay per message (ms): a hiccup at #6 holds #6-#9, which then arrive together after #10; #14 is late alone. */
export const DELAYS_MS = [30, 25, 35, 30, 40, 30, 450, 380, 280, 180, 35, 30, 25, 40, 260, 30, 35, 30, 25, 30]
/** Challenge: act on at least this many of the 20 messages and never go back in time. */
export const MIN_ACTED = 15

export interface Msg { i: number; stamp: number; arrive: number; age: number }
export type Fate = 'acted' | 'stale' | 'older'
export interface Outcome extends Msg { fate: Fate; backwards: boolean }

export const messages = (): Msg[] =>
  DELAYS_MS.map((d, i) => ({ i, stamp: i * PERIOD_MS, arrive: i * PERIOD_MS + d, age: d }))
    .sort((a, b) => a.arrive - b.arrive || a.stamp - b.stamp)

/**
 * Handle messages in arrival order. Drop when age > maxAgeMs ('stale').
 * keepLatest: also drop anything stamped before the newest message already acted on ('older').
 * backwards = acted on data older than something acted on before: the robot's picture of the world jumped back.
 */
export function run(maxAgeMs: number, keepLatest = false): Outcome[] {
  let newest = -Infinity
  return messages().map((m) => {
    if (m.age > maxAgeMs) return { ...m, fate: 'stale' as const, backwards: false }
    if (keepLatest && m.stamp < newest) return { ...m, fate: 'older' as const, backwards: false }
    const backwards = m.stamp < newest
    newest = Math.max(newest, m.stamp)
    return { ...m, fate: 'acted' as const, backwards }
  })
}

export const summary = (o: Outcome[]) => {
  const acted = o.filter((m) => m.fate === 'acted')
  return {
    acted: acted.length,
    stale: o.filter((m) => m.fate === 'stale').length,
    older: o.filter((m) => m.fate === 'older').length,
    backwards: acted.filter((m) => m.backwards).length,
    worstAge: Math.max(0, ...acted.map((m) => m.age)),
  }
}
export const inGoal = (o: Outcome[]) => { const s = summary(o); return s.backwards === 0 && s.acted >= MIN_ACTED }

export interface LateScene extends Record<string, unknown> { tMs: number; arrived: number }
export const END_MS = Math.max(...DELAYS_MS.map((d, i) => i * PERIOD_MS + d)) + 200

/** Time runs 0..END_MS; a message is drawn in flight between its stamp and its arrival. */
export function scenario(): Scenario<LateScene> {
  const arrivals = messages().map((m) => m.arrive)
  return {
    id: 'ep2-late',
    durationMs: END_MS,
    eventsMs: [...new Set(arrivals)],
    frame: (tMs) => ({ tMs, arrived: arrivals.filter((a) => a <= tMs).length }),
  }
}
