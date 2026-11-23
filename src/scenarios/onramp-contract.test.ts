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
    for (const v of [0.1, 0.22]) for (const w of [0, 0.6, -1.5]) expect(actAt(v, w, 1, act.BRAKE, 10).rollOn, `v ${v} w ${w}`).toBeCloseTo(act.rollOnM(v), 9)
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
  it('no reading (covered, or past the sensor range) shows the chapter word for nothing there', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { createElement } = await import('react')
    const { default: SenseScene } = await import('./SenseScene')
    const sn = await import('../chapters/l0/sense')
    const { SENSE_STRINGS } = await import('../chapters/l0/sense.strings')
    const word = SENSE_STRINGS.en.nothing
    for (const [front, covered] of [[4, false], [1.5, true]] as const) {
      expect(sn.front(sn.turn(front, covered))).toBeNull()
      const h = renderToStaticMarkup(createElement(SenseScene, { box: { ...sn.ROOM, front, maxFront: 5 }, mode: 'beam', covered, noneWord: word, label: '' }))
      expect(h).toContain('data-reading="none"')
      expect(h).toContain(`class="ss-num is-none"`)
      expect(h).toContain(`>${word}</text>`)
    }
  })
  it('wall past the range: the dashed beam ends at 3.5 m with a tick, short of the wall; covered or too close: no tick', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { createElement } = await import('react')
    const { default: SenseScene } = await import('./SenseScene')
    const sn = await import('../chapters/l0/sense')
    const at = (front: number, covered = false) => renderToStaticMarkup(createElement(SenseScene, { box: { ...sn.ROOM, front, maxFront: 5 }, mode: 'beam', covered, label: '' }))
    const far = at(4)
    expect(far).toContain('data-range="3.5"')
    const beamX = +/class="ss-beam is-none" x1="[\d.]+" y1="[\d.]+" x2="([\d.]+)"/.exec(far)![1], tickX = +/class="ss-range" x1="([\d.]+)"/.exec(far)![1]
    expect(beamX).toBeCloseTo(tickX, 3)
    const wallXs = [...far.matchAll(/class="ss-wall[^"]*" x1="([\d.]+)" y1="[\d.]+" x2="([\d.]+)"/g)].filter((m) => m[1] === m[2]).map((m) => +m[1])
    expect(Math.max(...wallXs)).toBeGreaterThan(beamX + 5) // the front wall is visibly further than the beam's end
    expect(at(1.5, true)).not.toContain('ss-range')
    expect(at(0.1)).not.toContain('ss-range')
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
  it('the drawn d is the chapter distance: START_M at the start, run().final at the end, lit only when d < rule', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { createElement } = await import('react')
    const { default: ThinkScene } = await import('./ThinkScene')
    const th = await import('../chapters/l0/think')
    const model = { run: (a: number) => th.run(a), speed: th.SPEED, startM: th.START_M }
    const at = (a: number, t: number) => renderToStaticMarkup(createElement(ThinkScene, { stopAt: a, t, model, label: '' }))
    expect(at(th.RULE_M, 0)).toContain(`class="tk-d" data-d="${th.START_M.toFixed(2)}"`)
    for (const a of [th.RULE_M, 0.25, 0.01]) {
      const r = th.run(a)
      expect(at(a, 60)).toContain(`data-d="${Math.max(0, r.final).toFixed(2)}"`)
      expect(at(a, 60).includes('tk-d is-on')).toBe(r.final < a)
    }
  })
})

describe('ThinkScene built-in model: d is the sensor reading', () => {
  it('a rule under the 0.12 m floor: at the end the sensor sees nothing, d is drawn as ?', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { createElement } = await import('react')
    const { default: ThinkScene } = await import('./ThinkScene')
    const h = renderToStaticMarkup(createElement(ThinkScene, { stopAt: 0.1, t: 60, label: '' }))
    expect(h).toContain('data-state="bumped"')
    expect(h).toContain('class="tk-d is-blind" data-d="none"')
    expect(h).toContain('d = ?')
    const ok = renderToStaticMarkup(createElement(ThinkScene, { stopAt: 0.5, t: 60, label: '' }))
    expect(ok).toMatch(/class="tk-d is-on" data-d="0\.[0-4]\d"/)
  })
})

describe('SimPickScene takes the chapter ladder', () => {
  it('one shelf per LADDER row, 3D rows a full side, 2.5D rows a half side, none rows dashed, the picked row lit', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { createElement } = await import('react')
    const { default: SimPickScene } = await import('./SimPickScene')
    const sp = await import('../chapters/l0/simpick')
    const rungs = sp.LADDER.map((r) => ({ name: r.id, kind: r.dim }))
    const at = sp.LADDER.findIndex((r) => r.id === sp.pick({ gpu: false, sensor: true, physics: false }))
    const h = renderToStaticMarkup(createElement(SimPickScene, { rungs, pick: at, t: 9, label: '' }))
    expect(h.match(/class="sp-step/g)!.length).toBe(sp.LADDER.length)
    expect(h.match(/l6 -5v/g)?.length ?? 0).toBe(sp.LADDER.filter((r) => r.dim === '3D').length)
    expect(h.match(/l3 -2.5v/g)?.length ?? 0).toBe(sp.LADDER.filter((r) => r.dim === '2.5D').length)
    expect(h.match(/is-25d/g)?.length ?? 0).toBe(sp.LADDER.filter((r) => r.dim === '2.5D').length)
    expect(h.match(/is-none/g)?.length ?? 0).toBe(sp.LADDER.filter((r) => r.dim === 'none').length)
    expect(h).toContain(`data-pick="${at}"`)
  })
})

describe('SimWhatScene sensor off says why the view is blank', () => {
  it('emptyWord in the view only when the sensor is off; no dots then', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { createElement } = await import('react')
    const { default: SimWhatScene } = await import('./SimWhatScene')
    const { SIMWHAT_STRINGS } = await import('../chapters/l0/simwhat.strings')
    const word = SIMWHAT_STRINGS.en.empty
    const at = (sensorOn: boolean) => renderToStaticMarkup(createElement(SimWhatScene, { sensorOn, worldWord: 'w', viewWord: 'v', emptyWord: word, label: '' }))
    expect(at(false)).toContain(`class="sw-none" x=`)
    expect(at(false)).toContain(`>${word}</text>`)
    expect(at(true)).not.toContain('sw-none')
  })
})
