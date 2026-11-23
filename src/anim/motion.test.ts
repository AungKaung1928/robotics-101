import { describe, expect, it } from 'vitest'
import { GLIDE_MS, currentStep, fromKeyboard, glide, playerKey, shouldAutoplay } from './motion'

describe('glide', () => {
  it('starts at from, lands exactly on to, passes the midpoint at half time', () => {
    expect(glide(1, 3, 0)).toBe(1)
    expect(glide(1, 3, GLIDE_MS)).toBe(3)
    expect(glide(1, 3, GLIDE_MS * 5)).toBe(3)
    expect(glide(1, 3, GLIDE_MS / 2)).toBeCloseTo(2, 9)
  })
  it('is monotonic (never overshoots the event it steps to), also backwards', () => {
    for (const [a, b] of [[0, 2], [2, 0]]) {
      let prev = a
      for (let ms = 0; ms <= GLIDE_MS; ms += 7) {
        const v = glide(a, b, ms)
        expect((v - prev) * Math.sign(b - a)).toBeGreaterThanOrEqual(-1e-12)
        expect(Math.min(a, b) - 1e-12 <= v && v <= Math.max(a, b) + 1e-12).toBe(true)
        prev = v
      }
    }
  })
  it('zero duration jumps (reduced motion path)', () => {
    expect(glide(0, 5, 0, 0)).toBe(5)
  })
})

describe('playerKey', () => {
  it('maps the group keys', () => {
    expect(playerKey(' ', false)).toBe('toggle')
    expect(playerKey('k', true)).toBe('toggle')
    expect(playerKey('ArrowLeft', false)).toBe('back')
    expect(playerKey('ArrowRight', false)).toBe('next')
    expect(playerKey('Home', false)).toBe('start')
    expect(playerKey('End', false)).toBe('end')
    expect(playerKey('r', true)).toBe('replay')
  })
  it('leaves arrows and Home/End to the scrubber, ignores other keys', () => {
    for (const k of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) expect(playerKey(k, true)).toBeNull()
    expect(playerKey('a', false)).toBeNull()
    expect(playerKey('Tab', false)).toBeNull()
  })
})

describe('currentStep', () => {
  const ev = [0, 0.5, 1.2, 2]
  it('is the last event at or before t', () => {
    expect(currentStep(ev, -0.1)).toBe(-1)
    expect(currentStep(ev, 0)).toBe(0)
    expect(currentStep(ev, 0.49)).toBe(0)
    expect(currentStep(ev, 0.5)).toBe(1)
    expect(currentStep(ev, 1.9)).toBe(2)
    expect(currentStep(ev, 9)).toBe(3)
  })
  it('counts an event reached by float addition as reached', () => {
    expect(currentStep([0.3], 0.1 + 0.2)).toBe(0)
  })
})

describe('shouldAutoplay', () => {
  it('plays only when asked, motion allowed and not held by an earlier pause', () => {
    expect(shouldAutoplay(true, false, false)).toBe(true)
    expect(shouldAutoplay(false, false, false)).toBe(false)
    expect(shouldAutoplay(true, true, false)).toBe(false)
    expect(shouldAutoplay(true, false, true)).toBe(false)
  })
})

describe('fromKeyboard', () => {
  it('detail 0 = Enter / Space on a focused button (jump), 1+ = pointer clicks (glide)', () => {
    expect(fromKeyboard({ detail: 0 })).toBe(true)
    expect(fromKeyboard({ detail: 1 })).toBe(false)
    expect(fromKeyboard({ detail: 2 })).toBe(false)
  })
})
