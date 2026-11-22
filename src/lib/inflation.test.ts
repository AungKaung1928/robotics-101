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

import { distToBox } from './inflation'
describe('distToBox', () => {
  const box1 = { x: 2, y: 2, w: 1, h: 1, yaw: 0 } // explorer_world.sdf:104-109
  it('0 inside, face distance beside, corner distance diagonal', () => {
    expect(distToBox(2.2, 1.9, box1)).toBe(0)
    expect(distToBox(1.2, 2, box1)).toBeCloseTo(0.3, 12)
    expect(distToBox(1.2, 1.2, box1)).toBeCloseTo(0.3 * Math.SQRT2, 12)
  })
  it('honours the yaw', () => {
    expect(distToBox(2 + 1, 2, { ...box1, w: 2, yaw: Math.PI / 2 })).toBeCloseTo(0.5, 12)
  })
})

import { kForEdgeCost } from './inflation'
describe('kForEdgeCost', () => {
  it('his geometry: k ≈ 9.8 brings the 0.55 m edge down to 10; that k gives cost 10 there', () => {
    const k = kForEdgeCost(10, NAV2.robotRadius, NAV2.inflationRadius)
    expect(k).toBeCloseTo(9.78, 2)
    expect(252 * Math.exp(-k * (NAV2.inflationRadius - NAV2.robotRadius))).toBeCloseTo(10, 9)
  })
})
