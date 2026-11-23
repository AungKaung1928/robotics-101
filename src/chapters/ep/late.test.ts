import { describe, expect, it } from 'vitest'
import { DELAYS_MS, MIN_ACTED, inGoal, messages, run, scenario, summary } from './late'

describe('EP2 late messages', () => {
  it('20 messages at 10 Hz; #10 arrives before #6-#9 (the hiccup)', () => {
    const order = messages().map((m) => m.i)
    expect(order).toHaveLength(20)
    expect(order.indexOf(10)).toBeLessThan(order.indexOf(6))
    expect(order.indexOf(16)).toBeLessThan(order.indexOf(14))
  })

  it('no filter (max age 1 s): acts on all 20, goes back in time 5 times, worst age 450 ms', () => {
    expect(summary(run(1000))).toEqual({ acted: 20, stale: 0, older: 0, backwards: 5, worstAge: 450 })
  })

  it('an age threshold alone: 179 ms solves it, 180 ms lets #9 through backwards', () => {
    expect(summary(run(179)).backwards).toBe(0)
    expect(inGoal(run(179))).toBe(true)
    expect(summary(run(180)).backwards).toBe(1)
    expect(inGoal(run(180))).toBe(false)
  })

  it('too strict a threshold drops good data: 30 ms acts on fewer than the challenge needs', () => {
    expect(summary(run(30)).acted).toBeLessThan(MIN_ACTED)
  })

  it('keep-latest (stamp check) never goes back in time, for any max age', () => {
    for (const a of [40, 100, 179, 180, 300, 1000]) expect(summary(run(a, true)).backwards).toBe(0)
    expect(summary(run(1000, true))).toMatchObject({ acted: 15, older: 5 })
  })

  it('scenario: nothing arrived at 0, all arrived at the end, pure', () => {
    const sc = scenario()
    expect(sc.frame(0).arrived).toBe(0)
    expect(sc.frame(sc.durationMs).arrived).toBe(DELAYS_MS.length)
    expect(sc.frame(1080)).toEqual(sc.frame(1080))
  })
})

describe('EP2 challenge on the real slider (0.02..1.00 s, step 0.01)', () => {
  it('solvable exactly from 0.04 to 0.17 s: below drops good data, above lets #9 back in', () => {
    const solved: number[] = []
    for (let v = 2; v <= 100; v++) if (inGoal(run(v * 10))) solved.push(v / 100)
    expect(solved[0]).toBe(0.04)
    expect(solved.at(-1)).toBe(0.17)
    expect(solved).toHaveLength(14)
  })
})
