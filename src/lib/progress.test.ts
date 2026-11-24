import { describe, expect, it } from 'vitest'
import { markCompleted, markVisited, readProgress } from './progress'

const memory = (init: Record<string, string> = {}) => {
  const m = new Map<string, string>(Object.entries(init))
  return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}
const list = (s: Set<string>) => [...s].sort()

describe('progress', () => {
  it('opening a chapter = visited, not completed', () => {
    const s = memory()
    markVisited(s, 'scan'); markVisited(s, 'scan')
    const p = readProgress(s)
    expect(list(p.visited)).toEqual(['scan'])
    expect(p.completed.size).toBe(0)
  })
  it('a solved check = completed (and visited)', () => {
    const s = memory()
    markCompleted(s, 'move')
    expect(list(readProgress(s).completed)).toEqual(['move'])
    expect(list(readProgress(s).visited)).toEqual(['move'])
  })
  it('v1 r101-done (written on every open, d4aa303) migrates to visited only; the old value is kept', () => {
    const s = memory({ 'r101-done': '["scan","tf"]' })
    const p = markVisited(s, 'grid')
    expect(list(p.visited)).toEqual(['grid', 'scan', 'tf'])
    expect(p.completed.size).toBe(0)
    expect(s.m.get('r101-done')).toBe('["scan","tf"]')
  })
  it('corrupt or foreign values in either key start fresh instead of breaking the overview', () => {
    for (const bad of ['{oops', '{"a":1}', '3', 'null']) {
      const p = readProgress(memory({ 'r101-done': bad, 'r101-progress-v2': bad }))
      expect(p.visited.size + p.completed.size).toBe(0)
    }
    expect(list(readProgress(memory({ 'r101-done': '["grid",3]' })).visited)).toEqual(['grid'])
    expect(list(readProgress(memory({ 'r101-progress-v2': '{"completed":["tf",7]}' })).visited)).toEqual(['tf'])
  })
})
