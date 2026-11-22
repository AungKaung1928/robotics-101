import { BASE_TO_SCAN, type Shape } from '../content/world'
import { compose } from './tf2d'

export type Pose = { x: number; y: number; yaw: number }

/** Beam angles of one scan, evenly spaced from min to max inclusive (Gazebo ray sensor). */
export function beamAngles(samples: number, min: number, max: number): number[] {
  const step = (max - min) / (samples - 1)
  return Array.from({ length: samples }, (_, i) => min + i * step)
}

/** Arc length between two neighbouring beams at range r: r * angular step. */
export function beamGap(r: number, samples: number, min: number, max: number): number {
  return (r * (max - min)) / (samples - 1)
}

/** Distance the robot moves between two scans. */
export function movePerScan(speed: number, hz: number): number {
  return speed / hz
}

// Distance along the ray (ox,oy)+t(dx,dy), |d| = 1, to the first hit on a shape; Infinity if none.
function hitBox(ox: number, oy: number, dx: number, dy: number, b: Extract<Shape, { kind: 'box' }>): number {
  // Move the ray into the box frame, then slab test against the axis-aligned box.
  const c = Math.cos(-b.yaw), s = Math.sin(-b.yaw)
  const px = c * (ox - b.x) - s * (oy - b.y), py = s * (ox - b.x) + c * (oy - b.y)
  const qx = c * dx - s * dy, qy = s * dx + c * dy
  let tmin = -Infinity, tmax = Infinity
  for (const [p, q, half] of [[px, qx, b.w / 2], [py, qy, b.h / 2]]) {
    if (Math.abs(q) < 1e-12) {
      if (Math.abs(p) > half) return Infinity
      continue
    }
    const t1 = (-half - p) / q, t2 = (half - p) / q
    tmin = Math.max(tmin, Math.min(t1, t2))
    tmax = Math.min(tmax, Math.max(t1, t2))
  }
  if (tmax < tmin || tmax < 0) return Infinity
  return tmin >= 0 ? tmin : Infinity // origin inside the box: no hit
}

function hitDisc(ox: number, oy: number, dx: number, dy: number, d: Extract<Shape, { kind: 'disc' }>): number {
  const fx = ox - d.x, fy = oy - d.y
  const b = fx * dx + fy * dy
  const c = fx * fx + fy * fy - d.r * d.r
  const disc = b * b - c
  if (disc < 0) return Infinity
  const t = -b - Math.sqrt(disc)
  return t >= 0 ? t : Infinity
}

/** One beam: range to the nearest hit and the index of the shape hit; range Infinity and shape -1 outside [minRange, maxRange]. */
export function castRayHit(pose: Pose, angle: number, world: Shape[], minRange: number, maxRange: number): { d: number; shape: number } {
  const a = pose.yaw + angle
  const dx = Math.cos(a), dy = Math.sin(a)
  let best = Infinity, shape = -1
  world.forEach((s, i) => {
    const t = s.kind === 'box' ? hitBox(pose.x, pose.y, dx, dy, s) : hitDisc(pose.x, pose.y, dx, dy, s)
    if (t < best) [best, shape] = [t, i]
  })
  return best >= minRange && best <= maxRange ? { d: best, shape } : { d: Infinity, shape: -1 }
}

/** Range reading of one beam: nearest hit, or Infinity outside [minRange, maxRange] (no return). */
export function castRay(pose: Pose, angle: number, world: Shape[], minRange: number, maxRange: number): number {
  return castRayHit(pose, angle, world, minRange, maxRange).d
}

/** Pose of the LiDAR (base_scan) for a robot (base_link) pose: 3.2 cm behind the centre (URDF scan_joint). */
export function sensorPose(robot: Pose): Pose {
  return compose(robot, BASE_TO_SCAN)
}
