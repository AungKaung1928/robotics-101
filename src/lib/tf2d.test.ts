import { describe, expect, it } from 'vitest'
import { FOOTPRINT_TO_BASE, NAV2, TF_CHECK_PERIOD, TF_MAX_AGE, TF_MAX_JUMP } from '../content/world'
import { maxDrivePerCheck, verdict } from './anomaly'
import { apply, compose, invert } from './tf2d'

const close = (a: number[], b: number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 12))
describe('2D transforms', () => {
  const a = { x: 1, y: 2, yaw: Math.PI / 2 }
  const b = { x: 0.5, y: 0, yaw: 0.3 }
  it('compose rotates the child offset by the parent yaw', () => {
    const c = compose(a, b)
    close([c.x, c.y, c.yaw], [1, 2.5, Math.PI / 2 + 0.3])
  })
  it('apply agrees with compose', () => {
    const c = compose(a, b)
    close(apply(a, [b.x, b.y]), [c.x, c.y])
  })
  it('T ∘ T⁻¹ is the identity', () => {
    const t = { x: -0.7, y: 1.3, yaw: 2.1 }
    const i = compose(t, invert(t))
    close([i.x, i.y, i.yaw], [0, 0, 0])
    close(apply(invert(t), apply(t, [0.4, -0.9])), [0.4, -0.9])
  })
})

describe('anomaly verdict at his thresholds (1.0 s, 0.5 m)', () => {
  const v = (age: number, jump: number) => verdict(age, jump, TF_MAX_AGE, TF_MAX_JUMP)
  it('exactly at a threshold is still healthy (strict >)', () => {
    expect(v(1.0, 0.5)).toBe('healthy')
  })
  it('over a threshold', () => {
    expect(v(1.01, 0)).toBe('stale')
    expect(v(0, 0.51)).toBe('jump')
  })
  it('stale wins over jump', () => {
    expect(v(2, 2)).toBe('stale')
  })
})

describe('a jump cannot be driven', () => {
  it('0.26 m/s for 0.5 s is 0.13 m, under the 0.5 m jump threshold', () => {
    expect(maxDrivePerCheck(NAV2.maxVelX, TF_CHECK_PERIOD)).toBeCloseTo(0.13, 12)
    expect(maxDrivePerCheck(NAV2.maxVelX, TF_CHECK_PERIOD)).toBeLessThan(TF_MAX_JUMP)
  })
})

describe('base_footprint → base_link', () => {
  it('is the identity in the plane (only a 1 cm lift, xacro:12-16)', () => {
    const p = { x: 1.2, y: -0.4, yaw: 0.7 }
    const q = compose(p, FOOTPRINT_TO_BASE)
    close([q.x, q.y, q.yaw], [p.x, p.y, p.yaw])
  })
})
