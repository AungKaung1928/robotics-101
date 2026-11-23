import { describe, expect, it } from 'vitest'
import { GLIDE_MS, glide, playerKey } from './motion'

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
  })
  it('leaves arrows and Home/End to the scrubber, ignores other keys', () => {
    for (const k of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) expect(playerKey(k, true)).toBeNull()
    expect(playerKey('a', false)).toBeNull()
    expect(playerKey('Tab', false)).toBeNull()
  })
})
