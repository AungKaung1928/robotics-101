import type { Line } from './shell'
import './l1.css'

/** Terminal view shared by 1.5 and 2.6: past lines (prompt + command + output, errors red) and an optional typing line. */
export default function Term({ lines, start, cursor }: { lines: Line[]; start: string[]; cursor?: string }) {
  return (
    <pre className="code term" role="log" aria-live="polite">
      {lines.map((l, i) => (
        <span key={i}>
          <span className="ln"><span className="cmt">{start[i]}</span> {l.cmd}</span>
          {l.out && <span className={`ln${l.ok ? '' : ' bad'}`}>{l.out}</span>}
        </span>
      ))}
      {cursor !== undefined && <span className="ln"><span className="cmt">{start[lines.length]}</span> {cursor}<span className="caret">▌</span></span>}
    </pre>
  )
}
