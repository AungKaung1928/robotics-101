import { describe, expect, it } from 'vitest'
import { NAV2 } from '../content/world'
import { cellCount, logOdds, prob, update } from './grid'

describe('occupancy grid', () => {
  it('10 x 10 m at his 0.05 m resolution is 200 x 200 = 40,000 cells', () => {
    expect(cellCount(10, NAV2.costmapResolution)).toBe(40_000)
    expect(cellCount(10, 0.025)).toBe(160_000)
  })
  it('log-odds round-trips and 0.5 is 0', () => {
    expect(logOdds(0.5)).toBe(0)
    expect(prob(logOdds(0.7))).toBeCloseTo(0.7, 12)
  })
  it('two hits at p = 0.7 from unknown: 0.7² / (0.7² + 0.3²) = 0.845', () => {
    const l = update(update(0, 0.7), 0.7)
    expect(prob(l)).toBeCloseTo(0.49 / 0.58, 12)
  })
  it('a hit then a miss of equal strength cancel', () => {
    expect(update(update(0, 0.7), 0.3)).toBeCloseTo(0, 12)
  })
})
