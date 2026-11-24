import { describe, expect, it } from 'vitest'
import { FIG, PARTS, decider, isRobot, rcCar } from './meet'

describe('meet model', () => {
  it('who decides when the car turns: the person, until a rule reads a sensor', () => {
    const all = [[false, false], [true, false], [false, true], [true, true]] as const
    expect(all.map(([sensor, rule]) => decider({ sensor, rule }))).toEqual(['person', 'person', 'person', 'rule'])
    expect(all.map(([sensor, rule]) => isRobot(rcCar({ sensor, rule })))).toEqual([false, false, false, true])
    expect(rcCar({ sensor: true, rule: false }).senses).toBe(true) // senses, still not a robot
  })
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
