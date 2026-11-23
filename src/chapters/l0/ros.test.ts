import { describe, expect, it } from 'vitest'
import { DISTROS, TODAY, humbleLast, label, month, scenario, supported, unsupportedFor } from './ros'
import { ROS_STRINGS } from './ros.strings'

describe('ros distros', () => {
  it('today (Nov 2026): Humble, Jazzy, Kilted, Lyrical get fixes; Noetic and Iron do not', () => {
    expect(supported(TODAY)).toEqual(['humble', 'jazzy', 'kilted', 'lyrical'])
    expect(supported(month(2027, 6))).toEqual(['jazzy', 'lyrical'])
  })
  it('a project started on Iron has run 23 months without fixes by Nov 2026', () => {
    expect(unsupportedFor('iron', TODAY)).toBe(23)
    expect(unsupportedFor('humble', TODAY)).toBe(0)
  })
  it('challenge: only May 2027 is the last Humble month', () => {
    expect(humbleLast(month(2027, 5))).toBe(true)
    expect(humbleLast(month(2027, 6))).toBe(false)
    expect(label(month(2027, 5))).toEqual({ y: 2027, m: 5 })
  })
  it('the sweep is eased and ends today', () => {
    const sc = scenario()
    expect(sc.frame(0).at).toBe(0)
    expect(sc.frame(sc.durationMs).at).toBe(TODAY)
    expect(sc.frame(sc.durationMs / 6).at).toBeLessThan(TODAY / 6)
  })
  it('every LTS lasts 5 years; EN and JA have the same keys', () => {
    for (const d of DISTROS) if (d.lts) expect(d.last - d.from).toBe(60)
    expect(Object.keys(ROS_STRINGS.ja).sort()).toEqual(Object.keys(ROS_STRINGS.en).sort())
  })
})
