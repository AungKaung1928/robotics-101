import { describe, expect, it } from 'vitest'
import { LIDAR, WALLS, WORLD } from '../content/world'
import { clusterCount, clusters, objectsInView } from './cluster'
import { beamAngles, castRayHit, sensorPose } from './scan'

const P = (x: number, y: number): [number, number] => [x, y]
describe('clusters', () => {
  it('splits where neighbours are farther apart than the threshold', () => {
    const pts = [P(0, 0), P(0.1, 0), P(1, 0), P(1.1, 0)]
    expect(clusters(pts, 0.2)).toEqual([0, 0, 1, 1])
    expect(clusters(pts, 1)).toEqual([0, 0, 0, 0])
  })
  it('a beam with no return breaks a cluster', () => {
    expect(clusters([P(0, 0), null, P(0.05, 0), P(9, 9)], 1)).toEqual([0, -1, 1, 2])
  })
  it('joins a cluster across the end of the circle', () => {
    expect(clusters([P(0, 0), P(5, 5), P(0.05, 0)], 0.2)).toEqual([0, 1, 0])
    expect(clusterCount(clusters([P(0, 0), P(5, 5), P(0.05, 0)], 0.2))).toBe(2)
  })
})

describe('one scan of the arena (robot at 0.5, 0.5, heading 45°: the chapter start)', () => {
  const pose = sensorPose({ x: 0.5, y: 0.5, yaw: Math.PI / 4 }) // the page casts from base_scan
  const angles = beamAngles(LIDAR.samples, LIDAR.minAngle, LIDAR.maxAngle)
  const hits = angles.map((a) => castRayHit(pose, a, WORLD, LIDAR.minRange, LIDAR.maxRange))
  const pts = hits.map((h, i) => (h.d === Infinity ? null : P(pose.x + h.d * Math.cos(pose.yaw + angles[i]), pose.y + h.d * Math.sin(pose.yaw + angles[i]))))
  const seen = new Set(hits.filter((h) => h.shape >= 0).map((h) => h.shape)).size
  it('sees the 3 obstacles and no wall (walls beyond 3.5 m)', () => {
    expect(seen).toBe(3)
  })
  it('0.2 m and up find exactly the 3 objects; 0.1 m gives 5', () => {
    expect(clusterCount(clusters(pts, 0.5))).toBe(seen)
    expect(clusterCount(clusters(pts, 0.2))).toBe(seen)
    expect(clusterCount(clusters(pts, 0.1))).toBe(5)
  })
  it('a 1 cm threshold over-segments: beams on one object are farther apart than that', () => {
    expect(clusterCount(clusters(pts, 0.01))).toBeGreaterThan(seen)
  })
})

describe('objectsInView', () => {
  it('counts all walls as one object', () => {
    expect(objectsInView([-1, 0, 1, 1, 3, 5, 6], 4)).toBe(3)
  })
  it('near the north-east corner two walls meet: one cluster, one object', () => {
    const pose = { x: 4, y: 4, yaw: 0 }
    const angles = beamAngles(LIDAR.samples, LIDAR.minAngle, LIDAR.maxAngle)
    const hits = angles.map((a) => castRayHit(pose, a, WORLD, LIDAR.minRange, LIDAR.maxRange))
    const pts = hits.map((h, i) => (h.d === Infinity ? null : P(pose.x + h.d * Math.cos(angles[i]), pose.y + h.d * Math.sin(angles[i]))))
    const walls = new Set(hits.filter((h) => h.shape >= 0 && h.shape < WALLS.length).map((h) => h.shape)).size
    expect(walls).toBe(2)
    expect(clusterCount(clusters(pts, 0.5))).toBe(objectsInView(hits.map((h) => h.shape), WALLS.length))
  })
})

import { gaussian } from './noise'
describe('his sensor noise splits surfaces', () => {
  it('start pose, 0.1 m threshold: 5 pieces clean, 7 with σ = 1 cm (seed 1, as the page)', () => {
    const pose = sensorPose({ x: 0.5, y: 0.5, yaw: Math.PI / 4 })
    const A = beamAngles(LIDAR.samples, LIDAR.minAngle, LIDAR.maxAngle)
    const n = gaussian(A.length, LIDAR.noiseStd, 1)
    const pts = A.map((a, i): [number, number] | null => {
      const d = castRayHit(pose, a, WORLD, LIDAR.minRange, LIDAR.maxRange).d
      return d === Infinity ? null : [pose.x + (d + n[i]) * Math.cos(pose.yaw + a), pose.y + (d + n[i]) * Math.sin(pose.yaw + a)]
    })
    expect(clusterCount(clusters(pts, 0.1))).toBe(7)
  })
})
