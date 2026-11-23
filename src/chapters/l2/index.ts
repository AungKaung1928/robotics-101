import type { ChapterMeta } from '../../anim/contract'
import { MSGTYPES_STRINGS } from './msgtypes.strings'
import { NODES_STRINGS } from './nodes.strings'
import { TOPICS_STRINGS } from './topics.strings'

/** Level 2 chapters, in reading order. Lane app2 fills this on branch 'levels'. */
export const LEVEL2_CHAPTERS: ChapterMeta[] = [
  { id: 'nodes', level: 2, titleEn: NODES_STRINGS.en.title, titleJa: NODES_STRINGS.ja.title, icon: 'launch' },
  { id: 'topics', level: 2, titleEn: TOPICS_STRINGS.en.title, titleJa: TOPICS_STRINGS.ja.title, icon: 'lidar' },
  { id: 'msgtypes', level: 2, titleEn: MSGTYPES_STRINGS.en.title, titleJa: MSGTYPES_STRINGS.ja.title, icon: 'frame' },
]

/** Chapter bodies by id; same props as the existing chapters ({ t: Strings }). */
export { default as NodesChapter } from './NodesChapter'
export { default as TopicsChapter } from './TopicsChapter'
export { default as MsgTypesChapter } from './MsgTypesChapter'
