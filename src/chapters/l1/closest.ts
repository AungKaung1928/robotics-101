import type { Scenario } from '../../anim/contract'

/** Chapter 1.2 model: a for loop over 10 distances, kept in a function that returns the closest one. */

/** Example readings (m), left to right across the front of the robot. Made up for the page, inside the LiDAR's 0.12-3.5 m range. */
export const BASE = [1.8, 1.6, 1.9, 2.4, 2.2, 2.0, 1.7, 2.5, 2.1, 1.95]
export const BOX_M = 0.4 // reading of the beam that hits the box
export const STEP_MS = 700 // one loop pass per step in the scenario
export const FAN_DEG = 90 // the 10 beams span this angle, left to right

export type Start = 'inf' | 'zero' // break it: closest = 0 instead of float('inf')

export const readings = (boxAt: number) => BASE.map((d, i) => (i === boxAt ? BOX_M : d))
export const beamDeg = (i: number) => FAN_DEG / 2 - (i * FAN_DEG) / (BASE.length - 1) // + = left

export interface Pass { i: number; d: number; closest: number; updated: boolean }

/** Every pass of the loop, in order: what `closest` holds after it and whether this pass changed it. */
export function trace(rs: number[], start: Start = 'inf'): Pass[] {
  let closest = start === 'inf' ? Infinity : 0
  return rs.map((d, i) => {
    const updated = d < closest
    if (updated) closest = d
    return { i, d, closest, updated }
  })
}

/** The page's version of `def closest(readings)`: the value the loop ends with. */
export const closestOf = (rs: number[], start: Start = 'inf') => trace(rs, start).at(-1)!.closest
export const updates = (rs: number[], start: Start = 'inf') => trace(rs, start).filter((p) => p.updated).length

/** Challenge: place the box so `closest` changes exactly once. */
export const challengeOk = (boxAt: number) => updates(readings(boxAt)) === 1

export interface ClosestScene extends Record<string, unknown> {
  pass: number; done: boolean; closest: number; best: number; updated: boolean
}

/** Scenario: one pass per STEP_MS, then the return. best = index holding `closest` so far (-1 = none). */
export function scenario(boxAt: number, start: Start = 'inf'): Scenario<ClosestScene> {
  const rs = readings(boxAt)
  const tr = trace(rs, start)
  const durationMs = (tr.length + 1) * STEP_MS
  return {
    id: 'l1-closest',
    durationMs,
    eventsMs: [...tr.map((_, i) => i * STEP_MS), tr.length * STEP_MS],
    frame(tMs) {
      const t = Math.min(Math.max(tMs, 0), durationMs)
      const pass = Math.min(tr.length - 1, Math.floor(t / STEP_MS))
      const p = tr[pass]
      const seen = tr.slice(0, pass + 1)
      const best = [...seen].reverse().find((q) => q.updated)?.i ?? -1
      return { pass, done: t >= tr.length * STEP_MS, closest: p.closest, best, updated: p.updated }
    },
  }
}
