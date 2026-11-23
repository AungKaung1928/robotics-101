import { describe, expect, it } from 'vitest'

/** Every number written with digits in an English string must also appear, with digits, in the Japanese string under
 * the same key: a translation that drifts (20 -> 21 per second) turns red. Japanese may add digits English spells out
 * ("2回" for "two"), so the check is one-way. Scope: this lane's chapters (l1, l2, ep, and Level 0's on-ramp pages). */
const mods = import.meta.glob(
  ['../{l1,l2,ep}/*.strings.ts', '../l0/{meet,move,sense,think,act,simwhat,simpick}.strings.ts'],
  { eager: true },
) as Record<string, Record<string, unknown>>

const nums = (s: string) => s.match(/\d+(?:\.\d+)?/g) ?? []
function missing(en: unknown, ja: unknown, path: string, out: string[]): number {
  if (typeof en === 'string' && typeof ja === 'string') {
    const j = new Set(nums(ja))
    const miss = nums(en).filter((n) => !j.has(n))
    if (miss.length) out.push(`${path}: ${miss.join(', ')} not in JA`)
    return 1
  }
  if (!en || !ja || typeof en !== 'object' || typeof ja !== 'object') return 0
  let n = 0
  for (const k of Object.keys(en)) n += missing((en as Record<string, unknown>)[k], (ja as Record<string, unknown>)[k], `${path}.${k}`, out)
  return n
}

describe('EN digits appear in JA, key by key', () => {
  it('no number lost or changed in translation', () => {
    const out: string[] = []
    let compared = 0
    for (const [file, m] of Object.entries(mods))
      for (const [name, v] of Object.entries(m))
        if (v && typeof v === 'object' && 'en' in v && 'ja' in v) compared += missing(v.en, v.ja, `${file}:${name}`, out)
    expect(Object.keys(mods).length).toBeGreaterThanOrEqual(20) // the glob found the chapters, not an empty set
    expect(compared).toBeGreaterThan(500)
    expect(out).toEqual([])
  })
})
