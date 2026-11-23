import { LAUNCH_NAV2_S, LIDAR, NAV2, OBSTACLES, SLAM_RESOLUTION, TF_MAX_JUMP } from './world'
import { beamGap } from '../lib/scan'
import type { ChapterId } from '../lib/route'
import type { Strings } from '../i18n'

const gapCm = (beamGap(LIDAR.maxRange, LIDAR.samples, LIDAR.minAngle, LIDAR.maxAngle) * 100).toFixed(1)

/** One headline value per waypoint, from the tracked constants; kind = where the value comes from. Words come from `w` (EN/JA). */
export function waypointValues(w: Strings['wv']): Record<ChapterId, { v: string; kind: 'config' | 'formula' }> {
  return {
    bringup: { v: `Nav2 @ ${LAUNCH_NAV2_S} s`, kind: 'config' },
    tf: { v: w.jump(TF_MAX_JUMP), kind: 'config' },
    scan: { v: `${gapCm} cm @ ${LIDAR.maxRange} m`, kind: 'formula' },
    detect: { v: w.obstacles(OBSTACLES.length), kind: 'config' },
    grid: { v: w.cells(SLAM_RESOLUTION), kind: 'config' },
    costmap: { v: `k = ${NAV2.costScaling.toFixed(1)}`, kind: 'config' },
    goal: { v: `± ${NAV2.goalTolerance} m`, kind: 'config' },
  }
}
