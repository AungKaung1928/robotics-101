import type { Scenario } from '../../anim/contract'

/**
 * The tool stack under his patrol robot, bottom to top. `needs` = what a layer stops working without:
 * ROS 2 Humble targets Ubuntu 22.04 (REP 2000) and its `ros2` command is a Python program (ros2/ros2cli).
 */
export const LAYERS = [
  { id: 'linux', needs: [] },
  { id: 'terminal', needs: ['linux'] },
  { id: 'python', needs: ['linux'] },
  { id: 'cpp', needs: ['linux'] },
  { id: 'ros', needs: ['linux', 'python'] },
] as const
export type ToolId = (typeof LAYERS)[number]['id']
export const DROP_S = 0.8 // page time per layer

/** Layers that still work when `removed` is gone (a layer works only if everything it needs works). */
export function working(removed: ToolId | null): Set<ToolId> {
  const ok = new Set<ToolId>()
  for (const l of LAYERS) if (l.id !== removed && l.needs.every((n) => ok.has(n))) ok.add(l.id)
  return ok
}

/** Challenge: one job per tool; the reader picks a tool for each. */
export const JOBS = [
  { id: 'install', tool: 'terminal' },
  { id: 'idea', tool: 'python' },
  { id: 'fast', tool: 'cpp' },
  { id: 'connect', tool: 'ros' },
] as const satisfies readonly { id: string; tool: ToolId }[]
export type JobId = (typeof JOBS)[number]['id']
export const score = (picks: Partial<Record<JobId, ToolId>>) => JOBS.filter((j) => picks[j.id] === j.tool).length

const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2)

export interface ToolsScene extends Record<string, unknown> { shown: number; drop: number }

/** Layers land one by one from the bottom; `drop` = eased fall of the newest layer (0 = above, 1 = landed). */
export function scenario(): Scenario<ToolsScene> {
  return {
    id: 'l0-tools',
    durationMs: LAYERS.length * DROP_S * 1000,
    eventsMs: Array.from({ length: LAYERS.length + 1 }, (_, i) => i * DROP_S * 1000),
    frame(tMs) {
      const x = Math.min(LAYERS.length, Math.max(0, tMs / 1000 / DROP_S))
      const shown = Math.min(LAYERS.length, Math.floor(x) + 1)
      return { shown, drop: x >= LAYERS.length ? 1 : ease(x - Math.floor(x)) }
    },
  }
}
