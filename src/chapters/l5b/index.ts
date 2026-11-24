import type { ChapterMeta } from '../../anim/contract'
import { FIELDFAIL_STRINGS } from './fieldfail.strings'
import { LIFECYCLE_STRINGS } from './lifecycle.strings'
import { QOS_STRINGS } from './qos.strings'

/** Level 5 chapters 5.4-5.6 (lane app3). The qa lane joins them after 5.1-5.3: LEVELS[5] = [...LEVEL5_CHAPTERS, ...LEVEL5B_CHAPTERS]. */
export const LEVEL5B_CHAPTERS: ChapterMeta[] = [
  { id: 'qos', level: 5, titleEn: QOS_STRINGS.en.title, titleJa: QOS_STRINGS.ja.title, icon: 'lidar' },
  { id: 'lifecycle', level: 5, titleEn: LIFECYCLE_STRINGS.en.title, titleJa: LIFECYCLE_STRINGS.ja.title, icon: 'launch' },
  { id: 'fieldfail', level: 5, titleEn: FIELDFAIL_STRINGS.en.title, titleJa: FIELDFAIL_STRINGS.ja.title, icon: 'robot' },
]

export { default as QosChapter } from './QosChapter'
export { default as LifecycleChapter } from './LifecycleChapter'
export { default as FieldfailChapter } from './FieldfailChapter'
