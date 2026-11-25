import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { STRINGS } from '../i18n'
import CiChapter from '../chapters/l5/CiChapter'

describe('5.2 ci run scene', () => {
  it('before Run every step waits and no fill bar is drawn', () => {
    const html = renderToStaticMarkup(<CiChapter t={STRINGS.en} />)
    expect(html.match(/class="ci-step ci-live wait"/g)).toHaveLength(6)
    expect(html).not.toContain('ci-fill')
  })
  it('reduced motion: Run jumps to the end frame (chapter) and the stop shake is off (css)', () => {
    expect(readFileSync(new URL('../chapters/l5/CiChapter.tsx', import.meta.url), 'utf8')).toContain('setTA(still() ? end : 0)')
    expect(readFileSync(new URL('./cirun.css', import.meta.url), 'utf8')).toMatch(/prefers-reduced-motion: reduce\) { \.ci-live\.failure { animation: none; } }/)
  })
})
