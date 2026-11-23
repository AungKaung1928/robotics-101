import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { STRINGS } from '../i18n'
import Player from './Player'

const render = (t: number, autoplay = true) => renderToStaticMarkup(
  <Player t={t} setT={() => {}} end={3} events={[0, 1, 2, 3]} speed={1} autoplay={autoplay} caption="c" labels={['a', 'b', 'c', 'd']} s={STRINGS.en} />)
const motion = (reduce: boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: reduce && q.includes('reduce'), media: q }))

afterEach(() => vi.unstubAllGlobals())

describe('Player render', () => {
  it('reduced motion: Play disabled and not pressed, even with autoplay', () => {
    motion(true)
    const html = render(3)
    expect(html).toMatch(/<button type="button" disabled="" aria-pressed="false"><svg[^>]*><path d="M2 1L5.5[^"]*"><\/path><\/svg>Play<\/button>/)
  })
  it('motion allowed + autoplay: Play is pressed (playing) and offers Pause', () => {
    motion(false)
    expect(render(0)).toMatch(/aria-pressed="true"><svg[^>]*><path d="M2 1L4 1[^"]*"><\/path><\/svg>Pause<\/button>/)
  })
  it('rail: current step marked, earlier steps done, Next names the next step; caption is a live region', () => {
    motion(false)
    const html = render(1.2, false)
    expect(html.match(/aria-current="step"/g)).toHaveLength(1)
    expect(html.match(/data-done="true"/g)).toHaveLength(1)
    expect(html).toContain('<span class="wide">: c</span>')
    expect(html).toContain('aria-live="polite"')
  })
  it('scrubber speaks the step, not the raw time: aria-valuetext = n/total + label; no labels = none', () => {
    motion(false)
    expect(render(1.5)).toContain('aria-valuetext="2/4 b"')
    expect(render(3)).toContain('aria-valuetext="4/4 d"')
    expect(renderToStaticMarkup(<Player t={1} setT={() => {}} end={3} events={[0, 1, 3]} speed={1} caption="c" s={STRINGS.en} />)).not.toContain('aria-valuetext')
  })
})
