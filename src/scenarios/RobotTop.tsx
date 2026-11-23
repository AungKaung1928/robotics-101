import TreadWheel from '../anim/TreadWheel'
import './robottop.css'

export type TopMood = 'idle' | 'curious' | 'worried' | 'dizzy' | 'proud'
const BODY = 20, WW = 7, WH = 18 // body radius, wheel width / length (figure units)
const PITCH = 6 // stripe pitch: minPitch(0.22 m/s, the Burger top speed in the ROBOTIS e-Manual, × 300 px/m) = 2.75 at 60 fps: 2x margin against reversed-looking stripes

/**
 * The guide robot seen from above (TurtleBot3 Burger plan: round body, two side wheels, the distance sensor on top),
 * the same character as the side-view mascot. Faces +x in its own frame; the parent passes the pose in screen units
 * (y down, `deg` clockwise). Wheel stripes slide by each wheel's own rolled distance; the face shows the mood.
 * `t` (s) only spins the dizzy stars; every mood is readable as a still frame.
 */
export default function RobotTop({ x, y, deg, rolledL = 0, rolledR = 0, mood = 'idle', t = 0, sensor = true }: {
  x: number; y: number; deg: number; rolledL?: number; rolledR?: number; mood?: TopMood; t?: number; sensor?: boolean
}) {
  return (
    <g className="rtop" data-mood={mood} transform={`translate(${x} ${y})`}>
      <g transform={`rotate(${deg})`}>
        {/* wheels run along +x (TreadWheel runs along +y: a quarter turn); left wheel on −y (screen up); seen from above the top of a wheel moves forward */}
        <g transform="rotate(-90)"><TreadWheel x={BODY - 2} y={-WH / 2} w={WW} h={WH} rolled={rolledL} pitch={PITCH} /></g>
        <g transform="rotate(-90)"><TreadWheel x={-BODY - WW + 2} y={-WH / 2} w={WW} h={WH} rolled={rolledR} pitch={PITCH} /></g>
        <circle className="rtop-body" r={BODY} />
        {/* the distance sensor's dome is the head, as in the side-view mascot; sensor off = a plain dome */}
        <circle className={sensor ? 'rtop-lidar' : 'rtop-lidar is-off'} r={13} />
        <Face mood={mood} />
      </g>
      {mood === 'dizzy' && <g className="rtop-stars">{[0, 1, 2].map((i) => {
        const a = t * 5 + (i * 2 * Math.PI) / 3
        return <path key={i} d="M0-3L.8-.8 3 0 .8.8 0 3-.8.8-3 0-.8-.8Z" transform={`translate(${12 * Math.cos(a)} ${-BODY - 6 + 4 * Math.sin(a)})`} />
      })}</g>}
      {mood === 'proud' && <path className="rtop-spark" d="M0-5L1.3-1.3 5 0 1.3 1.3 0 5-1.3 1.3-5 0-1.3-1.3Z" transform={`translate(${BODY} ${-BODY})`} />}
    </g>
  )
}

/** Eyes on the dome, toward the front (+x), so the robot looks where it drives. */
function Face({ mood }: { mood: TopMood }) {
  const ex = 5, ey = 4.5
  const eye = (s: 1 | -1) => {
    const cy = s * ey
    if (mood === 'proud') return <path key={s} className="rtop-line" d={`M${ex - 2} ${cy - 2}L${ex + 1} ${cy}L${ex - 2} ${cy + 2}`} />
    if (mood === 'dizzy') return <path key={s} className="rtop-line" d={`M${ex - 2} ${cy - 2}l4 4M${ex + 2} ${cy - 2}l-4 4`} />
    return <circle key={s} className="rtop-eye" cx={ex} cy={cy} r={mood === 'curious' ? 2.6 : 2} />
  }
  return (
    <g>
      {eye(1)}{eye(-1)}
      {mood === 'worried' && [1, -1].map((s) => <path key={s} className="rtop-line" d={`M${ex + 4} ${s * (ey - 2.5)}L${ex + 3} ${s * (ey + 2.5)}`} />)}
      {[1, -1].map((s) => <ellipse key={`b${s}`} className="rtop-blush" cx={ex - 1} cy={s * (ey + 5)} rx={1.6} ry={2.4} />)}
    </g>
  )
}
