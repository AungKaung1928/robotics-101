import { useEffect, useRef, useState, type ReactNode } from 'react'
import Mascot from '../anim/Mascot'
import type { TF } from '../lib/tf2d'
import { fixedYaw, tfMood, toMap, wallResidual, type Mood } from './tflab'
import './tflab.css'

/**
 * Top-down TF lab: the laser's hits on a wall at x = `wallX`, drawn through map->base `base` and base->laser `mount`
 * whose yaw is off by `err0` until the fix (`sinceFix` ≥ 0 s), then springs to 0 (FIX, no bounce). The laser frame's axes turn
 * with the error, so the reader sees WHY the points are off: the frame is rotated, not the wall. The robot is dizzy
 * while the points are off, curious while they move, and cheers once when they land.
 */
/** Circles as one path: two half arcs per point. */
const dots = (pts: [number, number][], r: number) => pts.map(([x, y]) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`).join('')

export default function TfLab({ hits, base, mount, wallX, err0, sinceFix, label, residualText, children }: {
  hits: [number, number][]; base: TF; mount: TF; wallX: number; err0: number; sinceFix: number; label: string
  residualText: (m: number) => string; children?: ReactNode // drawn in map coordinates (y up), on top
}) {
  const yaw = fixedYaw(err0, sinceFix)
  const m = { ...mount, yaw: mount.yaw + yaw }
  const drawn = toMap(base, m, hits), ghost = toMap(base, mount, hits)
  const res = wallResidual(drawn, wallX), mood = tfMood(res, wallResidual(toMap(base, { ...mount, yaw: mount.yaw + err0 }, hits), wallX))
  const [cheer, setCheer] = useState(0), [oops, setOops] = useState(0), prev = useRef<Mood>(mood)
  useEffect(() => {
    if (mood === 'happy' && prev.current !== 'happy' && err0 !== 0) setCheer((n) => n + 1)
    if (mood === 'dizzy' && prev.current === 'happy') setOops((n) => n + 1)
    prev.current = mood
  }, [mood, err0])
  const L = toMap(base, m, [[0, 0], [0.4, 0], [0, 0.4]])
  // Fixed view over the broken and the true points: the camera never moves while the fix plays.
  const ys = [...ghost, ...toMap(base, { ...mount, yaw: mount.yaw + err0 }, hits)].map(([, y]) => y)
  const lo = Math.min(...ys) - 0.2, hi = Math.max(...ys) + 0.2
  return (
    <svg className="inset tflab" viewBox={`-0.4 ${-hi} ${wallX + 0.6} ${hi - lo}`} role="img" aria-label={label} data-mood={mood}>
      <g transform={`translate(${base.x - 0.3} ${-base.y - 0.3}) scale(0.0094)`}>
        <Mascot inSvg label="" cheer={cheer} oops={oops} thinking={mood === 'curious'} look={0.8} />
      </g>
      <g transform="scale(1 -1)">
        <line className="wall" x1={wallX} y1={lo + 0.1} x2={wallX} y2={hi - 0.1} />
        {/* one path per layer, not one element per hit: a 360-beam scan is 4 nodes instead of ~1,440 */}
        <path className="ray" d={drawn.map(([x, y]) => `M${L[0][0]} ${L[0][1]}L${x} ${y}`).join('')} />
        <path className="ghost" d={dots(ghost, 0.035)} />
        <path className="gap" d={drawn.map(([x, y]) => `M${x} ${y}H${wallX}`).join('')} />
        <path className="hit" d={dots(drawn, 0.03)} />
        <line className="ax-x" x1={L[0][0]} y1={L[0][1]} x2={L[1][0]} y2={L[1][1]} />
        <line className="ax-y" x1={L[0][0]} y1={L[0][1]} x2={L[2][0]} y2={L[2][1]} />
        {children}
      </g>
      <text className="tf-readout" x={-0.35} y={-hi + 0.12} fontSize={0.09}>{residualText(res)}</text>
    </svg>
  )
}
