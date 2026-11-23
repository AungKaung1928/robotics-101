import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'

/** Burmese text (lane my) reaches a chapter only through stringsFor(table, t, '<dir>.<base>.<EXPORT>'), the id that
 * names src/i18n/my/<id>.json. A hand-written `t === STRINGS.ja ? ja : en` shows English to Burmese readers forever.
 * Scope: this lane's components. */
const ROOT = join(__dirname, '..')
const MINE = ['l1', 'l2', 'ep'].flatMap((d) => readdirSync(join(ROOT, d)).filter((f) => f.endsWith('.tsx') && !f.includes('.test.')).map((f) => `${d}/${f}`))
  .concat(['Meet', 'Move', 'Sense', 'Think', 'Act', 'Simwhat', 'Simpick'].map((n) => `l0/${n}Chapter.tsx`), ['l0/AlreadyKnow.tsx'])
const src = (f: string) => readFileSync(join(ROOT, f), 'utf8')

describe('my chapters are ready for Burmese strings', () => {
  it('no component picks EN/JA strings by hand', () => {
    expect(MINE.length).toBeGreaterThan(25)
    expect(MINE.filter((f) => /_STRINGS\[[^\]]*'ja'/.test(src(f)) || /STRINGS\.ja\b/.test(src(f)))).toEqual([])
  })
  it("every stringsFor id names a strings file that exports that table, under the table's own name", () => {
    const ids: [string, string][] = MINE.flatMap((f) => [...src(f).matchAll(/stringsFor\((\w+), t, '([\w.]+)'\)/g)].map((m) => [m[1], m[2]] as [string, string]))
    expect(ids.length).toBeGreaterThanOrEqual(23)
    for (const [table, id] of ids) {
      const [dir, base, exp] = id.split('.')
      expect(exp, id).toBe(table)
      expect(src(`${dir}/${base}.strings.ts`), id).toMatch(new RegExp(`export const ${exp} = \\{`))
    }
  })
  it('the l0 "you already know" link builds its id from the chapter id (meet -> l0.meet.MEET_STRINGS)', async () => {
    const { default: AlreadyKnow, L0_TITLES } = await import('../l0/AlreadyKnow')
    for (const from of Object.keys(L0_TITLES)) expect(src(`l0/${from}.strings.ts`)).toContain(`export const ${from.toUpperCase()}_STRINGS = {`)
    // Burmese with no overlay yet falls back to the English title (overlay in src/i18n.ts), never blank
    expect(renderToStaticMarkup(createElement(AlreadyKnow, { id: 'decide', t: STRINGS.my }))).toMatch(/href="#\/0\/think">How a robot thinks/)
  })
})
