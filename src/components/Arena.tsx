import type { ReactNode } from 'react'
import { WORLD, type Shape } from '../content/world'

const deg = (r: number) => (r * 180) / Math.PI

function ShapeEl({ s }: { s: Shape }) {
  if (s.kind === 'disc') return <circle className="occ" cx={s.x} cy={s.y} r={s.r} />
  return (
    <rect className="occ" x={-s.w / 2} y={-s.h / 2} width={s.w} height={s.h}
      transform={`translate(${s.x} ${s.y}) rotate(${deg(s.yaw)})`} />
  )
}

/** Top-down 10 x 10 m arena in metres, y up (REP 103). Children draw in world coordinates. */
// role 'img' hides children from assistive tech: a map holding links must be a 'group'.
export default function Arena({ children, label, overlay, role = 'img' }: { children?: ReactNode; label: string; overlay?: ReactNode; role?: 'img' | 'group' }) {
  return (
    <svg className="arena" viewBox="-5.4 -5.4 10.8 10.8" role={role} aria-label={label}>
      <defs>
        <pattern id="cell" width="0.5" height="0.5" patternUnits="userSpaceOnUse" x="-5" y="-5">
          <path d="M0.5 0H0V0.5" className="grid" />
        </pattern>
      </defs>
      <rect x="-5" y="-5" width="10" height="10" fill="url(#cell)" />
      <g transform="scale(1 -1)">
        {WORLD.map((s) => <ShapeEl key={s.name} s={s} />)}
        {children}
      </g>
      {overlay}
      <g className="scalebar" transform="translate(-4.7 -4.5)">
        <path d="M0 0H1" />
        <text x="1.1" y="0.09">1 m</text>
      </g>
    </svg>
  )
}
