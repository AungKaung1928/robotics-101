import type { ChapterMeta } from '../../anim/contract'
import { CLOSEST_STRINGS } from './closest.strings'
import { DECIDE_STRINGS } from './decide.strings'

/** Level 1 chapters, in reading order. Lane app2 fills this on branch 'levels'. */
export const LEVEL1_CHAPTERS: ChapterMeta[] = [
  { id: 'decide', level: 1, titleEn: DECIDE_STRINGS.en.title, titleJa: DECIDE_STRINGS.ja.title, icon: 'robot' },
  { id: 'closest', level: 1, titleEn: CLOSEST_STRINGS.en.title, titleJa: CLOSEST_STRINGS.ja.title, icon: 'lidar' },
]

/** Chapter bodies by id; same props as the existing chapters ({ t: Strings }). */
export { default as DecideChapter } from './DecideChapter'
export { default as ClosestChapter } from './ClosestChapter'
