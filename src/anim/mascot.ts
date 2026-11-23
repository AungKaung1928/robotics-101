import { BOUNCY, WOBBLE, settleTime, springAt } from './spring'

/** Body pose relative to rest: lift (px, up positive), scale x / y about the feet, tilt (deg) about the feet. */
export type Pose = { y: number; sx: number; sy: number; rot: number }
export const REST: Pose = { y: 0, sx: 1, sy: 1, rot: 0 }

/** Squash or stretch that keeps the area: sy given, sx = 1 / sy (a squashed body gets wider, not smaller). */
const squash = (sy: number) => ({ sx: 1 / sy, sy })

const CROUCH = 0.08, AIR = 0.3, HEIGHT = 10, LAND_V = -3 // s, s, px, scale units / s at touchdown
const LAND = CROUCH + AIR

/**
 * Happy bounce when a challenge is solved: crouch (squash), jump (stretch on take-off, round at the top),
 * land into a bouncy spring squash that overshoots once or twice and settles.
 */
export function happyPose(t: number): Pose {
  if (t <= 0) return REST
  if (t < CROUCH) return { y: 0, rot: 0, ...squash(1 - 0.12 * Math.sin((Math.PI / 2) * (t / CROUCH))) }
  if (t < LAND) {
    const p = (t - CROUCH) / AIR
    return { y: HEIGHT * 4 * p * (1 - p), rot: 0, ...squash(1 + 0.1 * (1 - p) * (1 - p)) }
  }
  return { y: 0, rot: 0, ...squash(1 + springAt(t - LAND, BOUNCY, 0, LAND_V)) }
}
export const HAPPY_S = LAND + settleTime(BOUNCY, 0, LAND_V, 0.004)

const KICK = 160 // deg / s: the shove when the reader breaks something

/** Wobble when the reader breaks something: a shove that rocks the body side to side about its feet, dying out. */
export function oopsPose(t: number): Pose {
  if (t <= 0) return REST
  return { ...REST, rot: springAt(t, WOBBLE, 0, KICK) }
}
export const OOPS_S = settleTime(WOBBLE, 0, KICK, 0.3)
