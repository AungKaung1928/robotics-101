import { describe, expect, it } from 'vitest'
import { arenaPoint, VIEW } from './drag'

const square = { left: 100, top: 50, width: 540, height: 540 } // 50 px per metre

describe('arenaPoint', () => {
  it('maps the centre to the origin and flips y (REP 103: y up)', () => {
    expect(arenaPoint(370, 320, square)).toEqual({ x: 0, y: 0 })
    const p = arenaPoint(370 + 50, 320 - 100, square) // 1 m right, 2 m up on screen
    expect(p.x).toBeCloseTo(1)
    expect(p.y).toBeCloseTo(2)
  })
  it('snaps to the slider step and clamps to the slider range', () => {
    expect(arenaPoint(370 + 51, 320, square).x).toBeCloseTo(1) // 1.02 m → 1.00
    expect(arenaPoint(100, 50, square)).toEqual({ x: -4.5, y: 4.5 }) // corner = 5.4 m → clamp
  })
  it('handles a wide box: the square view is centred, height sets the scale', () => {
    const wide = { left: 0, top: 0, width: 1000, height: VIEW * 10 } // 10 px per metre
    const p = arenaPoint(500 + 30, 54 - 20, wide)
    expect(p.x).toBeCloseTo(3)
    expect(p.y).toBeCloseTo(2)
  })
})
