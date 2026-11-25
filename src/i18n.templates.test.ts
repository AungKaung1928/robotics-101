import { describe, expect, it } from 'vitest'
import { STRINGS, stringsFor } from './i18n'
import { MY_TEMPLATES } from './i18n/my/templates'

const mods = import.meta.glob('./chapters/*/*.strings.ts', { eager: true }) as Record<string, Record<string, unknown>>
const at = (o: unknown, path: string) => path.split('.').reduce<unknown>((v, k) => (v as Record<string, unknown> | undefined)?.[k], o)

describe('Burmese templates reach the page', () => {
  it.each(Object.keys(MY_TEMPLATES))('%s: every template replaces its English function', (id) => {
    let en: unknown, my: unknown
    if (id === 'core') [en, my] = [STRINGS.en, STRINGS.my]
    else {
      const [dir, base, exp] = id.split('.')
      const table = mods[`./chapters/${dir}/${base}.strings.ts`]?.[exp] as { en: unknown; ja: unknown }
      expect(table, `no strings table for ${id}`).toBeDefined()
      ;[en, my] = [table.en, stringsFor(table, STRINGS.my, id)]
    }
    for (const [path, fn] of Object.entries(MY_TEMPLATES[id])) {
      expect(at(my, path), `${id} ${path}`).toBe(fn)
      expect(typeof at(en, path), `${id} ${path} English`).toBe('function')
      expect(at(en, path)).not.toBe(fn)
    }
  })
  it('English and Japanese keep their own functions', () => {
    expect(STRINGS.en).not.toBe(STRINGS.my)
    expect(String((at(STRINGS.en, 'wv.obstacles') as (n: number) => string)(3))).not.toMatch(/[က-႟]/)
  })
})
