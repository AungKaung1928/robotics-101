import { DOTS as ONRAMP_DOTS, GROWS_FROM as ONRAMP_GROWS } from '../chapters/l0/onramp'
import { LEVELS } from './levels'
import type { ChapterMeta } from '../anim/contract'

/** Difficulty dots 1-5 for every numbered chapter with its own page: app2's on-ramp data plus the lead's chapters. EP stays outside the scale. */
export const DOTS: Record<string, number> = { ...ONRAMP_DOTS, loop: 1, pipe: 1, tools: 1, ros: 1, tflab: 4 }

/** "You already know: <id>": the earlier chapter each one grows from. */
export const GROWS_FROM: Record<string, string> = { ...ONRAMP_GROWS, loop: 'act', pipe: 'loop', tools: 'pipe', ros: 'tools', tflab: 'tf' }

/** Chapter id → its meta, display number ('0.4') and route, across all levels. */
export function findChapter(id: string): { meta: ChapterMeta; num: string; href: string } | null {
  for (const [n, chs] of LEVELS.entries()) {
    const i = chs.findIndex((c) => c.id === id)
    if (i >= 0) return { meta: chs[i], num: `${n}.${i + 1}`, href: `#/${n}/${id}` }
  }
  return null
}
