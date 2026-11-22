import { describe, expect, it } from 'vitest'
import { LIDAR } from '../content/world'
import { gaussian, rng } from './noise'

describe('seeded noise', () => {
  it('same seed, same numbers; different seed, different numbers', () => {
    expect(gaussian(5, 0.01, 7)).toEqual(gaussian(5, 0.01, 7))
    expect(gaussian(5, 0.01, 7)).not.toEqual(gaussian(5, 0.01, 8))
  })
  it('uniform stays in [0, 1)', () => {
    const u = rng(1)
    for (let i = 0; i < 1000; i++) {
      const v = u()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
  it('his LiDAR noise: mean ≈ 0, standard deviation ≈ 0.01 m over 20,000 samples', () => {
    const xs = gaussian(20000, LIDAR.noiseStd, 42)
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length)
    expect(Math.abs(mean)).toBeLessThan(0.0003)
    expect(sd).toBeGreaterThan(0.0098)
    expect(sd).toBeLessThan(0.0102)
  })
})
