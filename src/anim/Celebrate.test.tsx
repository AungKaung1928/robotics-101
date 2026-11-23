import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Celebrate, { CelebrateFrame } from './Celebrate'

describe('Celebrate', () => {
  it('first render (and n = 0) draws nothing', () => {
    expect(renderToStaticMarkup(<svg><Celebrate x={100} y={50} n={0} /></svg>)).toBe('<svg></svg>')
    expect(renderToStaticMarkup(<svg><Celebrate x={100} y={50} n={3} /></svg>)).toBe('<svg></svg>')
  })
  it('a frame mid-burst: eight sparks around the origin, symmetric, above it early on; none after 0.8 s', () => {
    const html = renderToStaticMarkup(<svg><CelebrateFrame x={100} y={50} t={0.1} /></svg>)
    const cx = [...html.matchAll(/cx="([\d.]+)"/g)].map((m) => Number(m[1]))
    const cy = [...html.matchAll(/cy="([\d.]+)"/g)].map((m) => Number(m[1]))
    expect(cx).toHaveLength(8)
    expect(cx[0] - 100).toBeCloseTo(100 - cx[7], 6)
    expect(Math.min(...cy)).toBeLessThan(50)
    expect(renderToStaticMarkup(<svg><CelebrateFrame x={100} y={50} t={0.8} /></svg>)).toBe('<svg></svg>')
  })
})
