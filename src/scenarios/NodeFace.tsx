import { arrivalScale } from '../anim/spring'
import { TOPICS, TRAVEL_MS, resolve, type Sub } from '../chapters/l2/topics'
import './robottop.css'

/**
 * Seconds since the last message landed at `sub` at chapter time `t` (s), from the Topics chapter's own model:
 * publishes at k / hz, each dot travels TRAVEL_MS. null = nothing has landed (yet, or ever: the names do not match).
 */
export function sinceLanding(sub: Sub, t: number): number | null {
  const topic = TOPICS.find((x) => x.name === resolve(sub.topic, sub.node))
  const tt = t - TRAVEL_MS / 1000
  if (!topic || tt < 0) return null
  return tt - Math.floor(tt * topic.hz + 1e-9) / topic.hz
}

const MUNCH_S = 0.25 // the happy face shows this long after each landing

/**
 * A node's face (Topics chapter, beside its box): pops and smiles each time a message lands; a starved node (its
 * topic name matches no publisher) looks worried toward its silent wire. `since` from sinceLanding().
 */
export default function NodeFace({ x, y, starved, since }: { x: number; y: number; starved: boolean; since: number | null }) {
  const munch = !starved && since !== null && since < MUNCH_S, s = munch ? arrivalScale(since!) : 1
  const mood = starved ? 'starved' : munch ? 'munch' : 'idle', look = starved ? -1.5 : 0
  return (
    <g className="nface" data-mood={mood} transform={`translate(${x} ${y}) scale(${s})`}>
      <circle className="nface-body" r={9} />
      {munch
        ? <path className="nface-line" d="M-5 0q2 -3 4 0M1 0q2 -3 4 0" />
        : <><circle className="nface-eye" cx={-3 + look} cy={0} r={1.5} /><circle className="nface-eye" cx={3 + look} cy={0} r={1.5} /></>}
      {/* brows with the inner ends up: worried, not angry */}
      {starved && <path className="nface-line" d="M-6 -3.5l3 -1.4M6 -3.5l-3 -1.4" />}
      <ellipse className="rtop-blush" cx={-5} cy={4} rx={1.6} ry={1} /><ellipse className="rtop-blush" cx={5} cy={4} rx={1.6} ry={1} />
    </g>
  )
}
