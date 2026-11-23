import { describe, expect, it } from 'vitest'
import { PAUSE_D, PLAY_D, SCRUB_MAX_GAPS, nextRate, playerKey, shiftRate, scrubFrac, scrubTrack, storedRate } from './motion'

const stops = (bg: string) => bg.slice('linear-gradient(to right, '.length, -1).split(/, (?=var|transparent)/)

describe('scrubTrack', () => {
  it('one 3 px transparent gap per step event strictly inside (0, end), on the thumb-centre scale', () => {
    const s = stops(scrubTrack([0, 1, 2, 2, 4], 0, 4))
    expect(s.filter((x) => x.startsWith('transparent'))).toEqual([
      'transparent 0 calc(calc(11px + (100% - 22px) * 0.25) + 1.5px)', 'transparent 0 calc(calc(11px + (100% - 22px) * 0.5) + 1.5px)'])
    expect(s[0]).toBe('var(--scrub-rest) 0 calc(calc(11px + (100% - 22px) * 0.25) - 1.5px)') // t = 0: nothing played
  })
  it('played colour up to the playhead, split inside a segment, plain after', () => {
    expect(stops(scrubTrack([0, 1, 2, 4], 1.5, 4)).map((x) => x.split(' ')[0])).toEqual(
      ['var(--robot)', 'transparent', 'var(--robot)', 'var(--scrub-rest)', 'transparent', 'var(--scrub-rest)'])
    expect(stops(scrubTrack([0, 1, 4], 1, 4)).map((x) => x.split(' ')[0])).toEqual(['var(--robot)', 'transparent', 'var(--scrub-rest)'])
  })
  it('clamped: past the end all played, before 0 or end 0 none', () => {
    expect(scrubTrack([], 9, 4)).toBe('linear-gradient(to right, var(--robot) 0 100%)')
    expect(scrubTrack([], -1, 4)).toBe('linear-gradient(to right, var(--scrub-rest) 0 100%)')
    expect(scrubTrack([1], 0, 0)).toBe('linear-gradient(to right, var(--scrub-rest) 0 100%)')
  })
})

describe('scrubFrac', () => {
  it('inverse of the scrubTrack position: thumb-centre scale, clamped', () => {
    expect(scrubFrac(11, 222)).toBe(0)
    expect(scrubFrac(111, 222)).toBe(0.5)
    expect(scrubFrac(211, 222)).toBe(1)
    expect(scrubFrac(-5, 222)).toBe(0)
    expect(scrubFrac(500, 222)).toBe(1)
    expect(scrubFrac(5, 10)).toBe(0) // narrower than the thumb
  })
})

describe('play/pause icon', () => {
  it('both paths have the same command list, so the browser can morph d between them', () => {
    const cmds = (d: string) => d.replace(/[^A-Za-z]/g, '')
    expect(cmds(PLAY_D)).toBe(cmds(PAUSE_D))
    expect(PLAY_D.match(/[\d.]+/g)).toHaveLength(PAUSE_D.match(/[\d.]+/g)!.length)
  })
})

describe('playback rate', () => {
  it('cycles 1 -> 2 -> 0.5 -> 1; unknown starts at 1', () => {
    expect([nextRate(1), nextRate(2), nextRate(0.5), nextRate(3)]).toEqual([2, 0.5, 1, 1])
  })
  it('stored rate only if it is one of the offered rates', () => {
    expect([storedRate('2'), storedRate('0.5'), storedRate(null), storedRate('9'), storedRate('abc')]).toEqual([2, 0.5, 1, 1, 1])
  })
})

describe('speed keys', () => {
  it('< / > map to slower / faster, also on the scrubber', () => {
    expect([playerKey('<', false), playerKey('>', true)]).toEqual(['slower', 'faster'])
  })
  it('shiftRate walks 0.5 < 1 < 2 and holds at the ends; unknown -> 1', () => {
    expect([shiftRate(1, 1), shiftRate(2, 1), shiftRate(1, -1), shiftRate(0.5, -1), shiftRate(3, 1)]).toEqual([2, 2, 0.5, 0.5, 1])
  })
})

describe('scrubTrack with many events', () => {
  it('more than SCRUB_MAX_GAPS inner events (think: one per sensor check): no gaps, plain fill', () => {
    const many = Array.from({ length: 31 }, (_, i) => i / 5) // 0 .. 6 s, 5 checks a second
    expect(scrubTrack(many, 3, 6)).not.toContain('transparent')
    const few = Array.from({ length: SCRUB_MAX_GAPS + 2 }, (_, i) => i) // exactly SCRUB_MAX_GAPS inner events
    expect(scrubTrack(few, 0, few.length - 1).match(/transparent/g)).toHaveLength(SCRUB_MAX_GAPS)
  })
})
