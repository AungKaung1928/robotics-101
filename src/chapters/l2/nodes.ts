import type { Scenario } from '../../anim/contract'

/**
 * Chapter 2.1 model: a robot is many small programs (nodes), each with one job.
 * The nodes, start times and links are the ones launch/tf_explorer.launch.py starts in TF-Transform-Explorer.
 * Left out for one idea at a time: spawn_burger (one-shot), tf_monitor_node, frame_broadcaster_node.
 */
export type NodeId = 'bridge' | 'rsp' | 'slam' | 'nav2' | 'patrol' | 'anomaly' | 'rviz'

/** x = column (0 left, 1 right), y = layer: a node sits below every node it needs. */
export interface RosNode { id: NodeId; name: string; startS: number; needs: NodeId[]; lines: string; x: number; y: number }

export const NODES: RosNode[] = [
  { id: 'bridge', name: 'ros_gz_bridge', startS: 0, needs: [], lines: '59-65', x: 0, y: 0 },
  { id: 'rsp', name: 'robot_state_publisher', startS: 0, needs: [], lines: '41-48', x: 1, y: 0 },
  { id: 'slam', name: 'slam_toolbox', startS: 8, needs: ['bridge', 'rsp'], lines: '68-83', x: 0, y: 1 },
  { id: 'anomaly', name: 'tf_anomaly_detector', startS: 9, needs: ['bridge', 'rsp'], lines: '101-113', x: 1, y: 1 },
  { id: 'nav2', name: 'nav2 (a group of nodes)', startS: 10, needs: ['bridge', 'rsp', 'slam'], lines: '85-99', x: 0, y: 2 },
  { id: 'patrol', name: 'patrol_node', startS: 9, needs: ['nav2'], lines: '101-113', x: 0, y: 3 },
  { id: 'rviz', name: 'rviz2', startS: 12, needs: ['bridge', 'rsp', 'slam'], lines: '117-126', x: 1, y: 2 },
]
export const byId = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<NodeId, RosNode>
export const END_S = 14

/** A node does its job when it runs and every node it needs does its job (transitively). */
export function working(stopped: Set<NodeId>, startedBy = Infinity): Set<NodeId> {
  const ok = new Set<NodeId>()
  let grew = true
  while (grew) {
    grew = false
    for (const n of NODES) {
      if (ok.has(n.id) || stopped.has(n.id) || n.startS > startedBy) continue
      if (n.needs.every((d) => ok.has(d))) { ok.add(n.id); grew = true }
    }
  }
  return ok
}

export const patrols = (stopped: Set<NodeId>) => working(stopped).has('patrol')

/** Nodes nobody else needs: stopping them never stops the patrol. */
export const optional = () => NODES.filter((n) => patrols(new Set([n.id]))).map((n) => n.id)

/** Challenge: stop as many nodes as possible while the robot still patrols. */
export const challengeOk = (stopped: Set<NodeId>) => patrols(stopped) && stopped.size === optional().length

export interface NodesScene extends Record<string, unknown> { started: NodeId[]; working: NodeId[] }

/** Scenario: the launch file's start-up, second by second; a node lights up once it and its inputs run. */
export function scenario(stopped: Set<NodeId>): Scenario<NodesScene> {
  const durationMs = END_S * 1000
  return {
    id: 'l2-nodes',
    durationMs,
    eventsMs: [...new Set([0, ...NODES.map((n) => n.startS * 1000), durationMs])].sort((a, b) => a - b),
    frame(tMs) {
      const t = Math.min(Math.max(tMs, 0), durationMs) / 1000
      return {
        started: NODES.filter((n) => n.startS <= t && !stopped.has(n.id)).map((n) => n.id),
        working: [...working(stopped, t)],
      }
    },
  }
}
