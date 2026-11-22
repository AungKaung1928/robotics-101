/** Launch stages of TF-Transform-Explorer (launch/tf_explorer.launch.py:68-137, README "Run"). */
export type StageId = 'gazebo' | 'spawn' | 'slam' | 'detector' | 'nav2' | 'rviz' | 'patrol'
export type Stage = { id: StageId; t: number; needs: StageId[]; gives: string }

export const STAGES: Stage[] = [
  { id: 'gazebo', t: 0, needs: [], gives: '/clock' },
  { id: 'spawn', t: 3, needs: ['gazebo'], gives: '/scan, odom → base_link' },
  { id: 'slam', t: 8, needs: ['spawn'], gives: 'map → odom' },
  { id: 'detector', t: 9, needs: ['slam'], gives: 'TF diagnostics' },
  { id: 'nav2', t: 10, needs: ['slam'], gives: 'navigate_to_pose' },
  { id: 'rviz', t: 12, needs: ['spawn'], gives: 'view' },
  { id: 'patrol', t: 25, needs: ['nav2'], gives: 'goals' },
]

/** Stages that start no later than a stage they need (a tie is a race): [stage, the missing one]. Empty = a clean bring-up. */
export function earlyStarts(times: Record<StageId, number>): [StageId, StageId][] {
  return STAGES.flatMap((s) => s.needs.filter((n) => times[s.id] <= times[n]).map((n): [StageId, StageId] => [s.id, n]))
}
