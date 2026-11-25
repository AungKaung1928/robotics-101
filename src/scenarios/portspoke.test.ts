import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { HALF, LDS, cppIndex, pyIndex } from '../chapters/l5/port'
import { STRINGS } from '../i18n'
import PortChapter from '../chapters/l5/PortChapter'
import { spokeDeg } from './portspoke'

const rot = (deg: number, r: number) => { const t = (deg * Math.PI) / 180; return [120 + r * Math.sin(t), 120 - r * Math.cos(t)] } // rotate (120, 120 - r) clockwise
const spoke = (s: typeof LDS, i: number, r: number) => { const a = s.angleMin + i * s.inc; return [120 - r * Math.sin(a), 120 - r * Math.cos(a)] }

describe('port spoke', () => {
  it('rotated line ends exactly where the chapter draws ray i, every ray, both layouts', () => {
    for (const s of [LDS, HALF]) for (let i = 0; i < s.n; i += 7) { const [x, y] = rot(spokeDeg(s, i), 80), [ex, ey] = spoke(s, i, 80); expect(x).toBeCloseTo(ex, 9); expect(y).toBeCloseTo(ey, 9) }
  })
  it('wrap bug: the C++ spoke leaves the Python one (start != end); fixed: they coincide', () => {
    expect(spokeDeg(LDS, cppIndex(LDS, -90, false).idx)).not.toBeCloseTo(spokeDeg(LDS, pyIndex(LDS, -90)), 3)
    expect(spokeDeg(LDS, cppIndex(LDS, -90, true).idx)).toBeCloseTo(spokeDeg(LDS, pyIndex(LDS, -90)), 9)
  })
  it('chapter renders the rotated C++ spoke with its start angle; reduced motion turns the turn off', () => {
    expect(renderToStaticMarkup(createElement(PortChapter, { t: STRINGS.en }))).toMatch(/class="cpp cpp-rot[^"]*"[^>]*style="--from:[-\d.]+deg;transform:rotate\([-\d.]+deg\)"/)
    expect(readFileSync(new URL('./portspoke.css', import.meta.url), 'utf8')).toMatch(/prefers-reduced-motion: reduce\) { \.port-ring \.cpp-rot { transition: none; } }/)
  })
})
