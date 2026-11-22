import { describe, expect, it } from 'vitest'
import { CHAPTERS } from '../lib/route'
import { WAYPOINT_VALUE } from './waypoints'

describe('waypoint headline values', () => {
  it('every chapter has one, with a number in it', () => {
    for (const c of CHAPTERS) expect(WAYPOINT_VALUE[c].v).toMatch(/\d/)
  })
  it('the scan value is the beam gap at max range', () => {
    expect(WAYPOINT_VALUE.scan.v).toBe('6.1 cm @ 3.5 m')
  })
})
