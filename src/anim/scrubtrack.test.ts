import { describe, expect, it } from 'vitest'
import { scrubTrack } from './motion'

const stops = (bg: string) => bg.slice('linear-gradient(to right, '.length, -1).split(/, (?=var|transparent)/)

describe('scrubTrack', () => {
  it('one 3 px transparent gap per step event strictly inside (0, end), on the thumb-centre scale', () => {
    const s = stops(scrubTrack([0, 1, 2, 2, 4], 0, 4))
    expect(s.filter((x) => x.startsWith('transparent'))).toEqual([
      'transparent 0 calc(calc(11px + (100% - 22px) * 0.25) + 1.5px)', 'transparent 0 calc(calc(11px + (100% - 22px) * 0.5) + 1.5px)'])
    expect(s[0]).toBe('var(--rule) 0 calc(calc(11px + (100% - 22px) * 0.25) - 1.5px)') // t = 0: nothing played
  })
  it('played colour up to the playhead, split inside a segment, plain after', () => {
    expect(stops(scrubTrack([0, 1, 2, 4], 1.5, 4)).map((x) => x.split(' ')[0])).toEqual(
      ['var(--robot)', 'transparent', 'var(--robot)', 'var(--rule)', 'transparent', 'var(--rule)'])
    expect(stops(scrubTrack([0, 1, 4], 1, 4)).map((x) => x.split(' ')[0])).toEqual(['var(--robot)', 'transparent', 'var(--rule)'])
  })
  it('clamped: past the end all played, before 0 or end 0 none', () => {
    expect(scrubTrack([], 9, 4)).toBe('linear-gradient(to right, var(--robot) 0 100%)')
    expect(scrubTrack([], -1, 4)).toBe('linear-gradient(to right, var(--rule) 0 100%)')
    expect(scrubTrack([1], 0, 0)).toBe('linear-gradient(to right, var(--rule) 0 100%)')
  })
})
