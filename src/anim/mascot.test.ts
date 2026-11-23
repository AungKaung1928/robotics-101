import { describe, expect, it } from 'vitest'
import { BOOP_S, HAPPY_S, WHEEL_R, eyeShift, wheelAngle, OOPS_S, REST, SPARK_AT, boopPose, happyPose, oopsPose, sparks } from './mascot'

const ts = (end: number) => Array.from({ length: 601 }, (_, i) => (i / 600) * end)

describe('happyPose', () => {
  it('starts and ends at rest, lasts under 1.2 s', () => {
    expect(happyPose(0)).toEqual(REST)
    const e = happyPose(HAPPY_S)
    expect(e.y).toBe(0)
    expect(Math.abs(e.sy - 1)).toBeLessThan(0.005)
    expect(HAPPY_S).toBeLessThan(1.2)
  })
  it('keeps the area (sx · sy = 1) and lifts 10 px at the top', () => {
    for (const t of ts(HAPPY_S)) {
      const p = happyPose(t)
      expect(p.sx * p.sy).toBeCloseTo(1, 12)
      expect(p.y).toBeGreaterThanOrEqual(0)
    }
    expect(Math.max(...ts(HAPPY_S).map((t) => happyPose(t).y))).toBeCloseTo(10, 1)
  })
  it('squashes before take-off, stretches in the air, squashes on landing and overshoots back up', () => {
    expect(happyPose(0.07).sy).toBeLessThan(0.9)
    expect(happyPose(0.1).sy).toBeGreaterThan(1.05)
    const after = ts(HAPPY_S).filter((t) => t > 0.38).map((t) => happyPose(t).sy)
    expect(Math.min(...after)).toBeLessThan(0.93)
    expect(Math.max(...after)).toBeGreaterThan(1.01)
  })
})

describe('oopsPose', () => {
  it('rocks both ways, dies out, under 1.5 s', () => {
    const r = ts(OOPS_S).map((t) => oopsPose(t).rot)
    expect(Math.max(...r)).toBeGreaterThan(5)
    expect(Math.min(...r)).toBeLessThan(-2)
    expect(Math.abs(oopsPose(OOPS_S).rot)).toBeLessThan(0.3)
    expect(OOPS_S).toBeLessThan(1.5)
  })
})

describe('sparks', () => {
  it('pop at the top of the jump (head highest), over before the bounce settles', () => {
    expect(happyPose(SPARK_AT).y).toBeCloseTo(10, 9)
    expect(sparks(HAPPY_S)).toEqual([]) // the reaction runs until the last spark is gone
  })
  it('none before or after, six in between, fanning out symmetrically', () => {
    expect(sparks(SPARK_AT)).toEqual([])
    expect(sparks(SPARK_AT + 0.7)).toEqual([])
    const s = sparks(SPARK_AT + 0.1)
    expect(s).toHaveLength(6)
    const xs = s.map((p) => p.x - 32)
    expect(xs[0]).toBeCloseTo(-xs[5], 9)
  })
  it('rise first, then fall under gravity, fading', () => {
    const mid = (t: number) => sparks(SPARK_AT + t)[2]
    expect(mid(0.1).y).toBeLessThan(2) // above the head top at the apex (12 − 10)
    expect(mid(0.65).y).toBeGreaterThan(mid(0.3).y)
    expect(mid(0.6).o).toBeLessThan(mid(0.1).o)
  })
})

describe('boopPose', () => {
  it('a small, quick nudge: under a third of the oops swing, rest again within 0.6 s', () => {
    const ts = Array.from({ length: 301 }, (_, i) => (i / 300) * BOOP_S)
    const maxBoop = Math.max(...ts.map((t) => Math.abs(boopPose(t).rot)))
    const maxOops = Math.max(...Array.from({ length: 301 }, (_, i) => Math.abs(oopsPose((i / 300) * OOPS_S).rot)))
    expect(maxBoop).toBeGreaterThan(1)
    expect(maxBoop).toBeLessThan(maxOops / 3)
    expect(BOOP_S).toBeLessThan(0.6)
    expect(Math.abs(boopPose(BOOP_S).rot)).toBeLessThan(0.2)
    expect(boopPose(BOOP_S).y).toBe(0)
  })
})

describe('eyeShift', () => {
  it('maps −1 … 1 to −2.5 … 2.5 px, clamps, ignores NaN', () => {
    expect(eyeShift(0)).toBe(0)
    expect(eyeShift(1)).toBe(2.5)
    expect(eyeShift(-0.4)).toBeCloseTo(-1, 12)
    expect(eyeShift(7)).toBe(2.5)
    expect(eyeShift(NaN)).toBe(0)
  })
})

describe('wheelAngle', () => {
  it('one wheel circumference rolled = one full turn; backwards turns back', () => {
    expect(wheelAngle(2 * Math.PI * WHEEL_R)).toBeCloseTo(360, 9)
    expect(wheelAngle(-Math.PI * WHEEL_R)).toBeCloseTo(-180, 9)
    expect(wheelAngle(0)).toBe(0)
  })
})
