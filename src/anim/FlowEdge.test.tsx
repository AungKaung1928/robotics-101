import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import FlowEdge, { flowStyle } from './FlowEdge'

describe('FlowEdge', () => {
  it('one dash per message: /scan at 5 Hz moves one 24 px period every 0.2 s', () => {
    const s = flowStyle(5) as Record<string, string>
    expect(s['--flow-dur']).toBe('0.2s')
    expect(s['--flow-period']).toBe('24px')
    expect(s.strokeDasharray).toBe('8.4 15.6')
  })
  it('live draws the flowing path, not live a plain faint one', () => {
    expect(renderToStaticMarkup(<svg><FlowEdge d="M0 0L100 0" hz={20} live /></svg>)).toContain('class="flow"')
    const off = renderToStaticMarkup(<svg><FlowEdge d="M0 0L100 0" hz={20} live={false} /></svg>)
    expect(off).toContain('flow-off')
    expect(off).not.toContain('--flow-dur')
  })
})
