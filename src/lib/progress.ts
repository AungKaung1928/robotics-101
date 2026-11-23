/** Chapters the reader has opened, kept in localStorage so the level map can tick them. */
const KEY = 'r101-done'

export function readDone(store: Pick<Storage, 'getItem'>): Set<string> {
  try {
    const v: unknown = JSON.parse(store.getItem(KEY) ?? '[]')
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set() // corrupt value: start fresh rather than break the overview
  }
}

export function markDone(store: Pick<Storage, 'getItem' | 'setItem'>, id: string): Set<string> {
  const done = readDone(store)
  done.add(id)
  store.setItem(KEY, JSON.stringify([...done]))
  return done
}
