import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { STRINGS } from '../i18n'
import LifecycleChapter from '../chapters/l5b/LifecycleChapter'
import { LIFECYCLE_STRINGS } from '../chapters/l5b/lifecycle.strings'

describe('5.5 lifecycle chapter token', () => {
  it('renders the node token on the unconfigured box, no wobble before any rejection', () => {
    const html = renderToStaticMarkup(<LifecycleChapter t={STRINGS.en} />)
    expect(html).toMatch(/class="lc-token" data-at="unconfigured"[^>]*translate\(90px, 20px\)/)
    expect(html).not.toContain('lc-wobble')
  })
  it('reduced motion: the css turns the spring and the wobble off', async () => {
    const css = (await import('node:fs')).readFileSync(new URL('./lifecycle.css', import.meta.url), 'utf8')
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*{[^}]*\.lc-token { transition: none; }[^}]*\.lc-wobble { animation: none; }/)
  })
  it('error note sits in a closed details box; error button names a failing transition callback', () => {
    for (const lang of ['en', 'ja'] as const) {
      const html = renderToStaticMarkup(<LifecycleChapter t={STRINGS[lang]} />)
      expect(html).toMatch(/<details class="note"><summary>[^<]+<\/summary><p>ErrorProcessing/)
      expect(html).not.toMatch(/<details[^>]* open/)
      expect(html).toContain(`data-tr="error">${LIFECYCLE_STRINGS[lang].anim.errBtn}</button>`)
    }
  })
})
