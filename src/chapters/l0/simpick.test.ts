import { describe, expect, it } from 'vitest'
import { LADDER, STEPS, pick } from './simpick'

const all = [true, false]

describe('simpick helper', () => {
  it('nothing answered: this site', () => expect(pick({ gpu: null, sensor: null, physics: null })).toBe('site'))
  it('all 8 answer sets pick a main row on the ladder, never the alternative', () => {
    for (const gpu of all) for (const sensor of all) for (const physics of all) {
      const row = LADDER.find((r) => r.id === pick({ gpu, sensor, physics }))!
      expect(row).toBeTruthy()
      expect(row.alt).toBeUndefined()
    }
  })
  it('no graphics card never picks 3D with physics (the field note)', () => {
    for (const sensor of all) for (const physics of all) expect(pick({ gpu: false, sensor, physics })).not.toBe('gazebo')
  })
  it('a distance sensor never picks turtlesim (no sensors there)', () => {
    for (const gpu of all) for (const physics of all) expect(pick({ gpu, sensor: true, physics })).not.toBe('turtlesim')
  })
  it('exactly 5 rungs, site first, Webots the one alternative to Gazebo; every rung after this site has a source URL', () => {
    expect(LADDER.map((r) => r.id)).toEqual(['site', 'turtlesim', 'mvsim', 'gazebo', 'webots'])
    expect(LADDER.filter((r) => r.alt).map((r) => r.id)).toEqual(['webots'])
    for (const r of LADDER.slice(1)) expect(r.url).toMatch(/^https:\/\//)
  })
  it('the check answer holds: no graphics card + distance sensor = mvsim', () => {
    for (const physics of all) expect(pick({ gpu: false, sensor: true, physics })).toBe('mvsim')
  })
  it('drawn as 4 steps, top first; Gazebo and Webots share the top step', () => {
    expect(STEPS.map((st) => st.map((r) => r.id))).toEqual([['gazebo', 'webots'], ['mvsim'], ['turtlesim'], ['site']])
  })
})
