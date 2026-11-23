import type { ChapterMeta } from '../anim/contract'
import { LEVEL1_CHAPTERS } from '../chapters/l1'
import { LEVEL2_CHAPTERS } from '../chapters/l2'
import { STRINGS } from '../i18n'
import { CHAPTER_ICON } from '../icons'
import type { ChapterId } from '../lib/route'

const existing = (level: number, ids: ChapterId[]): ChapterMeta[] =>
  ids.map((id) => ({ id, level, titleEn: STRINGS.en.chapters[id], titleJa: STRINGS.ja.chapters[id], icon: CHAPTER_ICON[id] }))

/**
 * Levels 0-5 in reading order (research curriculum, zero experience → robotics software engineer).
 * The 7 built chapters sit in Levels 3-4; empty levels show as 'coming next' on the map.
 */
export const LEVELS: ChapterMeta[][] = [
  [],
  LEVEL1_CHAPTERS,
  LEVEL2_CHAPTERS,
  existing(3, ['scan', 'tf', 'detect']),
  existing(4, ['grid', 'costmap', 'goal', 'bringup']),
  [],
]
