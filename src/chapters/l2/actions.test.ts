import { describe, expect, it } from 'vitest'
import { ACCEPT_MS, MAX_RETRIES, SPEED, STATUS, TOL, challengeOk, remainingAt, run, scenario } from './actions'

const kinds = (d: number, r: boolean, c: number | null) => run(d, r, c).map((e) => e.kind)

describe('2.4 actions', () => {
  it('GoalStatus codes the patrol checks: SUCCEEDED 4 (patrol_controller.py), CANCELED 5, ABORTED 6', () => {
    expect(STATUS).toEqual({ SUCCEEDED: 4, CANCELED: 5, ABORTED: 6 })
  })

  it('a reachable goal: goal, accepted, feedback with falling distance_remaining, then SUCCEEDED at the tolerance', () => {
    const evs = run(2, true, null)
    expect(kinds(2, true, null).slice(0, 2)).toEqual(['goal', 'accepted'])
    const fb = evs.filter((e) => e.kind === 'feedback').map((e) => (e.kind === 'feedback' ? e.remaining : 0))
    expect(fb.length).toBeGreaterThan(3)
    for (let i = 1; i < fb.length; i++) expect(fb[i]).toBeLessThan(fb[i - 1])
    const res = evs.at(-1)!
    expect(res).toMatchObject({ kind: 'result', status: 'SUCCEEDED' })
    expect(remainingAt(2, res.tMs)).toBeCloseTo(TOL, 9)
    expect(res.tMs).toBeCloseTo(ACCEPT_MS + ((2 - TOL) / SPEED) * 1000, 6)
  })

  it('cancel: no feedback after the cancel, result CANCELED', () => {
    const evs = run(2, true, 2000)
    expect(evs.at(-1)).toMatchObject({ kind: 'result', status: 'CANCELED', tMs: 2000 })
    expect(evs.filter((e) => e.kind === 'feedback').every((e) => e.tMs <= 2000)).toBe(true)
  })

  it('unreachable: ABORTED, retried max_retries (3) times, then skipped', () => {
    const evs = run(2, false, null)
    expect(evs.filter((e) => e.kind === 'goal')).toHaveLength(MAX_RETRIES + 1)
    expect(evs.filter((e) => e.kind === 'result' && e.status === 'ABORTED')).toHaveLength(MAX_RETRIES + 1)
    expect(evs.at(-1)!.kind).toBe('skip')
  })

  it('challenge: cancel only counts after feedback under 1 m', () => {
    const late = ACCEPT_MS + ((3 - 0.8) / SPEED) * 1000 // 0.8 m left
    expect(challengeOk(run(3, true, late))).toBe(true)
    expect(challengeOk(run(3, true, 1500))).toBe(false)
    expect(challengeOk(run(3, true, null))).toBe(false)
  })

  it('scenario: robot never moves on an unreachable goal and stops at cancel', () => {
    expect(scenario(2, false, null).frame(1e9).robot).toBe(0)
    const sc = scenario(2, true, 2000)
    expect(sc.frame(1e9).robot).toBeCloseTo(((2000 - ACCEPT_MS) / 1000) * SPEED, 9)
    expect(sc.frame(1500)).toEqual(sc.frame(1500))
  })
})

describe('2.4 strings', () => {
  it('EN and JA have the same keys and list lengths', async () => {
    const { ACTIONS_STRINGS: S } = await import('./actions.strings')
    expect(Object.keys(S.ja).sort()).toEqual(Object.keys(S.en).sort())
    expect(Object.keys(S.ja.ev).sort()).toEqual(Object.keys(S.en.ev).sort())
    expect(S.ja.compare).toHaveLength(S.en.compare.length)
    expect(S.ja.glossary).toHaveLength(S.en.glossary.length)
  })
})
