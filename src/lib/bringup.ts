import { LAUNCH_NAV2_S, PATROL_WAIT_S } from '../content/world'

/**
 * Launch stages of TF-Transform-Explorer (launch/tf_explorer.launch.py:68-137, README "Run"). At 0 s the launch
 * starts Gazebo, robot_state_publisher and ros_gz_bridge together (:131-137; bridged topics: config/gz_bridge.yaml:4-40).
 */
export type StageId = 'gazebo' | 'spawn' | 'slam' | 'detector' | 'nav2' | 'rviz' | 'patrol'
export type Stage = { id: StageId; t: number; needs: StageId[]; gives: string }

export const STAGES: Stage[] = [
  { id: 'gazebo', t: 0, needs: [], gives: '/clock, base_link → base_scan' },
  { id: 'spawn', t: 3, needs: ['gazebo'], gives: '/scan, odom → base_footprint' },
  { id: 'slam', t: 8, needs: ['spawn'], gives: 'map → odom' },
  { id: 'detector', t: 9, needs: ['slam'], gives: 'TF diagnostics' },
  { id: 'nav2', t: LAUNCH_NAV2_S, needs: ['slam'], gives: 'navigate_to_pose' },
  { id: 'rviz', t: 12, needs: ['spawn'], gives: 'view' },
  { id: 'patrol', t: LAUNCH_NAV2_S + PATROL_WAIT_S, needs: ['nav2'], gives: 'goals' },
]

/** Stages that start no later than a stage they need (a tie is a race): [stage, the missing one]. Empty = a clean bring-up. */
export function earlyStarts(times: Record<StageId, number>): [StageId, StageId][] {
  return STAGES.flatMap((s) => s.needs.filter((n) => times[s.id] <= times[n]).map((n): [StageId, StageId] => [s.id, n]))
}

/** Stages in start order (ties keep the launch-file order): the steps of the step-through. */
export function startOrder(times: Record<StageId, number>): StageId[] {
  return STAGES.map((s, i) => ({ id: s.id, t: times[s.id], i })).sort((a, b) => a.t - b.t || a.i - b.i).map((s) => s.id)
}
