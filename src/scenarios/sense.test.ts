import { describe, expect, it } from 'vitest'
import { MAX_R, cast, room, sweep } from './sense'

const O = { x: 0.3, y: 0.5 }
describe('sense model', () => {
  it('beam to the movable wall: distance = wall x − robot x, and it follows the wall', () => {
    expect(cast(O, 0, room(1.0))).toBeCloseTo(0.7)
    expect(cast(O, 0, room(0.6))).toBeCloseTo(0.3)
  })
  it('too close (under 0.12 m) or covered: no number', () => {
    expect(cast(O, 0, room(0.35))).toBeNull()
    expect(cast(O, 0, room(1.0), true)).toBeNull()
  })
  it('beyond 3.5 m: no number', () => {
    expect(cast({ x: 0, y: 0 }, 0, [[MAX_R + 0.5, -1, MAX_R + 0.5, 1]])).toBeNull()
  })
  it('backwards beam hits the room wall behind the robot', () => {
    expect(cast(O, Math.PI, room(1.0))).toBeCloseTo(0.3)
  })
  it('sweep: one turn = 180 readings at 2°, newest bright, oldest faint; covered = none', () => {
    const h = sweep(O, room(1.0), 1, 1)
    expect(h.length).toBe(180)
    expect(Math.max(...h.map((p) => p.o))).toBeCloseTo(1)
    expect(Math.min(...h.map((p) => p.o))).toBeLessThan(0.01)
    expect(sweep(O, room(1.0), 1, 1, Math.PI / 90, true)).toEqual([])
    expect(sweep(O, room(1.0), 0.25, 1).length).toBe(46) // a quarter turn so far
  })
})
