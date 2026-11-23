import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import MoveScene from './MoveScene'
import { poseAt } from './diffdrive'

const at = (vl: number, vr: number, slip = 0) => renderToStaticMarkup(<MoveScene vl={vl} vr={vr} t={1} slip={slip} arrows label="" />)
const len = (h: string, k: string) => { // drawn length of the solid arrow of wheel k, px
  const m = new RegExp(`data-wheel="${k}"[^>]*><path d="M([-\\d.]+) ([-\\d.]+)L([-\\d.]+) ([-\\d.]+)"`).exec(h)!
  return Math.hypot(+m[3] - +m[1], +m[4] - +m[2])
}

describe('MoveScene wheel arrows', () => {
  it('off by default', () => expect(renderToStaticMarkup(<MoveScene vl={0.2} vr={0.1} t={1} label="" />)).not.toContain('ms-v'))
  it('each arrow = that wheel ground speed over 1 s (300 px per m)', () => {
    const h = at(0.2, 0.1)
    expect(len(h, 'left')).toBeCloseTo(60, 0)
    expect(len(h, 'right')).toBeCloseTo(30, 0)
  })
  it('slip: solid left arrow = (1 - slip) vl, as poseAt moves the robot; dashed = vl spun', () => {
    const h = at(0.2, 0.2, 0.5)
    expect(h).toContain('data-wheel="left" data-ms="0.100"')
    expect(h).toContain('class="ms-v is-spin" data-ms="0.200"')
    // the robot follows the ground speeds: right faster on the floor -> heading turns counter-clockwise (left)
    expect(poseAt(0.2, 0.2, 1, 0.5).th).toBeGreaterThan(0)
  })
  it('spin on the spot: the two arrows point opposite ways', () => {
    const h = at(-0.1, 0.1), m = [...h.matchAll(/data-wheel="\w+"[^>]*><path d="M([-\d.]+) [-\d.]+L([-\d.]+) /g)].map((x) => +x[2] - +x[1])
    expect(Math.sign(m[0])).toBe(-Math.sign(m[1]))
  })
})

describe('MoveScene framing over the chapter slider range', () => {
  it('left 0.15, right -0.22..0.22, 4 s, slip off / on: every drawn trail point stays 30 px inside the 460 x 340 frame', async () => {
    const mv = await import('../chapters/l0/move')
    const out: string[] = []
    for (let r = -mv.TOP_SPEED; r <= mv.TOP_SPEED + 1e-9; r += 0.01) for (const slip of [0, 1 - mv.SLIP]) {
      const h = renderToStaticMarkup(<MoveScene vl={mv.LEFT} vr={r} t={mv.SECONDS} slip={slip} label="" />)
      const d = /class="ms-trail" d="([^"]+)"/.exec(h)![1], pts = [...d.matchAll(/[ML]([-\d.]+) ([-\d.]+)/g)].map((m) => [+m[1], +m[2]])
      const bad = pts.find(([x, y]) => x < 30 || x > 430 || y < 30 || y > 310)
      if (bad) out.push(`right ${r.toFixed(2)} slip ${slip}: ${bad.join(',')}`)
    }
    if (out.length) console.log('OFF-FRAME', out.join(' | '))
    expect(out).toEqual([])
  })
})
