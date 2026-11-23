/// <reference types="node" />
// Read from disk: vite.config test.css.include keeps only index.css, so a `?raw` import of these files is '' in tests.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// A motion rule written after the reduced-motion block (same specificity) wins over it and moves anyway.
const files = ['src/anim', 'src/scenarios'].flatMap((d) => readdirSync(d).filter((f: string) => f.endsWith('.css')).map((f: string) => join(d, f)))
const read = (f: string) => readFileSync(f, 'utf8')

describe('reduced motion comes last', () => {
  it('reads the CSS files, not empty strings', () => {
    expect(files.length).toBeGreaterThanOrEqual(5)
    for (const f of files) expect(read(f).length, f).toBeGreaterThan(50)
  })
  it.each(files)('%s: nothing that animates follows the prefers-reduced-motion block', (f) => {
    const css = read(f), at = css.lastIndexOf('@media (prefers-reduced-motion: reduce)')
    const end = at < 0 ? css.length : css.indexOf('\n', at)
    expect(css.slice(end < 0 ? css.length : end)).not.toMatch(/animation|transition|transform/)
  })
  it.each(files)('%s: animates only with the reduced-motion block present', (f) => {
    const css = read(f)
    if (/animation:|transition:/.test(css)) expect(css).toContain('prefers-reduced-motion: reduce')
  })
})

// @keyframes names are global: a name reused in another stylesheet silently replaces one of the two animations
// (found 2026-11-23: our 'flow' vs the app's 'flow' in index.css and l2.css).
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => {
  const p = join(d, f)
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.css') ? [p] : []
})
const names = (f: string) => [...read(f).matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])

describe('keyframe names', () => {
  it('ours appear in no other stylesheet under src', () => {
    const ours = new Set(files.flatMap(names))
    const others = walk('src').filter((f) => !files.includes(f)).flatMap((f) => names(f).map((n) => `${n} (${f})`))
    expect(others.filter((o) => ours.has(o.split(' ')[0]))).toEqual([])
    expect(ours.size).toBeGreaterThan(5)
  })
})

describe('keyframe names across the app', () => {
  it('each @keyframes name is defined in one place only', () => {
    const all = walk('src').flatMap((f) => names(f).map((n) => `${n} (${f})`))
    const dup = all.filter((o, i) => all.findIndex((p) => p.split(' ')[0] === o.split(' ')[0]) !== i)
    expect(dup).toEqual([])
  })
})
