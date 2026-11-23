// Level 0 "act": a decision becomes two numbers (forward speed, turn speed) -> two wheel speeds; nothing stops at once.
import { NAV2 } from '../../content/world'
import { SCAN_HZ } from '../l1/decide'
import { TOP_SPEED, WHEEL_GAP_M } from './move'

export const BRAKE = Math.abs(NAV2.accLimX) // 2.5 m/s², TF-Transform-Explorer config/nav2_params.yaml:45 and decel_lim_x -2.5 at :48
export const TURN_MAX = 1.5 // slider end, rad/s (page choice)

/** Forward speed v (m/s) and turn speed w (rad/s, + = left) -> left and right wheel speeds (m/s); inverse of move.body. */
export const wheels = (v: number, w: number) => ({ left: v - (w * WHEEL_GAP_M) / 2, right: v + (w * WHEEL_GAP_M) / 2 })

/** A wheel cannot go faster than the robot's top speed. */
export const tooFast = (v: number, w: number) => { const k = wheels(v, w); return Math.max(Math.abs(k.left), Math.abs(k.right)) > TOP_SPEED + 1e-9 }

/** After "stop": braking at BRAKE, the robot still rolls v² / (2 BRAKE) metres, for v / BRAKE seconds. */
export const rollOnM = (v: number) => (v * v) / (2 * BRAKE)
export const rollOnS = (v: number) => Math.abs(v) / BRAKE
/** Driven blind between two sensor checks (think): v / SCAN_HZ. */
export const blindM = (v: number) => Math.abs(v) / SCAN_HZ
/** Figure frame: wider turns than in move (turn up to 1.5 rad/s both ways), so a smaller scale; act.page.test checks the fit. */
export const VIEW = { w: 600, h: 300, px: 200, ox: 200, oy: 150 }
