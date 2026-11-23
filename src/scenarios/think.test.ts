import { describe, expect, it } from 'vitest'
import { room } from './sense'
import { HZ, MIN_R, RADIUS, thinkRun, thinkX } from './think'

const W = room(1.2), V = 0.2
describe('think rule', () => {
  it('stopAt 0.5: fires and stops with the wall between 0.5 − one tick of travel and 0.5 m away', () => {
    const r = thinkRun(0.5, V, W)
    expect(r).toMatchObject({ fired: true, bumped: false })
    const gap = 1.2 - r.stopX
    expect(gap).toBeLessThan(0.5)
    expect(gap).toBeGreaterThanOrEqual(0.5 - V / HZ)
  })
  it('bigger stopAt stops earlier', () => {
    expect(thinkRun(0.6, V, W).stopX).toBeLessThan(thinkRun(0.3, V, W).stopX)
  })
  it('below the sensor minimum the rule never fires: bump at the body radius', () => {
    const r = thinkRun(MIN_R, V, W)
    expect(r).toMatchObject({ fired: false, bumped: true })
    expect(r.stopX).toBeCloseTo(1.2 - RADIUS)
  })
  it('position follows v then holds', () => {
    const r = thinkRun(0.5, V, W)
    expect(thinkX(r, V, 1)).toBeCloseTo(0.5)
    expect(thinkX(r, V, 99)).toBe(r.stopX)
  })
})
