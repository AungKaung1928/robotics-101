import RobotTop from './RobotTop'
import { cast, room, sweep } from './sense'
import './robottop.css'

const S = 280, M = 20, O = { x: 0.3, y: 0.5 }
const X = (x: number) => M + x * S, Y = (y: number) => M + (1 - y) * S

/**
 * On-ramp "sense". mode 'beam': one beam straight ahead to the movable wall at `wallX` (m), its reading riding on it.
 * mode 'spin': the beam turns at `rate` rev/s and leaves hit dots that fade over one turn (the LiDAR picture).
 * `covered`: a paw over the sensor; no beam reaches anything, no number, the robot looks worried. From sense.ts.
 */
export default function SenseScene({ wallX, mode, t = 0, covered = false, rate = 0.5, label }: {
  wallX: number; mode: 'beam' | 'spin'; t?: number; covered?: boolean; rate?: number; label: string
}) {
  const walls = room(wallX), a = mode === 'spin' ? 2 * Math.PI * rate * t : 0, d = cast(O, a, walls, covered)
  const hits = mode === 'spin' ? sweep(O, walls, t, rate, Math.PI / 90, covered) : []
  const end = d ?? 0.18, ex = O.x + end * Math.cos(a), ey = O.y + end * Math.sin(a)
  return (
    <svg className="sense-scene" viewBox={`0 0 ${2 * M + 1.5 * S} ${2 * M + S}`} role="img" aria-label={label} data-reading={d === null ? 'none' : d.toFixed(2)}>
      {walls.map(([x1, y1, x2, y2], i) => <line key={i} className={i === 4 ? 'ss-wall is-movable' : 'ss-wall'} x1={X(x1)} y1={Y(y1)} x2={X(x2)} y2={Y(y2)} />)}
      {hits.map((h, i) => <circle key={i} className="ss-hit" cx={X(h.x)} cy={Y(h.y)} r={2.6} opacity={h.o} />)}
      {!covered && <line className={d === null ? 'ss-beam is-none' : 'ss-beam'} x1={X(O.x)} y1={Y(O.y)} x2={X(ex)} y2={Y(ey)} />}
      {d !== null && <circle className="ss-hit is-now" cx={X(ex)} cy={Y(ey)} r={4} />}
      {mode === 'beam' && <text className="ss-num" x={covered ? X(O.x) + 34 : X(O.x + end / 2)} y={Y(O.y) - (covered ? 26 : 10)} textAnchor="middle">{d === null ? '–' : `${d.toFixed(2)} m`}</text>}
      <RobotTop x={X(O.x)} y={Y(O.y)} deg={0} mood={covered ? 'worried' : 'curious'} sensor={!covered} />
      {covered && <g className="ss-paw" transform={`translate(${X(O.x)} ${Y(O.y)})`}>{/* a soft paw from behind over the dome: palm + three toe beans; the worried eyes stay visible in front */}
        <ellipse cx={-7} cy={0} rx={9} ry={11} />{[-8, 0, 8].map((ty) => <circle key={ty} cx={ty ? -17 : -19} cy={ty} r={3.6} />)}
      </g>}
    </svg>
  )
}
