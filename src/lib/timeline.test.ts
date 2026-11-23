import { describe, expect, it } from 'vitest'
import { advance, easeInOut, progress, stepEvent } from './timeline'

describe('advance', () => {
  it('moves speed × dt and stops at the end', () => {
    expect(advance(2, 0.5, 4, 25)).toBe(4)
    expect(advance(24, 1, 4, 25)).toBe(25)
  })
})

describe('stepEvent', () => {
  const ev = [0, 3, 8, 9, 10, 12, 25]
  it('jumps to the next and previous event', () => {
    expect(stepEvent(ev, 3, 1)).toBe(8)
    expect(stepEvent(ev, 4.2, 1)).toBe(8)
    expect(stepEvent(ev, 4.2, -1)).toBe(3)
    expect(stepEvent(ev, 8, -1)).toBe(3)
  })
  it('stays put at either end', () => {
    expect(stepEvent(ev, 25, 1)).toBe(25)
    expect(stepEvent(ev, 0, -1)).toBe(0)
  })
  it('does not depend on event order', () => {
    expect(stepEvent([25, 0, 9, 3], 4, 1)).toBe(9)
  })
})

describe('easing', () => {
  it('starts and ends flat, passes the middle, is monotone', () => {
    expect(easeInOut(0)).toBe(0)
    expect(easeInOut(1)).toBe(1)
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 9)
    expect(easeInOut(0.05)).toBeLessThan(0.05) // slow start: not linear
    for (let x = 0; x < 1; x += 0.05) expect(easeInOut(x + 0.05)).toBeGreaterThanOrEqual(easeInOut(x))
  })
  it('progress is 0 before, 1 after a segment, eased inside', () => {
    expect(progress(2, 3, 8)).toBe(0)
    expect(progress(9, 3, 8)).toBe(1)
    expect(progress(5.5, 3, 8)).toBeCloseTo(0.5, 9)
    expect(progress(5, 5, 5)).toBe(1)
  })
})
