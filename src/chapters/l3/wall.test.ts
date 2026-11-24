import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { KP_RANGE, P, avoided, challengeOk, closest, collision, run, settleS, spun, tooCloseTicks } from './wall'
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
  it('repo default kp 2.0 with look-ahead settles in 8.75 s, closest 0.45 m', () => {
    const ts = run(2.0)
    expect(settleS(ts)).toBeCloseTo(8.75, 2)
    expect(closest(ts)).toBeCloseTo(0.448, 2)
    expect(tooCloseTicks(ts)).toBe(0)
    expect(ok(2.0)).toBe(true)
  })
  it('break it: look-ahead off at kp 2.0 turns past 1 rad', () => {
    expect(spun(run(2.0, 0))).toBe(true)
    expect(ok(2.0, 0)).toBe(false)
  })
  it('with the front slow-down (controller.py:340-349) no slider setting reaches the too-close branch; look-ahead off at kp 0.6-0.7 trips the collision zones', () => {
    const hit: string[] = []
    for (const la of [0, P.lookahead]) for (let i = Math.round(KP_RANGE[0] * 10); i <= Math.round(KP_RANGE[1] * 10); i++) {
      const ts = run(i / 10, la)
      expect(tooCloseTicks(ts)).toBe(0)
      if (avoided(ts)) { hit.push(`${la}:${(i / 10).toFixed(1)}`); expect(challengeOk(ts)).toBe(false) }
    }
    expect(hit).toEqual(['0:0.6', '0:0.7'])
    expect(closest(run(0.5, 0))).toBeCloseTo(0.305, 2)
  })
  it('collision zones (controller.py:193-224) trip on a steep close approach, not when parallel at 0.5 m', () => {
    expect(collision(0.3, 0.5)).toBe(true) // beam -50 deg: 0.3 / sin(0.5 + 50 deg) = 0.31 m < 0.35 m
    expect(collision(0.5, 0)).toBe(false)
  })
  it('the start value kp 0.5 overshoots and does not settle; the passing band is 1.7-2.0', () => {
    expect(ok(0.5)).toBe(false)
    expect(closest(run(0.5))).toBeCloseTo(0.39, 2)
    const pass = Array.from({ length: 50 }, (_, i) => (i + 1) / 10).filter((k) => ok(k))
    expect(pass.map((k) => k.toFixed(1))).toEqual(['1.7', '1.8', '1.9', '2.0'])
  })
  it('EN and JA have the same keys (numbers: i18n.parity.test)', () => {
    expect(Object.keys(WALL_STRINGS.ja).sort()).toEqual(Object.keys(WALL_STRINGS.en).sort())
  })
})
