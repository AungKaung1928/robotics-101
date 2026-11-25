import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// WCAG 2.x contrast: text 4.5:1 (1.4.3), graphics / data marks 3:1 (1.4.11). Tokens read from index.css, both themes.
const css = readFileSync('src/index.css', 'utf8')
const block = (re: RegExp) => Object.fromEntries([...re.exec(css)![1].matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]))
const light = block(/:root\s*{([\s\S]*?)}/), dark = block(/prefers-color-scheme: dark\)\s*{\s*:root\s*{([\s\S]*?)}/)
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const DATA = ['free', 'robot', 'ray', 'cost', 'axis-x', 'axis-y', 'occ']

describe('theme contrast for the Level-5 scenes and the mascot (all colours are tokens)', () => {
  for (const [name, t] of [['light', light], ['dark', dark]] as const) {
    it(`${name}: ink is AA text on paper and surface; data marks >= 3:1 on both`, () => {
      for (const bg of ['paper', 'surface']) {
        expect(ratio(t.ink, t[bg])).toBeGreaterThanOrEqual(4.5)
        for (const k of DATA) expect(ratio(t[k], t[bg]), `${k} on ${bg}`).toBeGreaterThanOrEqual(3)
      }
    })
  }
  it('dark: mascot outline (ink) reads against its own fill (surface) and the spokes (surface) against the wheel (ink)', () => {
    expect(ratio(dark.ink, dark.surface)).toBeGreaterThanOrEqual(3)
  })
  it('Level-5 scene CSS and the mascot use tokens only, no hard-coded colour that would skip the dark theme', () => {
    for (const f of ['src/scenarios/portspoke.css', 'src/scenarios/cirun.css', 'src/scenarios/dbg.css', 'src/scenarios/lifecycle.css', 'src/scenarios/qoslate.css', 'src/scenarios/fieldtrack.css', 'src/anim/mascot.css'])
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i)
  })
})
