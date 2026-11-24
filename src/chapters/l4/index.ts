import type { ChapterMeta } from '../../anim/contract'
import { PATROL_STRINGS } from './patrol.strings'

export const PATROL_META = { id: 'patrol', level: 4, titleEn: PATROL_STRINGS.en.title, titleJa: PATROL_STRINGS.ja.title, icon: 'goal' } as const
/** Level 4 chapters built under l4/ (the older Level 4 chapters live in lib/route). An array, so the Burmese titles overlay accepts their ids. */
export const L4_CHAPTERS: ChapterMeta[] = [PATROL_META]
export { default as PatrolChapter } from './PatrolChapter'
