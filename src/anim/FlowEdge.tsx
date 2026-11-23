import type { CSSProperties } from 'react'
import './flow.css'

/**
 * Dash pattern for a link carrying `hz` messages per second: one dash per message, `period` px apart, moving one
 * period per message, so the dashes passing a point per second equal the topic rate. Dash 35 % of the period.
 */
export function flowStyle(hz: number, period = 24): CSSProperties {
  return {
    strokeDasharray: `${+(period * 0.35).toFixed(2)} ${+(period * 0.65).toFixed(2)}`,
    '--flow-period': `${period}px`,
    '--flow-dur': `${+(1 / hz).toFixed(4)}s`,
  } as CSSProperties
}

/**
 * A link between two nodes (path `d`, drawn from producer to consumer) that shows messages flowing while `live`;
 * not live = a plain faint line (no data). Reduced motion: dashes stand still, so the rate is still readable.
 */
export default function FlowEdge({ d, hz, live, className = '' }: { d: string; hz: number; live: boolean; className?: string }) {
  return live
    ? <path className={['flow', className].filter(Boolean).join(' ')} d={d} style={flowStyle(hz)} data-hz={hz} />
    : <path className={['flow-off', className].filter(Boolean).join(' ')} d={d} />
}
