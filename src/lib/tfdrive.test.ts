import { describe, expect, it } from 'vitest'
import { checkJump, corrections, footAt, mapFootAt, slamAt, type Drive } from './tfdrive'

const D: Drive = { start: { x: 0, y: 0, yaw: 0 }, speed: 0.26, turn: Math.PI / 2, duration: 8, drift: { x: 0.3, y: 0, yaw: 0 }, minTravel: 0.5, missUntil: 0 }

describe('tf drive scenario', () => {
  it('drives a quarter circle of length speed × duration', () => {
    const r = (0.26 * 8) / (Math.PI / 2)
    const end = footAt(D, 8)
    expect(end.x).toBeCloseTo(r, 9)
    expect(end.y).toBeCloseTo(r, 9)
    expect(end.yaw).toBeCloseTo(Math.PI / 2, 9)
    expect(footAt({ ...D, turn: 0 }, 2).x).toBeCloseTo(0.52, 9)
  })
  it('SLAM corrects every 0.5 m: 0.5 / 0.26 = 1.923 s, 4 times in 8 s', () => {
    expect(corrections(D)).toEqual([1.923, 3.846, 5.769, 7.692])
    expect(corrections({ ...D, missUntil: 6 })).toEqual([7.692])
  })
  it('map → odom holds between corrections and snaps at them', () => {
    expect(slamAt(D, 1.9).x).toBe(0)
    expect(slamAt(D, 1.93).x).toBeCloseTo(0.3 * (1.923 / 8), 6)
    expect(slamAt(D, 3.0).x).toBe(slamAt(D, 1.93).x)
  })
  it('healthy drive: every check moves ≤ 0.5 m; missed corrections: one snap is a JUMP', () => {
    for (let t = 0; t <= 8; t += 0.5) expect(checkJump(D, t, 0.5)).toBeLessThanOrEqual(0.5)
    const bad: Drive = { ...D, drift: { x: 1, y: 0, yaw: 0 }, missUntil: 6 }
    const worst = Math.max(...Array.from({ length: 17 }, (_, i) => checkJump(bad, i * 0.5, 0.5)))
    expect(worst).toBeGreaterThan(0.5)
    expect(mapFootAt(bad, 8).x - footAt(bad, 8).x).toBeCloseTo(slamAt(bad, 8).x, 9)
  })
})
