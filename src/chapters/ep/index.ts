import type { ChapterMeta } from '../../anim/contract'
import { BFS_STRINGS } from './bfs.strings'
import { LATE_STRINGS } from './late.strings'

/** Engineering Practice: optional track outside the numbered levels, never a prerequisite (route #/ep/<id>). */
export const EP_CHAPTERS: ChapterMeta[] = [
  { id: 'bfs', level: 'ep', titleEn: BFS_STRINGS.en.title, titleJa: BFS_STRINGS.ja.title, icon: 'map' },
  { id: 'late', level: 'ep', titleEn: LATE_STRINGS.en.title, titleJa: LATE_STRINGS.ja.title, icon: 'clock' },
]

export { default as BfsChapter } from './BfsChapter'
export { default as LateChapter } from './LateChapter'
