import { describe, expect, it } from 'vitest'
import { TRACK, WHEEL_R, poseAt } from './diffdrive'
import { actAt, wheels } from './act'
import { MIN_R, MAX_R } from './sense'
import * as move from '../chapters/l0/move'
import * as act from '../chapters/l0/act'
import * as sense from '../chapters/l0/sense'

// My on-ramp scenes must say the same numbers as lane app2's on-ramp models (src/chapters/l0/*.ts); this fails on drift.
describe('on-ramp scenes agree with the chapter models', () => {
  it('wheel geometry and sensor range', () => {
    expect(TRACK).toBe(move.WHEEL_GAP_M)
    expect(WHEEL_R).toBe(move.WHEEL_RADIUS_M)
    expect(MIN_R).toBe(sense.MIN_M)
    expect(MAX_R).toBe(sense.MAX_M)
  })
  it('wheel split and roll-on match act.ts when ActScene gets decel = BRAKE', () => {
    for (const [v, w] of [[0.2, 0], [0.1, 1], [-0.15, -0.8]]) {
      const a = wheels(v, w), b = act.wheels(v, w)
      expect(a.vl).toBeCloseTo(b.left)
      expect(a.vr).toBeCloseTo(b.right)
    }
    for (const v of [0.1, 0.22]) expect(actAt(v, 0, 1, act.BRAKE, 10).rollOn).toBeCloseTo(act.rollOnM(v), 9)
  })
  it('slip meaning: the chapter SLIP is the share delivered, MoveScene slip is the share lost -> pass 1 - SLIP', () => {
    const p = poseAt(move.LEFT, move.LEFT, 2, 1 - move.SLIP), straight = poseAt(move.LEFT, move.LEFT, 2)
    expect(p.th).toBeGreaterThan(0) // the slipping left wheel turns the robot left
    expect(p.x).toBeLessThan(straight.x)
  })
})
