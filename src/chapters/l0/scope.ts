/**
 * 0.12 "How much you need": which skills the later chapters use. Data = this course only: every tag below is backed by
 * what that chapter's own files cite or show (Python / C++ code, ROS 2 docs, APIs and topics, terminal commands);
 * scope.test.ts re-derives the tags from the files and fails on any difference.
 */
export const SKILLS = ['py', 'cpp', 'ros2', 'shell'] as const
export type Skill = (typeof SKILLS)[number]

/** Rows of the figure: Levels 1-4 and Engineering Practice, chapter ids in reading order (test: equals LEVELS / EP_CHAPTERS). */
export const ROWS: { row: '1' | '2' | '3' | '4' | 'EP'; ids: string[] }[] = [
  { row: '1', ids: ['decide', 'closest', 'callback', 'cpp', 'shell'] },
  { row: '2', ids: ['nodes', 'topics', 'msgtypes', 'actions', 'params', 'ws', 'drive'] },
  { row: '3', ids: ['scan', 'tf', 'tflab', 'detect'] },
  { row: '4', ids: ['grid', 'costmap', 'goal', 'bringup'] },
  { row: 'EP', ids: ['bfs', 'late'] },
]

export const TAGS: Record<string, readonly Skill[]> = {
  decide: ['py', 'ros2'], closest: ['py'], callback: ['py', 'ros2'], cpp: ['cpp'], shell: ['py', 'cpp', 'ros2', 'shell'],
  nodes: ['py', 'ros2'], topics: ['ros2', 'shell'], msgtypes: ['ros2'], actions: ['py', 'ros2'], params: ['py', 'cpp', 'ros2', 'shell'],
  ws: ['cpp', 'ros2', 'shell'], drive: ['ros2', 'shell'],
  scan: ['ros2'], tf: ['cpp', 'ros2'], tflab: ['cpp', 'ros2', 'shell'], detect: ['ros2'],
  grid: ['ros2'], costmap: ['ros2'], goal: ['ros2'], bringup: ['py', 'ros2'],
  bfs: ['py', 'cpp', 'ros2'], late: ['py', 'cpp', 'ros2'],
}

export const ALL_IDS = ROWS.flatMap((r) => r.ids)

/** Chapters per skill (whole course). */
export function counts(): Record<Skill, number> {
  const c = { py: 0, cpp: 0, ros2: 0, shell: 0 }
  for (const id of ALL_IDS) for (const s of TAGS[id]) c[s]++
  return c
}

/** The skill used in the most chapters (the challenge's answer). */
export const most = (): Skill => SKILLS.reduce((a, b) => (counts()[b] > counts()[a] ? b : a))

/** Break it: skipping `skill` locks every chapter that uses it; returned in reading order. */
export const lockedBy = (skill: Skill | null): string[] => (skill ? ALL_IDS.filter((id) => TAGS[id].includes(skill)) : [])

/** Scenario: one row lights per step (Levels 1, 2, 3, 4, EP), 0.9 s apart; frame(t) = rows shown so far. */
export const STEP_MS = 900
export function scenario() {
  const durationMs = ROWS.length * STEP_MS
  return { id: 'scope', durationMs, eventsMs: ROWS.map((_, i) => (i + 1) * STEP_MS), frame: (tMs: number) => ({ rows: Math.min(ROWS.length, Math.floor(tMs / STEP_MS + 1e-9)) }) }
}
