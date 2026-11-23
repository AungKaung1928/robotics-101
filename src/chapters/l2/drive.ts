import type { Scenario } from '../../anim/contract'

/**
 * Chapter 2.7 model: Twist commands on /cmd_vel drive the simulated TurtleBot3 (gz DiffDrive, TF-Transform-Explorer
 * turtlebot3_burger.urdf.xacro:143-154). DiffDrive keeps the last command until a new one arrives (no timeout,
 * gz-sim DiffDrive.cc:641-646), so stopping the publisher does not stop the robot: you must publish zeros.
 * Speeding up is capped by max_linear_acceleration 1.0 m/s^2 (:149); slowing down is not set there, modelled as instant.
 */
export const WHEEL_SEP = 0.16, WHEEL_R = 0.033 // xacro:146-147
export const MAX_ACC = 1.0
export const DT = 0.01

/** Each wheel's ground speed (m/s) and spin (rad/s) for one Twist: v -/+ w * separation / 2. */
export function wheels(v: number, w: number) {
  const left = v - (w * WHEEL_SEP) / 2, right = v + (w * WHEEL_SEP) / 2
  return { left, right, leftRad: left / WHEEL_R, rightRad: right / WHEEL_R }
}

export interface Cmd { tS: number; v: number; w: number }
export interface Pose { x: number; y: number; th: number; v: number }

/** Robot pose every DT from t = 0 to endS under the commands (each holds until the next). */
export function simulate(cmds: Cmd[], endS: number): Pose[] {
  const out: Pose[] = []
  let x = 0, y = 0, th = 0, v = 0
  for (let k = 0; k * DT <= endS + 1e-9; k++) {
    out.push({ x, y, th, v })
    const t = k * DT
    const c = [...cmds].reverse().find((q) => q.tS <= t + 1e-9) ?? { v: 0, w: 0 }
    v = c.v > v ? Math.min(c.v, v + MAX_ACC * DT) : c.v
    x += v * Math.cos(th) * DT
    y += v * Math.sin(th) * DT
    th += c.w * DT
  }
  return out
}

/** The reader's plan: drive (v, w) for durS, then optionally publish zeros. */
export const plan = (v: number, w: number, durS: number, zeros: boolean): Cmd[] =>
  zeros ? [{ tS: 0, v, w }, { tS: durS, v: 0, w: 0 }] : [{ tS: 0, v, w }]

export const GOAL = { x: 1.0, y: 0.5, r: 0.15 }
export const END_S = 12
/** Challenge: end inside the goal circle and standing still. */
export function challengeOk(cmds: Cmd[]): boolean {
  const p = simulate(cmds, END_S).at(-1)!
  return Math.hypot(p.x - GOAL.x, p.y - GOAL.y) <= GOAL.r && p.v === 0
}

export interface DriveScene extends Record<string, unknown> { pose: Pose; trail: Pose[] }
export function scenario(cmds: Cmd[]): Scenario<DriveScene> {
  const poses = simulate(cmds, END_S)
  const durationMs = END_S * 1000
  return {
    id: 'l2-drive',
    durationMs,
    eventsMs: [...new Set([0, ...cmds.map((c) => Math.round(c.tS * 1000)), durationMs])].sort((a, b) => a - b),
    frame(tMs) {
      const k = Math.min(poses.length - 1, Math.round(Math.min(Math.max(tMs, 0), durationMs) / 1000 / DT))
      return { pose: poses[k], trail: poses.slice(0, k + 1).filter((_, i) => i % 10 === 0) }
    },
  }
}
