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
