import { describe, expect, it } from 'vitest'
import css from './index.css?raw'

// Tokens used as text colour: body, secondary, links/robot, chapter number (free), warnings (ray), x axis label.
const TEXT = ['--ink', '--ink-2', '--robot', '--free', '--ray']
const BACK = ['--paper', '--surface']

function tokens(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]))
}
const light = tokens(css.slice(css.indexOf(':root {'), css.indexOf('@media (prefers-color-scheme: dark)')))
const dark = { ...light, ...tokens(css.slice(css.indexOf('@media (prefers-color-scheme: dark)'), css.indexOf('* { box-sizing'))) }

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

describe('text contrast (WCAG AA 4.5:1)', () => {
  it('contrast() matches known values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 6)
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
  })
  for (const [name, theme] of [['light', light], ['dark', dark]] as const) {
    for (const fg of TEXT) for (const bg of BACK) {
      it(`${name}: ${fg} on ${bg}`, () => {
        expect(theme[fg], `${fg} missing`).toBeDefined()
        expect(contrast(theme[fg], theme[bg])).toBeGreaterThanOrEqual(4.5)
      })
    }
    it(`${name}: primary button text (--surface on --ink, hover --ink-2)`, () => {
      expect(contrast(theme['--surface'], theme['--ink'])).toBeGreaterThanOrEqual(4.5)
      expect(contrast(theme['--surface'], theme['--ink-2'])).toBeGreaterThanOrEqual(4.5)
    })
  }
})

describe('reduced motion', () => {
  const reduce = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
  it('turns off every transition, and every animation if the sheet has any', () => {
    expect(reduce).toMatch(/transition:\s*none/)
    if (/animation(-name)?:\s*(?!none)\w/.test(css)) expect(reduce).toMatch(/animation:\s*none/)
  })
})
