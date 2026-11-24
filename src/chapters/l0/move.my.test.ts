import { describe, expect, it } from 'vitest'
import MY from '../../i18n/my/l0.move.MOVE_STRINGS.json'
import { MOVE_STRINGS } from './move.strings'

/** Lesson 0.2 in Burmese: every English text (arrays entry by entry) has a Burmese string. The app falls back to English
 * per string (src/i18n.ts overlay), so a missing key or a null array entry shows English silently; this test does not. */
const gaps = (en: unknown, my: unknown, at: string): string[] => {
  if (typeof en === 'function') return [] // caption: a number + unit, built in code
  if (typeof en === 'string') return typeof my === 'string' && /[က-႟]/.test(my) && my !== en ? [] : [at]
  if (Array.isArray(en)) return [...(Array.isArray(my) && my.length !== en.length ? [`${at}.length`] : []), ...en.flatMap((e, i) => gaps(e, Array.isArray(my) ? my[i] : undefined, `${at}[${i}]`))]
  return Object.entries(en as object).flatMap(([k, v]) => gaps(v, (my as Record<string, unknown> | undefined)?.[k], at ? `${at}.${k}` : k))
}

describe('lesson 0.2 Burmese is complete', () => {
  it('no omitted key, no null array entry, no English left', () => {
    expect(gaps(MOVE_STRINGS.en, MY, '')).toEqual([])
  })
  it('every {slot} of the English templates is kept in the Burmese one', () => {
    for (const k of ['slipSame', 'slipDiff'] as const) {
      const slots = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()
      expect(slots((MY as unknown as Record<string, string>)[k])).toEqual(slots(MOVE_STRINGS.en[k]))
    }
  })
})
