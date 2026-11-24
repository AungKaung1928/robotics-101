import type { ChapterMeta } from '../../anim/contract'
import { CI_STRINGS } from './ci.strings'
import { DEBUG_STRINGS } from './debug.strings'
import { PORT_STRINGS } from './port.strings'

/** Level 5 (robotics software engineer), built under l5/. */
export const LEVEL5_CHAPTERS: ChapterMeta[] = [
  { id: 'port', level: 5, titleEn: PORT_STRINGS.en.title, titleJa: PORT_STRINGS.ja.title, icon: 'robot' },
  { id: 'ci', level: 5, titleEn: CI_STRINGS.en.title, titleJa: CI_STRINGS.ja.title, icon: 'launch' },
  { id: 'debug', level: 5, titleEn: DEBUG_STRINGS.en.title, titleJa: DEBUG_STRINGS.ja.title, icon: 'warning' },
]
export { default as PortChapter } from './PortChapter'
export { default as CiChapter } from './CiChapter'
export { default as DebugChapter } from './DebugChapter'
