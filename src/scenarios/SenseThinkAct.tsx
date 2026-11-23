import { MascotFigure } from '../anim/Mascot'
import { REST } from '../anim/mascot'
import { loopAt, type Phase, type Tick } from './loop'
import './loop.css'

const W = 640, H = 270, TRACK = 230, X0 = 60, X1 = 600, RING = { x: 90, y: 82, r: 42 }
const FRONT = 46 // px from the robot drawing's left edge to its front at size 56: the sensor, where x is measured
const NODE: Record<Phase, number> = { sense: -90, think: 30, act: 150 } // degrees on the ring, clockwise from the top

/**
 * Level 0.1 figure: the loop ring (which step runs now, a dot going round once per scan) above the track where the
 * robot drives to the wall. Sense draws the ray and the distance, think the rule and its answer, act the motion.
 */
export default function SenseThinkAct({ ticks, hz, t, wall, stopAt, words, label }: {
  ticks: Tick[]; hz: number; t: number; wall: number; stopAt: number; label: string
  words: Record<Phase | 'go' | 'stop', string>
}) {
  const at = loopAt(ticks, hz, t), k = ticks[at.i], done = at.i === ticks.length - 1 && at.p >= 1
  const sx = (m: number) => X0 + (m / wall) * (X1 - X0)
  const rx = sx(at.x), rad = (deg: number) => (deg * Math.PI) / 180
  const dot = rad(-90 + 360 * at.p)
  return (
    <svg className="stl" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <circle className="stl-ring" cx={RING.x} cy={RING.y} r={RING.r} />
      {(Object.keys(NODE) as Phase[]).map((ph) => {
        const a = rad(NODE[ph]), x = RING.x + RING.r * Math.cos(a), y = RING.y + RING.r * Math.sin(a)
        return (
          <g key={ph} className="stl-node" data-on={ph === at.phase && !done ? '' : undefined}>
            <circle cx={x} cy={y} r="13" />
            <text x={x + (ph === 'sense' ? 0 : ph === 'think' ? 18 : -18)} y={y + (ph === 'sense' ? -19 : 4)}
              textAnchor={ph === 'sense' ? 'middle' : ph === 'think' ? 'start' : 'end'}>{words[ph]}</text>
          </g>
        )
      })}
      {!done && <circle className="stl-dot" cx={RING.x + RING.r * Math.cos(dot)} cy={RING.y + RING.r * Math.sin(dot)} r="4" />}
      <text className="stl-tick" x={RING.x} y={RING.y + 4} textAnchor="middle">#{at.i + 1}</text>

      <line className="stl-track" x1={X0} x2={X1} y1={TRACK} y2={TRACK} />
      <line className="stl-stop" x1={sx(wall - stopAt)} x2={sx(wall - stopAt)} y1={TRACK - 60} y2={TRACK + 8} />
      <path className="stl-dim" d={`M${sx(wall - stopAt)} ${TRACK + 16}H${X1}`} />
      <text className="stl-small" x={(sx(wall - stopAt) + X1) / 2} y={TRACK + 30} textAnchor="middle">{stopAt} m</text>
      <rect className="stl-wall" x={X1} y={TRACK - 80} width="10" height="88" />
      {at.phase === 'sense' && !done && <line className="stl-ray" x1={rx} x2={X1} y1={TRACK - 34} y2={TRACK - 34} />}
      {at.phase === 'act' && k.go && !done && <path className="stl-go" d={`M${rx + 6} ${TRACK - 10}h22l-6 -5m6 5l-6 5`} />}
      <g transform={`translate(${rx - FRONT} ${TRACK - 54})`}>
        <MascotFigure pose={REST} mood={done ? 'happy' : 'idle'} size={56} label="" />
      </g>
      <text className="stl-say" x={Math.min(Math.max(rx - FRONT, 150), X1 - 210)} y={TRACK - 70}>
        {at.phase === 'sense' && !done && `${words.sense}: ${k.d.toFixed(2)} m`}
        {at.phase === 'think' && !done && `${k.d.toFixed(2)} ${k.go ? '>' : '≤'} ${stopAt} → ${k.go ? words.go : words.stop}`}
        {(at.phase === 'act' || done) && (k.go && !done ? `${words.act}: ${words.go}` : `${words.stop} · ${k.d.toFixed(2)} m`)}
      </text>
    </svg>
  )
}
