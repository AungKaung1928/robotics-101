import RobotTop from './RobotTop'
import { poseAt, rolled, trail, turnCentre, wheelPoint } from './diffdrive'
import './robottop.css'

const S = 300, X0 = 50, Y0 = 200 // px per m (the drawn wheels sit TRACK·S = 48 px apart, as in RobotTop), start point (screen)
const scr = (p: { x: number; y: number }) => [X0 + p.x * S, Y0 - p.y * S] as const

/**
 * On-ramp "move": the robot drives `t` s at left / right wheel speeds vl, vr (m/s). The path is drawn behind it, the
 * wheel stripes slide at each wheel's own speed, and with `slip` > 0 the left wheel leaves a skid mark where it spun
 * without gripping, while the robot curves although both wheels turn alike. All from diffdrive.poseAt().
 */
export default function MoveScene({ vl, vr, t, slip = 0, showTurn = false, label }: { vl: number; vr: number; t: number; slip?: number; showTurn?: boolean; label: string }) {
  const p = poseAt(vl, vr, t, slip), [x, y] = scr(p), r = rolled(vl, vr, t), tr = trail(vl, vr, t, slip)
  const path = tr.map((q, i) => `${i ? 'L' : 'M'}${scr(q).map((v) => v.toFixed(1)).join(' ')}`).join('')
  const skid = slip > 0 ? tr.filter((_, i) => i % 3 === 0).map((q) => scr(wheelPoint(q, 1))) : []
  return (
    <svg className="move-scene" viewBox="0 0 460 340" role="img" aria-label={label}>
      <path className="ms-trail" d={path} />
      {skid.map(([sx, sy], i) => <circle key={i} className="ms-skid" cx={sx} cy={sy} r={2.2} />)}
      {showTurn && (() => { // why it curves: the point it turns around (on the wheel axis), its circle and radius
        const c = turnCentre(vl, vr, p, slip)
        if (!c) return <text className="ms-turn-label" x={x} y={y - 30} textAnchor="middle" data-turn="straight">R = ∞</text>
        const [cx, cy] = scr(c), close = Math.abs(c.r) * S < 50 // label above the robot when the centre is near it, else under the centre
        const lx = Math.min(410, Math.max(50, close ? x : cx)), ly = Math.min(330, Math.max(16, close ? y - 30 : cy + 20))
        return <g className="ms-turn" data-turn={c.r.toFixed(2)}>
          <circle className="ms-turn-path" cx={cx} cy={cy} r={Math.abs(c.r) * S} />
          <line className="ms-turn-r" x1={x} y1={y} x2={cx} y2={cy} />
          <circle className="ms-turn-c" cx={cx} cy={cy} r={3.5} />
          <text className="ms-turn-label" x={lx} y={ly} textAnchor="middle">R = {Math.abs(c.r).toFixed(2)} m</text>
        </g>
      })()}
      <RobotTop x={x} y={y} deg={(-p.th * 180) / Math.PI} rolledL={r.l * S} rolledR={r.r * S} mood={slip > 0 ? 'worried' : 'idle'} />
    </svg>
  )
}
