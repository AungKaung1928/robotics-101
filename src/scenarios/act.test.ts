import { describe, expect, it } from 'vitest'
import { TRACK } from './diffdrive'
import { ACT_VIEW, actAt, actFrame, brakeTime, progress, wheels } from './act'

describe('act model', () => {
  it('two numbers become two wheel speeds', () => {
    expect(wheels(0.2, 0)).toEqual({ vl: 0.2, vr: 0.2 })
    const s = wheels(0, 1)
    expect(s.vr - s.vl).toBeCloseTo(TRACK)
  })
  it('straight roll-on after stop = v² / (2a)', () => {
    const v = 0.2, a = 0.5, end = actAt(v, 0, 1, a, 10)
    expect(end.rollOn).toBeCloseTo((v * v) / (2 * a))
    expect(end.pose.x - end.ghost.x).toBeCloseTo((v * v) / (2 * a))
    expect(end.speed).toBe(0)
  })
  it('before stop the ghost and the robot coincide, speed share 1', () => {
    const f = actAt(0.2, 0.5, 2, 0.5, 1)
    expect(f.pose).toEqual(f.ghost)
    expect(f.rollOn).toBe(0)
    expect(f.speed).toBe(1)
  })
  it('turning: the roll-on stays on the same circle', () => {
    const v = 0.2, w = 1, R = v / w, f = actAt(v, w, 1, 0.5, 5)
    expect(Math.hypot(f.pose.x, f.pose.y - R)).toBeCloseTo(R, 9)
  })
  it('progress is continuous and stops growing after the brake time', () => {
    const tb = brakeTime(0.2, 0, 0.5)
    expect(progress(1, 1, tb)).toBe(1)
    expect(progress(1 + tb, 1, tb)).toBeCloseTo(progress(1 + 3 * tb, 1, tb))
  })
})

describe('brake stretch', () => {
  it('1 while driving, stretched while braking, overshoots into a squash after the stop, settles to 1', async () => {
    const { brakeStretch, brakeTime } = await import('./act')
    const v = 0.2, a = 0.5, ts = 1, end = ts + brakeTime(v, 0, a)
    expect(brakeStretch(v, 0, ts, a, 0.5)).toBe(1)
    expect(brakeStretch(v, 0, ts, a, ts + 0.2)).toBeGreaterThan(1.05)
    const after = Array.from({ length: 60 }, (_, i) => brakeStretch(v, 0, ts, a, end + i * 0.01))
    expect(Math.min(...after)).toBeLessThan(0.99) // the squash
    expect(brakeStretch(v, 0, ts, a, end + 3)).toBeCloseTo(1, 3)
  })
})

describe('actFrame: the whole trajectory fits, framing fixed for every t', () => {
  const _b = 2.5 // act chapter BRAKE (nav2 decel limit)
  it.each([[0.2, 0.6], [0.22, 1.5], [0.1, -1.2], [-0.15, 0.8], [0.22, 0], [0, 1]])('v %f, w %f: every pose + robot room inside the drawing area', (v, w) => {
    const tStop = 3, { s, x0, y0 } = actFrame(v, w, tStop, _b), V = ACT_VIEW
    for (let t = 0; t <= tStop + 1; t += 0.05) {
      const p = actAt(v, w, tStop, _b, t).pose, x = x0 + p.x * s, y = y0 - p.y * s
      expect(x).toBeGreaterThanOrEqual(V.side - 1e-6)
      expect(x).toBeLessThanOrEqual(V.w - V.side + 1e-6)
      expect(y).toBeGreaterThanOrEqual(V.top - 1e-6)
      expect(y).toBeLessThanOrEqual(V.bottom - V.under + 1e-6)
    }
    expect(s).toBeLessThanOrEqual(V.sMax)
  })
  it('a short straight drive keeps the old scale (300 px per m)', () => expect(actFrame(0.1, 0, 1, 2.5).s).toBe(300))
})

describe('ActScene roll-on label in the chapter unit', () => {
  it('cm with one decimal (chapter: (rollOnM(v) * 100).toFixed(1)); none while it rounds to 0.0', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { createElement } = await import('react')
    const { default: ActScene } = await import('./ActScene')
    const at = (v: number) => renderToStaticMarkup(createElement(ActScene, { v, w: 0, tStop: 3, decel: 2.5, t: 4, label: '' }))
    expect(at(0.15)).toContain(`+${((0.15 * 0.15) / (2 * 2.5) * 100).toFixed(1)} cm</text>`) // the chapter's rollOnM(0.15) rounds to 0.4
    expect(at(0.22)).toContain(`+${((0.22 * 0.22) / (2 * 2.5) * 100).toFixed(1)} cm</text>`) // 0.968 -> 1.0
    expect(at(0.02)).not.toContain('as-num') // 0.08 mm
  })
})
