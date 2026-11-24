/**
 * Reader progress in localStorage. visited = the chapter was opened; completed = its check was answered right
 * (the chapter rendered `.verdict.ok`). Chapters without a check (the 6 older Level 3-4 walkthroughs) can only be visited.
 */
const KEY = 'r101-progress-v2'
/** v1 (d4aa303): JSON string[] written on every open. It proves a visit, never a completion; it is read, not deleted. */
const V1 = 'r101-done'

export interface Progress { visited: Set<string>; completed: Set<string> }
type Store = Pick<Storage, 'getItem' | 'setItem'>

const ids = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
const parse = (s: string | null): unknown => {
  try { return JSON.parse(s ?? 'null') } catch { return null } // corrupt value: start fresh rather than break the overview
}

export function readProgress(store: Pick<Storage, 'getItem'>): Progress {
  const v2 = parse(store.getItem(KEY)) as { visited?: unknown; completed?: unknown } | null
  const completed = new Set(ids(v2?.completed))
  const visited = new Set([...ids(parse(store.getItem(V1))), ...ids(v2?.visited), ...completed])
  return { visited, completed }
}

function write(store: Store, p: Progress): Progress {
  store.setItem(KEY, JSON.stringify({ visited: [...p.visited], completed: [...p.completed] }))
  return p
}

export function markVisited(store: Store, id: string): Progress {
  const p = readProgress(store)
  p.visited.add(id)
  return write(store, p)
}

export function markCompleted(store: Store, id: string): Progress {
  const p = readProgress(store)
  p.visited.add(id)
  p.completed.add(id)
  return write(store, p)
}
