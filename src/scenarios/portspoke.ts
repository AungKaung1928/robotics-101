import type { Scan } from '../chapters/l5/port'

/**
 * Chapter 5.1 scene: the C++ spoke is one line rotated about the robot; its angle is the ray the C++ index reads
 * (port.cppIndex), and it enters from the Python spoke's angle (port.pyIndex), so a wrapped index is seen swinging away.
 * SVG rotate() is clockwise; the chapter's spoke() puts ray i at (120 - r sin a, 120 - r cos a), a = angleMin + i * inc.
 */
export const spokeDeg = (s: Scan, i: number) => (-(s.angleMin + i * s.inc) * 180) / Math.PI

/** The same direction as `target`, moved by whole turns to sit within 180° of `prev`, so a CSS rotate transition
 *  across the scan's seam (last ray -> ray 0, a 360° jump in spokeDeg) takes the short way. */
export const nearestTurn = (prev: number, target: number) => target + 360 * Math.round((prev - target) / 360)
