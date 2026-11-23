import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import MoveScene from './MoveScene'
import RobotTop from './RobotTop'
import { minPitch } from '../anim/TreadWheel'

const count = (h: string, re: RegExp) => h.match(re)?.length ?? 0

describe('MoveScene and RobotTop', () => {
  it('straight: robot ends right of start, no skid, calm face', () => {
    const h = renderToStaticMarkup(<MoveScene vl={0.2} vr={0.2} t={1} label="" />)
    expect(h).toContain('translate(110 200)') // 50 + 0.2 m · 300 px/m
    expect(count(h, /ms-skid/g)).toBe(0)
    expect(h).toContain('data-mood="idle"')
  })
  it('slip: skid marks and a worried face', () => {
    const h = renderToStaticMarkup(<MoveScene vl={0.2} vr={0.2} t={2} slip={0.3} label="" />)
    expect(count(h, /ms-skid/g)).toBeGreaterThan(3)
    expect(h).toContain('data-mood="worried"')
  })
  it('every mood draws, dizzy has 3 stars, proud a sparkle', () => {
    for (const m of ['idle', 'curious', 'worried', 'dizzy', 'proud'] as const) expect(renderToStaticMarkup(<svg><RobotTop x={0} y={0} deg={0} mood={m} /></svg>)).toContain(`data-mood="${m}"`)
    expect(count(renderToStaticMarkup(<svg><RobotTop x={0} y={0} deg={0} mood="dizzy" /></svg>), /<path d=/g)).toBe(3)
    expect(renderToStaticMarkup(<svg><RobotTop x={0} y={0} deg={0} mood="proud" /></svg>)).toContain('rtop-spark')
  })
  it('stripe pitch 6 is above the wagon-wheel limit at top speed', () => {
    expect(minPitch(0.22 * 300)).toBeLessThan(6)
  })
})

describe('SenseScene', () => {
  it('beam: the number on the beam is the model reading; covered: no number, worried', async () => {
    const { default: SenseScene } = await import('./SenseScene')
    const a = renderToStaticMarkup(<SenseScene wallX={1} mode="beam" label="" />)
    expect(a).toContain('data-reading="0.70"')
    expect(a).toContain('0.70 m')
    const b = renderToStaticMarkup(<SenseScene wallX={1} mode="beam" covered label="" />)
    expect(b).toContain('data-reading="none"')
    expect(b).toContain('data-mood="worried"')
    expect(b).toContain('ss-paw')
    const c = renderToStaticMarkup(<SenseScene wallX={1} mode="spin" t={2} label="" />)
    expect(count(c, /class="ss-hit"/g)).toBe(180)
  })
})

describe('ThinkScene', () => {
  it('driving -> fired + proud for 0.5 m; bumped + dizzy for 0.12 m', async () => {
    const { default: ThinkScene } = await import('./ThinkScene')
    expect(renderToStaticMarkup(<ThinkScene stopAt={0.5} t={0.5} label="" />)).toContain('data-state="driving"')
    const a = renderToStaticMarkup(<ThinkScene stopAt={0.5} t={20} label="" />)
    expect(a).toContain('data-state="fired"')
    expect(a).toContain('data-mood="proud"')
    expect(a).toContain('tk-bubble is-fired')
    const b = renderToStaticMarkup(<ThinkScene stopAt={0.12} t={20} label="" />)
    expect(b).toContain('data-state="bumped"')
    expect(b).toContain('data-mood="dizzy"')
  })
})

describe('ActScene', () => {
  it('driving -> rolling (dials at 0, ghost, roll-on label) -> stopped', async () => {
    const { default: ActScene } = await import('./ActScene')
    const p = (t: number) => renderToStaticMarkup(<ActScene v={0.2} w={0} tStop={1} decel={0.5} t={t} label="" />)
    expect(p(0.5)).toContain('data-phase="driving"')
    expect(p(0.5)).toContain('v 0.20')
    const r = p(1.2)
    expect(r).toContain('data-phase="rolling"')
    expect(r).toContain('v 0.00')
    expect(r).toContain('opacity="0.35"')
    const s = p(5)
    expect(s).toContain('data-phase="stopped"')
    expect(s).toContain('+0.04 m') // 0.2² / (2 · 0.5)
  })
})

describe('SimWhatScene', () => {
  it('scan points follow the wall; sensor off empties the view, the world keeps its wall', async () => {
    const { default: SimWhatScene } = await import('./SimWhatScene')
    const p = (x: number, on = true) => renderToStaticMarkup(<SimWhatScene wallX={x} sensorOn={on} worldWord="world" viewWord="view" label="" />)
    expect(p(1)).toContain('data-points="180"')
    expect(p(1)).not.toBe(p(0.8))
    const off = p(1, false)
    expect(off).toContain('data-points="0"')
    expect(off).toContain('ss-wall is-movable')
  })
})

describe('MeetScene', () => {
  it('no part: no outline; a part: outline, its label, happy face; four tappable parts with names', async () => {
    const { MeetFrame, default: MeetScene } = await import('./MeetScene')
    const words = { sensor: 'distance sensor', computer: 'small computer', battery: 'battery', wheels: 'two wheels' }
    expect(renderToStaticMarkup(<MeetFrame part={null} t={0} words={words} label="" />)).not.toContain('mt-outline')
    const h = renderToStaticMarkup(<MeetFrame part="sensor" t={2} words={words} label="" />)
    expect(h).toContain('data-part="sensor"')
    expect(h).toContain('distance sensor')
    expect(h).toContain('data-mood="happy"')
    const s = renderToStaticMarkup(<MeetScene words={words} label="" />)
    expect(count(s, /role="button"/g)).toBe(4)
    expect(s).toContain('aria-label="two wheels"')
  })
})
