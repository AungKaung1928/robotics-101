import type { ComponentType } from 'react'
import type { ChapterMeta } from '../anim/contract'
import { ActChapter, LEVEL0_CHAPTERS, LoopChapter, MeetChapter, MoveChapter, PipeChapter, RosChapter, ScopeChapter, SenseChapter, SimpickChapter, SimwhatChapter, ThinkChapter, ToolsChapter } from '../chapters/l0'
import { CallbackChapter, ClosestChapter, CppChapter, DecideChapter, LEVEL1_CHAPTERS, ShellChapter } from '../chapters/l1'
import { TFLAB_META, TfLabChapter } from '../chapters/l3'
import { PATROL_META, PatrolChapter } from '../chapters/l4'
import { BfsChapter, EP_CHAPTERS, LateChapter } from '../chapters/ep'
import { ActionsChapter, DriveChapter, LEVEL2_CHAPTERS, MsgTypesChapter, NodesChapter, ParamsChapter, TopicsChapter, WsChapter } from '../chapters/l2'
import { STRINGS, type Strings } from '../i18n'
import { CHAPTER_ICON } from '../icons'
import type { ChapterId } from '../lib/route'

const existing = (level: number, ids: ChapterId[]): ChapterMeta[] =>
  ids.map((id) => ({ id, level, titleEn: STRINGS.en.chapters[id], titleJa: STRINGS.ja.chapters[id], icon: CHAPTER_ICON[id] }))

/**
 * Levels 0-5 in reading order (research curriculum, zero experience → robotics software engineer).
 * The 7 built chapters sit in Levels 3-4; empty levels show as 'coming next' on the map.
 */
export const LEVELS: ChapterMeta[][] = [
  LEVEL0_CHAPTERS,
  LEVEL1_CHAPTERS,
  LEVEL2_CHAPTERS,
  [...existing(3, ['scan', 'tf']), { ...TFLAB_META }, ...existing(3, ['detect'])],
  [...existing(4, ['grid', 'costmap', 'goal']), { ...PATROL_META }, ...existing(4, ['bringup'])],
  [],
]

/** Bodies of the new-level chapters (the 7 patrol chapters keep their own routes in App). */
export const LEVEL_BODY: Record<string, ComponentType<{ t: Strings }>> = {
  meet: MeetChapter, move: MoveChapter, sense: SenseChapter, think: ThinkChapter, act: ActChapter, simwhat: SimwhatChapter, simpick: SimpickChapter,
  loop: LoopChapter, pipe: PipeChapter, tools: ToolsChapter, ros: RosChapter, scope: ScopeChapter, decide: DecideChapter, closest: ClosestChapter, callback: CallbackChapter, cpp: CppChapter, shell: ShellChapter,
  bfs: BfsChapter, late: LateChapter, tflab: TfLabChapter, patrol: PatrolChapter,
  nodes: NodesChapter, topics: TopicsChapter, msgtypes: MsgTypesChapter, actions: ActionsChapter, params: ParamsChapter, ws: WsChapter, drive: DriveChapter,
}

export type LevelPage = { meta: ChapterMeta; num: string; prev: ChapterMeta | null; next: ChapterMeta | null }

/**
 * '#/1/decide' → that chapter with its number ('1.1') and its neighbours in reading order (across levels);
 * '#/ep/bfs' → 'EP1', neighbours inside Engineering Practice only; anything else → null.
 */
export function levelPage(hash: string): LevelPage | null {
  const [lv, id] = hash.replace(/^#\/?/, '').split('?')[0].split('/')
  if (lv === 'ep') {
    const j = EP_CHAPTERS.findIndex((c) => c.id === id)
    return j < 0 ? null : { meta: EP_CHAPTERS[j], num: `EP${j + 1}`, prev: EP_CHAPTERS[j - 1] ?? null, next: EP_CHAPTERS[j + 1] ?? null }
  }
  const chs = LEVELS[Number(lv)]
  const i = chs?.findIndex((c) => c.id === id && LEVEL_BODY[c.id]) ?? -1
  if (!chs || i < 0) return null
  const all = LEVELS.flat(), k = all.indexOf(chs[i])
  return { meta: chs[i], num: `${lv}.${i + 1}`, prev: all[k - 1] ?? null, next: all[k + 1] ?? null }
}

/** Reading position of the page at `hash` across all levels (0, 1, ...); overview or unknown → -1. */
export function readingIndex(hash: string): number {
  const id = hash.replace(/^#\/?/, '').split('?')[0].split('/').find((seg) => !/^\d*$/.test(seg))
  return LEVELS.flat().findIndex((c) => c.id === id)
}
