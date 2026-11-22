import { describe, expect, it } from 'vitest'
import { LAUNCH_NAV2_S, LIDAR, NAV2, PATROL_WAIT_S, WORLD } from './content/world'
import { clusterCount, clusters } from './lib/cluster'
import { cellCount } from './lib/grid'
import { inflationCost } from './lib/inflation'
import { beamAngles, beamGap, castRayHit } from './lib/scan'
import README from '../README.md?raw'

describe('README numbers match the code', () => {
  it('beam gap at max range', () => {
    const cm = (beamGap(LIDAR.maxRange, LIDAR.samples, LIDAR.minAngle, LIDAR.maxAngle) * 100).toFixed(1)
    expect(README).toContain(`gap between beams (${cm} cm at ${LIDAR.maxRange} m)`)
  })
  it('inflation cost at the edge', () => {
    const edge = inflationCost(NAV2.inflationRadius, NAV2.costScaling, NAV2.robotRadius, NAV2.inflationRadius)
    expect(README).toContain(`${edge} at the ${NAV2.inflationRadius} m edge`)
  })
  it('grid cells at his resolution', () => {
    expect(README).toContain(`${cellCount(10, NAV2.costmapResolution).toLocaleString('en-US')} at his ${NAV2.costmapResolution} m`)
  })
  it('distance per control tick', () => {
    expect(README).toContain(`${((NAV2.maxVelX / NAV2.controllerHz) * 100).toFixed(1)} cm per ${NAV2.controllerHz} Hz control tick`)
  })
  it('detector counts at the chapter start pose', () => {
    const pose = { x: 0.5, y: 0.5, yaw: Math.PI / 4 } // DetectChapter start values
    const angles = beamAngles(LIDAR.samples, LIDAR.minAngle, LIDAR.maxAngle)
    const pts = angles.map((a): [number, number] | null => {
      const d = castRayHit(pose, a, WORLD, LIDAR.minRange, LIDAR.maxRange).d
      return d === Infinity ? null : [pose.x + d * Math.cos(pose.yaw + a), pose.y + d * Math.sin(pose.yaw + a)]
    })
    expect(README).toContain(`0.1 m gives ${clusterCount(clusters(pts, 0.1))} pieces, 0.5 m the ${clusterCount(clusters(pts, 0.5))} objects`)
  })
  it('patrol start with the launch delays', () => {
    expect(README).toContain(`patrol start (${LAUNCH_NAV2_S + PATROL_WAIT_S} s with the launch file's delays)`)
  })
})
