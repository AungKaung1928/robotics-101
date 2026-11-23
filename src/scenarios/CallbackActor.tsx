import Mascot from '../anim/Mascot'
import { DEPTH, type Msg } from '../chapters/l1/callback'

/** At chapter time `t` (ms): messages waiting in the queue, whether a callback is running, and drops so far. */
export function queueAt(ms: Msg[], t: number) {
  const waiting = ms.filter((m) => m.arriveMs <= t && (m.startMs === null || m.startMs > t) && !(m.dropped && m.goneMs! <= t)).length
  const busy = ms.some((m) => m.startMs !== null && m.startMs <= t && t < m.endMs!)
  const drops = ms.filter((m) => m.dropped && m.goneMs! <= t).length
  return { waiting, busy, drops }
}

/**
 * The callback chapter's robot with its inbox: a stack of envelopes behind it, one per waiting scan (DEPTH slots,
 * the subscription's queue size); it thinks while a callback runs and wobbles each time the full queue drops the
 * oldest scan. All from simulate()'s messages at time `t` (ms). `x, y` = where the robot stands (feet).
 */
export default function CallbackActor({ ms, t, x, y, size = 44, label = '' }: { ms: Msg[]; t: number; x: number; y: number; size?: number; label?: string }) {
  const q = queueAt(ms, t), k = size / 64
  return (
    <g className="cb-actor" data-waiting={q.waiting}>
      {Array.from({ length: DEPTH }, (_, i) => (
        <rect key={i} className={i < q.waiting ? 'cb-env is-full' : 'cb-env'} x={x - size / 2 - 22} y={y - 6 - i * 5} width={16} height={4} rx={1} />
      ))}
      <g transform={`translate(${x - 32 * k} ${y - 58 * k})`}>
        <Mascot inSvg size={size} label={label} thinking={q.busy} oops={q.drops} />
      </g>
    </g>
  )
}
