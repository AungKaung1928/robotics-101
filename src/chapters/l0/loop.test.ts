import { describe, expect, it } from 'vitest'
import { HZ, SPEED, START_M, STOP_AT, blindM, inGoal, loopRun, scenario } from './loop'

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
