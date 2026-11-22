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

/** Step number from '#/<chapter>/<step>' (1-based in the URL) as a 0-based index, clamped to [0, count - 1]; no step → last. */
export function routeStep(hash: string, count: number): number {
  const n = Number(hash.replace(/^#\/?/, '').split('/')[1])
  return Number.isInteger(n) && n >= 1 ? Math.min(n, count) - 1 : count - 1
}

/** The chapter before (-1) or after (+1) `id`, or null at either end. */
export function neighbour(id: ChapterId, dir: -1 | 1): ChapterId | null {
  return CHAPTERS[CHAPTERS.indexOf(id) + dir] ?? null
}
