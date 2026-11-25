import { describe, expect, it } from 'vitest'
import { run } from '../chapters/l4/patrol'
import { patrolMood } from './patrolmood'

describe('4.4 patrol mood from the model', () => {
  it('clear path: cheers rise with each reached goal, never an oops', () => {
    const ev = run({ blocked: null, loop: false, retry: true })
    const reached = ev.filter((e) => e.kind === 'reached').length
    expect(reached).toBeGreaterThan(0)
    expect(patrolMood(ev, ev.length)).toEqual({ cheer: reached, oops: 0 })
    expect(patrolMood(ev, 0)).toEqual({ cheer: 0, oops: 0 })
  })
  it('blocked goal without retry: one oops per failure, none extra for the early stop', () => {
    const ev = run({ blocked: 1, loop: false, retry: false })
    const m = patrolMood(ev, ev.length)
    expect(ev.some((e) => e.kind === 'stop' && e.why === 'noRetry')).toBe(true)
    expect(m.oops).toBe(ev.filter((e) => e.kind === 'failed').length)
  })
  it('counts only rise as the playhead moves forward', () => {
    const ev = run({ blocked: 1, loop: false, retry: true })
    for (let k = 1; k <= ev.length; k++) {
      const a = patrolMood(ev, k - 1), b = patrolMood(ev, k)
      expect(b.cheer).toBeGreaterThanOrEqual(a.cheer); expect(b.oops).toBeGreaterThanOrEqual(a.oops)
    }
  })
  it('with the chapter\'s k (events shown), a failure counts on the same step it appears', () => {
    const ev = run({ blocked: 1, loop: false, retry: true }), end = ev.length
    const k = (tS: number) => Math.max(1, Math.min(end, Math.floor(Math.min(tS, end)) + 1)) // PatrolChapter.tsx:29
    const j = ev.findIndex((e) => e.kind === 'failed')
    expect(j).toBeGreaterThan(0)
    expect(patrolMood(ev, k(j)).oops - patrolMood(ev, k(j - 1)).oops).toBe(1) // the step that shows ev[j]
  })
})
