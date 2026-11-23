import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import PredictMark from './PredictMark'
import { gapLine, judge, nudgeGuess } from './predict'

describe('predict before reveal', () => {
  it('judge: distance and tolerance', () => {
    expect(judge([0, 0], [3, 4], 5)).toEqual({ gap: 5, close: true })
    expect(judge([0, 0], [3, 4], 4.9).close).toBe(false)
  })
  it('gap line grows from guess to truth, clamped, never past it', () => {
    expect(gapLine([0, 0], [10, 0], -1)).toEqual([0, 0])
    expect(gapLine([0, 0], [10, 0], 0.2)[0]).toBeCloseTo(8.75, 12) // ease-out: 1 - 0.5^3
    expect(gapLine([0, 0], [10, 0], 9)).toEqual([10, 0])
  })
  it('nothing about the truth before reveal; gap and verdict after', () => {
    const at = (s: number, guess: [number, number] | null = [0, 0]) => renderToStaticMarkup(<svg><PredictMark guess={guess} truth={[3, 4]} sinceReveal={s} tol={1} r={1} gapText={(g, c) => `${g.toFixed(1)} ${c ? 'close' : 'off'}`} /></svg>)
    expect(at(-1)).toContain('class="guess"')
    expect(at(-1)).not.toMatch(/truth|gap|data-close/)
    expect(at(0.5)).toContain('data-close="false"')
    expect(at(0.5)).toContain('5.0 off')
    expect(at(0.1)).not.toContain('class="truth"')
    expect(at(-1, null)).toBe('<svg></svg>')
  })
  it('yUp: the gap text is flipped back so it reads upright in a map frame', () => {
    const html = (yUp: boolean) => renderToStaticMarkup(<svg><PredictMark guess={[0, 0]} truth={[3, 4]} sinceReveal={1} tol={1} r={1} gapText={() => 'x'} yUp={yUp} /></svg>)
    expect(html(true)).toContain('scale(1 -1)')
    expect(html(false)).not.toContain('scale(1 -1)')
  })
  it('nudgeGuess: arrows move by step (Shift x5), clamp to the box, y up in map frames, other keys null', () => {
    const box: [number, number, number, number] = [0, 0, 2, 1]
    expect(nudgeGuess([1, 0.5], 'ArrowRight', false, 0.1, box)).toEqual([1.1, 0.5])
    expect(nudgeGuess([1, 0.5], 'ArrowUp', false, 0.1, box)).toEqual([1, 0.4]) // screen frame: up = -y
    expect(nudgeGuess([1, 0.5], 'ArrowUp', false, 0.1, box, true)).toEqual([1, 0.6]) // map frame: up = +y
    expect(nudgeGuess([1, 0.5], 'ArrowLeft', true, 0.1, box)).toEqual([0.5, 0.5])
    expect(nudgeGuess([1.95, 0.5], 'ArrowRight', true, 0.1, box)).toEqual([2, 0.5])
    expect(nudgeGuess([1, 0.5], 'Enter', false, 0.1, box)).toBeNull()
  })
})

