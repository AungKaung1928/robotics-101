import { describe, expect, it } from 'vitest'
import { BEAMS, COVER_M, front, FRONT_MAX, FRONT_START, hit, MAX_M, MIN_M, perSecond, ROOM, turn, valid, VIEW, why } from './sense'

describe('sense model', () => {
  it('one beam straight ahead = the wall distance', () => {
    expect(front(turn(FRONT_START))).toBeCloseTo(1.5)
    expect(front(turn(0.3))).toBeCloseTo(0.3)
  })
  it('past 3.5 m the front number is nothing there, but the side walls still show', () => {
    const r = turn(3.8)
    expect(front(r)).toBeNull()
    expect(r.filter(valid).length).toBeGreaterThan(300)
  })
  it('beam to the left side wall at 90 degrees = 1.0 m, behind = 0.8 m', () => {
    expect(hit(Math.PI / 2, 2)).toBeCloseTo(ROOM.side)
    expect(hit(Math.PI, 2)).toBeCloseTo(-ROOM.back)
  })
  it('break it: covered, every reading is under the 12 cm minimum, so none count', () => {
    expect(COVER_M).toBeLessThan(MIN_M)
    const r = turn(FRONT_START, true)
    expect(r.filter(valid).length).toBe(0)
    expect(front(r)).toBeNull()
    expect(why(r)).toBe('near') // REP 117: too close (-inf), not "nothing in range" (+inf)
    expect(why(turn(MAX_M + 0.3))).toBe('far')
  })
  it('360 beams x 5 turns per second = 1800 numbers per second', () => {
    expect(BEAMS).toBe(360)
    expect(perSecond()).toBe(1800)
  })
  it('the room and the farthest front wall fit in the figure', () => {
    const x = (m: number) => VIEW.ox + m * VIEW.px
    expect(x(ROOM.back)).toBeGreaterThan(10)
    expect(x(FRONT_MAX)).toBeLessThan(VIEW.w - 10)
    expect(VIEW.oy - ROOM.side * VIEW.px).toBeGreaterThan(10)
    expect(FRONT_MAX).toBeGreaterThan(MAX_M)
  })
})
