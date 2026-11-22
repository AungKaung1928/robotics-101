/** Chapters in patrol order: one per waypoint. */
export const CHAPTERS = ['bringup', 'tf', 'scan', 'detect', 'grid', 'costmap', 'goal'] as const

export type ChapterId = (typeof CHAPTERS)[number]
export type Route = { page: 'overview' } | { page: 'chapter'; id: ChapterId }

/** '#/scan' → the scan chapter; '', '#/', unknown ids → overview. */
export function parseRoute(hash: string): Route {
  const id = hash.replace(/^#\/?/, '').split('/')[0]
  const ch = CHAPTERS.find((c) => c === id)
  return ch ? { page: 'chapter', id: ch } : { page: 'overview' }
}

/** The chapter before (-1) or after (+1) `id`, or null at either end. */
export function neighbour(id: ChapterId, dir: -1 | 1): ChapterId | null {
  return CHAPTERS[CHAPTERS.indexOf(id) + dir] ?? null
}
