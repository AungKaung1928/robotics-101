import RobotTop from './RobotTop'
import { TRACK, poseAt, rolled, trail, wheelPoint, type Pose2 } from './diffdrive'
import TurnOverlay from './TurnOverlay'
import { startStretch } from '../anim/spring'
import './robottop.css'

const S = 300, X0 = 60, Y0 = 200 // px per m (the drawn wheels sit TRACK·S = 48 px apart, as in RobotTop), start point (screen)
const scr = (p: { x: number; y: number }) => [X0 + p.x * S, Y0 - p.y * S] as const
const OUT = 0.035 // m: arrows start this far outside the wheel, clear of the body

/** Arrow from a point beside wheel `side` (1 = left) along the heading, `ms` m/s long over 1 s (back if negative). */
function wheelArrow(p: Pose2, side: 1 | -1, ms: number) {
  const o = TRACK / 2 + OUT, bx = p.x - side * o * Math.sin(p.th), by = p.y + side * o * Math.cos(p.th)
  const [x1, y1] = scr({ x: bx, y: by }), [x2, y2] = scr({ x: bx + ms * Math.cos(p.th), y: by + ms * Math.sin(p.th) })
  const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / (len || 1), uy = (y2 - y1) / (len || 1), h = Math.min(7, len * 0.6)
  return { d: `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`, head: len < 1 ? '' :
    `M${(x2 - h * ux - h * 0.6 * uy).toFixed(1)} ${(y2 - h * uy + h * 0.6 * ux).toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}L${(x2 - h * ux + h * 0.6 * uy).toFixed(1)} ${(y2 - h * uy - h * 0.6 * ux).toFixed(1)}` }
}

/**
 * On-ramp "move": the robot drives `t` s at left / right wheel speeds vl, vr (m/s). The path is drawn behind it, the
 * wheel stripes slide at each wheel's own speed, and with `slip` > 0 the left wheel leaves a skid mark where it spun
 * without gripping, while the robot curves although both wheels turn alike. All from diffdrive.poseAt().
 * `arrows`: per wheel, where its ground point gets in 1 s (unequal = a curve, opposite = a spin on the spot); with slip a
 * dashed arrow shows what the left wheel spins, the solid one what reaches the floor.
 * `tEnd`: the rest of the path up to tEnd, faint (where it is going), plus the start dot. `solved`: proud face.
 */
export default function MoveScene({ vl, vr, t, slip = 0, showTurn = false, arrows = false, tEnd, solved = false, label }: {
  vl: number; vr: number; t: number; slip?: number; showTurn?: boolean; arrows?: boolean; tEnd?: number; solved?: boolean; label: string
}) {
  const p = poseAt(vl, vr, t, slip), [x, y] = scr(p), r = rolled(vl, vr, t), tr = trail(vl, vr, t, slip)
  const path = tr.map((q, i) => `${i ? 'L' : 'M'}${scr(q).map((v) => v.toFixed(1)).join(' ')}`).join('')
  const skid = slip > 0 ? tr.filter((_, i) => i % 3 === 0).map((q) => scr(wheelPoint(q, 1))) : []
  return (
    <svg className="move-scene" viewBox="0 0 460 340" role="img" aria-label={label}>
      {tEnd !== undefined && tEnd > t && <path className="ms-ahead" d={[p, ...trail(vl, vr, tEnd, slip).filter((_, i) => i * 0.05 > t + 1e-9)]
        .map((q, i) => `${i ? 'L' : 'M'}${scr(q).map((v) => v.toFixed(1)).join(' ')}`).join('')} />}
      {tEnd !== undefined && <circle className="ms-start" cx={scr({ x: 0, y: 0 })[0]} cy={scr({ x: 0, y: 0 })[1]} r={4} />}
      <path className="ms-trail" d={path} />
      {skid.map(([sx, sy], i) => <circle key={i} className="ms-skid" cx={sx} cy={sy} r={2.2} />)}
      {showTurn && <TurnOverlay vl={vl} vr={vr} p={p} slip={slip} scr={scr} s={S} x={x} y={y} />}
      {arrows && slip > 0 && <g className="ms-v is-spin" data-ms={vl.toFixed(3)}><path d={wheelArrow(p, 1, vl).d} /><path d={wheelArrow(p, 1, vl).head} /></g>}
      {arrows && ([[1, vl * (1 - slip)], [-1, vr]] as const).map(([side, g]) => { const a = wheelArrow(p, side, g); return (
        <g key={side} className="ms-v" data-wheel={side === 1 ? 'left' : 'right'} data-ms={g.toFixed(3)}><path d={a.d} /><path d={a.head} /></g>) })}
      <RobotTop x={x} y={y} deg={(-p.th * 180) / Math.PI} rolledL={r.l * S} rolledR={r.r * S} mood={slip > 0 ? 'worried' : solved ? 'proud' : 'idle'} stretch={vl || vr ? startStretch(t) : 1} />
    </svg>
  )
}
