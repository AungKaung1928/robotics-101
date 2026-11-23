import { describe, expect, it } from 'vitest'
import { STRINGS } from '../i18n'
import { CHAPTERS } from '../lib/route'
import { waypointValues } from './waypoints'

describe('waypoint headline values', () => {
  it('every chapter has one, with a number in it, in both languages', () => {
    for (const lang of ['en', 'ja'] as const) for (const c of CHAPTERS) expect(waypointValues(STRINGS[lang].wv)[c].v).toMatch(/\d/)
  })
  it('the scan value is the beam gap at max range', () => {
    expect(waypointValues(STRINGS.en.wv).scan.v).toBe('6.1 cm @ 3.5 m')
  })
  it('Japanese values carry no English word (numbers, units and Nav2 only)', () => {
    for (const { v } of Object.values(waypointValues(STRINGS.ja.wv))) expect(v).not.toMatch(/\b[a-z]{3,}\b/)
  })
})
