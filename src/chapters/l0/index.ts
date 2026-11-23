import type { ChapterMeta } from '../../anim/contract'
import { LOOP_STRINGS } from './loop.strings'
import { PIPE_STRINGS } from './pipe.strings'

/** Level 0 chapters, in reading order (lane app). */
export const LEVEL0_CHAPTERS: ChapterMeta[] = [
  { id: 'loop', level: 0, titleEn: LOOP_STRINGS.en.title, titleJa: LOOP_STRINGS.ja.title, icon: 'robot' },
  { id: 'pipe', level: 0, titleEn: PIPE_STRINGS.en.title, titleJa: PIPE_STRINGS.ja.title, icon: 'launch' },
]

export { default as LoopChapter } from './LoopChapter'
export { default as PipeChapter } from './PipeChapter'
