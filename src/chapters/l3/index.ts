import type { ChapterMeta } from '../../anim/contract'
import { TFLAB_STRINGS } from './tflab.strings'
import { WALL_STRINGS } from './wall.strings'

export const TFLAB_META = { id: 'tflab', level: 3, titleEn: TFLAB_STRINGS.en.title, titleJa: TFLAB_STRINGS.ja.title, icon: 'warning' } as const
/** Level 3 chapters built under l3/ (the older Level 3 chapters live in lib/route). An array, so the Burmese titles overlay accepts their ids. */
export const WALL_META = { id: 'wall', level: 3, titleEn: WALL_STRINGS.en.title, titleJa: WALL_STRINGS.ja.title, icon: 'robot' } as const
export const L3_CHAPTERS: ChapterMeta[] = [TFLAB_META, WALL_META]
export { default as TfLabChapter } from './TfLabChapter'
export { default as WallChapter } from './WallChapter'
