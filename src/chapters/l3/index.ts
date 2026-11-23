import type { ChapterMeta } from '../../anim/contract'
import { TFLAB_STRINGS } from './tflab.strings'

export const TFLAB_META = { id: 'tflab', level: 3, titleEn: TFLAB_STRINGS.en.title, titleJa: TFLAB_STRINGS.ja.title, icon: 'warning' } as const
/** Level 3 chapters built under l3/ (the older Level 3 chapters live in lib/route). An array, so the Burmese titles overlay accepts their ids. */
export const L3_CHAPTERS: ChapterMeta[] = [TFLAB_META]
export { default as TfLabChapter } from './TfLabChapter'
