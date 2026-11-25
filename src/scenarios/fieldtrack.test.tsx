import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { FAILS, correct, options } from '../chapters/l5b/fieldfail'
import { STRINGS } from '../i18n'
import FieldfailChapter from '../chapters/l5b/FieldfailChapter'
import { markerX, reaction, tileLook } from './fieldtrack'

describe('5.6 field-failure track', () => {
  it('mascot reaction follows correct() for every option of every case, one cheer per case', () => {
    FAILS.forEach((_, i) => {
      for (const p of options(i)) expect(reaction(i, p)).toBe(correct(i, p) ? 'cheer' : 'oops')
      expect(options(i).filter((p) => reaction(i, p) === 'cheer')).toHaveLength(1)
    })
  })
  it('marker x is the tile x of the current case; tiles show first-try results', () => {
    expect(FAILS.map((_, i) => markerX(i))).toEqual(FAILS.map((_, k) => 10 + k * 105))
    expect([tileLook({ a: true }, 'a'), tileLook({ a: false }, 'a'), tileLook({}, 'a')]).toEqual(['body', 'qfull', 'qslot'])
  })
  it('renders mascot, marker on case 1, no pop before any answer (en, ja)', () => {
    for (const t of [STRINGS.en, STRINGS.ja]) {
      const html = renderToStaticMarkup(<FieldfailChapter t={t} />)
      expect(html).toContain('translateX(10px)')
      expect(html).not.toContain('ff-pop')
      expect(html).toMatch(/aria-label="(Debug buddy|診断の相棒)/)
    }
  })
  it('reduced motion: slide and pop off', () => {
    expect(readFileSync(new URL('./fieldtrack.css', import.meta.url), 'utf8')).toMatch(/prefers-reduced-motion: reduce\) { \.ff-marker { transition: none; } \.ff-pop { animation: none; } }/)
  })
})
