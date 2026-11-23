import { REVEAL_S, gapLine, judge, type Pt } from './predict'
import './predict.css'

/**
 * Inside a figure SVG: the reader's guess (hollow ring) and, once `sinceReveal` ≥ 0, a line growing from the guess to
 * the truth (filled dot) with the gap as text, left of the truth. Nothing about the truth is drawn before the reveal.
 * `yUp`: the parent group is flipped (scale(1 -1), map frames); the text is flipped back so it reads upright.
 */
export default function PredictMark({ guess, truth, sinceReveal, tol, r, gapText, yUp = false }: {
  guess: Pt | null; truth: Pt; sinceReveal: number; tol: number; r: number; gapText: (gap: number, close: boolean) => string; yUp?: boolean
}) {
  if (!guess) return null
  const shown = sinceReveal >= 0, v = judge(guess, truth, tol), end = gapLine(guess, truth, sinceReveal)
  const tx = truth[0] - r * 1.6, ty = truth[1] + (yUp ? -r * 0.6 : r * 0.6) // baseline a little below the dot's centre
  return (
    <g className="predict" data-close={shown ? v.close : undefined}>
      <circle className="guess" cx={guess[0]} cy={guess[1]} r={r} />
      {shown && <line className="gap" x1={guess[0]} y1={guess[1]} x2={end[0]} y2={end[1]} />}
      {shown && sinceReveal >= REVEAL_S && <circle className="truth" cx={truth[0]} cy={truth[1]} r={r * 0.6} />}
      {shown && sinceReveal >= REVEAL_S && <text className="gap-text" transform={`translate(${tx} ${ty})${yUp ? ' scale(1 -1)' : ''}`} fontSize={r * 2}>{gapText(v.gap, v.close)}</text>}
    </g>
  )
}
