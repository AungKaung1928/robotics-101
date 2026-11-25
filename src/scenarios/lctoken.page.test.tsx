import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { STRINGS } from '../i18n'
import LifecycleChapter from '../chapters/l5b/LifecycleChapter'

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
})
