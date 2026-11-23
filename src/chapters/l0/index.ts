import type { ChapterMeta } from '../../anim/contract'
import { MEET_STRINGS } from './meet.strings'
import { MOVE_STRINGS } from './move.strings'
import { SENSE_STRINGS } from './sense.strings'
import { THINK_STRINGS } from './think.strings'
import { ACT_STRINGS } from './act.strings'
import { SIMWHAT_STRINGS } from './simwhat.strings'
import { SIMPICK_STRINGS } from './simpick.strings'
import { LOOP_STRINGS } from './loop.strings'
import { PIPE_STRINGS } from './pipe.strings'
import { ROS_STRINGS } from './ros.strings'
import { TOOLS_STRINGS } from './tools.strings'
import { SCOPE_STRINGS } from './scope.strings'
import { ONRAMP_A, ONRAMP_B } from './onramp'

/** Level 0 chapters, in reading order: on-ramp (meet → act, loop), simulator (simwhat, simpick), then the tools (pipe, tools, ros) and how much of each skill the course needs (scope). */
export const LEVEL0_CHAPTERS: ChapterMeta[] = [
  { id: 'meet', level: 0, titleEn: MEET_STRINGS.en.title, titleJa: MEET_STRINGS.ja.title, icon: 'robot' },
  { id: 'move', level: 0, titleEn: MOVE_STRINGS.en.title, titleJa: MOVE_STRINGS.ja.title, icon: 'goal' },
  { id: 'sense', level: 0, titleEn: SENSE_STRINGS.en.title, titleJa: SENSE_STRINGS.ja.title, icon: 'lidar' },
  { id: 'think', level: 0, titleEn: THINK_STRINGS.en.title, titleJa: THINK_STRINGS.ja.title, icon: 'map' },
  { id: 'act', level: 0, titleEn: ACT_STRINGS.en.title, titleJa: ACT_STRINGS.ja.title, icon: 'launch' },
  { id: 'loop', level: 0, titleEn: LOOP_STRINGS.en.title, titleJa: LOOP_STRINGS.ja.title, icon: 'robot' },
  { id: 'simwhat', level: 0, titleEn: SIMWHAT_STRINGS.en.title, titleJa: SIMWHAT_STRINGS.ja.title, icon: 'frame' },
  { id: 'simpick', level: 0, titleEn: SIMPICK_STRINGS.en.title, titleJa: SIMPICK_STRINGS.ja.title, icon: 'frame' },
  { id: 'pipe', level: 0, titleEn: PIPE_STRINGS.en.title, titleJa: PIPE_STRINGS.ja.title, icon: 'launch' },
  { id: 'tools', level: 0, titleEn: TOOLS_STRINGS.en.title, titleJa: TOOLS_STRINGS.ja.title, icon: 'frame' },
  { id: 'ros', level: 0, titleEn: ROS_STRINGS.en.title, titleJa: ROS_STRINGS.ja.title, icon: 'clock' },
  { id: 'scope', level: 0, titleEn: SCOPE_STRINGS.en.title, titleJa: SCOPE_STRINGS.ja.title, icon: 'map' },
]

/** Level 0 groups on the level map (spec APP_R101_ONRAMP.md): A meet the robot, B a practice world, C the software around it. */
export const LEVEL0_GROUPS: readonly (readonly string[])[] = [[...ONRAMP_A, 'loop'], ONRAMP_B, ['pipe', 'tools', 'ros', 'scope']]

export { default as LoopChapter } from './LoopChapter'
export { default as PipeChapter } from './PipeChapter'
export { default as ToolsChapter } from './ToolsChapter'
export { default as RosChapter } from './RosChapter'
export { default as ScopeChapter } from './ScopeChapter'
export { default as MeetChapter } from './MeetChapter'
export { default as MoveChapter } from './MoveChapter'
export { default as SenseChapter } from './SenseChapter'
export { default as ThinkChapter } from './ThinkChapter'
export { default as ActChapter } from './ActChapter'
export { default as SimwhatChapter } from './SimwhatChapter'
export { default as SimpickChapter } from './SimpickChapter'
