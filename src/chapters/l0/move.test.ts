import { describe, expect, it } from 'vitest'
import { LEFT, SLIP, TOP_SPEED, VIEW, body, kind, path, turnsPerS } from './move'

describe('move model', () => {
  it('same speed = straight line, length = speed x time', () => {
    const p = path(LEFT, LEFT, 4)
    expect(kind(LEFT, LEFT)).toBe('straight')
    expect(p.at(-1)!.x).toBeCloseTo(0.6)
    expect(p.at(-1)!.y).toBeCloseTo(0)
  })
  it('right wheel faster = curve to the left (y grows), slower = to the right', () => {
    expect(kind(LEFT, 0.22)).toBe('curveLeft')
    expect(path(LEFT, 0.22).at(-1)!.y).toBeGreaterThan(0)
    expect(kind(LEFT, 0.05)).toBe('curveRight')
    expect(path(LEFT, 0.05).at(-1)!.y).toBeLessThan(0)
  })
  it('opposite speeds = spin on the spot: the centre never moves', () => {
    expect(kind(LEFT, -LEFT)).toBe('spin')
    for (const q of path(LEFT, -LEFT)) expect(Math.hypot(q.x, q.y)).toBeLessThan(1e-9)
    expect(body(LEFT, -LEFT).w).toBeCloseTo(-1.875) // 0.3 / 0.16 rad/s, clockwise
  })
  it('break it: the left wheel slips, so equal commands still curve left by themselves', () => {
    expect(kind(LEFT * SLIP, LEFT)).toBe('curveLeft')
    expect(path(LEFT, LEFT, 4, SLIP).at(-1)!.y).toBeGreaterThan(0.1)
  })
  it('a curve keeps a constant distance from its centre (exact arc)', () => {
    const { v, w } = body(LEFT, 0.22)
    const R = v / w
    for (const q of path(LEFT, 0.22)) expect(Math.hypot(q.x, q.y - R)).toBeCloseTo(Math.abs(R), 9)
  })
  it('top speed 0.22 m/s on a 3.3 cm wheel is about one turn per second', () => {
    expect(turnsPerS(TOP_SPEED)).toBeCloseTo(1.06, 2)
  })
  it('every slider value (with and without slip) keeps the robot inside the figure', () => {
    const margin = 30 // body radius + wheel
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
    for (let r = -TOP_SPEED; r <= TOP_SPEED + 1e-9; r += 0.01) for (const sl of [1, SLIP]) for (const q of path(LEFT, r, 4, sl)) {
      const x = VIEW.ox + q.x * VIEW.px, y = VIEW.oy - q.y * VIEW.px
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
    }
    expect(x0).toBeGreaterThan(margin); expect(x1).toBeLessThan(VIEW.w - margin)
    expect(y0).toBeGreaterThan(margin); expect(y1).toBeLessThan(VIEW.h - margin)
  })
})
