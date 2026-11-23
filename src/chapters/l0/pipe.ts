import type { Scenario } from '../../anim/contract'

/** The programs one LiDAR scan passes through before the wheels move (his TurtleBot3 Nav2 stack), and the chapter that teaches each. */
export const PIPE = [
  { id: 'lidar', chapter: '#/3/scan' },
  { id: 'slam', chapter: '#/4/grid' },
  { id: 'costmap', chapter: '#/4/costmap' },
  { id: 'planner', chapter: '#/4/goal' },
  { id: 'controller', chapter: '#/4/goal' },
] as const
export type PipeId = (typeof PIPE)[number]['id']
export const HOP_S = 0.9 // page time per program

/** Index of the last program that receives the scan: a broken program receives it but passes nothing on. */
export const reach = (broken: number | null) => (broken === null ? PIPE.length - 1 : broken)

/** Challenge: the reader names the program where the data stops. */
export const found = (broken: number, clicked: number | null) => clicked === broken

export interface PipeScene extends Record<string, unknown> { at: number; moving: boolean; arrived: boolean }

/** The scan hops program to program; `moving` while it travels a link, `arrived` once the last reachable program has it. */
export function scenario(broken: number | null): Scenario<PipeScene> {
  const last = reach(broken)
  return {
    id: 'l0-pipe',
    durationMs: (last + 1) * HOP_S * 1000,
    eventsMs: Array.from({ length: last + 2 }, (_, i) => i * HOP_S * 1000),
    frame(tMs) {
      const x = Math.max(0, tMs / 1000 / HOP_S)
      const at = Math.min(last, Math.floor(x))
      return { at, moving: x < last && x - Math.floor(x) > 0.6, arrived: x >= last + 1 - 1e-9 }
    },
  }
}
