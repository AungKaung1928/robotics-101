import { describe, expect, it } from 'vitest'
import { NAV2 } from '../content/world'
import { INSCRIBED, LETHAL, inflationCost } from './inflation'

const cost = (d: number, k = NAV2.costScaling) => inflationCost(d, k, NAV2.robotRadius, NAV2.inflationRadius)
describe('inflationCost (his k 3.0, r 0.22 m, radius 0.55 m)', () => {
  it('lethal on the obstacle, inscribed inside the footprint radius', () => {
    expect(cost(0)).toBe(LETHAL)
    expect(cost(0.1)).toBe(INSCRIBED)
    expect(cost(0.22)).toBe(INSCRIBED)
  })
  it('decays as 252 exp(-3 (d - 0.22))', () => {
    expect(cost(0.32)).toBe(Math.trunc(252 * Math.exp(-0.3))) // 186
    expect(cost(0.32)).toBe(186)
    expect(cost(0.55)).toBe(93)
  })
  it('zero beyond the inflation radius', () => {
    expect(cost(0.56)).toBe(0)
  })
  it('larger k drops cost faster', () => {
    expect(cost(0.4, 10)).toBeLessThan(cost(0.4, 3))
  })
})
