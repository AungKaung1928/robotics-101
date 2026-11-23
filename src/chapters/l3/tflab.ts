/**
 * TF debugging lab (Level 3), built from TF-Transform-Explorer:
 * - the detector checks three pairs every 0.5 s (src/tf_anomaly_detector.cpp:37-39) and reports
 *   "MISSING: ..." when tf2 cannot look a pair up (:103-110);
 * - the lab test breaks the chain by never sending odom -> base_link (test/test_tf_lab_missing_link.cpp:56-58).
 * tf2 can look up any two frames joined in the tree, in either direction, so a pair is OK when both frames are connected.
 */
export type Frame = 'map' | 'odom' | 'base_link'
export type Edge = readonly [Frame, Frame] // parent, child: one broadcaster
export type Status = 'OK' | 'MISSING'

export const PAIRS: readonly Edge[] = [['map', 'odom'], ['odom', 'base_link'], ['map', 'base_link']]
export const BROKEN: readonly Edge[] = [['map', 'odom']] // SLAM sends map -> odom; nobody sends odom -> base_link
export const FIX: Edge = ['odom', 'base_link'] // the odometry broadcaster's transform
export const pairKey = ([p, c]: Edge) => `${p}->${c}`

/** Status of each checked pair, as the detector would publish it on /tf_diagnostics. */
export function diagnose(edges: readonly Edge[]): Record<string, Status> {
  const linked = (a: Frame, b: Frame): boolean => {
    const seen = new Set<Frame>([a]), todo: Frame[] = [a]
    while (todo.length) {
      const f = todo.pop()!
      for (const [p, c] of edges) for (const [x, y] of [[p, c], [c, p]] as const) if (x === f && !seen.has(y)) { seen.add(y); todo.push(y) }
    }
    return seen.has(b)
  }
  return Object.fromEntries(PAIRS.map((e) => [pairKey(e), linked(e[0], e[1]) ? 'OK' : 'MISSING']))
}

/** Fix choices the reader can apply; only the one that adds the missing broadcaster heals the chain. */
export const CHOICES = ['restart', 'resend', 'odom'] as const
export type Choice = (typeof CHOICES)[number]
export function apply(edges: readonly Edge[], c: Choice): readonly Edge[] {
  return c === 'odom' ? [...edges, FIX] : c === 'resend' ? [...edges, ['map', 'odom'] as const] : edges
}
export const healthy = (edges: readonly Edge[]) => Object.values(diagnose(edges)).every((s) => s === 'OK')

/**
 * Second failure, STALE: the detector's default max age is 1.0 s (src/tf_anomaly_detector.cpp:10) and a pair is STALE
 * only when its age is above it (:63). While the robot turns, a transform that is `age` s old puts every laser hit
 * TURN * age rad off (staleYaw), so the scan is already wrong long before the detector says STALE.
 */
export const MAX_AGE = 1.0
export const ageStatus = (age: number): 'OK' | 'STALE' => (age > MAX_AGE ? 'STALE' : 'OK')
/** Example turn rate (rad/s) for the picture, not a value from his config; 1 rad/s ≈ 57°/s. */
export const TURN = 1.0
/** Laser hits on a wall 2 m ahead, in the laser frame (laser 0.1 m in front of base_link). */
export const WALL_X = 2
export const MOUNT = { x: 0.1, y: 0, yaw: 0 }
export const HITS: [number, number][] = [-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6].map((y) => [WALL_X - MOUNT.x, y])
