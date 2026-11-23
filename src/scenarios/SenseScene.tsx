import RobotTop from './RobotTop'
import { cast, sweep } from './sense'
import { roomLayout, type Box } from './room'
import './robottop.css'

const S = 280, M = 20, VW = 2 * M + 1.5 * S, VH = 2 * M + S

/**
 * On-ramp "sense". mode 'beam': one beam straight ahead to the movable wall at `wallX` (m), its reading riding on it.
 * mode 'spin': the beam turns at `rate` rev/s and leaves hit dots that fade over one turn (the LiDAR picture).
 * `covered`: a paw over the sensor; no beam reaches anything, no number, the robot looks worried. From sense.ts.
 * `box` = the chapter's own room (src/chapters/l0/sense.ts ROOM) instead of the built-in one (wallX then unused).
 */
export default function SenseScene({ wallX = 1, box, mode, t = 0, covered = false, rate = 0.5, label }: {
  wallX?: number; box?: Box; mode: 'beam' | 'spin'; t?: number; covered?: boolean; rate?: number; label: string
}) {
  const { walls, O, movable, X, Y } = roomLayout(wallX, box, VW, VH, M, S), a = mode === 'spin' ? 2 * Math.PI * rate * t : 0, d = cast(O, a, walls, covered)
  const hits = mode === 'spin' ? sweep(O, walls, t, rate, Math.PI / 90, covered) : []
  const end = d ?? 0.18, ex = O.x + end * Math.cos(a), ey = O.y + end * Math.sin(a)
  const near = X(O.x + end / 2) - X(O.x) < 44 // near wall: the beam's midpoint is under the robot, so the reading moves above its head
  return (
    <svg className="sense-scene" viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={label} data-hits={hits.length} data-reading={d === null ? 'none' : d.toFixed(2)}>
      {walls.map(([x1, y1, x2, y2], i) => <line key={i} className={i === movable ? 'ss-wall is-movable' : 'ss-wall'} x1={X(x1)} y1={Y(y1)} x2={X(x2)} y2={Y(y2)} />)}
      {fadeBuckets(hits, X, Y).map(([o, d]) => <path key={o} className="ss-hit" opacity={o} d={d} />)}
      {!covered && <line className={d === null ? 'ss-beam is-none' : 'ss-beam'} x1={X(O.x)} y1={Y(O.y)} x2={X(ex)} y2={Y(ey)} />}
      {d !== null && <circle className="ss-hit is-now" cx={X(ex)} cy={Y(ey)} r={4} />}
      {mode === 'beam' && <text className="ss-num" x={covered ? X(O.x) + 34 : near ? X(O.x) : X(O.x + end / 2)} y={Y(O.y) - (covered ? 26 : near ? 34 : 10)} textAnchor="middle">{d === null ? '–' : `${d.toFixed(2)} m`}</text>}
      <RobotTop x={X(O.x)} y={Y(O.y)} deg={0} mood={covered ? 'worried' : 'curious'} sensor={!covered} />
      {covered && <g className="ss-paw" transform={`translate(${X(O.x)} ${Y(O.y)})`}>{/* a soft paw from behind over the dome: palm + three toe beans; the worried eyes stay visible in front */}
        <ellipse cx={-7} cy={0} rx={9} ry={11} />{[-8, 0, 8].map((ty) => <circle key={ty} cx={ty ? -17 : -19} cy={ty} r={3.6} />)}
      </g>}
    </svg>
  )
}

const FADE_STEPS = 8, R = 2.6
/** Hit dots grouped by fade (1/8 steps) into one path each: ~9 DOM nodes per frame instead of up to 180 circles. */
function fadeBuckets(hits: { x: number; y: number; o: number }[], X: (x: number) => number, Y: (y: number) => number): [number, string][] {
  const by = new Map<number, string>()
  for (const h of hits) {
    const o = Math.max(1, Math.round(h.o * FADE_STEPS)) / FADE_STEPS
    by.set(o, (by.get(o) ?? '') + `M${(X(h.x) - R).toFixed(1)} ${Y(h.y).toFixed(1)}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0`)
  }
  return [...by.entries()]
}
