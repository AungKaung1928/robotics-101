import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { CONFIG, POINTS, goalsPast, run } from './patrol'
import { PATROL_STRINGS } from './patrol.strings'

// A checkout of ros2-patrol-project next to this repo (or PATROL_REPO=<path>); skipped without one.
const YAML = `${process.env.PATROL_REPO ?? '../ros2-patrol-project'}/config/patrol_points.yaml`

describe('4.4 patrol model', () => {
  it.skipIf(!existsSync(YAML))('points and patrol_config match the repo yaml', () => {
    const y = readFileSync(YAML, 'utf8')
    const pts = [...y.matchAll(/name: "(\w+)"\s*\n\s*x: (-?[\d.]+)\s*\n\s*y: (-?[\d.]+)/g)].map((m) => ({ name: m[1], x: +m[2], y: +m[3] }))
    expect(pts).toEqual(POINTS.map((p) => ({ ...p })))
    expect(/loop_enabled: (\w+)/.exec(y)![1]).toBe(String(CONFIG.loop))
    expect(+/wait_at_waypoint: ([\d.]+)/.exec(y)![1]).toBe(CONFIG.waitS)
    expect(/retry_on_failure: (\w+)/.exec(y)![1]).toBe(String(CONFIG.retry))
    expect(+/max_retries: (\d+)/.exec(y)![1]).toBe(CONFIG.maxRetries)
  })
  it('blocked first goal: 4 goals to it, then the next point (repo test_launch_bounded_retry.py:67)', () => {
    const ev = run({ blocked: 0, loop: true, retry: true })
    const sends = ev.filter((e) => e.kind === 'send').slice(0, 5).map((e) => e.i)
    expect(sends).toEqual([0, 0, 0, 0, 1])
    expect(goalsPast(ev, 0)).toBe(5)
  })
  it('blocked point_3: 5 goals from the first try to reaching point_5; patrol keeps looping', () => {
    const ev = run({ blocked: 2, loop: true, retry: true })
    expect(goalsPast(ev, 2)).toBe(5)
    expect(ev.some((e) => e.kind === 'skip' && e.i === 2)).toBe(true)
    expect(ev.at(-1)!.kind).not.toBe('stop')
  })
  it('break it: retry off stops the whole patrol at the blocked point', () => {
    const ev = run({ blocked: 2, loop: true, retry: false })
    expect(ev.at(-1)).toEqual({ kind: 'stop', i: 2, why: 'noRetry' })
    expect(goalsPast(ev, 2)).toBeNull()
  })
  it('loop off: one lap then stop at central_hub', () => {
    const ev = run({ blocked: null, loop: false, retry: true })
    expect(ev.filter((e) => e.kind === 'reached')).toHaveLength(7)
    expect(ev.at(-1)).toEqual({ kind: 'stop', i: 6, why: 'end' })
  })
  it('EN and JA have the same keys', () => {
    expect(Object.keys(PATROL_STRINGS.ja).sort()).toEqual(Object.keys(PATROL_STRINGS.en).sort())
  })
})
