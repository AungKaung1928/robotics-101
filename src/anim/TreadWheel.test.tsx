import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import TreadWheel, { minPitch, treadPhase } from './TreadWheel'

describe('TreadWheel', () => {
  it('phase repeats every pitch, also when rolling backwards', () => {
    expect(treadPhase(0, 5)).toBe(0)
    expect(treadPhase(12, 5)).toBeCloseTo(2, 12)
    expect(treadPhase(-1, 5)).toBeCloseTo(4, 12)
    expect(treadPhase(15, 5)).toBeCloseTo(0, 12)
  })
  it('stripes shift by the rolled distance: a wheel that rolled half a pitch more is drawn half a pitch on', () => {
    const ys = (rolled: number) => [...renderToStaticMarkup(<svg><TreadWheel x={0} y={0} w={6} h={20} rolled={rolled} pitch={5} /></svg>).matchAll(/y1="([-\d.]+)"/g)].map((m) => Number(m[1]))
    const a = ys(0), b = ys(2.5)
    expect(b.map((v, i) => v - a[i])).toEqual(a.map(() => 2.5))
    expect(ys(5)).toEqual(a)
  })
})

describe('minPitch', () => {
  it('right wheel of a 0.2 m/s, 1 rad/s turn drawn at 600 px/m (168 px/s): 10 px pitch is fine at 60 fps, aliases at 30', () => {
    const speed = 0.28 * 600
    expect(minPitch(speed, 60)).toBeLessThan(10)
    expect(minPitch(speed, 30)).toBeGreaterThan(10)
    expect(minPitch(-speed, 30)).toBe(minPitch(speed, 30))
  })
})
