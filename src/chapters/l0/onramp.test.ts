import { describe, expect, it } from 'vitest'
import { LEVEL1_CHAPTERS } from '../l1'
import { LEVEL2_CHAPTERS } from '../l2'
import { DOTS, GROWS_FROM, ONRAMP_A, ONRAMP_B } from './onramp'

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
