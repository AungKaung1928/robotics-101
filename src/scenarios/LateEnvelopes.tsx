import { arrivalScale } from '../anim/spring'
import Mascot from '../anim/Mascot'
import { consume, flight, type Msg } from './late'
import './late.css'

/**
 * EP2 figure: each message is an envelope flying from the sensor (left) to the consumer (right) over its own
 * latency, one row per message. On arrival it swells once (press spring) and takes its fate's colour; stale and old
 * ones fade out. The robot wobbles at each drop, so a late message is felt, not only read. Each row starts with the
 * message's #id, the same number the chapter's timeline uses, so a row can be matched to its message.
 */
export default function LateEnvelopes({ msgs, maxAge, t, label, fateText }: {
  msgs: Msg[]; maxAge: number; t: number; label: string; fateText: (f: 'used' | 'stale' | 'old') => string
}) {
  const fates = consume(msgs, maxAge), X0 = 34, W = 300, row = 22, H = msgs.length * row + 10
  const drops = fates.filter((f) => f.fate !== 'used' && f.at <= t).length
  return (
    <svg className="inset late" viewBox={`0 0 ${W + 110} ${H}`} role="img" aria-label={label}>
      {msgs.map((m, i) => {
        const f = fates.find((x) => x.id === m.id)!, y = 10 + i * row, p = flight(m, t), landed = t >= f.at
        if (t < m.stamp) return null
        const s = landed ? arrivalScale(t - f.at) : 1, o = landed && f.fate !== 'used' ? Math.max(1 - (t - f.at) / 0.6, 0.25) : 1
        const x = X0 + p * (W - 20 - X0)
        return (
          <g key={m.id}>
            <text className="env-id" x={X0 - 6} y={y + 10}>#{m.id}</text>
            <g opacity={o}>{/* a dropped message fades; its id and the reason stay readable */}
              <line className="lane-line" x1={X0} y1={y + 6} x2={W - 10} y2={y + 6} />
              <g transform={`translate(${x + 10} ${y + 6}) scale(${s}) translate(-10 -6)`}>
                <rect className={`env${landed ? ` ${f.fate}` : ''}`} width={20} height={12} rx={2} />
                <path className={`env${landed ? ` ${f.fate}` : ''}`} d="M0 0 L10 7 L20 0" fill="none" />
              </g>
            </g>
            {landed && <text className="env-label" x={W + 5} y={y + 10}>{fateText(f.fate)}</text>}
          </g>
        )
      })}
      <g transform={`translate(${W + 70} ${H / 2 - 16}) scale(0.5)`}>
        <Mascot inSvg label="" oops={drops} />
      </g>
    </svg>
  )
}
