import { describe, expect, it } from 'vitest'
import { LEVEL1_CHAPTERS } from '../l1'
import { LEVEL2_CHAPTERS } from '../l2'
import { DOTS, GROWS_FROM, ONRAMP_A, ONRAMP_B } from './onramp'
import { ACT_STRINGS } from './act.strings'
import { MEET_STRINGS } from './meet.strings'
import { MOVE_STRINGS } from './move.strings'
import { SENSE_STRINGS } from './sense.strings'
import { SIMPICK_STRINGS } from './simpick.strings'
import { SIMWHAT_STRINGS } from './simwhat.strings'
import { THINK_STRINGS } from './think.strings'

// Reading path through the chapters this lane owns: new Level 0 chapters, then Level 1 and Level 2 in their index order.
const PATH = [...ONRAMP_A, ...ONRAMP_B, ...LEVEL1_CHAPTERS.map((c) => c.id), ...LEVEL2_CHAPTERS.map((c) => c.id)]

describe('on-ramp path', () => {
  it('every chapter on the path has dots 1-5, and nothing extra', () => {
    for (const id of PATH) expect(DOTS[id], id).toBeGreaterThanOrEqual(1)
    for (const id of PATH) expect(DOTS[id], id).toBeLessThanOrEqual(5)
    expect(Object.keys(DOTS).sort()).toEqual([...PATH].sort())
  })
  it('dots never go down along the path', () => {
    for (let i = 1; i < PATH.length; i++) expect(DOTS[PATH[i]], `${PATH[i - 1]} -> ${PATH[i]}`).toBeGreaterThanOrEqual(DOTS[PATH[i - 1]])
  })
  it('"you already know" always points back, never forward', () => {
    for (const [id, from] of Object.entries(GROWS_FROM)) {
      expect(PATH.indexOf(from), `${id} <- ${from}`).toBeGreaterThanOrEqual(0)
      expect(PATH.indexOf(from), `${id} <- ${from}`).toBeLessThan(PATH.indexOf(id))
    }
  })
  it('the bridges the spec names exist: 1.1 <- think, 2.7 <- act', () => {
    expect(GROWS_FROM.decide).toBe('think')
    expect(GROWS_FROM.drive).toBe('act')
  })
})

describe('on-ramp words', () => {
  const BY_ID = { meet: MEET_STRINGS, move: MOVE_STRINGS, sense: SENSE_STRINGS, think: THINK_STRINGS, act: ACT_STRINGS, simwhat: SIMWHAT_STRINGS, simpick: SIMPICK_STRINGS }
  it('each word is taught once along the path, at most 3 per chapter', () => {
    const seen = new Map<string, string>()
    for (const id of [...ONRAMP_A, ...ONRAMP_B]) {
      const g = BY_ID[id].en.glossary
      expect(g.length, id).toBeLessThanOrEqual(3)
      for (const [w] of g) {
        expect(seen.get(w.toLowerCase()), `"${w}" in ${id}`).toBeUndefined()
        seen.set(w.toLowerCase(), id)
      }
    }
  })
  // Plain English before think gives them their robot meaning: "a sensor and a rule" (spec wording for meet), "Check:" (every page's question label).
  const EVERYDAY = new Set(['rule', 'check'])
  it('no word is used in an earlier chapter than the one that teaches it (EN text)', () => {
    const order = [...ONRAMP_A, ...ONRAMP_B]
    const text = (id: (typeof order)[number]) => {
      const { glossary: _g, ...rest } = BY_ID[id].en as Record<string, unknown>
      return JSON.stringify(rest).toLowerCase()
    }
    order.forEach((id, i) => {
      for (const later of order.slice(i + 1)) for (const [w] of BY_ID[later].en.glossary) {
        if (w.includes('/')) continue // '2D / 3D' is a pair label, not one word
        if (EVERYDAY.has(w)) continue
        expect(text(id), `"${w}" (taught in ${later}) already used in ${id}`).not.toMatch(new RegExp(`\\b${w.toLowerCase()}\\b`))
      }
    })
  })
})

