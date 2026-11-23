// Level 0 "sense": one beam -> one number; the same beam spinning -> a ring of numbers. Pure model, no DOM.
import { LIDAR } from '../../content/world'

export const BEAMS = LIDAR.samples // 360 per turn, TF-Transform-Explorer turtlebot3_burger.urdf.xacro:174
export const TURNS_PER_S = LIDAR.hz // 5, xacro:168
export const MIN_M = LIDAR.minRange // 0.12, xacro:181
export const MAX_M = LIDAR.maxRange // 3.5, xacro:182
export const COVER_M = 0.02 // break it: a hand on the sensor sits this close, under MIN_M (page choice)
/** The room in the figure, robot at the origin facing +x (page choice): back wall, side walls; the front wall moves. */
export const ROOM = { back: -0.8, side: 1.0 }
export const FRONT_START = 1.5

/** Distance along a beam at angle a (rad) to the first wall of the room, front wall at x = front. */
export function hit(a: number, front: number): number {
  const c = Math.cos(a), s = Math.sin(a)
  const t: number[] = []
  if (c > 1e-12) t.push(front / c)
  if (c < -1e-12) t.push(ROOM.back / c)
  if (Math.abs(s) > 1e-12) t.push(ROOM.side / Math.abs(s))
  return Math.min(...t)
}

/** One turn: what the sensor measures for each beam (beam i points i * 360 / BEAMS degrees left of straight ahead). */
export function turn(front: number, covered = false): number[] {
  return Array.from({ length: BEAMS }, (_, i) => (covered ? COVER_M : hit((2 * Math.PI * i) / BEAMS, front)))
}

/** A reading counts only inside what the sensor can measure; outside it means "nothing there". */
export const valid = (r: number) => r >= MIN_M && r <= MAX_M

/** The front number the page shows: metres, or null = nothing there. */
export const front = (ranges: number[]) => (valid(ranges[0]) ? ranges[0] : null)

export const perSecond = () => BEAMS * TURNS_PER_S

/** Figure frame (svg units); sense.test checks the room and the farthest front wall fit. */
export const VIEW = { w: 600, h: 300, px: 115, ox: 120, oy: 150 }
export const FRONT_MAX = 4.0 // slider end: past MAX_M on purpose
