import { describe, expect, it } from 'vitest'
import { addBeam, makeGrid } from '../lib/grid'
import { applyBeams, knownCells, type Beam } from './gridscan'

const beams: Beam[] = Array.from({ length: 36 }, (_, i) => ({ x: 0, y: 0, angle: (i / 36) * 2 * Math.PI, range: i % 9 === 4 ? Infinity : 1.2 }))

describe('applyBeams', () => {
  it('0 beams = the base map, all beams = the full scan, base untouched', () => {
    const base = makeGrid(4, 0.05)
    expect(knownCells(applyBeams(base, beams, 0, 0.7, 0.4))).toBe(0)
    const full = makeGrid(4, 0.05)
    for (const b of beams) addBeam(full, b.x, b.y, b.angle, b.range, 0.7, 0.4)
    expect(Array.from(applyBeams(base, beams, beams.length, 0.7, 0.4).l)).toEqual(Array.from(full.l))
    expect(knownCells(base)).toBe(0)
  })
  it('known cells only grow as the sweep goes on; no-return beams add nothing', () => {
    const base = makeGrid(4, 0.05)
    let prev = 0
    for (let k = 0; k <= beams.length; k++) {
      const n = knownCells(applyBeams(base, beams, k, 0.7, 0.4))
      expect(n).toBeGreaterThanOrEqual(prev)
      if (k > 0 && beams[k - 1].range === Infinity) expect(n).toBe(prev)
      prev = n
    }
    expect(prev).toBeGreaterThan(0)
  })
})
