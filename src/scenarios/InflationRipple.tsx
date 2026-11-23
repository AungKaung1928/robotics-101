import type { ReactNode } from 'react'
import './inflate.css'

/**
 * Top-down costmap inset with the inflation front: cells within `front` metres of the obstacle show their cost,
 * the band the front just crossed (one cell wide) is outlined so the reader sees where Nav2 is writing now.
 * `children` draws on top (robot, probe) in the same world coordinates.
 */
export default function InflationRipple({ cells, res, x0, span, front, cost, lethal = 254, label, children }: {
  cells: { x: number; y: number; d: number }[]; res: number; x0: number; span: number; front: number
  cost: (d: number) => number; lethal?: number; label: string; children?: ReactNode
}) {
  return (
    <svg className="inset" viewBox={`${x0} ${-x0 - span} ${span} ${span}`} role="img" aria-label={label}>
      <g transform="scale(1 -1)">
        {cells.map((c) => {
          if (c.d > front + 1e-9) return null
          const v = cost(c.d)
          if (v <= 0) return null
          const wave = front > 0 && c.d > front - res
          return <rect key={`${c.x} ${c.y}`} className={`${v === lethal ? 'c-lethal' : 'c-cost'}${wave ? ' wave' : ''}`}
            x={c.x} y={c.y} width={res} height={res} opacity={v === lethal || wave ? 1 : v / lethal} />
        })}
        {children}
      </g>
    </svg>
  )
}
