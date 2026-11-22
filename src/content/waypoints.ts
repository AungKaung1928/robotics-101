import { LAUNCH_NAV2_S, LIDAR, NAV2, OBSTACLES, TF_MAX_JUMP } from './world'
import { beamGap } from '../lib/scan'
import type { ChapterId } from '../lib/route'

const gapCm = (beamGap(LIDAR.maxRange, LIDAR.samples, LIDAR.minAngle, LIDAR.maxAngle) * 100).toFixed(1)

/** One headline value per waypoint, from the tracked constants; kind = where the value comes from. */
export const WAYPOINT_VALUE: Record<ChapterId, { v: string; kind: 'config' | 'formula' }> = {
  bringup: { v: `Nav2 @ ${LAUNCH_NAV2_S} s`, kind: 'config' },
  tf: { v: `jump > ${TF_MAX_JUMP} m`, kind: 'config' },
  scan: { v: `${gapCm} cm @ ${LIDAR.maxRange} m`, kind: 'formula' },
  detect: { v: `${OBSTACLES.length} obstacles`, kind: 'config' },
  grid: { v: `${NAV2.costmapResolution} m cells`, kind: 'config' },
  costmap: { v: `k = ${NAV2.costScaling.toFixed(1)}`, kind: 'config' },
  goal: { v: `± ${NAV2.goalTolerance} m`, kind: 'config' },
}
