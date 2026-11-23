import { describe, expect, it } from 'vitest'
import { scrubKey, scrubValue } from './scrub'

const R = { min: 0, max: 0.5, step: 0.01, px: 4 }

describe('scrub number', () => {
  it('drag: px per step, snapped, clamped, no float noise', () => {
    expect(scrubValue(0.1, 0, R)).toBe(0.1)
    expect(scrubValue(0.1, 8, R)).toBe(0.12)
    expect(scrubValue(0.1, 9, R)).toBe(0.12) // 2.25 steps -> 2
    expect(scrubValue(0.1, -400, R)).toBe(0)
    expect(scrubValue(0.1, 400, R)).toBe(0.5)
    expect(scrubValue(0.07, 4, R)).toBe(0.08) // 0.07 + 0.01 is 0.08000000000000002 in floats
  })
  it('keys: arrows, Shift x10, Page x10, Home/End; other keys are not ours', () => {
    expect(scrubKey(0.1, 'ArrowRight', false, R)).toBe(0.11)
    expect(scrubKey(0.1, 'ArrowDown', false, R)).toBe(0.09)
    expect(scrubKey(0.1, 'ArrowUp', true, R)).toBe(0.2)
    expect(scrubKey(0.45, 'PageUp', false, R)).toBe(0.5)
    expect(scrubKey(0.1, 'Home', false, R)).toBe(0)
    expect(scrubKey(0.1, 'End', false, R)).toBe(0.5)
    expect(scrubKey(0.1, 'a', false, R)).toBeNull()
  })
  it('a min off the step grid still snaps from min', () => {
    expect(scrubValue(0.25, 6, { min: 0.05, max: 1, step: 0.1, px: 6 })).toBe(0.35)
  })
})
