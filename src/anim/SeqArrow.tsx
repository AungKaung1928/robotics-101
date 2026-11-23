import { easeInOut } from '../lib/timeline'
import './seq.css'

export const DRAW_MS = 260 // drawn travel time of a message arrow (not a measured latency)

/** How far a message arrow is drawn `ms` after its event: 0 before, eased to 1 over DRAW_MS, 1 after. */
export function drawn(ms: number, dur = DRAW_MS): number {
  return ms <= 0 ? 0 : ms >= dur ? 1 : easeInOut(ms / dur)
}

/**
 * One message in a sequence diagram, drawn from sender (x1) to receiver (x2) at height y as its time comes:
 * the line grows towards the receiver, the head appears on arrival, the label sits over the drawn part.
 * `ms` = time since the message was sent (negative = not yet).
 */
export default function SeqArrow({ x1, x2, y, ms, label, kind }: { x1: number; x2: number; y: number; ms: number; label: string; kind?: string }) {
  const p = drawn(ms)
  if (p === 0) return null
  const tip = x1 + (x2 - x1) * p, dir = Math.sign(x2 - x1) || 1
  return (
    <g className="seq" data-kind={kind} data-done={p === 1 || undefined}>
      <line x1={x1} x2={tip} y1={y} y2={y} />
      {p === 1 && <path d={`M${x2 - 8 * dir} ${y - 5}L${x2} ${y}L${x2 - 8 * dir} ${y + 5}`} />}
      <text x={(x1 + tip) / 2} y={y - 6} textAnchor="middle" opacity={p}>{label}</text>
    </g>
  )
}
