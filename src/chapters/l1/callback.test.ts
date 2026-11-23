import { describe, expect, it } from 'vitest'
import { DEPTH, N, PERIOD_MS, challengeOk, dropped, keepsUp, maxAgeMs, scenario, simulate } from './callback'

describe('1.3 callback queue', () => {
  it('5 Hz scans: one message every 200 ms', () => expect(PERIOD_MS).toBe(200))

  it('a fast callback runs on arrival: no waiting, nothing dropped, every message handled once', () => {
    const ms = simulate(20)
    expect(maxAgeMs(ms)).toBe(0)
    expect(dropped(ms)).toBe(0)
    expect(ms.every((m) => m.startMs === m.arriveMs)).toBe(true)
  })

  it('one call at a time: no two callbacks overlap', () => {
    for (const w of [150, 200, 350, 700]) {
      const run = simulate(w).filter((m) => m.startMs !== null).sort((a, b) => a.startMs! - b.startMs!)
      for (let i = 1; i < run.length; i++) expect(run[i].startMs!).toBeGreaterThanOrEqual(run[i - 1].endMs!)
    }
  })

  it('too slow: the queue fills to depth, the oldest are dropped, the robot acts on old data', () => {
    const ms = simulate(600)
    expect(dropped(ms)).toBeGreaterThan(0)
    expect(maxAgeMs(ms)).toBeGreaterThan(DEPTH * PERIOD_MS / 2)
    expect(ms.filter((m) => !m.dropped).every((m) => m.endMs !== null)).toBe(true)
    expect(ms.filter((m) => !m.dropped).length + dropped(ms)).toBe(N)
  })

  it('slightly slow (210 ms): nothing dropped in 6 s, but the age grows by 10 ms per message', () => {
    const ms = simulate(210)
    expect(dropped(ms)).toBe(0)
    expect(maxAgeMs(ms)).toBe(10 * (N - 1))
  })

  it('challenge: 200 ms is the slowest callback that keeps up', () => {
    expect(keepsUp(200)).toBe(true)
    expect(keepsUp(210)).toBe(false)
    expect(challengeOk(200)).toBe(true)
    expect(challengeOk(190)).toBe(false)
  })

  it('scenario counts add up at every instant; end frame = all handled or dropped', () => {
    for (const w of [20, 210, 600]) {
      const sc = scenario(w)
      for (let t = 0; t <= sc.durationMs; t += 37) {
        const f = sc.frame(t)
        expect(f.done + f.waiting + f.dropped + (f.running === null ? 0 : 1)).toBe(f.arrived)
        expect(f.waiting).toBeLessThanOrEqual(DEPTH)
        expect(f.waiting).toBeGreaterThanOrEqual(0)
      }
      const end = sc.frame(sc.durationMs)
      expect(end.done + end.dropped).toBe(N)
      expect(sc.frame(500)).toEqual(sc.frame(500))
    }
  })
})

describe('1.3 strings', () => {
  it('EN and JA have the same keys and list lengths', async () => {
    const { CALLBACK_STRINGS: S } = await import('./callback.strings')
    expect(Object.keys(S.ja).sort()).toEqual(Object.keys(S.en).sort())
    expect(S.ja.lines).toHaveLength(S.en.lines.length)
    expect(S.ja.glossary).toHaveLength(S.en.glossary.length)
  })
})
