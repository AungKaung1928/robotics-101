/// <reference types="node" />
// Data marks and text in our figures must stay readable in both themes: WCAG 2.2 1.4.11 (graphics that carry
// meaning, 3:1) and 1.4.3 (text, 4.5:1), computed from the tokens in src/index.css.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/index.css', 'utf8')
const block = (re: RegExp) => Object.fromEntries([...(re.exec(css)?.[1] ?? '').matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]))
const light = block(/:root\s*{([^}]*)}/), dark = { ...light, ...block(/prefers-color-scheme: dark\)\s*{\s*:root\s*{([^}]*)}/) }
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

// token -> what it marks in src/anim + src/scenarios
const MARKS = { ray: 'laser hits, stale/old envelopes', free: 'BFS front, used envelopes', robot: 'path, goal, truth dot, scrub number', cost: 'dizzy stars, costmap', ink: 'wall, guess ring', occ: 'BFS walls' }
const TEXT = { 'ink-2': 'readouts, gap text, fate labels', ink: 'body text' }

describe.each([['light', light], ['dark', dark]] as const)('%s theme contrast', (_, t) => {
  it('tokens parsed', () => expect(Object.keys(t).length).toBeGreaterThan(10))
  it.each(Object.keys(MARKS))('--%s vs paper >= 3:1 (data mark)', (k) => expect(ratio(t[k], t.paper)).toBeGreaterThanOrEqual(3))
  it.each(Object.keys(TEXT))('--%s vs paper >= 4.5:1 (text)', (k) => expect(ratio(t[k], t.paper)).toBeGreaterThanOrEqual(4.5))
})

// Composited marks: a translucent mark over a translucent fill, opacities read from the stylesheet.
const hex = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16))
const toHex = (c: number[]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
const over = (top: string, o: number, bg: string) => toHex(hex(top).map((v, i) => v * o + hex(bg)[i] * (1 - o)))
const bfs = readFileSync('src/scenarios/bfswave.css', 'utf8')
const opacity = (sel: string) => parseFloat(new RegExp(`\\.bfs \\.${sel} \\{[^}]*opacity: ([\\d.]+)`).exec(bfs)![1])

describe.each([['light', light], ['dark', dark]] as const)('%s theme: BFS parent arrows on explored cells', (_, t) => {
  it('arrow vs explored fill >= 3:1 (the arrows carry "explored": the fill alone is ~1.3:1)', () => {
    const seen = over(t.free, opacity('seen'), t.paper)
    expect(ratio(over(t['ink-2'], opacity('came'), seen), seen)).toBeGreaterThanOrEqual(3)
  })
})
