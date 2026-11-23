/**
 * EP2: a telemetry stream whose messages arrive late and out of order. Each message is stamped when sensed and
 * arrives at stamp + latency. The consumer handles arrivals in time order and keeps a message only if it is newer
 * than the last one it used (out-of-order = stale) and younger than `maxAge` s at arrival (too old to act on).
 */

export type Msg = { id: number; stamp: number; latency: number }
export type Fate = { id: number; at: number; fate: 'used' | 'stale' | 'old' }

/** Arrival order (ties: earlier stamp first) and what the consumer does with each message. */
export function consume(msgs: Msg[], maxAge: number): Fate[] {
  const byArrival = [...msgs].sort((a, b) => a.stamp + a.latency - (b.stamp + b.latency) || a.stamp - b.stamp)
  let last = -Infinity
  return byArrival.map((m) => {
    const at = m.stamp + m.latency
    if (m.latency > maxAge) return { id: m.id, at, fate: 'old' }
    if (m.stamp <= last) return { id: m.id, at, fate: 'stale' }
    last = m.stamp
    return { id: m.id, at, fate: 'used' }
  })
}

/** Envelope position for the figure: 0 at send (its stamp), 1 at arrival; clamped. */
export const flight = (m: Msg, t: number) => Math.min(Math.max((t - m.stamp) / Math.max(m.latency, 1e-9), 0), 1)
