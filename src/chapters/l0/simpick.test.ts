import { describe, expect, it } from 'vitest'
import { LADDER, pick } from './simpick'

const all = [true, false]

describe('simpick helper', () => {
  it('nothing answered: this site', () => expect(pick({ gpu: null, sensor: null, physics: null })).toBe('site'))
  it('all 8 answer sets pick a row on the ladder, never the mention-only one', () => {
    for (const gpu of all) for (const sensor of all) for (const physics of all) {
      const id = pick({ gpu, sensor, physics })
      const row = LADDER.find((r) => r.id === id)!
      expect(row).toBeTruthy()
      expect(row.mentionOnly).toBeUndefined()
    }
  })
  it('no graphics card never picks 3D with physics (the field note)', () => {
    for (const sensor of all) for (const physics of all) expect(pick({ gpu: false, sensor, physics })).not.toBe('gazebo')
  })
  it('a distance sensor never picks turtlesim or the fake node (no sensors there)', () => {
    for (const gpu of all) for (const physics of all) expect(['turtlesim', 'fake']).not.toContain(pick({ gpu, sensor: true, physics }))
  })
  it('the ladder climbs: 2D first, Isaac Sim last and mention only', () => {
    expect(LADDER[0].id).toBe('site')
    expect(LADDER.at(-1)!.id).toBe('isaac')
    expect(LADDER.filter((r) => r.mentionOnly).map((r) => r.id)).toEqual(['isaac'])
  })
})
