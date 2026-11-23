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
  it('each arrow = that wheel ground speed over 0.5 s (300 px per m)', () => {
    const h = at(0.2, 0.1)
    expect(len(h, 'left')).toBeCloseTo(30, 0)
    expect(len(h, 'right')).toBeCloseTo(15, 0)
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

describe('MoveScene tEnd and solved (the chapter figure shows the whole path and the solved face)', () => {
  it('ahead path from the robot to the pose at tEnd; start dot; proud when solved', async () => {
    const { poseAt } = await import('./diffdrive')
    const h = renderToStaticMarkup(<MoveScene vl={0.15} vr={0.1} t={1} tEnd={4} solved label="" />)
    const d = /class="ms-ahead" d="([^"]+)"/.exec(h)![1], pts = [...d.matchAll(/[ML]([-\d.]+) ([-\d.]+)/g)].map((m) => [+m[1], +m[2]])
    const now = poseAt(0.15, 0.1, 1), end = poseAt(0.15, 0.1, 4)
    expect(pts[0][0]).toBeCloseTo(100 + now.x * 300, 0); expect(pts[0][1]).toBeCloseTo(200 - now.y * 300, 0)
    expect(pts.at(-1)![0]).toBeCloseTo(100 + end.x * 300, 0); expect(pts.at(-1)![1]).toBeCloseTo(200 - end.y * 300, 0)
    expect(h).toContain('class="ms-start"')
    expect(h).toContain('data-mood="proud"')
    expect(renderToStaticMarkup(<MoveScene vl={0.15} vr={0.1} t={4} tEnd={4} label="" />)).not.toContain('ms-ahead') // at the end nothing is ahead
  })
})

describe('MoveScene arrows stay in the frame over the chapter range', () => {
  it('left 0.15, right -0.22..0.22, slip off / on, every 0.5 s to 4 s: every arrow tip inside 460 x 340 (5 px room)', async () => {
    const mv = await import('../chapters/l0/move')
    const out: string[] = []
    // right every 0.02 m/s (both ends included): 414 renders, about 2.5 s; the 0.01 grid took 5.7 s under load (flaky at 5 s)
    for (let r = -mv.TOP_SPEED; r <= mv.TOP_SPEED + 1e-9; r += 0.02) for (const slip of [0, 1 - mv.SLIP]) for (let t = 0; t <= mv.SECONDS; t += 0.5) {
      const h = renderToStaticMarkup(<MoveScene vl={mv.LEFT} vr={r} t={t} slip={slip} arrows label="" />)
      for (const m of h.matchAll(/class="ms-v[^"]*"[^>]*><path d="M[-\d.]+ [-\d.]+L([-\d.]+) ([-\d.]+)"/g)) {
        const x = +m[1], y = +m[2]
        if (x < 5 || x > 455 || y < 5 || y > 335) { out.push(`r ${r.toFixed(2)} slip ${slip} t ${t}: ${x},${y}`); break }
      }
    }
    if (out.length) console.log('ARROW-OFF', out.length, out.slice(0, 6).join(' | '))
    expect(out).toEqual([])
   }, 20_000)
})
