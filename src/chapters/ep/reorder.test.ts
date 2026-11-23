import { describe, expect, it } from 'vitest'
import { backpressure, reorder, run, summary } from './late'

describe('EP2 reorder buffer', () => {
  it('window 450 ms: all 20 used, in stamp order, each 450 ms late', () => {
    const r = reorder(450)
    expect(r.used).toEqual(Array.from({ length: 20 }, (_, i) => i))
    expect(r.addedDelayMs).toBe(450)
  })
  it('window 200 ms: #6, #7, #8 and #14 arrive after their window and are dropped; the rest stay in order', () => {
    const r = reorder(200)
    expect(r.dropped).toEqual([6, 7, 8, 14])
    expect(r.used).toEqual([...r.used].sort((a, b) => a - b))
  })
  it('trade-off vs keep-latest: keep-latest uses 15 with no wait; a 200 ms buffer uses 16 but 200 ms late', () => {
    expect(summary(run(1000, true)).acted).toBe(15)
    expect(reorder(200).used).toHaveLength(16)
  })
})

describe('EP2 backpressure (1.3 queue model at 10 Hz)', () => {
  it('a consumer as fast as the stream (100 ms) drops nothing and uses fresh data', () => {
    expect(backpressure(100, 3)).toEqual({ dropped: 0, oldestMs: 0 })
  })
  it('a slow consumer (150 ms): a short queue drops more, a long queue drops less but acts on older data', () => {
    const short = backpressure(150, 1), long = backpressure(150, 10)
    expect(short.dropped).toBeGreaterThan(long.dropped)
    expect(long.oldestMs).toBeGreaterThan(short.oldestMs)
  })
})
