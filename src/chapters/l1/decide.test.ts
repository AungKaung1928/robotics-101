import { describe, expect, it } from 'vitest'
import { GOAL, START_M, STEP_M, decide, inGoal, run, scenario } from './decide'

describe('1.1 decide', () => {
  it('stops only when the distance is below stop_at', () => {
    expect(decide(0.4, 0.5)).toBe('stop')
    expect(decide(0.5, 0.5)).toBe('go') // equal is not "less than"
    expect(decide(1.2, 0.5)).toBe('go')
  })

  it('drives 0.26 m/s / 5 Hz = 5.2 cm between decisions (TF-Transform-Explorer nav2 max_vel_x, LiDAR update_rate)', () => {
    expect(STEP_M).toBeCloseTo(0.052, 9)
  })

  it('stops at most one step closer than stop_at, never farther', () => {
    for (const stopAt of [0.12, 0.25, 0.5, 0.77, 1.0]) {
      const r = run(stopAt)
      expect(r.crashed).toBe(false)
      expect(r.final).toBeLessThan(stopAt)
      expect(r.final).toBeGreaterThanOrEqual(stopAt - STEP_M - 1e-9)
    }
  })

  it('stop_at = 0 never fires: the robot drives into the wall', () => {
    const r = run(0)
    expect(r.crashed).toBe(true)
    expect(r.final).toBe(0)
  })

  it('break it: ">" instead of "<" stops at the very first scan, 2 m from the wall', () => {
    const r = run(0.5, '>')
    expect(r.ticks).toHaveLength(1)
    expect(r.final).toBe(START_M)
  })

  it('challenge band is reachable and checked by the model', () => {
    expect(inGoal(run(0.3))).toBe(true)
    expect(inGoal(run(0.5))).toBe(false)
    expect(inGoal(run(0))).toBe(false)
    const final = run(0.3).final
    expect(final).toBeGreaterThanOrEqual(GOAL[0])
  })

  it('scenario frame is pure, events ascend inside [0, duration], end frame = final distance', () => {
    for (const [stopAt, op] of [[0.5, '<'], [0, '<'], [0.5, '>']] as const) {
      const sc = scenario(stopAt, op)
      const ev = sc.eventsMs!
      expect([...ev].sort((a, b) => a - b)).toEqual(ev)
      expect(ev[0]).toBe(0)
      expect(ev[ev.length - 1]).toBeLessThanOrEqual(sc.durationMs)
      expect(sc.frame(1234)).toEqual(sc.frame(1234))
      expect(sc.frame(sc.durationMs).distance).toBeCloseTo(run(stopAt, op).final, 9)
      expect(sc.frame(0).distance).toBeCloseTo(START_M, 9)
    }
    expect(scenario(0).frame(1e9).crashed).toBe(true)
  })

  it('distance never increases while the scenario plays', () => {
    const sc = scenario(0.5)
    let last = Infinity
    for (let t = 0; t <= sc.durationMs; t += 50) {
      const d = sc.frame(t).distance
      expect(d).toBeLessThanOrEqual(last + 1e-12)
      last = d
    }
  })
})

describe('1.1 strings', () => {
  it('EN and JA have the same keys and list lengths', async () => {
    const { DECIDE_STRINGS: S } = await import('./decide.strings')
    expect(Object.keys(S.ja).sort()).toEqual(Object.keys(S.en).sort())
    expect(S.ja.lines).toHaveLength(S.en.lines.length)
    expect(S.ja.glossary).toHaveLength(S.en.glossary.length)
  })
})
