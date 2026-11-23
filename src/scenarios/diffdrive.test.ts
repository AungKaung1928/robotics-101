import { describe, expect, it } from 'vitest'
import { TRACK, poseAt, rolled, trail, wheelPoint } from './diffdrive'

describe('differential drive model', () => {
  it('equal speeds drive straight', () => {
    expect(poseAt(0.2, 0.2, 2)).toEqual({ x: expect.closeTo(0.4), y: expect.closeTo(0), th: 0 })
  })
  it('opposite speeds spin on the spot: ω = 2v / L', () => {
    const p = poseAt(-0.1, 0.1, 1)
    expect(Math.hypot(p.x, p.y)).toBeLessThan(1e-9)
    expect(p.th).toBeCloseTo((2 * 0.1) / TRACK)
  })
  it('right wheel faster curves left on a circle of radius (L/2)(vr+vl)/(vr−vl)', () => {
    const vl = 0.1, vr = 0.2, R = (TRACK / 2) * (vr + vl) / (vr - vl)
    for (const t of [0.5, 1, 2, 3]) { const p = poseAt(vl, vr, t); expect(Math.hypot(p.x, p.y - R)).toBeCloseTo(R, 9); expect(p.y).toBeGreaterThan(0) }
  })
  it('a slipping left wheel makes a straight command curve left, though both wheels spin the same', () => {
    const p = poseAt(0.2, 0.2, 2, 0.3)
    expect(p.y).toBeGreaterThan(0.05)
    expect(p.th).toBeGreaterThan(0)
    expect(rolled(0.2, 0.2, 2)).toEqual({ l: expect.closeTo(0.4), r: expect.closeTo(0.4) })
  })
  it('trail starts at the origin and ends at the pose', () => {
    const tr = trail(0.1, 0.2, 1.03)
    expect(tr[0]).toEqual({ x: 0, y: 0, th: 0 })
    expect(tr.at(-1)).toEqual(poseAt(0.1, 0.2, 1.03))
  })
  it('wheel points sit half a track either side', () => {
    const p = { x: 0, y: 0, th: Math.PI / 2 }
    expect(wheelPoint(p, 1).x).toBeCloseTo(-TRACK / 2)
    expect(wheelPoint(p, -1).x).toBeCloseTo(TRACK / 2)
  })
})

describe('turn centre', () => {
  it('every trail point sits |R| from the centre; straight = none; opposite wheels = R 0; slip moves it', async () => {
    const { turnCentre } = await import('./diffdrive')
    const vl = 0.1, vr = 0.2, c = turnCentre(vl, vr, { x: 0, y: 0, th: 0 })!
    expect(c.r).toBeCloseTo((TRACK / 2) * 0.3 / 0.1)
    for (const p of trail(vl, vr, 3)) expect(Math.hypot(p.x - c.x, p.y - c.y)).toBeCloseTo(Math.abs(c.r), 9)
    expect(turnCentre(0.2, 0.2, { x: 0, y: 0, th: 0 })).toBeNull()
    expect(turnCentre(-0.1, 0.1, { x: 0, y: 0, th: 0 })!.r).toBeCloseTo(0)
    const s = turnCentre(0.2, 0.2, { x: 0, y: 0, th: 0 }, 0.3)!
    for (const p of trail(0.2, 0.2, 3, 0.3)) expect(Math.hypot(p.x - s.x, p.y - s.y)).toBeCloseTo(Math.abs(s.r), 9)
  })
})
