import { describe, expect, it } from 'vitest'
import { RULE_M, SCAN_HZ, blindCm, largestBumpCm, run } from './think'

describe('think model (1.1 rule)', () => {
  it('0.5 m: stops before the wall, less than one step past the rule', () => {
    const r = run(RULE_M)
    expect(r.crashed).toBe(false)
    expect(r.final).toBeLessThan(RULE_M)
    expect(RULE_M - r.final).toBeLessThan(blindCm() / 100)
  })
  it('bigger rule = stops farther from the wall', () => {
    expect(run(0.9).final).toBeGreaterThan(run(0.5).final)
    expect(run(0.5).final).toBeGreaterThan(run(0.2).final)
  })
  it('too small bumps: 2 cm or less touches the wall, 3 cm does not', () => {
    expect(largestBumpCm()).toBe(2)
    expect(run(0.02).crashed).toBe(true)
    expect(run(0.03).crashed).toBe(false)
    expect(run(0).crashed).toBe(true) // break it: a rule of 0 m never fires
  })
  it('5 checks a second, 5.2 cm driven between two checks', () => {
    expect(SCAN_HZ).toBe(5)
    expect(blindCm()).toBe(5.2)
  })
})
