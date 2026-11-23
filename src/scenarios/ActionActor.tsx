import Mascot from '../anim/Mascot'
import type { Ev } from '../chapters/l2/actions'

/** Mascot triggers from the action messages seen so far (each counter bumps once per message, so every retry reacts). */
export function actionCues(seen: Ev[]) {
  const n = (f: (e: Ev) => boolean) => seen.filter(f).length
  const last = seen.at(-1)
  return {
    start: n((e) => e.kind === 'accepted'), // the goal is accepted: it sets off (inertia jolt)
    oops: n((e) => e.kind === 'result' && e.status === 'ABORTED'), // Nav2 gave up on this attempt
    brake: n((e) => e.kind === 'result' && e.status === 'CANCELED'), // the reader cancelled: it stops
    cheer: n((e) => e.kind === 'result' && e.status === 'SUCCEEDED'),
    thinking: last?.kind === 'goal', // sent, not yet accepted
  }
}

/**
 * The Actions chapter's robot as the character: reacts to each goal / result message (actionCues) and rolls its wheels
 * by the distance really driven. `x` = its front on the chapter's track, `y` = the ground line, `moved` = svg units
 * driven (the scene's robot distance times the chapter's scale).
 */
export default function ActionActor({ seen, x, y, moved, size = 40, label = '' }: { seen: Ev[]; x: number; y: number; moved: number; size?: number; label?: string }) {
  const k = size / 64
  return (
    <g className="action-actor" transform={`translate(${x - 55 * k} ${y - 58 * k})`}>
      <Mascot inSvg size={size} label={label} roll={moved / k} {...actionCues(seen)} />
    </g>
  )
}
