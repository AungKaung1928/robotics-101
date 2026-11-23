import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Mascot, { MascotFigure } from './Mascot'
import { REST, SPARK_AT } from './mascot'

describe('Mascot render', () => {
  it('labelled = an image with that name; empty label = decorative, hidden from screen readers', () => {
    expect(renderToStaticMarkup(<MascotFigure pose={REST} mood="idle" label="guide robot" />)).toMatch(/role="img" aria-label="guide robot"/)
    const deco = renderToStaticMarkup(<MascotFigure pose={REST} mood="idle" label="" />)
    expect(deco).toContain('aria-hidden="true"')
    expect(deco).not.toContain('role="img"')
  })
  it('inSvg: a <g> hit area holding a nested <svg>, valid inside a chapter figure', () => {
    const html = renderToStaticMarkup(<svg><g transform="translate(10 20)"><Mascot label="robot" inSvg /></g></svg>)
    expect(html).toContain('<g class="mascot-hit"><svg class="mascot"')
    expect(html).not.toContain('<span')
  })
  it('first frame: idle face with two eyes, labelled, inside the boop hit area, no sparks', () => {
    const html = renderToStaticMarkup(<Mascot label="guide robot" cheer={0} oops={0} />)
    expect(html).toMatch(/^<span class="mascot-hit">/)
    expect(html).toContain('aria-label="guide robot"')
    expect(html).toContain('data-mood="idle"')
    expect(html.match(/<circle[^>]*r="2.2"/g)).toHaveLength(2)
    expect(html).not.toContain('m-spark')
  })
  it('thinking: eyes up, three-dot bubble; idle has none', () => {
    const think = renderToStaticMarkup(<Mascot label="" thinking />)
    expect(think).toContain('data-mood="think"')
    expect(think.match(/<g class="m-think">/g)).toHaveLength(1)
    expect(think).toContain('translate(1.5px, -2px)')
    expect(renderToStaticMarkup(<Mascot label="" />)).not.toContain('m-think')
  })
  it('faces: happy = arcs, oops = wide eyes + mouth; six sparks mid-celebration', () => {
    expect(renderToStaticMarkup(<MascotFigure pose={REST} mood="happy" label="" />)).toContain('q3-4 6 0')
    expect(renderToStaticMarkup(<MascotFigure pose={REST} mood="oops" label="" />)).toContain('m-mouth')
    expect(renderToStaticMarkup(<MascotFigure pose={REST} mood="happy" label="" spark={SPARK_AT + 0.2} />).match(/m-spark/g)).toHaveLength(6)
  })
  it('curious: the face sits in a tilt group that the think mood rotates (CSS), inside the head group', () => {
    const html = renderToStaticMarkup(<MascotFigure pose={REST} mood="think" label="" />)
    expect(html).toContain('data-mood="think"')
    expect(html.indexOf('m-headgroup')).toBeLessThan(html.indexOf('m-tilt'))
    expect(html.indexOf('m-tilt')).toBeLessThan(html.indexOf('m-sway'))
  })
})


describe('sleep face', () => {
  it('closed eyes and two z, no open eyes', () => {
    const h = renderToStaticMarkup(<MascotFigure pose={REST} mood="sleep" label="" />)
    expect(h).toContain('data-mood="sleep"')
    expect(h).toContain('m-zz')
    expect(h).toContain('M24 24q3 3 6 0')
    expect(h).not.toContain('m-eyes')
  })
})

describe('entrance first paint', () => {
  it('with enter the first frame is already off to the left (no flash at rest); without, at rest', () => {
    expect(renderToStaticMarkup(<Mascot enter label="" />)).toContain('<g transform="translate(-40 0)')
    expect(renderToStaticMarkup(<Mascot label="" />)).toContain('<g transform="translate(0 0)')
  })
})

describe('glance toward the last tap', () => {
  it('maps a tap left / right of the robot to −1 … 1, 0 straight above, clamped', async () => {
    const { glanceAt } = await import('./Mascot')
    expect(glanceAt(132, 100, 64)).toBe(0)
    expect(glanceAt(132 + 120, 100, 64)).toBeCloseTo(0.5)
    expect(glanceAt(-5000, 100, 64)).toBe(-1)
    expect(glanceAt(5000, 100, 64)).toBe(1)
  })
})

describe('LiveNote', () => {
  it('first render is an empty polite status region, even with text (it must exist before it is filled)', async () => {
    const { default: LiveNote } = await import('./LiveNote')
    const h = renderToStaticMarkup(<LiveNote text="bumped into the wall" />)
    expect(h).toContain('role="status"')
    expect(h).toContain('aria-live="polite"')
    expect(h).not.toContain('bumped')
  })
})

describe('LevelDone', () => {
  it('done dots filled; they pop in one after another; the burst waits for the last dot', async () => {
    const { LevelDoneFrame, STAGGER } = await import('./LevelDone')
    const f = (t: number) => renderToStaticMarkup(<LevelDoneFrame done={5} total={7} t={t} label="" />)
    expect(f(-1).match(/ld-dot is-done/g)!.length).toBe(5)
    expect(f(-1).match(/class="ld-dot"/g)!.length).toBe(2)
    const scales = (h: string) => [...h.matchAll(/scale\(([\d.]+)\)/g)].map((m) => +m[1])
    const mid = scales(f(2.5 * STAGGER)) // dots 0-2 popping, 3-4 not yet
    expect(mid[0]).not.toBe(1)
    expect(mid[4]).toBe(1)
    expect(f(4 * STAGGER)).not.toContain('class="celebrate"')
    expect(f(5 * STAGGER + 0.1)).toContain('class="celebrate"')
  })
  it('a long level: the whole ripple stays within STAGGER_MAX, the burst comes right after the last dot', async () => {
    const { LevelDoneFrame, STAGGER, STAGGER_MAX, staggerStep } = await import('./LevelDone')
    expect(staggerStep(5)).toBe(STAGGER) // short rows keep 80 ms
    for (const n of [12, 22]) {
      expect(n * staggerStep(n)).toBeLessThanOrEqual(STAGGER_MAX + 1e-9)
      const g = (t: number) => renderToStaticMarkup(<LevelDoneFrame done={n} total={n} t={t} label="" />)
      expect(g(STAGGER_MAX + 0.05)).toContain('class="celebrate"') // was n * 80 ms: 0.96 s / 1.76 s
    }
  })
})
