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

// Class names are global too: the first class of each selector is the scope our styles hang on; the same root class in
// another stylesheet styles both (found 2026-11-24: our ScrubNumber '.scrub' also got index.css's flex: 1 1 10rem).
const roots = (f: string) => [...read(f).replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(?:^|[},])\s*([^{}@,]+?)\s*(?=[{,])/gm)]
  .map((m) => /^\.([\w-]+)/.exec(m[1].trim())?.[1]).filter((c): c is string => !!c)

// Shared on purpose: 'inset' = the app's figure box our figures sit in; 'stepper' = src/anim/Player replaces
// src/components/Player and keeps its class, so index.css's layout still applies.
const SHARED = new Set(['inset', 'stepper'])

describe('root class names', () => {
  it('ours are not root classes in any other stylesheet under src', () => {
    const ours = new Set(files.flatMap(roots).filter((c) => !SHARED.has(c)))
    const clash = walk('src').filter((f) => !files.includes(f)).flatMap((f) => [...new Set(roots(f))].filter((c) => ours.has(c)).map((c) => `${c} (${f})`))
    expect(clash).toEqual([])
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

describe('squish-range', () => {
  it('never puts the WebKit and Firefox thumb selectors in one rule (a browser would drop it), and has a reduced-motion block', async () => {
    const { readFileSync } = await import('node:fs')
    const css = readFileSync('src/anim/range.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const sel of css.match(/[^{}]+(?=\{)/g)!) expect(sel.includes('-webkit-slider-thumb') && sel.includes('-moz-range-thumb')).toBe(false)
    expect(css).toContain('prefers-reduced-motion: reduce')
  })
})

// Each rule here is read as a flat list: comments dropped, @keyframes skipped, `reduce` = inside a reduced-motion block.
function cssRules(css: string) {
  const out: { sel: string; body: string; reduce: boolean }[] = [], stack: string[] = []
  let buf = ''
  for (const ch of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (ch === '{') { stack.push(buf.trim()); buf = '' }
    else if (ch === '}') {
      const sel = stack.pop()!, at = stack.join(' ')
      if (!sel.startsWith('@') && !at.includes('@keyframes')) out.push({ sel, body: buf.trim(), reduce: at.includes('reduce') })
      buf = ''
    } else buf += ch
  }
  return out
}
const sels = (s: string) => s.split(',').map((x) => x.trim().replace(/\s+/g, ' '))
// Moving under reduce is impossible for these without an off-rule of the same selector:
const SAFE: Record<string, string> = {
  ".mascot[data-mood='sleep'] .m-breath": 'sets only animation-duration; the reduce block sets .m-breath animation: none (name none)',
  '::view-transition-group(chapter)': 'reduce block: ::view-transition-group(*) animation none !important',
  "html[data-vt='next']::view-transition-old(chapter)": "transition.ts swap() sets data-vt='fade' under reduce",
  "html[data-vt='next']::view-transition-new(chapter)": "transition.ts swap() sets data-vt='fade' under reduce",
  "html[data-vt='back']::view-transition-old(chapter)": "transition.ts swap() sets data-vt='fade' under reduce",
  "html[data-vt='back']::view-transition-new(chapter)": "transition.ts swap() sets data-vt='fade' under reduce",
}

describe('reduced motion switches off the same selector', () => {
  // An off-rule with a shorter selector loses on specificity and the thing still moves
  // (player.css 2026-11-23: '.stepper .rail li::before' vs '.stepper .rail li + li::before', 0.253 s in Chrome).
  it('every selector that transitions or animates has an off-rule with the identical selector in a reduce block', () => {
    const missing: string[] = [], seen = new Set<string>()
    for (const f of files) {
      const r = cssRules(read(f))
      const off = new Set(r.filter((x) => x.reduce).flatMap((x) => sels(x.sel)))
      for (const x of r) {
        if (x.reduce || !/(^|;)\s*(transition|animation)(-name|-duration)?\s*:/.test(x.body) || /(transition|animation)\s*:\s*none/.test(x.body)) continue
        for (const s of sels(x.sel)) { seen.add(s); if (!off.has(s) && !SAFE[s]) missing.push(`${f}: ${s}`) }
      }
    }
    expect(missing).toEqual([])
    expect(Object.keys(SAFE).filter((s) => !seen.has(s)), 'stale SAFE entries').toEqual([])
  })
})
