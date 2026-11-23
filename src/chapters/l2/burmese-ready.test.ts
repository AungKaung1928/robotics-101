import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Burmese text (lane my) reaches a page only through stringsFor / titleOf / langOf (src/i18n.ts). A hand-written
 * `t === STRINGS.ja ? ja : en` shows English to Burmese readers forever. src/i18n.ids.test.ts checks the ids; this checks
 * that no component of this lane picks by hand (chapters, level intros, the real-project box). */
const ROOT = join(__dirname, '..')
const MINE = ['l1', 'l2', 'ep'].flatMap((d) => readdirSync(join(ROOT, d)).filter((f) => f.endsWith('.tsx') && !f.includes('.test.')).map((f) => `${d}/${f}`))
  .concat(['Meet', 'Move', 'Sense', 'Think', 'Act', 'Simwhat', 'Simpick'].map((n) => `l0/${n}Chapter.tsx`))
const src = (f: string) => readFileSync(join(ROOT, f), 'utf8')

describe('my components are ready for Burmese strings', () => {
  it('no component picks EN/JA strings or titles by hand', () => {
    expect(MINE.length).toBeGreaterThan(25)
    const hand = /_STRINGS\[[^\]]*'ja'|STRINGS\.ja\b|\.titleJa\b/
    expect(MINE.filter((f) => hand.test(src(f)))).toEqual([])
  })
})
