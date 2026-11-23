import { room, type Seg } from './sense'

/** A chapter's own room (src/chapters/l0/sense.ts ROOM): robot at the origin facing +x, walls at x = back and x = front,
 * y = ±side; front is the wall the reader moves, scaled for maxFront so dragging it never rescales the picture. */
export type Box = { back: number; front: number; side: number; maxFront: number }

/**
 * Walls, robot position, the movable wall's index and the metres -> figure mapping, for the built-in room (room(wallX),
 * 1.5 x 1 m, robot at (0.3, 0.5), `scale` px per m) or a chapter's box fitted into a `w` x `h` figure with margin `m`.
 */
export function roomLayout(wallX: number, box: Box | undefined, w: number, h: number, m: number, scale: number) {
  if (!box) return { walls: room(wallX), O: { x: 0.3, y: 0.5 }, movable: 4, X: (x: number) => m + x * scale, Y: (y: number) => m + (1 - y) * scale }
  const { back, front, side, maxFront } = box, k = Math.min((w - 2 * m) / (maxFront - back), (h - 2 * m) / (2 * side))
  const walls: Seg[] = [[back, -side, back, side], [back, side, front, side], [front, side, front, -side], [front, -side, back, -side]]
  return { walls, O: { x: 0, y: 0 }, movable: 2, X: (x: number) => m + (x - back) * k, Y: (y: number) => h / 2 - y * k }
}
