/** Seeded uniform [0, 1) generator (mulberry32): the same seed gives the same noise, so pages and tests agree. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Gaussian samples with mean 0 and standard deviation `sigma` (Box–Muller), `n` of them from `seed`. */
export function gaussian(n: number, sigma: number, seed: number): number[] {
  const u = rng(seed)
  return Array.from({ length: n }, () => {
    const u1 = Math.max(u(), Number.MIN_VALUE)
    return sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u())
  })
}
