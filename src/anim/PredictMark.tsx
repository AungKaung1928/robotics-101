import { REVEAL_S, gapLine, judge, type Pt } from './predict'
import './predict.css'

/**
 * Inside a figure SVG: the reader's guess (hollow ring) and, once `sinceReveal` ≥ 0, a line growing from the guess to
 * the truth (filled dot) with the gap as text. Nothing about the truth is drawn before the reveal.
 */
export default function PredictMark({ guess, truth, sinceReveal, tol, r, gapText }: {
  guess: Pt | null; truth: Pt; sinceReveal: number; tol: number; r: number; gapText: (gap: number, close: boolean) => string
}) {
  if (!guess) return null
  const shown = sinceReveal >= 0, v = judge(guess, truth, tol), end = gapLine(guess, truth, sinceReveal)
  return (
    <g className="predict" data-close={shown ? v.close : undefined}>
      <circle className="guess" cx={guess[0]} cy={guess[1]} r={r} />
      {shown && <line className="gap" x1={guess[0]} y1={guess[1]} x2={end[0]} y2={end[1]} />}
      {shown && sinceReveal >= REVEAL_S && <circle className="truth" cx={truth[0]} cy={truth[1]} r={r * 0.6} />}
      {shown && sinceReveal >= REVEAL_S && <text className="gap-text" x={truth[0]} y={truth[1] - r * 1.6} fontSize={r * 2}>{gapText(v.gap, v.close)}</text>}
    </g>
  )
}
