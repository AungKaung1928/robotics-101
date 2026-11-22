import { describe, expect, it } from 'vitest'
import { LIDAR, NAV2 } from './content/world'
import { inflationCost } from './lib/inflation'
import { beamGap } from './lib/scan'
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
})
