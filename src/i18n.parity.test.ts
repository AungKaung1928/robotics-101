import { describe, expect, it } from 'vitest'
import { STRINGS } from './i18n'

// Numbers and `code` spans must survive translation (en ↔ ja; my joins when it exists). English number words count as
// digits; a lone 1 is ignored (Japanese counters add it for "a" / "one").
const mods = import.meta.glob('./chapters/*/*.strings.ts', { eager: true }) as Record<string, Record<string, { en: unknown; ja: unknown }>>
const sets: [string, { en: unknown; ja: unknown }][] = [['i18n.ts', STRINGS], ...Object.entries(mods).flatMap(([f, m]) => Object.values(m).map((o): [string, { en: unknown; ja: unknown }] => [f, o]))]

// Checked by hand 2026-11-24: the same value written as a word in one language (二輪 = two-wheel, 10億 = billion, May = 5月).
const WORDING = new Set(['i18n.ts.detect.lines.0', 'i18n.ts.costmap.twoMaps', './chapters/l0/ros.strings.ts.solved',
  './chapters/l1/cpp.strings.ts.glossary.3.1', './chapters/l2/drive.strings.ts.glossary.2.1', './chapters/l2/msgtypes.strings.ts.lines.2'])

const W: Record<string, string> = { zero: '0', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10', twelve: '12', twice: '2' }
const leaves = (v: unknown, p = ''): [string, string][] =>
  typeof v === 'string' ? [[p, v]] : v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => leaves(x, `${p}.${k}`)) : []
export function tokens(s0: string): string {
  const s = s0.replace(/[０-９]/g, (d) => String(d.charCodeAt(0) - 0xff10)).replace(/\b(zero|two|three|four|five|six|seven|eight|nine|ten|twelve|twice)\b/gi, (w) => W[w.toLowerCase()])
  return [...(s.match(/\d+(?:[.,]\d+)*/g) ?? []), ...(s.match(/`[^`]+`/g) ?? [])].filter((t) => t !== '1').sort().join(' ')
}

describe('numbers and code survive translation', () => {
  it('tokens: words and full-width digits count, a lone 1 does not', () => {
    expect(tokens('360 beams, one per degree, five times')).toBe(tokens('1 度につき 1 本、360 本を ５ 回'))
    expect(tokens('0.25 m')).not.toBe(tokens('0.5 m'))
  })
  it('reads every strings file', () => expect(sets.length).toBeGreaterThan(20))
  it.each(sets)('%s', (f, o) => {
    const ja = new Map(leaves(o.ja))
    const bad = leaves(o.en).filter(([p, s]) => ja.has(p) && !WORDING.has(f + p) && tokens(s) !== tokens(ja.get(p)!)).map(([p]) => f + p)
    expect(bad).toEqual([])
  })
})
