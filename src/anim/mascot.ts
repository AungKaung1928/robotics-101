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

const KICK = 160 // deg / s: the shove when the reader breaks something

/** Wobble when the reader breaks something: a shove that rocks the body side to side about its feet, dying out. */
export function oopsPose(t: number): Pose {
  if (t <= 0) return REST
  return { ...REST, rot: springAt(t, WOBBLE, 0, KICK) }
}
export const OOPS_S = settleTime(WOBBLE, 0, KICK, 0.3)

const SPARKS = 6, G = 160, SPEED = 70, SPARK_S = 0.7 // count, px/s² down, px/s, s
/** Sparks pop at the top of the jump, from the top of the lifted head. */
export const SPARK_AT = CROUCH + AIR / 2

/**
 * Sparks for a solved challenge: thrown from the top of the head in a fan (−60° … +60° from straight up) at the
 * top of the bounce (`t` = time since the bounce started), then falling under gravity and fading out.
 * Positions in the mascot's 64-unit box.
 */
export function sparks(time: number): { x: number; y: number; o: number }[] {
  return burst(time - SPARK_AT, 32, 12 - HEIGHT)
}

/**
 * A burst of `n` sparks from (x, y): thrown in a fan (−60° … +60° from straight up), every other one a little slower,
 * then falling under gravity and fading over `life` s. Units are the figure's own (px in the mascot's 64 box).
 */
export function burst(t: number, x: number, y: number, n = SPARKS, speed = SPEED, g = G, life = SPARK_S): { x: number; y: number; o: number }[] {
  if (t <= 0 || t >= life) return []
  return Array.from({ length: n }, (_, i) => {
    const a = ((i / (n - 1)) * 120 - 60) * (Math.PI / 180), v = speed * (Math.min(i, n - 1 - i) % 2 ? 0.8 : 1)
    return { x: x + v * Math.sin(a) * t, y: y - v * Math.cos(a) * t + 0.5 * g * t * t, o: 1 - t / life }
  })
}

/** Length of the happy reaction: until the landing spring has settled and the last spark has faded. */
export const HAPPY_S = Math.max(LAND + settleTime(BOUNCY, 0, LAND_V, 0.004), SPARK_AT + SPARK_S)

const BOOP_KICK = 70 // deg / s: a fingertip nudge, well under the oops shove

/** Boop when the pointer arrives (Josh Comeau's "boop"): a small spring tilt and a 2 px hop, then back to rest. */
export function boopPose(t: number): Pose {
  if (t <= 0) return REST
  return { ...REST, rot: springAt(t, BOUNCY, 0, BOOP_KICK), y: t < 0.18 ? 2 * Math.sin((Math.PI * t) / 0.18) : 0 }
}
export const BOOP_S = settleTime(BOUNCY, 0, BOOP_KICK, 0.2)

/** Eye offset (px in the 64 box) for a gaze `look` in [−1, 1]: up to 2.5 px, so the pupils stay inside the head. */
export function eyeShift(look: number): number {
  return 2.5 * Math.min(1, Math.max(-1, Number.isFinite(look) ? look : 0))
}

export const WHEEL_R = 5 // wheel radius in the mascot's 64-unit box

/** Wheel turn (deg) after rolling `dist` (same units as the radius) without slipping: θ = s / r, as wheel odometry assumes. */
export function wheelAngle(dist: number, r = WHEEL_R): number {
  return ((dist / r) * 180) / Math.PI
}

const JOLT = 90 // deg / s of pitch rate at the jolt

/**
 * Inertia on starts and stops: braking pitches the body forward (positive tilt, towards the direction of travel)
 * and it springs back; starting leans it back the same way. Tilt is about the feet, like oops, but smaller.
 */
export function brakePose(t: number): Pose {
  return t <= 0 ? REST : { ...REST, rot: springAt(t, BOUNCY, 0, JOLT) }
}
export function startPose(t: number): Pose {
  return t <= 0 ? REST : { ...REST, rot: springAt(t, BOUNCY, 0, -JOLT) }
}
export const JOLT_S = settleTime(BOUNCY, 0, JOLT, 0.2)

export const HEAD_LAG = 0.04 // s the head trails the body (overlapping action; Cooper, 12 principles in games)

/**
 * Follow-through for the head: it shows the body's pose from `lag` seconds ago, relative to the body now, so on a
 * wobble or a hop it trails and then catches up. Zero when the body is still (at rest and after the reaction).
 */
export function headLag(f: (t: number) => Pose, t: number, lag = HEAD_LAG): { rot: number; dy: number } {
  if (t <= 0) return { rot: 0, dy: 0 }
  const now = f(t), before = f(Math.max(t - lag, 0))
  return { rot: before.rot - now.rot, dy: now.y - before.y }
}
