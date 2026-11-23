import { describe, expect, it } from 'vitest'

/** Curriculum teaching rule: at most ~150 words of text per step (the animation carries the rest). English counted. */
const mods = import.meta.glob(['../l1/*.strings.ts', '../l2/*.strings.ts', './*.strings.ts'], { eager: true }) as Record<string, Record<string, { en?: Record<string, unknown> }>>
const words = (v: unknown): number =>
  typeof v === 'string' ? v.split(/\s+/).filter(Boolean).length : Array.isArray(v) ? v.reduce((a: number, x) => a + (typeof x === 'string' ? words(x) : 0), 0) : 0
const rows = Object.entries(mods).flatMap(([f, m]) => Object.values(m).filter((S) => S?.en).map((S) => [f.split('/').slice(-2).join('/'), S.en!] as const))

describe('Level 1-2 + EP: page text within the 150-word step budget', () => {
  it('found every chapter', () => expect(rows.length).toBeGreaterThanOrEqual(16))
  it.each(rows)('%s', (_, en) => {
    expect(words(en.learn) + words(en.lines)).toBeLessThanOrEqual(150)
    if ('cost' in en) expect(words(en.cost) + words(en.costNote)).toBeLessThanOrEqual(150) // EP1 second step
  })
})
