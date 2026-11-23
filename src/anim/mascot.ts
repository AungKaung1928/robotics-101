import { BOUNCY, WOBBLE, settleTime, springAt } from './spring'

/** Body pose relative to rest: lift (px, up positive), scale x / y about the feet, tilt (deg) about the feet. */
export type Pose = { y: number; sx: number; sy: number; rot: number; x?: number } // x: sideways offset (px), entrance only
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

export const ENTER_D = 40, ENTER_ROLL = 0.6 // px rolled in from the left, s of braking
/**
 * Entrance (landing page): the robot rolls in from ENTER_D px to the left, braking at a constant rate to a stop at
 * ENTER_ROLL s (x = −D·(1 − t/T)², so speed falls linearly to 0), then the brake jolt pitches it forward and it settles.
 */
export function enterPose(t: number): Pose {
  if (t <= 0) return { ...REST, x: -ENTER_D }
  if (t < ENTER_ROLL) return { ...REST, x: -ENTER_D * (1 - t / ENTER_ROLL) ** 2 }
  return { ...brakePose(t - ENTER_ROLL), x: 0 }
}
export const ENTER_S = ENTER_ROLL + JOLT_S

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

const STARS = 3, STAR_TURN_S = 0.6 // stars, seconds per lap
/**
 * Dizzy stars while the wobble runs: `STARS` stars on an ellipse above the head (a circle seen from the side, so the
 * motion follows an arc), one lap per STAR_TURN_S; stars on the far side are smaller, fainter and drawn behind the head
 * (`front` false), and all fade over the last 40 % of the wobble. Empty outside (0, OOPS_S).
 */
export function dizzyStars(t: number, cx = 32, cy = 7, rx = 13, ry = 3.5): { x: number; y: number; s: number; o: number; front: boolean }[] {
  if (t <= 0 || t >= OOPS_S) return []
  const fade = Math.min(1, (OOPS_S - t) / (0.4 * OOPS_S))
  return Array.from({ length: STARS }, (_, i) => {
    const a = (2 * Math.PI * t) / STAR_TURN_S + (2 * Math.PI * i) / STARS, near = (Math.sin(a) + 1) / 2 // 1 = front
    return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), s: 0.85 + 0.35 * near, o: fade * (0.45 + 0.55 * near), front: near >= 0.5 }
  })
}

/** Face change as a blink-through: eyes squash shut, the face swaps while closed, eyes reopen (a hard cut otherwise). */
export const SWAP_S = 0.14
export function faceSwap(t: number): { sy: number; showNew: boolean } {
  const u = t / SWAP_S
  if (u <= 0) return { sy: 1, showNew: false }
  if (u >= 1) return { sy: 1, showNew: true }
  return u < 0.5 ? { sy: 1 - 1.8 * u, showNew: false } : { sy: 0.1 + 1.8 * (u - 0.5), showNew: true }
}

/** Reduced motion: the reaction's cue as one still frame (no movement): stars at full strength, sparks just out. */
export const STILL_DIZZY = OOPS_S * 0.15
export const STILL_SPARK = SPARK_AT + 0.15

/** Per-robot blink phase (ms, ≤ 0) from a stable id, so two robots on one page do not blink in sync. */
export const BLINK_MS = 9400
export const blinkDelay = (id: string): number => phaseDelay(id, BLINK_MS)
/** A stable negative delay in (−period, 0] from an id (FNV-1a hash): a per-robot start offset for a CSS loop. */
function phaseDelay(id: string, period: number): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0
  return -(h % period)
}
export const BREATH_MS = 3200, SWAY_MS = 5300 // must match the m-breath / m-sway durations in mascot.css
/** Per-robot phase for the breath and sway loops too, so two robots on one page never move in lockstep. */
export const idlePhase = (id: string) => ({ breath: phaseDelay(id + 'b', BREATH_MS), sway: phaseDelay(id + 's', SWAY_MS) })
