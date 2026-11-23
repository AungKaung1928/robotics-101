import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import SeqArrow, { DRAW_MS, drawn } from './SeqArrow'

describe('SeqArrow', () => {
  it('drawn: 0 before, eased half at half time, 1 after', () => {
    expect(drawn(-5)).toBe(0)
    expect(drawn(DRAW_MS / 2)).toBeCloseTo(0.5, 9)
    expect(drawn(DRAW_MS)).toBe(1)
  })
  it('renders nothing before the event, a growing line without head in flight, the head on arrival', () => {
    const at = (ms: number) => renderToStaticMarkup(<svg><SeqArrow x1={100} x2={500} y={50} ms={ms} label="goal" /></svg>)
    expect(at(-1)).toBe('<svg></svg>')
    const mid = at(DRAW_MS / 2)
    expect(mid).toContain('x2="300"')
    expect(mid).not.toContain('<path')
    expect(at(DRAW_MS + 1)).toContain('<path d="M492 45L500 50L492 55"')
  })
  it('right-to-left messages point left', () => {
    expect(renderToStaticMarkup(<svg><SeqArrow x1={500} x2={100} y={50} ms={999} label="result" /></svg>)).toContain('M108 45L100 50L108 55')
  })
})
