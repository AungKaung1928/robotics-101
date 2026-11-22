import { describe, expect, it } from 'vitest'
import { NAV2, SLAM_RESOLUTION } from '../content/world'
import { cellCount, logOdds, prob, update } from './grid'

describe('occupancy grid', () => {
  it('10 x 10 m at his 0.05 m resolution is 200 x 200 = 40,000 cells', () => {
    expect(cellCount(10, SLAM_RESOLUTION)).toBe(40_000)
    expect(cellCount(10, 0.025)).toBe(160_000)
  })
  it('log-odds round-trips and 0.5 is 0', () => {
    expect(logOdds(0.5)).toBe(0)
    expect(prob(logOdds(0.7))).toBeCloseTo(0.7, 12)
  })
  it('two hits at p = 0.7 from unknown: 0.7² / (0.7² + 0.3²) = 0.845', () => {
    const l = update(update(0, 0.7), 0.7)
    expect(prob(l)).toBeCloseTo(0.49 / 0.58, 12)
  })
  it('a hit then a miss of equal strength cancel', () => {
    expect(update(update(0, 0.7), 0.3)).toBeCloseTo(0, 12)
  })
})

import { LIDAR, WORLD } from '../content/world'
import { addBeam, cellAt, makeGrid } from './grid'
import { beamAngles, castRay } from './scan'

describe('addBeam', () => {
  const scanFromOrigin = () => {
    const g = makeGrid(10, 0.05)
    for (const a of beamAngles(LIDAR.samples, LIDAR.minAngle, LIDAR.maxAngle)) {
      addBeam(g, 0, 0, a, castRay({ x: 0, y: 0, yaw: 0 }, a, WORLD, LIDAR.minRange, LIDAR.maxRange), 0.7, 0.4)
    }
    return g
  }
  it('cellAt maps the origin to the centre and rejects points outside', () => {
    const g = makeGrid(10, 0.05)
    expect(cellAt(g, 0, 0)).toBe(100 * 200 + 100)
    expect(cellAt(g, 5.01, 0)).toBe(-1)
  })
  it('one scan from the origin: box1 corner occupied, the way to it free, the far wall unknown', () => {
    const g = scanFromOrigin()
    // The beam nearest 50° hits box1's west face (x = 1.5); its hit cell must read occupied.
    const a = beamAngles(LIDAR.samples, LIDAR.minAngle, LIDAR.maxAngle).reduce((b, v) => (Math.abs(v - 0.8727) < Math.abs(b - 0.8727) ? v : b))
    const r = castRay({ x: 0, y: 0, yaw: 0 }, a, WORLD, LIDAR.minRange, LIDAR.maxRange)
    expect(r * Math.cos(a)).toBeCloseTo(1.5, 9)
    expect(prob(g.l[cellAt(g, r * Math.cos(a), r * Math.sin(a))])).toBeGreaterThan(0.5)
    expect(prob(g.l[cellAt(g, 0.75, 0.75)])).toBeLessThan(0.5)
    expect(g.l[cellAt(g, 4.95, 0)]).toBe(0) // east wall 4.9 m away: beyond 3.5 m, no return
  })
  it('one beam: its hit cell gets only the occupied update, each crossed cell one free update', () => {
    const g = makeGrid(10, 0.05)
    addBeam(g, 0.025, 0.025, 0, 1, 0.7, 0.4)
    expect(g.l[cellAt(g, 1.025, 0.025)]).toBeCloseTo(logOdds(0.7), 6)
    expect(g.l[cellAt(g, 0.525, 0.025)]).toBeCloseTo(logOdds(0.4), 6)
    expect(g.l.filter((v) => v !== 0)).toHaveLength(21) // 20 free cells + the hit
  })
  it('a beam with no return changes nothing', () => {
    const g = makeGrid(10, 0.05)
    addBeam(g, 0, 0, 0, Infinity, 0.7, 0.4)
    expect(g.l.every((v) => v === 0)).toBe(true)
  })
})

describe('one cell size everywhere', () => {
  it('SLAM map, local and global costmap all use 0.05 m cells', () => {
    expect(SLAM_RESOLUTION).toBe(NAV2.costmapResolution)
    expect(SLAM_RESOLUTION).toBe(NAV2.globalCostmapResolution)
  })
})
