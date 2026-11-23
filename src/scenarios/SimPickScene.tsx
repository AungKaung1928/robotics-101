import { MascotFigure } from '../anim/Mascot'
import { REST, happyPose } from '../anim/mascot'
import { arrivalScale } from '../anim/spring'
import './robottop.css'

export type Rung = { name: string; kind: '2D' | '3D'; note?: string } // note e.g. "needs a graphics card"
const SW = 74, SH = 24, HOP = 0.45 // step width, rise, hop time (s)
const stepX = (i: number) => 6 + i * (SW + 10), stepY = (i: number, n: number) => 70 + (n - 1 - i) * SH // gap 10 > the 3D side's 8
const base = (n: number) => stepY(0, n) + 52 // floor: the lowest step is still tall enough for name, kind and note

/**
 * On-ramp "which simulator": the ladder as steps rising to the right (flat 2D tiles, then 3D blocks, the far ones
 * bigger). The robot hops from step `from` to `pick` along an arc over HOP s, lands with the happy bounce, and the
 * chosen step bounces once. Notes (like the graphics-card warning) hang under their step. `t` = s since the pick.
 */
export default function SimPickScene({ rungs, pick, from = pick, t, label }: { rungs: Rung[]; pick: number; from?: number; t: number; label: string }) {
  const n = rungs.length, u = Math.min(1, Math.max(0, t / HOP)), top = (i: number) => stepY(i, n)
  const rx = stepX(from) + (stepX(pick) - stepX(from)) * u + SW / 2 - 16
  const ry = top(from) + (top(pick) - top(from)) * u - 40 * 4 * u * (1 - u) * (from === pick ? 0 : 1) - 30
  const landed = t >= HOP || from === pick
  return (
    <svg className="simpick-scene" viewBox={`0 0 ${stepX(n - 1) + SW + 12} ${base(n) + 4}`} role="img" aria-label={label} data-pick={pick}>
      {rungs.map((r, i) => {
        const s = i === pick && landed ? arrivalScale(t - (from === pick ? 0 : HOP)) : 1, x = stepX(i), y = top(i)
        return (
          <g key={r.name} className={`sp-step is-${r.kind.toLowerCase()}${i === pick ? ' is-pick' : ''}`} transform={`translate(${x + SW / 2} ${y}) scale(${s}) translate(${-x - SW / 2} ${-y})`}>
            {r.kind === '3D' && <path className="sp-side" d={`M${x + SW} ${y}l8 -6V${base(n)}h-8z`} />}
            <rect className="sp-face" x={x} y={y} width={SW} height={base(n) - y} rx={6} />
            <text className="sp-name" x={x + SW / 2} y={y + 17} textAnchor="middle">{r.name}</text>
            <text className="sp-kind" x={x + SW / 2} y={y + 32} textAnchor="middle">{r.kind}</text>
            {r.note && <text className="sp-note" x={x + SW / 2} y={y + 46} textAnchor="middle">{r.note}</text>}
          </g>
        )
      })}
      <g transform={`translate(${rx} ${ry})`}><MascotFigure pose={landed && from !== pick ? happyPose(t - HOP) : REST} mood={landed ? 'happy' : 'idle'} size={32} label="" /></g>
    </svg>
  )
}
