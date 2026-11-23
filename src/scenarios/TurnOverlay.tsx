import { turnCentre, type Pose2 } from './diffdrive'
import './robottop.css'

/**
 * Why the robot curves: the point it turns around (on its wheel axis, from turnCentre), the circle it is driving and R
 * in metres; "R = ∞" when straight. `scr` maps metres to the figure; `s` = px per m; (x, y) = the robot on screen.
 * The label goes above the robot when the centre is near it, else under the centre, clamped to [lo, hi] in x.
 */
export default function TurnOverlay({ vl, vr, p, slip = 0, scr, s, x, y, lo = 50, hi = 410 }: {
  vl: number; vr: number; p: Pose2; slip?: number; scr: (q: { x: number; y: number }) => readonly [number, number]; s: number; x: number; y: number; lo?: number; hi?: number
}) {
  const c = turnCentre(vl, vr, p, slip)
  if (!c) return <text className="ms-turn-label" x={x} y={y - 30} textAnchor="middle" data-turn="straight">R = ∞</text>
  const [cx, cy] = scr(c), close = Math.abs(c.r) * s < 50
  const lx = Math.min(hi, Math.max(lo, close ? x : cx)), ly = Math.max(16, close ? y - 30 : cy + 20)
  return (
    <g className="ms-turn" data-turn={c.r.toFixed(2)}>
      <circle className="ms-turn-path" cx={cx} cy={cy} r={Math.abs(c.r) * s} />
      <line className="ms-turn-r" x1={x} y1={y} x2={cx} y2={cy} />
      <circle className="ms-turn-c" cx={cx} cy={cy} r={3.5} />
      <text className="ms-turn-label" x={lx} y={ly} textAnchor="middle">R = {Math.abs(c.r).toFixed(2)} m</text>
    </g>
  )
}
