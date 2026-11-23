import { describe, expect, it } from 'vitest'
import { NAV2 } from '../content/world'
import { inflationCost } from '../lib/inflation'
import { inflateCounts, inflateEvents, inflateFront } from './inflate'

const R = NAV2.robotRadius, RAD = NAV2.inflationRadius, K = NAV2.costScaling
const cost = (d: number) => inflationCost(d, K, R, RAD)

describe('inflation ripple', () => {
  it('front runs 0 → inflation radius, clamped', () => {
    expect(inflateFront(0, 3, RAD)).toBe(0)
    expect(inflateFront(1.5, 3, RAD)).toBeCloseTo(RAD / 2, 12)
    expect(inflateFront(9, 3, RAD)).toBe(RAD)
  })
  it('inscribed event sits where the front reaches the robot radius', () => {
    const [a, b, c] = inflateEvents(3, R, RAD)
    expect(a).toBe(0)
    expect(inflateFront(b, 3, RAD)).toBeCloseTo(R, 12)
    expect(c).toBe(3)
  })
  it('counts grow monotonically in the order Nav2 fills them: lethal first, then inscribed, then inflated', () => {
    const ds = Array.from({ length: 400 }, (_, i) => (i / 400) * 1.0) // one cell row, 0 .. 1 m
    const at = (t: number) => inflateCounts(ds, inflateFront(t, 3, RAD), cost)
    const [, tIns, tEnd] = inflateEvents(3, R, RAD)
    expect(at(0)).toEqual({ lethal: 1, inscribed: 0, inflated: 0, total: 1 })
    expect(at(tIns).inflated).toBe(0)
    expect(at(tIns).inscribed).toBeGreaterThan(0)
    const end = at(tEnd), half = at((tIns + tEnd) / 2)
    expect(half.inflated).toBeGreaterThan(0)
    expect(end.inflated).toBeGreaterThan(half.inflated)
    expect(end.total).toBe(ds.filter((d) => cost(d) > 0).length) // at the end: every cell with a cost, none beyond RAD
  })
})
