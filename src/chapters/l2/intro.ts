import type { Scenario } from '../../anim/contract'
import { NODES, scenario as startUp, type NodesScene } from './nodes'

/**
 * Level 2 intro: the 2.1 launch start-up (7 nodes over 14 s) while the seven chapter chips light up.
 * The graph is the real 2.1 model with nothing stopped; the chips are a table of contents.
 */
export const CHAPTERS = 7

export interface Intro2Scene extends Record<string, unknown> { graph: NodesScene; lit: number }

export function introScenario(): Scenario<Intro2Scene> {
  const g = startUp(new Set())
  const slice = g.durationMs / CHAPTERS
  return {
    id: 'l2-intro',
    durationMs: g.durationMs,
    eventsMs: Array.from({ length: CHAPTERS + 1 }, (_, k) => Math.round(k * slice)),
    frame(tMs) {
      const t = Math.min(Math.max(tMs, 0), g.durationMs)
      return { graph: g.frame(t), lit: Math.min(CHAPTERS, Math.floor(t / slice) + 1) }
    },
  }
}

export const NODE_COUNT = NODES.length
