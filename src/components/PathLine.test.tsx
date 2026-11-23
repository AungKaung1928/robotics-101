import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS, titleOf } from '../i18n'
import { GROWS_FROM, findChapter } from '../content/path'
import PathLine from './PathLine'

const esc = (x: string) => x.replace(/&/g, '&amp;').replace(/'/g, '&#x27;').replace(/"/g, '&quot;')

describe('chapter header path line', () => {
  it.each(Object.keys(GROWS_FROM))('%s links back to the chapter it grows from, with its title, EN and JA', (id) => {
    const from = findChapter(GROWS_FROM[id])!
    for (const t of [STRINGS.en, STRINGS.ja]) {
      const html = renderToStaticMarkup(<PathLine id={id} t={t} />)
      expect(html).toContain(`href="${from.href}"`)
      expect(html).toContain(esc(titleOf(from.meta, t)))
      expect(html).toContain(t.levels.knows)
    }
  })
  it('nothing for a chapter outside the scale', () => {
    expect(renderToStaticMarkup(<PathLine id="bfs" t={STRINGS.en} />)).toBe('')
  })
})
