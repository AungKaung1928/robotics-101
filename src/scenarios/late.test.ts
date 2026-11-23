import { describe, expect, it } from 'vitest'
import { consume, flight } from './late'

// 10 Hz stream; message 2 hits a 250 ms delay, message 4 a 600 ms one.
const MSGS = [0, 1, 2, 3, 4, 5].map((id) => ({ id, stamp: id * 0.1, latency: id === 2 ? 0.25 : id === 4 ? 0.6 : 0.02 }))

describe('EP2 late messages', () => {
  it('no delay: everything used, in order', () => {
    const f = consume(MSGS.map((m) => ({ ...m, latency: 0.02 })), 0.5)
    expect(f.map((x) => x.id)).toEqual([0, 1, 2, 3, 4, 5])
    expect(f.every((x) => x.fate === 'used')).toBe(true)
  })
  it('a delayed message overtaken by a newer one is stale; one older than maxAge is old', () => {
    const f = consume(MSGS, 0.5)
    expect(f.map((x) => x.id)).toEqual([0, 1, 3, 2, 5, 4]) // 2 lands at 0.45 after 3 (0.32); 4 lands at 1.0
    expect(Object.fromEntries(f.map((x) => [x.id, x.fate]))).toEqual({ 0: 'used', 1: 'used', 3: 'used', 2: 'stale', 5: 'used', 4: 'old' })
  })
  it('a larger maxAge does not save a reordered message: 4 is stale, not used, once 5 got there first', () => {
    const f = consume(MSGS, 1)
    expect(f.find((x) => x.id === 4)!.fate).toBe('stale')
  })
  it('flight runs 0 -> 1 over the latency', () => {
    const m = MSGS[2]
    expect(flight(m, 0)).toBe(0)
    expect(flight(m, m.stamp + m.latency / 2)).toBeCloseTo(0.5, 12)
    expect(flight(m, 9)).toBe(1)
  })
})
