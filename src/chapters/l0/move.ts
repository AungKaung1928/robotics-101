// Level 0 "move": two wheels -> the drawn path (differential drive). Pure model, no DOM.

/** TurtleBot3 Burger, from TF-Transform-Explorer description/turtlebot3_burger.urdf.xacro:146-147. */
export const WHEEL_GAP_M = 0.16 // distance between the two wheels
export const WHEEL_RADIUS_M = 0.033
/** Burger top speed, ROBOTIS e-Manual TurtleBot3 Features (specifications table). */
export const TOP_SPEED = 0.22
export const LEFT = 0.15 // the page holds the left wheel here; the reader drags the right one (page choice)
export const SECONDS = 4 // the drawn path covers this long (page choice)
export const SLIP = 0.5 // break it: the slipping left wheel only delivers this share of its speed (page choice)

export interface Pose { x: number; y: number; yaw: number }
export type Kind = 'straight' | 'curveLeft' | 'curveRight' | 'spin' | 'still'

const EPS = 1e-9

/** Body speed (m/s) and turn speed (rad/s) from the two wheel speeds (m/s). Positive turn = to the left. */
export function body(left: number, right: number) {
  return { v: (left + right) / 2, w: (right - left) / WHEEL_GAP_M }
}

/** What the reader sees: straight, a curve, a spin on the spot, or standing still. */
export function kind(left: number, right: number): Kind {
  const { v, w } = body(left, right)
  if (Math.abs(v) < EPS && Math.abs(w) < EPS) return 'still'
  if (Math.abs(w) < EPS) return 'straight'
  if (Math.abs(v) < EPS) return 'spin'
  return w > 0 ? 'curveLeft' : 'curveRight'
}

/** Poses every dt s for `seconds`, start at the origin facing +x. `slip` scales the left wheel's delivered speed. */
export function path(left: number, right: number, seconds = SECONDS, slip = 1, dt = 0.02): Pose[] {
  const { v, w } = body(left * slip, right)
  const out: Pose[] = [{ x: 0, y: 0, yaw: 0 }]
  const n = Math.round(seconds / dt)
  for (let i = 1; i <= n; i++) {
    const t = i * dt
    // exact arc (no step error): straight when w = 0
    out.push(Math.abs(w) < EPS
      ? { x: v * t, y: 0, yaw: 0 }
      : { x: (v / w) * Math.sin(w * t), y: (v / w) * (1 - Math.cos(w * t)), yaw: w * t })
  }
  return out
}

/** Wheel turns per second for a wheel speed (m/s): what the motor has to do. */
export const turnsPerS = (speed: number) => speed / (2 * Math.PI * WHEEL_RADIUS_M)

/** Figure frame: svg units per metre and the start point; move.test checks every slider path stays inside. */
export const VIEW = { w: 600, h: 300, px: 270, ox: 250, oy: 170 }

/** Break it, as one sentence from the actual values: which template, the numbers and what the path does. */
export function slipFacts(right: number) {
  const eff = LEFT * SLIP
  return { same: Math.abs(right - LEFT) < EPS, told: LEFT.toFixed(2), eff: eff.toFixed(3), right: Math.abs(right).toFixed(2),
    dir: right < 0 ? 'back' as const : 'fwd' as const, turn: kind(eff, right) }
}

/** Fill {name} slots in a template; a slot with no value stays visible so a test catches it. */
export const fill = (tpl: string, v: Record<string, string>) => tpl.replace(/\{(\w+)\}/g, (m, k: string) => v[k] ?? m)
