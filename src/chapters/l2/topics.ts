import type { Scenario } from '../../anim/contract'
import { LIDAR, MEASURED } from '../../content/world'

/**
 * Chapter 2.2 model: a topic is a named channel. A publisher sends without knowing who listens;
 * every subscriber whose name resolves to the same topic gets its own copy; a wrong name gets nothing, with no error.
 * Publishers, subscribers and rates: TF-Transform-Explorer config (gz_bridge.yaml, slam_params.yaml, nav2_params.yaml, rviz).
 */
export interface Topic { name: string; type: string; hz: number; measuredHz: string; pub: string }
export const TOPICS: Topic[] = [
  { name: '/scan', type: 'sensor_msgs/msg/LaserScan', hz: LIDAR.hz, measuredHz: `${MEASURED.scanHz[0]}–${MEASURED.scanHz[1]}`, pub: 'ros_gz_bridge' },
  { name: '/cmd_vel', type: 'geometry_msgs/msg/Twist', hz: 20, measuredHz: MEASURED.cmdVelHz.toFixed(1), pub: 'nav2' },
]

export interface Sub { node: string; topic: string }
/** Subscriptions as written in the config; my_node's name comes from the reader. */
export const subs = (slamTopic: string, mine: string): Sub[] => [
  { node: 'slam_toolbox', topic: slamTopic },
  { node: 'nav2', topic: '/scan' },
  { node: 'rviz2', topic: '/scan' },
  { node: 'my_node', topic: mine },
  { node: 'ros_gz_bridge', topic: '/cmd_vel' },
]

/**
 * Topic name resolution for a node with no namespace (ROS 2 topic name rules): 'scan' -> '/scan',
 * '~/scan' -> '/<node>/scan'. Invalid (empty, spaces, first character not a letter, ~ or /, '__') -> null.
 */
export function resolve(name: string, node: string): string | null {
  const n = name.trim()
  if (!/^(~\/|\/)?[A-Za-z][A-Za-z0-9_]*(\/[A-Za-z_][A-Za-z0-9_]*)*$/.test(n) || n.includes('__')) return null
  if (n.startsWith('~/')) return `/${node}/${n.slice(2)}`
  return n.startsWith('/') ? n : `/${n}`
}

/** Messages a subscriber receives in `seconds`: the publisher's count when the names match, else 0. */
export function received(sub: Sub, seconds: number): number {
  const full = resolve(sub.topic, sub.node)
  const t = TOPICS.find((x) => x.name === full)
  return t ? Math.floor(seconds * t.hz + 1e-9) + 1 : 0
}

export const challengeOk = (mine: string) => resolve(mine, 'my_node') === '/scan'

export const TRAVEL_MS = 450 // drawn travel time of a dot along a wire (not a measured latency)
export const DURATION_MS = 3000

export interface Dot { node: string; topic: string; p: number }
export interface TopicsScene extends Record<string, unknown> { dots: Dot[]; counts: Record<string, number> }

/** Scenario: each publish sends one dot per matching subscriber; dots travel TRAVEL_MS then count as received. */
export function scenario(slamTopic: string, mine: string): Scenario<TopicsScene> {
  const ss = subs(slamTopic, mine)
  return {
    id: 'l2-topics',
    durationMs: DURATION_MS,
    eventsMs: [0, ...Array.from({ length: 3 * LIDAR.hz }, (_, k) => Math.round(((k + 1) * 1000) / LIDAR.hz)).filter((t) => t <= DURATION_MS)],
    frame(tMs) {
      const t = Math.min(Math.max(tMs, 0), DURATION_MS)
      const dots: Dot[] = []
      const counts: Record<string, number> = {}
      for (const s of ss) {
        const topic = TOPICS.find((x) => x.name === resolve(s.topic, s.node))
        counts[s.node] = 0
        if (!topic) continue
        const period = 1000 / topic.hz
        for (let k = 0; k * period <= t; k++) {
          const p = (t - k * period) / TRAVEL_MS
          if (p >= 1) counts[s.node]++
          else dots.push({ node: s.node, topic: topic.name, p })
        }
      }
      return { dots, counts }
    },
  }
}
