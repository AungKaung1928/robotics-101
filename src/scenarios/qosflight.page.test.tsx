import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { STRINGS } from '../i18n'
import QosChapter from '../chapters/l5b/QosChapter'

const phases = (html: string) => [...html.matchAll(/data-phase="(\w+)"/g)].map((m) => m[1])

describe('5.4 QoS chapter scene', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('opens on the first frame with the Player: one scan sent, none received', () => {
    const html = renderToStaticMarkup(<QosChapter t={STRINGS.en} />)
    expect(html).toContain('sent 1/20 · received 0')
    expect(html).toContain('one drops on the wire')
    expect(phases(html).filter((p) => p === 'arrived')).toHaveLength(0)
  })
  it('reduced motion: opens on the end frame, all 20 arrived (reliable default resends the drops)', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }))
    const html = renderToStaticMarkup(<QosChapter t={STRINGS.ja} />)
    expect(html).toContain('送信 20/20 · 受信 20')
    expect(phases(html).filter((p) => p === 'arrived')).toHaveLength(20)
  })
  it('verdict shows the depth that decides the challenge', () => {
    expect(renderToStaticMarkup(<QosChapter t={STRINGS.en} />)).toMatch(/data-k="challenge">[^<]*· history depth \(keep last\) 10<\/p>/)
  })
  it('mascot sits next to the verdict, named in the chapter language', () => {
    expect(renderToStaticMarkup(<QosChapter t={STRINGS.ja} />)).toMatch(/QoS の相棒ロボット[\s\S]*data-k="challenge"/)
  })
  it('late-joiner row: empty while scans fly, at the end shows the maps the model keeps for RViz (default volatile = 0)', () => {
    expect(renderToStaticMarkup(<QosChapter t={STRINGS.en} />)).toMatch(/data-k="late-row" data-got="-1"/)
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }))
    const html = renderToStaticMarkup(<QosChapter t={STRINGS.en} />)
    expect(html).toMatch(/data-k="late-row" data-got="0"/)
    expect(html.match(/data-kept="false"/g)).toHaveLength(3)
  })
})
