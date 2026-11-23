import RobotTop from './RobotTop'
import { actAt, wheels } from './act'
import './robottop.css'

const S = 300, X0 = 50, Y0 = 150, VMAX = 0.22, WMAX = 2.84 // px/m, start; Burger top speeds (ROBOTIS e-Manual)
const scr = (p: { x: number; y: number }) => [X0 + p.x * S, Y0 - p.y * S] as const
const deg = (th: number) => (-th * 180) / Math.PI

/** A half-circle gauge: the needle shows the COMMAND (it drops to 0 the moment stop is pressed). */
function Dial({ x, value, max, word }: { x: number; value: number; max: number; word: string }) {
  const a = Math.PI * (1 - (value / max + 1) / 2), r = 30 // −max at the left, 0 straight up, +max at the right
  return (
    <g className="as-dial" transform={`translate(${x} 290)`}>
      <path d={`M${-r} 0A${r} ${r} 0 0 1 ${r} 0`} />
      <line className="as-needle" x1={0} y1={0} x2={r * 0.85 * Math.cos(a)} y2={-r * 0.85 * Math.sin(a)} />
      <text y={18} textAnchor="middle">{word} {value.toFixed(2)}</text>
    </g>
  )
}

/**
 * On-ramp "act": dials for forward and turn speed (the command), arrows on each wheel for what the wheel really does,
 * the robot driving the arc. At `tStop` the dials drop to 0 but the wheels slow down over the brake time: the robot
 * rolls on past its ghost (where an instant stop would have left it) by the distance printed between them. From act.ts.
 */
export default function ActScene({ v, w, tStop, decel, t, vWord = 'v', wWord = 'ω', label }: {
  v: number; w: number; tStop: number; decel: number; t: number; vWord?: string; wWord?: string; label: string
}) {
  const f = actAt(v, w, tStop, decel, t), on = t < tStop, [x, y] = scr(f.pose), [gx, gy] = scr(f.ghost), { vl, vr } = wheels(v, w)
  const path = Array.from({ length: Math.floor(t / 0.05) + 2 }, (_, i) => scr(actAt(v, w, tStop, decel, Math.min(i * 0.05, t)).pose))
    .map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join('')
  const arrow = (side: 1 | -1, sp: number) => { const len = (sp / VMAX) * 22 * f.speed; return len ? <path className="as-arrow" d={`M0 ${-side * 26}h${len}`} markerEnd="url(#as-head)" /> : null }
  return (
    <svg className="act-scene" viewBox="0 0 460 320" role="img" aria-label={label} data-phase={on ? 'driving' : f.speed > 0 ? 'rolling' : 'stopped'}>
      <defs><marker id="as-head" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L6 3 0 6z" className="as-head" /></marker></defs>
      <path className="ms-trail" d={path} />
      {!on && <g opacity={0.35}><RobotTop x={gx} y={gy} deg={deg(f.ghost.th)} /></g>}
      {f.rollOn > 0.002 && <>
        <line className="as-roll" x1={gx} y1={gy} x2={x} y2={y} />
        <text className="as-num" x={(gx + x) / 2} y={Math.min(gy, y) - 30} textAnchor="middle">+{f.rollOn.toFixed(2)} m</text>
      </>}
      <RobotTop x={x} y={y} deg={deg(f.pose.th)} rolledL={f.rolled.l * S} rolledR={f.rolled.r * S} mood={on ? 'idle' : f.speed > 0 ? 'worried' : 'curious'} />
      <g transform={`translate(${x} ${y}) rotate(${deg(f.pose.th)})`}>{arrow(1, vl)}{arrow(-1, vr)}</g>
      <Dial x={150} value={on ? v : 0} max={VMAX} word={vWord} />
      <Dial x={310} value={on ? w : 0} max={WMAX} word={wWord} />
    </svg>
  )
}
