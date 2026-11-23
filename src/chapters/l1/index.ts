import type { ChapterMeta } from '../../anim/contract'
import { CALLBACK_STRINGS } from './callback.strings'
import { CLOSEST_STRINGS } from './closest.strings'
import { CPP_STRINGS } from './cpp.strings'
import { DECIDE_STRINGS } from './decide.strings'

/** Level 1 chapters, in reading order. Lane app2 fills this on branch 'levels'. */
export const LEVEL1_CHAPTERS: ChapterMeta[] = [
  { id: 'decide', level: 1, titleEn: DECIDE_STRINGS.en.title, titleJa: DECIDE_STRINGS.ja.title, icon: 'robot' },
  { id: 'closest', level: 1, titleEn: CLOSEST_STRINGS.en.title, titleJa: CLOSEST_STRINGS.ja.title, icon: 'lidar' },
  { id: 'callback', level: 1, titleEn: CALLBACK_STRINGS.en.title, titleJa: CALLBACK_STRINGS.ja.title, icon: 'clock' },
  { id: 'cpp', level: 1, titleEn: CPP_STRINGS.en.title, titleJa: CPP_STRINGS.ja.title, icon: 'launch' },
]

/** Chapter bodies by id; same props as the existing chapters ({ t: Strings }). */
export { default as DecideChapter } from './DecideChapter'
export { default as ClosestChapter } from './ClosestChapter'
export { default as CallbackChapter } from './CallbackChapter'
export { default as CppChapter } from './CppChapter'
