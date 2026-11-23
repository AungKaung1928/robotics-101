/**
 * Level 0.1, sense -> think -> act, as a loop you can step through. Each tick (one LiDAR scan, so the loop runs at the
 * scan rate): sense the distance to the wall, think (go while it is above the stop distance), act (drive at `v` for
 * one tick, or stand). Between two scans the robot drives v / hz metres without looking: the loop rate is a safety number.
 */
export type Tick = { t: number; d: number; go: boolean; x0: number; x1: number }
export type Phase = 'sense' | 'think' | 'act'

export function senseThinkAct(wall: number, start: number, v: number, hz: number, stopAt: number, maxTicks = 500): Tick[] {
  const ticks: Tick[] = []
  let x = start
  for (let i = 0; i < maxTicks; i++) {
    const d = wall - x, go = d > stopAt
    const x1 = go ? x + v / hz : x
    ticks.push({ t: i / hz, d, go, x0: x, x1 })
    if (!go) break
    x = x1
  }
  return ticks
}

/**
 * Where the loop is at time t: tick index, the step being drawn (each tick split in thirds: sense, think, act), and
 * the robot position (it drives the whole tick, it does not wait for the drawing). Past the end: last tick, stopped.
 */
export function loopAt(ticks: Tick[], hz: number, t: number): { i: number; phase: Phase; p: number; x: number } {
  const n = ticks.length, f = Math.max(0, t * hz)
  const i = Math.min(Math.floor(f), n - 1), local = i === n - 1 && f >= n ? 1 : f - i
  const k = ticks[i]
  const phase: Phase = local < 1 / 3 ? 'sense' : local < 2 / 3 ? 'think' : 'act'
  return { i, phase, p: local, x: k.x0 + (k.x1 - k.x0) * local }
}
