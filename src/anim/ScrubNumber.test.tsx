import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ScrubNumber from './ScrubNumber'

describe('ScrubNumber markup', () => {
  it('is a focusable slider that says its value in words', () => {
    const html = renderToStaticMarkup(<ScrubNumber value={0.1} onChange={() => {}} range={{ min: 0, max: 0.5, step: 0.01 }} format={(v) => `${v.toFixed(2)} s`} label="transform age" />)
    for (const s of ['role="slider"', 'tabindex="0"', 'aria-valuenow="0.1"', 'aria-valuemin="0"', 'aria-valuemax="0.5"', 'aria-valuetext="0.10 s"', 'aria-label="transform age"', '>0.10 s</span>'])
      expect(html).toContain(s)
    expect(html).not.toContain('data-drag')
  })
  it('touch: vertical page scroll is left to the browser, and a cancelled drag ends cleanly', () => {
    const css = readFileSync('src/anim/scrub.css', 'utf8'), src = readFileSync('src/anim/ScrubNumber.tsx', 'utf8')
    expect(css).toMatch(/\.scrub-num \{[^}]*touch-action: pan-y/)
    expect(src).toMatch(/onPointerCancel=\{\(\) => \{ start\.current = null; setDrag\(false\) \}\}/)
  })
})

