import { describe, expect, it } from 'vitest'
import { HZ, SLOW_HZ, SPEED, START_M, STOP_AT, blindM, inGoal, loopRun, pastLine, scenario } from './loop'

describe('loopRun', () => {
  it('at his 5 Hz the robot stops inside the stop_at line, less than one step past it', () => {
    const r = loopRun(HZ)
    expect(r.crashed).toBe(false)
    expect(r.final).toBeLessThan(STOP_AT)
    expect(STOP_AT - r.final).toBeLessThan(SPEED / HZ)
    expect(r.ticks[0].front).toBe(START_M)
  })
  it('the slowest whole-number rate that passes the challenge is 3 Hz (0.26 / 3 = 8.7 cm per loop)', () => {
    expect(inGoal(2)).toBe(false)
    expect(inGoal(3)).toBe(true)
    expect(inGoal(HZ)).toBe(false) // his 5 Hz is safe but not the slowest: the page does not open solved
    expect(blindM(HZ)).toBeCloseTo(0.052)
  })
  it('break it: a blind sensor keeps the last value, so the robot never stops and hits the wall', () => {
    const r = loopRun(HZ, 2)
    expect(r.crashed).toBe(true)
    expect(r.ticks[2].seen).toBeNull()
    expect(r.ticks[5].used).toBe(r.ticks[1].used)
  })
})

describe('break it: slow loop', () => {
  it('at once per second it stops 18 cm past the 0.5 m line (looks at 1.10, 0.84, 0.58, 0.32 m); at 5 Hz 2.4 cm', () => {
    const slow = loopRun(SLOW_HZ), fast = loopRun(HZ)
    expect(slow.ticks.map((t) => +t.front.toFixed(2))).toEqual([1.1, 0.84, 0.58, 0.32])
    expect(pastLine(slow)).toBeCloseTo(0.18)
    expect(pastLine(fast)).toBeCloseTo(0.024)
    expect(pastLine(slow)).toBeGreaterThan(blindM(HZ)) // the page's 'late' warning: only the slow loop trips it
    expect(pastLine(fast)).toBeLessThan(blindM(HZ))
  })
})

describe('scenario', () => {
  it('sense, think, act in thirds of a loop; the robot only moves during act', () => {
    const r = loopRun(HZ), sc = scenario(r, HZ)
    expect(sc.frame(0.1 * 1200).stage).toBe('sense')
    expect(sc.frame(0.5 * 1200).stage).toBe('think')
    expect(sc.frame(0.5 * 1200).front).toBe(START_M)
    expect(sc.frame(0.99 * 1200).front).toBeLessThan(START_M)
    expect(sc.frame(sc.durationMs).tick).toBe(r.ticks.length - 1)
  })
})

describe('strings', () => {
  it('EN and JA have the same keys', async () => {
    const { LOOP_STRINGS } = await import('./loop.strings')
    expect(Object.keys(LOOP_STRINGS.ja).sort()).toEqual(Object.keys(LOOP_STRINGS.en).sort())
  })
})

describe('slow-loop strings', () => {
  it('the note says 26 cm = the model at SLOW_HZ, in EN and JA', async () => {
    const { LOOP_STRINGS } = await import('./loop.strings')
    for (const l of ['en', 'ja'] as const) expect(LOOP_STRINGS[l].slowNote).toContain(`${(blindM(SLOW_HZ) * 100).toFixed(0)} cm`)
  })
})
