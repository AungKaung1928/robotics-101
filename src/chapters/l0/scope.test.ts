import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LEVELS } from '../../content/levels'
import { EP_CHAPTERS } from '../ep'
import { ALL_IDS, ROWS, SKILLS, TAGS, counts, lockedBy, most, scenario, type Skill } from './scope'

/** What counts as showing a skill in a chapter's own files (component, model, strings; tests excluded). */
const EVIDENCE: Record<Skill, RegExp> = {
  py: /aria-label="Python"|docs\.python\.org|\.py\b|python-ros2-reference|rclpy/,
  cpp: /aria-label="C\+\+"|cppreference|\.(cpp|hpp)\b|cpp-ros2-reference|-cpp\b|rclcpp/,
  ros2: /docs\.ros\.org|tf2|\/cmd_vel\b|\/scan\b|\.msg\b|rclpy|rclcpp|\bros2 [a-z]|create_(subscription|publisher)|launch\.py|nav2/i,
  shell: /\bcolcon (build|test)|\bros2 (run|launch|topic|node|param)|\bsource install|\$ [a-z]/,
}
const SRC = join(__dirname, '../..')
const OLD: Record<string, string> = { scan: 'Scan', tf: 'Tf', detect: 'Detect', grid: 'Grid', costmap: 'Costmap', goal: 'Goal', bringup: 'Bringup' }
const DIR: Record<string, string> = { '1': 'l1', '2': 'l2', '3': 'l3', EP: 'ep' }
function filesOf(row: string, id: string): string[] {
  if (OLD[id]) return [join(SRC, 'components', `${OLD[id]}Chapter.tsx`)]
  const d = join(SRC, 'chapters', DIR[row])
  return readdirSync(d).filter((f) => !f.includes('.test.') && (f.toLowerCase().startsWith(id + '.') || f.toLowerCase().startsWith(id + '_') || f.toLowerCase() === `${id}chapter.tsx`)).map((f) => join(d, f))
}

describe('0.12 skill map', () => {
  it('rows are Levels 1-4 and EP in reading order', () => {
    expect(ROWS.slice(0, 4).map((r) => r.ids)).toEqual(LEVELS.slice(1, 5).map((l) => l.map((c) => c.id)))
    expect(ROWS[4].ids).toEqual(EP_CHAPTERS.map((c) => c.id))
  })
  it.each(ROWS.flatMap((r) => r.ids.map((id) => [r.row, id] as const)))('row %s %s: tags = what its files show', (row, id) => {
    const fs = filesOf(row, id)
    expect(fs.length).toBeGreaterThan(0)
    const text = fs.map((f) => readFileSync(f, 'utf8')).join('\n')
    expect([...TAGS[id]]).toEqual(SKILLS.filter((k) => EVIDENCE[k].test(text)))
  })
  it('counts, the challenge answer and the break-it list come from the tags', () => {
    expect(ALL_IDS).toHaveLength(22)
    expect(counts()).toEqual({ py: 10, cpp: 8, ros2: 20, shell: 6 })
    expect(most()).toBe('ros2')
    expect(lockedBy('cpp')).toEqual(['cpp', 'shell', 'params', 'ws', 'tf', 'tflab', 'bfs', 'late'])
    expect(lockedBy(null)).toEqual([])
  })
  it('scenario lights one row per step, all rows at the end', () => {
    const sc = scenario()
    expect([0, 899, 900, sc.durationMs].map((t) => sc.frame(t).rows)).toEqual([0, 0, 1, ROWS.length])
  })
})

describe('0.12 strings', () => {
  it('EN and JA have the same keys and every skill a name', async () => {
    const { SCOPE_STRINGS: S } = await import('./scope.strings')
    expect(Object.keys(S.ja).sort()).toEqual(Object.keys(S.en).sort())
    expect(Object.keys(S.ja.skill).sort()).toEqual([...SKILLS].sort())
  })
})
