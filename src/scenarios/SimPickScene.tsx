import { useRef } from 'react'
import { MascotFigure } from '../anim/Mascot'
import { REST, happyPose } from '../anim/mascot'
import { arrivalScale } from '../anim/spring'
import { useTextWidth } from './fit'
import './robottop.css'

export type Rung = { name: string; kind: '2D' | '2.5D' | '3D' | 'none'; note?: string } // none = no world (only the robot in RViz): dashed shelf; note e.g. "needs a graphics card"
const VW = 360, RIGHT = 350, RH = 54, BH = 46, NOTCH = 36, TOP = 40, HOP = 0.45 // px; NOTCH = room for the 32 px robot
const ROBOT = 32, LINE = 1.8 * 13 // line pitch 1.8x: Burmese stacks marks above and below the line

/**
 * On-ramp "which simulator": the ladder as a staircase of shelves, easiest at the bottom; each shelf starts one notch
 * further right, so the robot stands in the notch on top of its shelf and every shelf keeps a full line for its name
 * (readable on a phone in any script). 3D shelves get a depth face. The robot hops from shelf `from` to `pick` along
 * an arc over HOP s, lands with the happy bounce, and the chosen shelf bounces once. `t` = s since the pick.
 */
export default function SimPickScene({ rungs, pick, from = pick, t, label }: { rungs: Rung[]; pick: number; from?: number; t: number; label: string }) {
  const ref = useRef<SVGSVGElement>(null), n = rungs.length
  const wide = useTextWidth(ref, '.sp-name, .sp-sub', rungs.map((r) => r.name + (r.note ?? '')).join('|'))
  const notch = Math.max(ROBOT + 4, Math.min(NOTCH, (RIGHT - 8 - wide - 20) / Math.max(1, n - 1))) // shrink toward the robot's width for long words
  const left = (i: number) => 8 + i * notch, top = (i: number) => TOP + (n - 1 - i) * RH
  const u = Math.min(1, Math.max(0, t / HOP)), hop = from === pick ? 0 : 1, landed = t >= HOP || !hop
  const rx = left(from) + (left(pick) - left(from)) * u + 2, ry = top(from) + (top(pick) - top(from)) * u - 30 * 4 * u * (1 - u) * hop - ROBOT
  return (
    <svg ref={ref} className="simpick-scene" viewBox={`0 0 ${VW} ${TOP + n * RH}`} role="img" aria-label={label} data-pick={pick}>
      {rungs.map((r, i) => {
        const x = left(i), y = top(i), w = RIGHT - x, s = i === pick && landed ? arrivalScale(t - (hop ? HOP : 0)) : 1
        return (
          <g key={i} className={`sp-step is-${r.kind.toLowerCase()}${i === pick ? ' is-pick' : ''}`} transform={`translate(${x + w / 2} ${y + BH / 2}) scale(${s}) translate(${-x - w / 2} ${-y - BH / 2})`}>
            {r.kind === '3D' && <path className="sp-side" d={`M${x + w} ${y}l6 -5v${BH}l-6 5z`} />}
            <rect className="sp-face" x={x} y={y} width={w} height={BH} rx={6} />
            <text className="sp-name" x={x + 8} y={y + 18}>{r.name}</text>
            <text className="sp-sub" x={x + 8} y={y + 18 + LINE}>{r.kind === 'none' ? '' : r.kind}{r.note && <tspan className="sp-note">{`${r.kind === 'none' ? '' : '  '}${r.note}`}</tspan>}</text>
          </g>
        )
      })}
      <g transform={`translate(${rx} ${ry})`}><MascotFigure pose={landed && hop ? happyPose(t - HOP) : REST} mood={landed ? 'happy' : 'idle'} size={ROBOT} label="" /></g>
    </svg>
  )
}
