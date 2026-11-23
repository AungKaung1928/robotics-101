import type { ReactNode } from 'react'
import { rowStates } from './log'
import './log.css'

/**
 * Event log under a scenario figure: one row per event (time ascending) with the model's own numbers.
 * Rows that already happened are solid, the latest is marked, the rest wait faded; clicking a row (or its number button, for keyboards) seeks there.
 * Each figure change gets a line of numbers next to it (protocol-explorer's packet table).
 * Linked highlight (explorable explanations): `onHot` reports the row under the pointer or keyboard focus, `hot`
 * marks a row the figure points at; the chapter keeps one index and passes it to both.
 */
export default function EventLog({ rows, t, seek, head, label, hot = null, onHot }: {
  rows: { t: number; cells: ReactNode[] }[]; t: number; seek: (t: number) => void; head: string[]; label: string
  hot?: number | null; onHot?: (i: number | null) => void
}) {
  const st = rowStates(rows.map((r) => r.t), t)
  return (
    <table className="evlog" aria-label={label}>
      <thead><tr><th>#</th>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} data-state={st[i]} data-hot={hot === i || undefined} onClick={() => seek(r.t)}
            onPointerEnter={() => onHot?.(i)} onPointerLeave={() => onHot?.(null)} onFocus={() => onHot?.(i)} onBlur={() => onHot?.(null)}>
            <td><button type="button" onClick={(e) => { e.stopPropagation(); seek(r.t) }}>{i + 1}</button></td>{r.cells.map((c, k) => <td key={k}>{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
