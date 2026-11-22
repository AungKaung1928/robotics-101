/** Path length the robot must still drive: the goal counts as reached on entering the tolerance circle. */
export function driveDistance(d: number, tolerance: number): number {
  return Math.max(0, d - tolerance)
}

/** Lower bound on time to goal: full speed from the first tick, no acceleration limit. */
export function minTime(d: number, tolerance: number, speed: number): number {
  return driveDistance(d, tolerance) / speed
}

/** Controller ticks to get there at full speed: each tick moves speed / hz. */
export function ticksToGoal(d: number, tolerance: number, speed: number, hz: number): number {
  // The epsilon keeps float error (2.6 / 0.013 = 200.00000000000003) from adding a tick.
  return Math.max(0, Math.ceil(driveDistance(d, tolerance) / (speed / hz) - 1e-9))
}

/**
 * Minimum time with equal acceleration and braking limits a (trapezoid speed profile): drive/v + v/a when the
 * robot reaches full speed, else a triangle 2·sqrt(drive/a).
 */
export function minTimeAccel(d: number, tolerance: number, speed: number, accel: number): number {
  const drive = driveDistance(d, tolerance)
  return drive >= (speed * speed) / accel ? drive / speed + speed / accel : 2 * Math.sqrt(drive / accel)
}
