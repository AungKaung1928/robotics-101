import { driveProfile } from './drive'
import './drive.css'

const W = 640, H = 180, PAD = 40

/**
 * Speed against time for the drive to the goal, playhead at `t`: the area filled under the curve so far is the
 * distance driven (the readout shows both, so the reader can check one against the other).
 */
export default function SpeedProfile({ p, t, label }: { p: ReturnType<typeof driveProfile>; t: number; label: string }) {
  const sx = (x: number) => PAD + (x / p.T) * (W - 2 * PAD)
  const sy = (v: number) => H - PAD - (v / (p.vPeak || 1)) * (H - 2 * PAD)
  const n = 120, now = Math.min(Math.max(t, 0), p.T)
  const pts = (to: number) => Array.from({ length: n + 1 }, (_, i) => (i / n) * to).map((x) => `${sx(x).toFixed(1)} ${sy(p.at(x).v).toFixed(1)}`)
  const { s, v } = p.at(now)
  return (
    <svg className="chart speed" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <path className="axis" d={`M${PAD} ${PAD}V${H - PAD}H${W - PAD}`} />
      <path className="driven" d={`M${sx(0)} ${sy(0)}L${pts(now).join('L')}L${sx(now)} ${sy(0)}Z`} />
      <path className="cost" d={`M${pts(p.T).join('L')}`} />
      <line className="probe" x1={sx(now)} x2={sx(now)} y1={PAD} y2={H - PAD} />
      <text className="tick" x={PAD - 6} y={sy(p.vPeak) + 4} textAnchor="end">{p.vPeak.toFixed(2)}</text>
      <text className="tick" x={sx(p.T)} y={H - PAD + 18} textAnchor="middle">{p.T.toFixed(1)} s</text>
      <text className="tick" x={sx(now) + 6} y={PAD + 12}>{now.toFixed(1)} s · {v.toFixed(2)} m/s · {s.toFixed(2)} / {p.L.toFixed(2)} m</text>
    </svg>
  )
}
