import { describe, expect, it } from 'vitest'
import { BROKEN, FIX, apply } from '../chapters/l3/tflab'
import { CHAIN, GROW, HOP, chainAt, chainEnd, reach } from './tfchain'

const FIXED = apply(BROKEN, 'odom')

describe('TF chain scene follows diagnose()', () => {
  it('reach: broken chain stops at odom, the fix reaches base_link, resend changes nothing', () => {
    expect(reach(BROKEN)).toBe(1)
    expect(reach(FIXED)).toBe(2)
    expect(reach(apply(BROKEN, 'resend'))).toBe(1)
    expect(reach([])).toBe(0)
    expect(reach([FIX])).toBe(0) // odom -> base_link alone does not join map
  })
  it('broken: the pulse walks one hop, bumps into the gap without crossing it, the robot gets the oops', () => {
    expect(chainAt(BROKEN, BROKEN, 0).s).toBe(0)
    expect(chainAt(BROKEN, BROKEN, HOP / 2).s).toBeCloseTo(0.5)
    let peak = 0
    for (let t = HOP; t < chainEnd(BROKEN, BROKEN); t += 0.005) {
      const f = chainAt(BROKEN, BROKEN, t)
      expect(f.outcome).toBe('stuck')
      expect(f.s).toBeGreaterThanOrEqual(1)
      peak = Math.max(peak, f.s)
    }
    expect(peak).toBeGreaterThan(1.1) // the bump is visible
    expect(peak).toBeLessThan(1.4) // and never reaches past the gap's middle
    expect(chainAt(BROKEN, BROKEN, 5).s).toBeCloseTo(1, 2) // settles at odom
    expect(chainAt(BROKEN, BROKEN, 0).links.map((l) => l.on)).toEqual([true, false])
  })
  it('fix: the new edge springs in with overshoot first, then the pulse walks both hops and arrives', () => {
    const scales = Array.from({ length: 70 }, (_, i) => chainAt(FIXED, BROKEN, i * 0.005).links[1].scale)
    expect(scales[0]).toBe(0)
    expect(Math.max(...scales)).toBeGreaterThan(1.02) // overshoot
    expect(chainAt(FIXED, BROKEN, 3).links[1].scale).toBeCloseTo(1, 2)
    expect(chainAt(FIXED, BROKEN, 0).links[0].scale).toBe(1) // the old edge does not re-grow
    expect(chainAt(FIXED, BROKEN, GROW).s).toBe(0) // waits for the edge
    expect(chainAt(FIXED, BROKEN, GROW + 1.5 * HOP).s).toBeCloseTo(1.5)
    const end = chainAt(FIXED, BROKEN, GROW + 2 * HOP + 0.01)
    expect(end).toMatchObject({ s: CHAIN.length - 1, outcome: 'arrived' })
    expect(chainEnd(FIXED, BROKEN)).toBeGreaterThan(GROW + 2 * HOP)
  })
  it('pulse never moves backwards while walking', () => {
    let last = -1
    for (let t = 0; t < GROW + 2 * HOP; t += 0.01) { const s = chainAt(FIXED, BROKEN, t).s; expect(s).toBeGreaterThanOrEqual(last); last = s }
  })
})

describe('TF chain robot rolls, never skids', () => {
  it('mid-walk the wheels have turned by distance / radius; on the bump the head trails the body', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { createElement } = await import('react')
    const { default: TfChain } = await import('./TfChain')
    const { wheelAngle } = await import('../anim/mascot')
    const h = renderToStaticMarkup(createElement(TfChain, { edges: BROKEN, before: BROKEN, t: HOP / 2, label: '' }))
    const dx = chainAt(BROKEN, BROKEN, HOP / 2).s * 170 // svg units from map (STEP = 170)
    const want = wheelAngle(dx / (52 / 64))
    const got = Number(h.match(/rotate\(([-\d.e]+) 14 53\)/)![1])
    expect(got).toBeCloseTo(want, 3)
    expect(Math.abs(got)).toBeGreaterThan(30)
    const bump = renderToStaticMarkup(createElement(TfChain, { edges: BROKEN, before: BROKEN, t: HOP + 0.06, label: '' }))
    expect(bump).not.toContain('m-headgroup" transform="translate(0 0) rotate(0 32 31)')
  })
})
