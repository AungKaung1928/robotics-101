import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { STRINGS } from '../i18n'
import QosChapter from '../chapters/l5b/QosChapter'

// The stepper's first button is Back; Next follows Play (and the optional speed button).
const stepperButtons = (html: string) => [...html.slice(html.indexOf('class="stepper"')).matchAll(/<button[^>]*>/g)].map((m) => m[0])

describe('Player Back/Next keep keyboard focus at the ends', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('first frame: Back is aria-disabled, not disabled (a disabled button drops focus to <body>)', () => {
    const back = stepperButtons(renderToStaticMarkup(<QosChapter t={STRINGS.en} />))[0]
    expect(back).toContain('aria-disabled="true"')
    expect(back).not.toMatch(/\sdisabled=""/)
  })
  it('end frame (reduced motion): Next is aria-disabled, not disabled', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }))
    const off = stepperButtons(renderToStaticMarkup(<QosChapter t={STRINGS.en} />)).filter((b) => b.includes('aria-disabled="true"'))
    expect(off).toHaveLength(1) // only Next: Back is live on the end frame
    expect(off[0]).not.toMatch(/\sdisabled=""/)
  })
})
