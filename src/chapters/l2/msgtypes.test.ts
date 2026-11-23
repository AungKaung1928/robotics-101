import { describe, expect, it } from 'vitest'
import { INC, LASERSCAN, SAMPLES, beamAngle, challengeOk, ignored, indexAt, pose, scenario, type Twist } from './msgtypes'

const tw = (lx: number, az: number, ax = 0): Twist => ({ linear: [lx, 0, 0], angular: [ax, 0, az] })

describe('2.3 LaserScan', () => {
  it('fields in .msg order with their line numbers (common_interfaces humble)', () => {
    expect(LASERSCAN.map((f) => f.name)).toEqual(['header', 'angle_min', 'angle_max', 'angle_increment', 'time_increment', 'scan_time', 'range_min', 'range_max', 'ranges', 'intensities'])
    expect(LASERSCAN.map((f) => f.line)).toEqual([7, 14, 15, 16, 18, 21, 23, 24, 26, 28])
  })

  it('index ↔ angle: ranges[0] looks backwards, the middle looks ahead, ~1° per index', () => {
    expect(beamAngle(0)).toBeCloseTo(-3.141592, 6)
    expect(beamAngle(SAMPLES - 1)).toBeCloseTo(3.141592, 5)
    expect((INC * 180) / Math.PI).toBeCloseTo(1.0028, 3)
    expect(Math.abs(beamAngle(indexAt(0)))).toBeLessThan(INC / 2 + 1e-9)
    expect(indexAt(Math.PI / 2)).toBe(269) // left
    expect(indexAt(-Math.PI / 2)).toBe(90) // right
  })
})

describe('2.3 Twist', () => {
  it('straight: 0.26 m/s for 2 s = 0.52 m ahead', () => {
    const [x, y, th] = pose(tw(0.26, 0), 2)
    expect([x, y, th]).toEqual([0.52, 0, 0])
  })

  it('positive angular.z turns left (REP 103); radius = v / w', () => {
    const [x, y, th] = pose(tw(0.2, 0.5), Math.PI / 0.5) // half circle
    expect(x).toBeCloseTo(0, 9)
    expect(y).toBeCloseTo(0.8, 9) // diameter 2 * 0.2 / 0.5
    expect(th).toBeCloseTo(Math.PI, 9)
  })

  it('break it: angular.x is ignored by a diff drive robot', () => {
    expect(pose(tw(0, 0, 0.8), 2)).toEqual([0, 0, 0])
    expect(ignored(tw(0, 0, 0.8))).toEqual(['angular.x'])
  })

  it('challenge: turn left in place', () => {
    expect(challengeOk(tw(0, 0.5))).toBe(true)
    expect(challengeOk(tw(0, -0.5))).toBe(false)
    expect(challengeOk(tw(0.1, 0.5))).toBe(false)
    expect(challengeOk(tw(0, 0, 0.5))).toBe(false)
  })

  it('scenario: fields first, then the beam fan; pure', () => {
    const sc = scenario()
    expect(sc.frame(0)).toEqual({ shown: 1, beams: 0 })
    expect(sc.frame(sc.durationMs)).toEqual({ shown: LASERSCAN.length, beams: SAMPLES })
    expect(sc.frame(3000)).toEqual(sc.frame(3000))
  })
})

describe('2.3 strings', () => {
  it('EN and JA have the same keys and list lengths', async () => {
    const { MSGTYPES_STRINGS: S } = await import('./msgtypes.strings')
    expect(Object.keys(S.ja).sort()).toEqual(Object.keys(S.en).sort())
    expect(S.ja.lines).toHaveLength(S.en.lines.length)
    expect(S.ja.glossary).toHaveLength(S.en.glossary.length)
  })
})
