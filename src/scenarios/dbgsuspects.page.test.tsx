import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { STRINGS } from '../i18n'
import DebugChapter from '../chapters/l5/DebugChapter'

describe('5.3 debug suspects', () => {
  it('renders every suspect marked "in" before any tool runs', () => {
    expect([...renderToStaticMarkup(<DebugChapter t={STRINGS.en} />).matchAll(/data-mark="(\w+)"/g)].map((m) => m[1])).toEqual(['in', 'in', 'in'])
  })
  it('reduced motion: strike and pop animations off', () => {
    expect(readFileSync(new URL('./dbg.css', import.meta.url), 'utf8')).toMatch(/prefers-reduced-motion: reduce\) { \.dbg-mark\[data-mark='struck'\] { animation: none; } \.dbg-mark\[data-mark='found'\] { animation: none; } }/)
  })
})
