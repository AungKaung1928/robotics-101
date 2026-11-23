import { describe, expect, it } from 'vitest'
import { FIG, PARTS, isRobot, rcCar } from './meet'

describe('meet model', () => {
  it('a remote-control car is not a robot: a person decides', () => expect(isRobot(rcCar(false))).toBe(false))
  it('add a sensor and a rule: now it is', () => expect(isRobot(rcCar(true))).toBe(true))
  it('moving alone, or sensing without moving, is not enough', () => {
    expect(isRobot({ moves: true, senses: true, decidesItself: false })).toBe(false)
    expect(isRobot({ moves: false, senses: true, decidesItself: true })).toBe(false)
  })
  it('every part sits inside the figure and points to a Level 0 chapter', () => {
    for (const p of PARTS) {
      for (const [x, y, w, h] of p.rects) { expect(x).toBeGreaterThanOrEqual(0); expect(y).toBeGreaterThanOrEqual(0); expect(x + w).toBeLessThanOrEqual(FIG.w); expect(y + h).toBeLessThanOrEqual(FIG.h) }
      expect(['move', 'sense', 'think', 'act']).toContain(p.next)
    }
  })
  it('parts do not overlap (each tap hits one part)', () => {
    const all = PARTS.flatMap((p) => p.rects.map((r) => ({ id: p.id, r })))
    for (const a of all) for (const b of all) if (a !== b) {
      const [ax, ay, aw, ah] = a.r, [bx, by, bw, bh] = b.r
      expect(ax + aw <= bx || bx + bw <= ax || ay + ah <= by || by + bh <= ay).toBe(true)
    }
  })
})
