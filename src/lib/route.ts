/** Chapters in patrol order: one per waypoint. */
export const CHAPTERS = ['bringup', 'tf', 'scan', 'detect', 'grid', 'costmap', 'goal'] as const

export type ChapterId = (typeof CHAPTERS)[number]
export type Route = { page: 'overview' } | { page: 'chapter'; id: ChapterId }

/** Path segments of the hash without the query; a leading level number ('#/4/grid') is dropped. */
function segments(hash: string): string[] {
  const parts = hash.replace(/^#\/?/, '').split('?')[0].split('/')
  return /^\d$/.test(parts[0]) && parts.length > 1 ? parts.slice(1) : parts
}

/** '#/scan' or '#/3/scan' → the scan chapter; '', '#/', unknown ids → overview. */
export function parseRoute(hash: string): Route {
  const id = segments(hash)[0]
  const ch = CHAPTERS.find((c) => c === id)
  return ch ? { page: 'chapter', id: ch } : { page: 'overview' }
}

/** Step number from '#/<chapter>/<step>' (1-based in the URL) as a 0-based index, clamped to [0, count - 1]; no step → last. */
export function routeStep(hash: string, count: number): number {
  const n = Number(segments(hash)[1])
  return Number.isInteger(n) && n >= 1 ? Math.min(n, count) - 1 : count - 1
}

/** Numeric start value from the query part of the hash ('#/tf?jump=0.6'), clamped to [min, max]; missing or bad → fallback. */
export function routeParam(hash: string, name: string, fallback: number, min: number, max: number): number {
  const q = hash.split('?')[1]
  const v = q === undefined ? NaN : Number(new URLSearchParams(q).get(name) ?? NaN)
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback
}

/** The chapter before (-1) or after (+1) `id`, or null at either end. */
export function neighbour(id: ChapterId, dir: -1 | 1): ChapterId | null {
  return CHAPTERS[CHAPTERS.indexOf(id) + dir] ?? null
}

/** Where a key press goes: 1–7 open that waypoint from any page; ← → step between chapters; anything else stays. */
export function keyTarget(key: string, route: Route): ChapterId | null {
  const n = Number(key)
  if (Number.isInteger(n) && n >= 1 && n <= CHAPTERS.length) return CHAPTERS[n - 1]
  if (route.page !== 'chapter') return null
  const dir = key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : 0
  return dir ? neighbour(route.id, dir) : null
}
