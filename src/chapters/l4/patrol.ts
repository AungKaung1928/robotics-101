/**
 * Chapter 4.4 model: the patrol loop of ros2-patrol-project as a state machine (no geometry, no timing beyond the code's own sleeps).
 * Points + patrol_config: config/patrol_points.yaml:2-49. Next point: waypoint_manager.py:121-133 ((i + 1) % n, None at the end when loop is off).
 * Result handling: patrol_controller.py:260-308 (SUCCEEDED -> wait 2.0 s -> next; ABORTED -> _on_failure). Rejected goal -> _on_failure (:204-211).
 * _on_failure (:220-253): retry the same point up to max_retries, then skip to the next; retry off -> patrol stops.
 * The repo's own launch test pins the count: 4 goals to a failing point, then the next one (test/test_launch_bounded_retry.py:67).
 */
export const POINTS = [
  { name: 'origin_station', x: 0.0, y: 0.0 },
  { name: 'point_2', x: 2.0, y: 2.0 },
  { name: 'point_3', x: 0.0, y: 2.0 },
  { name: 'point_5', x: -1.5, y: -1.5 },
  { name: 'point_6', x: -1.5, y: 1.5 },
  { name: 'point_7', x: 1.5, y: -1.5 },
  { name: 'central_hub', x: -0.3, y: 0.5 },
] as const
export const CONFIG = { loop: true, waitS: 2.0, retry: true, maxRetries: 3 } as const
export const RETRY_SLEEP_S = 2.0 // patrol_controller.py:232

export type Ev =
  | { kind: 'send'; i: number }
  | { kind: 'reached'; i: number }
  | { kind: 'failed'; i: number; retry: number } // retry = retry_count after the failure
  | { kind: 'skip'; i: number }
  | { kind: 'stop'; i: number; why: 'end' | 'noRetry' }

export interface Opts { blocked: number | null; loop: boolean; retry: boolean; maxRetries?: number; maxSends?: number }

const next = (i: number, loop: boolean) => (!loop && i >= POINTS.length - 1 ? null : (i + 1) % POINTS.length)

/** Events from start until the patrol stops or maxSends goals were sent. */
export function run({ blocked, loop, retry, maxRetries = CONFIG.maxRetries, maxSends = 16 }: Opts): Ev[] {
  const ev: Ev[] = []
  let i = 0, count = 0, sends = 0
  for (;;) {
    if (sends === maxSends) return ev
    ev.push({ kind: 'send', i }); sends++
    if (i !== blocked) {
      ev.push({ kind: 'reached', i }); count = 0
      const n = next(i, loop)
      if (n === null) { ev.push({ kind: 'stop', i, why: 'end' }); return ev }
      i = n; continue
    }
    if (!retry) { ev.push({ kind: 'failed', i, retry: 0 }, { kind: 'stop', i, why: 'noRetry' }); return ev }
    count++
    ev.push({ kind: 'failed', i, retry: count })
    if (count <= maxRetries) continue
    count = 0
    ev.push({ kind: 'skip', i })
    const n = next(i, loop)
    if (n === null) { ev.push({ kind: 'stop', i, why: 'end' }); return ev }
    i = n
  }
}

/** Goals sent from the first goal to the blocked point up to the goal that reaches the point after it; null if never. */
export function goalsPast(ev: Ev[], blocked: number): number | null {
  const first = ev.findIndex((e) => e.kind === 'send' && e.i === blocked)
  const reach = ev.findIndex((e, k) => k > first && e.kind === 'reached')
  return first < 0 || reach < 0 ? null : ev.slice(first, reach).filter((e) => e.kind === 'send').length
}
