import { BOUNCY, WOBBLE, springAt } from '../anim/spring'
import { HAPPY_S, OOPS_S } from '../anim/mascot'
import { diagnose, pairKey, type Edge, type Frame } from '../chapters/l3/tflab'

/** The chain drawn left to right; a lookup of map -> base_link walks it hop by hop. */
export const CHAIN: readonly Frame[] = ['map', 'odom', 'base_link']
export const HOP = 0.45 // s per hop of the lookup pulse
export const BUMP_V = 4.5 // hops / s into the gap: peaks near 0.2 hop, well short of the next frame
export const GROW = 0.35 // s for a new broadcaster's edge to spring in before the lookup starts

/** How far along the chain a lookup from map gets: index of the last frame tf2 can join to map (from diagnose()). */
export function reach(edges: readonly Edge[]): number {
  const d = diagnose(edges)
  return d[pairKey(['map', 'base_link'])] === 'OK' ? 2 : d[pairKey(['map', 'odom'])] === 'OK' ? 1 : 0
}

const has = (edges: readonly Edge[], p: Frame, c: Frame) => edges.some(([a, b]) => (a === p && b === c) || (a === c && b === p))
const ease = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u))

export type ChainFrame = {
  links: { on: boolean; scale: number }[] // one per hop of CHAIN; scale springs 0 -> 1 for an edge that is new since `before`
  s: number // pulse position in frame-index units along CHAIN
  outcome: 'walk' | 'stuck' | 'arrived'
  since: number // s since the outcome began (0 while walking): drives the mascot's oops / happy pose
}

/**
 * One frame of the scene, `t` s after `edges` replaced `before`: new edges spring in (bouncy, overshoot) over GROW,
 * then the lookup pulse walks hop by hop (smoothstep per hop) and either stops at the last reachable frame, bumping
 * into the gap once (a small wobble spring that never crosses it), or arrives at base_link.
 */
export function chainAt(edges: readonly Edge[], before: readonly Edge[], t: number): ChainFrame {
  const links = CHAIN.slice(1).map((c, i) => {
    const on = has(edges, CHAIN[i], c), fresh = on && !has(before, CHAIN[i], c)
    return { on, scale: !fresh ? 1 : t <= 0 ? 0 : Math.max(0, 1 + springAt(t, BOUNCY, -1)) }
  })
  const fresh = links.some((l, i) => l.on && !has(before, CHAIN[i], CHAIN[i + 1]))
  const r = reach(edges), w = t - (fresh ? GROW : 0), walk = r * HOP
  if (w < walk) {
    const k = Math.max(0, w) / HOP, i = Math.floor(k)
    return { links, s: i + ease(k - i), outcome: 'walk', since: 0 }
  }
  const since = w - walk
  if (r === CHAIN.length - 1) return { links, s: r, outcome: 'arrived', since }
  // bump: the pulse keeps its speed into the gap and a wobble spring throws it back; only the half that points into the gap is shown
  return { links, s: r + Math.max(0, springAt(since, WOBBLE, 0, BUMP_V)), outcome: 'stuck', since }
}

/** Scene length for `edges` after `before`: the walk plus the reaction it ends in. */
export function chainEnd(edges: readonly Edge[], before: readonly Edge[]): number {
  const fresh = CHAIN.slice(1).some((c, i) => has(edges, CHAIN[i], c) && !has(before, CHAIN[i], c))
  return (fresh ? GROW : 0) + reach(edges) * HOP + (reach(edges) === CHAIN.length - 1 ? HAPPY_S : OOPS_S)
}
