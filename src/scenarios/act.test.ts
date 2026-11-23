import { describe, expect, it } from 'vitest'
import { TRACK } from './diffdrive'
import { actAt, brakeTime, progress, wheels } from './act'

describe('act model', () => {
  it('two numbers become two wheel speeds', () => {
    expect(wheels(0.2, 0)).toEqual({ vl: 0.2, vr: 0.2 })
    const s = wheels(0, 1)
    expect(s.vr - s.vl).toBeCloseTo(TRACK)
  })
  it('straight roll-on after stop = v² / (2a)', () => {
    const v = 0.2, a = 0.5, end = actAt(v, 0, 1, a, 10)
    expect(end.rollOn).toBeCloseTo((v * v) / (2 * a))
    expect(end.pose.x - end.ghost.x).toBeCloseTo((v * v) / (2 * a))
    expect(end.speed).toBe(0)
  })
  it('before stop the ghost and the robot coincide, speed share 1', () => {
    const f = actAt(0.2, 0.5, 2, 0.5, 1)
    expect(f.pose).toEqual(f.ghost)
    expect(f.rollOn).toBe(0)
    expect(f.speed).toBe(1)
  })
  it('turning: the roll-on stays on the same circle', () => {
    const v = 0.2, w = 1, R = v / w, f = actAt(v, w, 1, 0.5, 5)
    expect(Math.hypot(f.pose.x, f.pose.y - R)).toBeCloseTo(R, 9)
  })
  it('progress is continuous and stops growing after the brake time', () => {
    const tb = brakeTime(0.2, 0, 0.5)
    expect(progress(1, 1, tb)).toBe(1)
    expect(progress(1 + tb, 1, tb)).toBeCloseTo(progress(1 + 3 * tb, 1, tb))
  })
})
