/** Chapters in patrol order. `built: false` waypoints show on the plan but do not open yet. */
export const CHAPTERS = [
  { id: 'bringup', built: true },
  { id: 'tf', built: true },
  { id: 'scan', built: true },
  { id: 'detect', built: false },
  { id: 'grid', built: false },
  { id: 'costmap', built: true },
  { id: 'goal', built: true },
] as const

export type ChapterId = (typeof CHAPTERS)[number]['id']
export type Route = { page: 'overview' } | { page: 'chapter'; id: ChapterId }

/** '#/scan' → the scan chapter; '', '#/', unknown or not-yet-built ids → overview. */
export function parseRoute(hash: string): Route {
  const id = hash.replace(/^#\/?/, '').split('/')[0]
  const ch = CHAPTERS.find((c) => c.id === id)
  return ch?.built ? { page: 'chapter', id: ch.id } : { page: 'overview' }
}

/** The built chapter before (-1) or after (+1) `id`, or null at either end. */
export function neighbour(id: ChapterId, dir: -1 | 1): ChapterId | null {
  const built = CHAPTERS.filter((c) => c.built).map((c) => c.id as ChapterId)
  return built[built.indexOf(id) + dir] ?? null
}
