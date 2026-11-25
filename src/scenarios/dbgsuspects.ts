import { FAULTS, remaining, type Clue, type Fault, type Tool } from '../chapters/l5/debug'

/**
 * Chapter 5.3 scene: the suspect list reacts to each clue. A fault the newest clue rules out is 'struck' (the strike is
 * drawn now), one ruled out earlier is 'out' (strike already there), the last one standing is 'found' (pops), the rest 'in'.
 * Every state comes from debug.remaining(); nothing is timed by hand.
 */
export type Mark = 'in' | 'struck' | 'out' | 'found'
export function marks(seen: { tool: Tool; clue: Clue }[]): Record<Fault, Mark> {
  const now = remaining(seen), before = remaining(seen.slice(0, -1))
  const m = {} as Record<Fault, Mark>
  for (const f of FAULTS) m[f] = now.includes(f) ? (now.length === 1 && seen.length ? 'found' : 'in') : before.includes(f) ? 'struck' : 'out'
  return m
}
