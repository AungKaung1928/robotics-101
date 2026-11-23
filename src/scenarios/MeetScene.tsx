import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useTextWidth } from './fit'
import { MascotFigure } from '../anim/Mascot'
import { REST } from '../anim/mascot'
import { WOBBLE, arrivalScale, springAt } from '../anim/spring'
import './robottop.css'

/** Parts of the side-view robot, boxes in the mascot's 64-unit drawing (Mascot.tsx): head = the distance sensor. */
export const PARTS = { sensor: [17, 12, 30, 20], computer: [14, 31, 36, 11], wheels: [8, 47, 48, 12], battery: [20, 41, 24, 14] } as const // battery last: its hit box sits on top of the wheels' between them
export type Part = keyof typeof PARTS
const K = 1.7, OX = 16, OY = 8, KICK = 120 // drawing scale, offset, wiggle kick (deg/s)

/** One frame: `part` was tapped `t` s ago: its outline wiggles on a wobble spring, its label springs out beside it. */
export function MeetFrame({ part, t, words, label, children }: { part: Part | null; t: number; words: Record<Part, string>; label: string; children?: ReactNode }) {
  const ref = useRef<SVGSVGElement>(null), vw = Math.max(300, 154 + useTextWidth(ref, '.mt-label', part ? words[part] : '') * 1.1 + 6) // label springs to 1.1x
  const box = part && PARTS[part], cx = box ? OX + K * (box[0] + box[2] / 2) : 0, cy = box ? OY + K * (box[1] + box[3] / 2) : 0
  return (
    <svg ref={ref} className="meet-scene" viewBox={`0 0 ${vw} 130`} role={children ? 'group' : 'img'} aria-label={label} data-part={part ?? 'none'}>
      <g transform={`translate(${OX} ${OY})`}><MascotFigure pose={REST} mood={part ? 'happy' : 'idle'} size={64 * K} label="" /></g>
      {box && <>
        <rect className="mt-outline" x={OX + K * box[0] - 3} y={OY + K * box[1] - 3} width={K * box[2] + 6} height={K * box[3] + 6} rx={8}
          transform={`rotate(${springAt(t, WOBBLE, 0, KICK)} ${cx} ${cy})`} />
        <line className="mt-lead" x1={OX + K * (box[0] + box[2]) + 4} y1={cy} x2={150} y2={cy} />
        <g transform={`translate(154 ${cy}) scale(${arrivalScale(t)})`}><text className="mt-label" y={5}>{words[part!]}</text></g>
      </>}
      {children}
    </svg>
  )
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** On-ramp "meet": tap (or Tab + Enter) a part of the robot; it wiggles and its name springs out. Reduced motion: still. */
export default function MeetScene({ words, label }: { words: Record<Part, string>; label: string }) {
  const [part, setPart] = useState<Part | null>(null), [n, setN] = useState(0), [t, setT] = useState(9)
  useEffect(() => {
    if (!part || reduced()) return setT(9)
    const t0 = performance.now()
    let id = 0
    const f = (ms: number) => { const s = (ms - t0) / 1000; setT(s); if (s < 1.5) id = requestAnimationFrame(f) }
    id = requestAnimationFrame(f)
    return () => cancelAnimationFrame(id)
  }, [part, n])
  const pick = (p: Part) => { setPart(p); setN(n + 1) }
  return (
    <MeetFrame part={part} t={t} words={words} label={label}>{/* hit areas inside the figure: they scale with it when the label widens it */}
      {(Object.keys(PARTS) as Part[]).map((p) => { const [x, y, w, h] = PARTS[p]; return (
        <rect key={p} className="mt-hit" x={OX + K * x} y={OY + K * y} width={K * w} height={K * h} role="button" tabIndex={0} aria-label={words[p]}
          onClick={() => pick(p)} onKeyDown={(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(p) } }} />
      ) })}
    </MeetFrame>
  )
}
