import { describe, expect, it } from 'vitest'
import { LIDAR, NAV2, WORLD } from '../content/world'
import { beamAngles, beamGap, castRay, movePerScan, sensorPose } from './scan'

const L = LIDAR
describe('scan geometry', () => {
  it('360 beams from -pi to +pi, about 1.003 deg apart', () => {
    const a = beamAngles(L.samples, L.minAngle, L.maxAngle)
    expect(a).toHaveLength(360)
    expect(a[0]).toBeCloseTo(L.minAngle, 9)
    expect(a[359]).toBeCloseTo(L.maxAngle, 9)
    expect(((a[1] - a[0]) * 180) / Math.PI).toBeCloseTo(1.003, 3)
  })
  it('beam gap at max range is 6.1 cm', () => {
    expect(beamGap(L.maxRange, L.samples, L.minAngle, L.maxAngle)).toBeCloseTo(0.0613, 4)
  })
  it('robot moves 5.2 cm per scan at 5 Hz, 2.6 cm at 10 Hz', () => {
    expect(movePerScan(NAV2.maxVelX, 5)).toBeCloseTo(0.052, 6)
    expect(movePerScan(NAV2.maxVelX, 10)).toBeCloseTo(0.026, 6)
  })
})

describe('castRay in the arena', () => {
  const origin = { x: 0, y: 0, yaw: 0 }
  it('east wall inner face is 4.9 m away: beyond 3.5 m, no return', () => {
    expect(castRay(origin, 0, WORLD, L.minRange, L.maxRange)).toBe(Infinity)
    expect(castRay(origin, 0, WORLD, L.minRange, 10)).toBeCloseTo(4.9, 9)
  })
  it('box1 (1 m cube at 2,2) seen at 45 deg: corner at 1.5,1.5', () => {
    expect(castRay(origin, Math.PI / 4, WORLD, L.minRange, L.maxRange)).toBeCloseTo(1.5 * Math.SQRT2, 9)
  })
  it('cylinder1 (r 0.5 at -2,-2) at -135 deg', () => {
    expect(castRay(origin, (-3 * Math.PI) / 4, WORLD, L.minRange, L.maxRange)).toBeCloseTo(2 * Math.SQRT2 - 0.5, 9)
  })
  it('robot yaw rotates the beam', () => {
    expect(castRay({ x: 0, y: 0, yaw: Math.PI / 2 }, -Math.PI / 4, WORLD, L.minRange, L.maxRange)).toBeCloseTo(1.5 * Math.SQRT2, 9)
  })
  it('a hit closer than min range is dropped', () => {
    expect(castRay({ x: 1.45, y: 2, yaw: 0 }, 0, WORLD, L.minRange, L.maxRange)).toBe(Infinity)
  })
})

describe('sensorPose', () => {
  it('base_scan sits 3.2 cm behind the centre, along the heading', () => {
    const s = sensorPose({ x: 1, y: 2, yaw: Math.PI / 2 })
    expect(s.x).toBeCloseTo(1, 12)
    expect(s.y).toBeCloseTo(2 - 0.032, 12)
    expect(s.yaw).toBeCloseTo(Math.PI / 2, 12)
  })
})
