import { describe, expect, it } from 'vitest'

// Every stringsFor(TABLE, t, '<dir>.<base>.<EXPORT>') call must name the strings file and export it reads,
// else its Burmese overlay (src/i18n/my/<id>.json) is never found and the chapter stays English without an error.
const sources = import.meta.glob('./**/*.tsx', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>
const tables = import.meta.glob('./chapters/*/*.strings.ts', { eager: true }) as Record<string, Record<string, unknown>>
const calls = Object.entries(sources).flatMap(([file, src]) =>
  [...src.matchAll(/stringsFor\((\w+), \w+, '([\w-]+)\.([\w-]+)\.(\w+)'\)/g)].map((m) => ({ file, table: m[1], dir: m[2], base: m[3], exp: m[4] })))

describe('stringsFor ids', () => {
  it('found the calls', () => expect(calls.length).toBeGreaterThanOrEqual(20))
  it.each(calls.map((c) => [`${c.file} ${c.dir}.${c.base}.${c.exp}`, c] as const))('%s', (_, c) => {
    expect(c.exp).toBe(c.table)
    expect(tables[`./chapters/${c.dir}/${c.base}.strings.ts`]?.[c.exp], 'strings file + export').toBeDefined()
  })
})

describe('titleOf in Burmese', async () => {
  const { STRINGS, titleOf } = await import('./i18n')
  const { LEVELS } = await import('./content/levels')
  const older = LEVELS.flat().filter((c) => c.id in STRINGS.en.chapters)
  it('found the 7 older chapters', () => expect(older.length).toBe(7))
  // They have no meta array (no titles.json key), so their Burmese title comes from core chapters.<id>.
  it.each(older.map((c) => [c.id, c] as const))('%s', (id, c) => expect(titleOf(c, STRINGS.my)).toBe((STRINGS.my.chapters as Record<string, string>)[id]))
})
