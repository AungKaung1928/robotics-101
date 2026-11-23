import { describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'
// @ts-expect-error plain JS module without types
import { lint } from '../../../scripts/my-lint.mjs'
import { MY_TEMPLATES } from './templates'

type Fn = (...a: unknown[]) => string
const mods = import.meta.glob('../../chapters/*/*.strings.ts', { eager: true }) as Record<string, Record<string, { en?: unknown }>>

// Every English function leaf, keyed like MY_TEMPLATES.
const english = new Map<string, Fn>()
const walk = (id: string, v: unknown, path: string[]) => {
  if (typeof v === 'function') english.set(`${id}|${path.join('.')}`, v as Fn)
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(id, x, [...path, k])
}
walk('core', STRINGS.en, [])
for (const [file, m] of Object.entries(mods)) {
  const [dir, base] = file.replace('../../chapters/', '').replace('.strings.ts', '').split('/')
  for (const [exp, t] of Object.entries(m)) if (t && typeof t === 'object' && 'en' in t) walk(`${dir}.${base}.${exp}`, t.en, [])
}
const burmese = Object.entries(MY_TEMPLATES).flatMap(([id, o]) => Object.entries(o).map(([k, f]) => [`${id}|${k}`, f as unknown as Fn] as const))

describe('Burmese templates', () => {
  it('every Burmese template has an English twin with the same arguments', () => {
    for (const [k, f] of burmese) {
      expect(english.has(k), k).toBe(true)
      expect(f.length, k).toBe(english.get(k)!.length)
    }
  })
  it('every English template has a Burmese one', () => {
    expect([...english.keys()].filter((k) => !burmese.some(([b]) => b === k))).toEqual([])
  })
  it.each(burmese)('%s: same numbers and code, lint clean, both branches', (k, f) => {
    for (const v of [3, 0]) {
      const args = Array.from({ length: f.length }, () => v)
      const en = english.get(k)!(...args)
      const my = f(...args)
      const role = /[.!]$/.test(en.trim()) ? 'body' : 'label'
      expect(lint(en, my, role).fail, `${en} | ${my}`).toEqual([])
    }
  })
})
