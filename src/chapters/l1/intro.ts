import type { Scenario } from '../../anim/contract'
import { scenario as drive, type DecideScene } from './decide'

/**
 * Level 1 intro: the 1.1 robot drives to the wall and stops, while the five chapter chips light up one by one.
 * The drive is the real 1.1 model (stop_at 0.5 m); the chips are a table of contents, spread evenly over the drive.
 */
export const CHAPTERS = 5
export const STOP_AT = 0.5

export interface IntroScene extends Record<string, unknown> { drive: DecideScene; lit: number }

export function introScenario(): Scenario<IntroScene> {
  const d = drive(STOP_AT)
  const slice = d.durationMs / CHAPTERS
  return {
    id: 'l1-intro',
    durationMs: d.durationMs,
    eventsMs: Array.from({ length: CHAPTERS + 1 }, (_, k) => Math.round(k * slice)),
    frame(tMs) {
      const t = Math.min(Math.max(tMs, 0), d.durationMs)
      return { drive: d.frame(t), lit: Math.min(CHAPTERS, Math.floor(t / slice) + 1) }
    },
  }
}
