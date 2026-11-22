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
