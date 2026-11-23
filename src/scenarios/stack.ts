import { BOUNCY, springAt } from '../anim/spring'

/**
 * Level 0.3: the tools as a stack that builds bottom-up, each layer resting on what it needs: Linux (+ terminal),
 * ROS 2 on top of it, Python and C++ side by side (ROS 2's client libraries rclpy and rclcpp), your robot code on top.
 * Each layer falls in under gravity and lands with a spring squash; `slot` = row from the bottom, `col` = 0 / 1 for
 * the side-by-side pair.
 */
export type Layer = { id: 'linux' | 'ros2' | 'python' | 'cpp' | 'app'; slot: number; col: 0 | 1 | null }
export const LAYERS: Layer[] = [
  { id: 'linux', slot: 0, col: null },
  { id: 'ros2', slot: 1, col: null },
  { id: 'python', slot: 2, col: 0 },
  { id: 'cpp', slot: 2, col: 1 },
  { id: 'app', slot: 3, col: null },
]

export const GAP = 0.7 // s between drops
const DROP = 120, G = 2400 // px fallen, px/s²
const FALL = Math.sqrt((2 * DROP) / G) // ≈ 0.316 s
const LAND_V = -2.5 // squash speed at touchdown, scale units / s

/** Layer i at time t: hidden before its drop, then height above its rest place (px) and vertical scale (squash). */
export function layerAt(i: number, t: number): { shown: boolean; lift: number; sy: number } {
  const u = t - i * GAP
  if (u < 0) return { shown: false, lift: DROP, sy: 1 }
  if (u < FALL) return { shown: true, lift: DROP - 0.5 * G * u * u, sy: 1 + 0.06 * (u / FALL) } // stretches as it speeds up
  return { shown: true, lift: 0, sy: 1 + springAt(u - FALL, BOUNCY, 0, LAND_V) }
}

/** Step events: the moment each layer lands (what it rests on is already there). */
export const stackEvents = (): number[] => LAYERS.map((_, i) => i * GAP + FALL)
export const STACK_END = (LAYERS.length - 1) * GAP + FALL + 0.6
