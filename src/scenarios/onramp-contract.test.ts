import { describe, expect, it } from 'vitest'
import { TRACK, WHEEL_R, poseAt } from './diffdrive'
import { actAt, wheels } from './act'
import { MIN_R, MAX_R } from './sense'
import * as move from '../chapters/l0/move'
import * as act from '../chapters/l0/act'
import * as sense from '../chapters/l0/sense'

// My on-ramp scenes must say the same numbers as lane app2's on-ramp models (src/chapters/l0/*.ts); this fails on drift.
describe('on-ramp scenes agree with the chapter models', () => {
  it('wheel geometry and sensor range', () => {
    expect(TRACK).toBe(move.WHEEL_GAP_M)
    expect(WHEEL_R).toBe(move.WHEEL_RADIUS_M)
    expect(MIN_R).toBe(sense.MIN_M)
    expect(MAX_R).toBe(sense.MAX_M)
  })
  it('wheel split and roll-on match act.ts when ActScene gets decel = BRAKE', () => {
    for (const [v, w] of [[0.2, 0], [0.1, 1], [-0.15, -0.8]]) {
      const a = wheels(v, w), b = act.wheels(v, w)
      expect(a.vl).toBeCloseTo(b.left)
      expect(a.vr).toBeCloseTo(b.right)
    }
    for (const v of [0.1, 0.22]) expect(actAt(v, 0, 1, act.BRAKE, 10).rollOn).toBeCloseTo(act.rollOnM(v), 9)
  })
  it('slip meaning: the chapter SLIP is the share delivered, MoveScene slip is the share lost -> pass 1 - SLIP', () => {
    const p = poseAt(move.LEFT, move.LEFT, 2, 1 - move.SLIP), straight = poseAt(move.LEFT, move.LEFT, 2)
    expect(p.th).toBeGreaterThan(0) // the slipping left wheel turns the robot left
    expect(p.x).toBeLessThan(straight.x)
  })
})

describe('SimWhatScene with the chapter box draws the chapter view', () => {
  it('every scan point equals simwhat.view() at the same angle (180 of its 360 beams); sensor off empties both', async () => {
    const { layout } = await import('./SimWhatScene')
    const { sweep } = await import('./sense')
    const sw = await import('../chapters/l0/simwhat')
    for (const front of [sw.FRONT_MIN, sw.FRONT_START, sw.FRONT_MAX]) {
      const g = layout(1, { ...sw.ROOM, front, maxFront: sw.FRONT_MAX }), mine = sweep(g.O, g.walls, 1, 1), theirs = sw.view(front, true)
      expect(theirs.length).toBe(360)
      expect(mine.length).toBe(180)
      // sweep(t = 1) is the last full turn: point k is at angle 2(k + 1)°, i.e. their beam 2(k + 1) mod 360
      mine.forEach((p, k) => { const q = theirs[(2 * (k + 1)) % 360]; expect(p.x).toBeCloseTo(q.x, 9); expect(p.y).toBeCloseTo(q.y, 9) })
      expect(sweep(g.O, g.walls, 1, 1, Math.PI / 90, true)).toEqual([])
      expect(sw.view(front, false)).toEqual([])
    }
  })
})

describe('SenseScene with the chapter box shows the chapter reading', () => {
  it('reading = sense.front(turn(front)) for open, too-close and covered cases', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { createElement } = await import('react')
    const { default: SenseScene } = await import('./SenseScene')
    const sn = await import('../chapters/l0/sense')
    for (const [front, covered] of [[1.5, false], [0.6, false], [0.1, false], [1.5, true]] as const) {
      const want = sn.front(sn.turn(front, covered))
      const h = renderToStaticMarkup(createElement(SenseScene, { box: { ...sn.ROOM, front, maxFront: 3 }, mode: 'beam', covered, label: '' }))
      expect(h).toContain(`data-reading="${want === null ? 'none' : want.toFixed(2)}"`)
    }
  })
})

describe('ThinkScene with the chapter model tells the chapter story', () => {
  it('fired / bumped follow think.run() for the opening rule, a mid rule and one smaller than a driving step', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { createElement } = await import('react')
    const { default: ThinkScene } = await import('./ThinkScene')
    const th = await import('../chapters/l0/think')
    const model = { run: (a: number) => th.run(a), speed: th.SPEED, startM: th.START_M }
    for (const a of [th.RULE_M, 0.25, 0.01]) {
      const r = th.run(a), h = renderToStaticMarkup(createElement(ThinkScene, { stopAt: a, t: 60, model, label: '' }))
      expect(h).toContain(`data-state="${r.crashed ? 'bumped' : 'fired'}"`)
    }
    expect(th.run(0.01).crashed).toBe(true) // a rule smaller than one step of driving misses the wall
  })
})
