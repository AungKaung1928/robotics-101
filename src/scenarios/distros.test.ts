import { describe, expect, it } from 'vitest'
import { DISTROS, distroEvents, supportedAt, year } from './distros'

const names = (y: number) => supportedAt(y).map((d) => d.name)

describe('ROS distributions', () => {
  it('LTS rule holds for the ROS 2 rows: even-year releases 5 years, odd-year 1.5 years (± a few weeks)', () => {
    for (const d of DISTROS.filter((x) => x.ros === 2 && x.name !== 'Foxy')) {
      const life = year(d.eol) - year(d.release)
      expect(d.lts).toBe(Number(d.release.slice(0, 4)) % 2 === 0)
      expect(life).toBeCloseTo(d.lts ? 5 : 1.5, 0)
    }
  })
  it('on 2026-11-23 (tonight): Humble, Jazzy, Kilted, Lyrical; ROS 1 is over', () => {
    expect(names(year('2026-11-23'))).toEqual(['Humble', 'Jazzy', 'Kilted', 'Lyrical'])
    expect(supportedAt(year('2026-11-23')).some((d) => d.ros === 1)).toBe(false)
  })
  it('Humble, this app\'s distro, ends after May 2027; Jazzy is then the oldest LTS', () => {
    expect(names(year('2027-06-01'))).toEqual(['Jazzy', 'Lyrical'])
  })
  it('events are sorted, start at ROS 2\'s first release, end at the last EOL', () => {
    const e = distroEvents()
    expect(e[0]).toBeCloseTo(2017 + 341 / 365, 9) // 2017-12-08 = day 342, 341 days after 1 Jan
    expect(e.at(-1)).toBeCloseTo(year('2031-05-31'), 9)
    expect(e.every((v, i) => i === 0 || v > e[i - 1])).toBe(true)
  })
})
