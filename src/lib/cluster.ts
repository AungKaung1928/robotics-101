/**
 * Breakpoint clustering of one scan with a constant threshold: walk the beams in order and start a new cluster
 * where two neighbouring hit points are more than `threshold` m apart, or where a beam has no return.
 * The scan covers the full circle, so a cluster running over the last beam continues into the first.
 * Returns the cluster label of each beam (-1 = no return).
 */
export function clusters(points: ([number, number] | null)[], threshold: number): number[] {
  const n = points.length
  const label = Array.from({ length: n }, () => -1)
  let k = -1
  for (let i = 0; i < n; i++) {
    const p = points[i], q = i > 0 ? points[i - 1] : null
    if (!p) continue
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > threshold) k++
    label[i] = k
  }
  const first = points[0], last = points[n - 1]
  if (k > 0 && first && last && Math.hypot(first[0] - last[0], first[1] - last[1]) <= threshold) {
    const join = label[n - 1]
    for (let i = n - 1; i >= 0 && label[i] === join; i--) label[i] = 0
  }
  return label
}

export const clusterCount = (label: number[]) => new Set(label.filter((l) => l >= 0)).size

/** Objects a scan sees: the walls form one closed ring, so every wall hit counts as one object; each obstacle hit is its own. */
export function objectsInView(shapes: number[], wallCount: number): number {
  return new Set(shapes.filter((s) => s >= 0).map((s) => (s < wallCount ? 'wall' : s))).size
}
