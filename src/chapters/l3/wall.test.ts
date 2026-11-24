import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { P, challengeOk, closest, run, settleS, spun, tooCloseTicks } from './wall'
import { WALL_STRINGS } from './wall.strings'

const ok = (kp: number, la?: number) => challengeOk(run(kp, la))

// A checkout of turtlebot3-wall-follower next to this repo (or WALL_REPO=<path>); skipped without one.
const YAML = `${process.env.WALL_REPO ?? '../turtlebot3-wall-follower'}/config/wall_following_params.yaml`

describe('3.2 wall follower model', () => {
  it.skipIf(!existsSync(YAML))('uses the repo yaml values', () => {
    const y = readFileSync(YAML, 'utf8')
    const val = (k: string) => Number(new RegExp(`${k}:\\s*([0-9.]+)`).exec(y)![1])
    expect([val('desired_distance'), val('forward_speed'), val('max_angular_speed'), val('kp'), val('kd'), val('lookahead_distance'), val('wall_min_distance'), val('wall_lost_distance')])
      .toEqual([P.desired, P.forward, P.maxW, P.kp, P.kd, P.lookahead, P.wallMin, P.wallLost])
  })
  it('repo default kp 2.0 with look-ahead settles in 8.85 s, closest 0.41 m', () => {
    const ts = run(2.0)
    expect(settleS(ts)).toBeCloseTo(8.85, 2)
    expect(closest(ts)).toBeCloseTo(0.415, 2)
    expect(tooCloseTicks(ts)).toBe(0)
    expect(ok(2.0)).toBe(true)
  })
  it('break it: look-ahead off at kp 2.0 turns past 1 rad', () => {
    expect(spun(run(2.0, 0))).toBe(true)
    expect(ok(2.0, 0)).toBe(false)
  })
  it('look-ahead off at low kp reaches the too-close branch (controller.py:320-323)', () => {
    const ts = run(0.5, 0)
    expect(tooCloseTicks(ts)).toBe(30)
    expect(closest(ts)).toBeLessThan(P.wallMin)
  })
  it('the start value kp 0.5 overshoots and does not settle; the passing band is 1.6-2.0', () => {
    expect(ok(0.5)).toBe(false)
    expect(closest(run(0.5))).toBeLessThan(0.4)
    const pass = Array.from({ length: 50 }, (_, i) => (i + 1) / 10).filter((k) => ok(k))
    expect(pass.map((k) => k.toFixed(1))).toEqual(['1.6', '1.7', '1.8', '1.9', '2.0'])
  })
  it('EN and JA have the same keys (numbers: i18n.parity.test)', () => {
    expect(Object.keys(WALL_STRINGS.ja).sort()).toEqual(Object.keys(WALL_STRINGS.en).sort())
  })
})
