/** Playhead model shared by every chapter scenario: time in scenario seconds, events = times where something happens. */

/** Playhead after `dt` real seconds at `speed` scenario seconds per second, stopped at `end`. */
export function advance(t: number, dt: number, speed: number, end: number): number {
  return Math.min(end, t + Math.max(0, dt) * speed)
}

/** Step to the next event after `t` (dir 1) or the last one before it (dir -1); none that way → `t` unchanged. */
export function stepEvent(events: number[], t: number, dir: -1 | 1): number {
  const sorted = [...events].sort((a, b) => a - b)
  const hit = dir === 1 ? sorted.find((e) => e > t + 1e-9) : sorted.reverse().find((e) => e < t - 1e-9)
  return hit ?? t
}

/** Smooth start and stop for anything that moves (cubic ease in-out), x clamped to [0, 1]. */
export function easeInOut(x: number): number {
  const c = Math.min(1, Math.max(0, x))
  return c < 0.5 ? 4 * c ** 3 : 1 - (-2 * c + 2) ** 3 / 2
}

/** Eased progress of a segment [t0, t1] at playhead t: 0 before, 1 after. */
export function progress(t: number, t0: number, t1: number): number {
  return t1 <= t0 ? (t >= t1 ? 1 : 0) : easeInOut((t - t0) / (t1 - t0))
}

/**
 * A rotating sensor's sweep at time t of one revolution lasting `period`: how many of `n` beams have fired, and each
 * fired beam's age as a fraction of the revolution (0 = just fired), for fading trails.
 */
export function sweep(n: number, t: number, period: number): { fired: number; age: (i: number) => number } {
  const f = Math.min(Math.max(t / period, 0), 1)
  const fired = Math.round(f * n)
  return { fired, age: (i) => (i < fired ? f - i / n : 1) }
}
