import type { Scenario } from '../../anim/contract'
import { LIDAR } from '../../content/world'

/**
 * Chapter 2.3 model: a message type is a fixed list of named, typed fields.
 * Field names and line numbers: ros2/common_interfaces (humble) sensor_msgs/msg/LaserScan.msg and geometry_msgs/msg/Twist.msg.
 * Values: TF-Transform-Explorer turtlebot3_burger.urdf.xacro (LIDAR in content/world). null = set by the driver, not in config.
 */
export interface Field { name: string; type: string; line: number; value: string | null }
export const SAMPLES = LIDAR.samples
/** Gazebo's lidar spacing, both ends included: Lidar::AngleResolution() = (max - min) / (RangeCount - 1)
 * (ign-sensors6 src/Lidar.cc:346-350, gz-sensors8 :357-361). Not read from a running robot. */
export const INC = (LIDAR.maxAngle - LIDAR.minAngle) / (SAMPLES - 1)

export const LASERSCAN: Field[] = [
  { name: 'header', type: 'std_msgs/Header', line: 7, value: null },
  { name: 'angle_min', type: 'float32', line: 14, value: String(LIDAR.minAngle) },
  { name: 'angle_max', type: 'float32', line: 15, value: String(LIDAR.maxAngle) },
  { name: 'angle_increment', type: 'float32', line: 16, value: INC.toFixed(5) },
  { name: 'time_increment', type: 'float32', line: 18, value: null },
  { name: 'scan_time', type: 'float32', line: 21, value: null },
  { name: 'range_min', type: 'float32', line: 23, value: String(LIDAR.minRange) },
  { name: 'range_max', type: 'float32', line: 24, value: String(LIDAR.maxRange) },
  { name: 'ranges', type: 'float32[]', line: 26, value: `[${SAMPLES} numbers]` },
  { name: 'intensities', type: 'float32[]', line: 28, value: null },
]

/** Angle (rad, 0 = straight ahead, + = left, REP 103) of ranges[i]. */
export const beamAngle = (i: number) => LIDAR.minAngle + i * INC
/** Index whose beam is closest to `angle`. */
export const indexAt = (angle: number) => Math.min(SAMPLES - 1, Math.max(0, Math.round((angle - LIDAR.minAngle) / INC)))

export interface Twist { linear: [number, number, number]; angular: [number, number, number] }
export const TWIST_FIELDS = ['linear.x', 'linear.y', 'linear.z', 'angular.x', 'angular.y', 'angular.z'] as const
export const LIMITS = { linX: 0.26, angZ: 1.0 } // nav2_params.yaml:207 velocity_smoother max_velocity [0.26, 0.0, 1.0]

/** A two-wheel (diff drive) robot can only use linear.x and angular.z; every other field is ignored. */
export const used = (tw: Twist) => ({ v: tw.linear[0], w: tw.angular[2] })
export const ignored = (tw: Twist) =>
  TWIST_FIELDS.filter((f, i) => f !== 'linear.x' && f !== 'angular.z' && (i < 3 ? tw.linear[i] : tw.angular[i - 3]) !== 0)

/** Pose after `t` s of a constant Twist from (0, 0, heading 0): exact arc of a unicycle. */
export function pose(tw: Twist, t: number): [number, number, number] {
  const { v, w } = used(tw)
  if (Math.abs(w) < 1e-9) return [v * t, 0, 0]
  return [(v / w) * Math.sin(w * t), (v / w) * (1 - Math.cos(w * t)), w * t]
}

/** Challenge: turn left on the spot (no forward motion, positive yaw rate). */
export const challengeOk = (tw: Twist) => Math.abs(used(tw).v) < 1e-9 && used(tw).w > 0

export const FIELD_MS = 450
export interface MsgScene extends Record<string, unknown> { shown: number; beams: number }
/** Scenario: the LaserScan fields fill in one by one, then the ranges array draws as a fan of beams. */
export function scenario(): Scenario<MsgScene> {
  const fieldsMs = LASERSCAN.length * FIELD_MS
  const durationMs = fieldsMs + 1800
  return {
    id: 'l2-msgtypes',
    durationMs,
    eventsMs: [...LASERSCAN.map((_, i) => i * FIELD_MS), fieldsMs, durationMs],
    frame(tMs) {
      const t = Math.min(Math.max(tMs, 0), durationMs)
      const shown = Math.min(LASERSCAN.length, Math.floor(t / FIELD_MS) + 1)
      const beams = t <= fieldsMs ? 0 : Math.round(((t - fieldsMs) / (durationMs - fieldsMs)) * SAMPLES)
      return { shown, beams }
    },
  }
}
