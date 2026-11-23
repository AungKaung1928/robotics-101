import type { ChapterMeta } from '../../anim/contract'
import { NODES_STRINGS } from './nodes.strings'

/** Level 2 chapters, in reading order. Lane app2 fills this on branch 'levels'. */
export const LEVEL2_CHAPTERS: ChapterMeta[] = [
  { id: 'nodes', level: 2, titleEn: NODES_STRINGS.en.title, titleJa: NODES_STRINGS.ja.title, icon: 'launch' },
]

/** Chapter bodies by id; same props as the existing chapters ({ t: Strings }). */
export { default as NodesChapter } from './NodesChapter'
