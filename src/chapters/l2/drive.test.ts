import { describe, expect, it } from 'vitest'
import { GOAL, MAX_ACC, challengeOk, plan, scenario, simulate, wheels } from './drive'

describe('2.7 drive', () => {
  it('wheel speeds: straight = equal, turning left = right wheel faster', () => {
    expect(wheels(0.2, 0)).toMatchObject({ left: 0.2, right: 0.2 })
    const w = wheels(0, 1)
    expect(w.right).toBeCloseTo(0.08, 9)
    expect(w.left).toBeCloseTo(-0.08, 9)
    expect(wheels(0.2, 0).leftRad).toBeCloseTo(0.2 / 0.033, 9)
  })

  it('speeding up is capped at 1.0 m/s^2: 0.2 m/s takes 0.2 s', () => {
    const p = simulate(plan(0.2, 0, 5, true), 1)
    expect(p[10].v).toBeCloseTo(0.1, 9) // 0.1 s
    expect(p[20].v).toBeCloseTo(0.2, 9)
    expect(MAX_ACC).toBe(1)
  })

  it('break it: no zeros -> the robot keeps the last command forever', () => {
    const end = simulate(plan(0.2, 0, 2, false), 12).at(-1)!
    expect(end.v).toBe(0.2)
    expect(end.x).toBeGreaterThan(2)
    const stopped = simulate(plan(0.2, 0, 2, true), 12).at(-1)!
    expect(stopped.v).toBe(0)
    expect(stopped.x).toBeLessThan(0.41)
  })

  it('challenge is solvable on an arc (R = 1.25 m): v 0.2, w 0.16, 5.8 s, then zeros', () => {
    expect(challengeOk(plan(0.2, 0.16, 5.8, true))).toBe(true)
    expect(challengeOk(plan(0.2, 0.16, 5.8, false))).toBe(false)
    expect(challengeOk(plan(0.2, 0, 5, true))).toBe(false)
    expect(GOAL.r).toBe(0.15)
  })

  it('scenario frames are pure and the trail grows', () => {
    const sc = scenario(plan(0.2, 0.5, 4, true))
    expect(sc.frame(3000)).toEqual(sc.frame(3000))
    expect(sc.frame(4000).trail.length).toBeGreaterThan(sc.frame(1000).trail.length)
  })
})

describe('2.7 strings', () => {
  it('EN and JA have the same keys and list lengths', async () => {
    const { DRIVE_STRINGS: S } = await import('./drive.strings')
    expect(Object.keys(S.ja).sort()).toEqual(Object.keys(S.en).sort())
    expect(S.ja.lines).toHaveLength(S.en.lines.length)
    expect(S.ja.glossary).toHaveLength(S.en.glossary.length)
  })
})
