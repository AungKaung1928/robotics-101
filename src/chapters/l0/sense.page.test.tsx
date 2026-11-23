import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'
import { BEAMS, COVER_M, MAX_M, MIN_M, TURNS_PER_S, perSecond } from './sense'
import SenseChapter from './SenseChapter'
import { SENSE_STRINGS } from './sense.strings'

const words = (x: string) => x.split(/\s+/).filter(Boolean).length
// Group A rule (research/APP_R101_ONRAMP.md): no software words or code; LiDAR is this chapter's taught word.
const BANNED = /\b(ROS|node|topic|scan|LaserScan|python|code|program|Gazebo|RViz)\b/i

describe('sense page', () => {
  it('EN and JA have the same keys, steps, glossary rows and answers', () => {
    const { en, ja } = SENSE_STRINGS
    expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort())
    expect(ja.steps.length).toBe(en.steps.length)
    expect(ja.glossary.length).toBe(en.glossary.length)
    expect(Object.keys(ja.answers)).toEqual(Object.keys(en.answers))
  })
  it('on-ramp rules: 3-5 steps, at most 80 words each, at most 3 new words, no software words', () => {
    const en = SENSE_STRINGS.en
    expect(en.steps.length).toBeGreaterThanOrEqual(3)
    expect(en.steps.length).toBeLessThanOrEqual(5)
    for (const st of en.steps) expect(words(st)).toBeLessThanOrEqual(80)
    expect(en.glossary.length).toBeLessThanOrEqual(3)
    expect([en.learn, ...en.steps, en.brokenNote, en.real, en.check, ...en.glossary.flat()].join(' ')).not.toMatch(BANNED)
  })
  it('numbers in the text are the model numbers (360, 5, 1800, 12 cm, 3.5 m, hand 2 cm)', () => {
    for (const l of ['en', 'ja'] as const) {
      const m = SENSE_STRINGS[l], all = [...m.steps, m.real, m.brokenNote].join(' ')
      for (const n of [BEAMS, TURNS_PER_S, perSecond(), `${MIN_M * 100} cm`, `${MAX_M} m`, `${COVER_M * 100} cm`]) expect(all).toContain(String(n))
    }
  })
  it.each(['en', 'ja'] as const)('%s renders: 360 dots at the start, front 1.50 m, sources', (l) => {
    const html = renderToStaticMarkup(<SenseChapter t={STRINGS[l]} />)
    expect(html.match(/class="sense-dot"/g)?.length).toBe(BEAMS)
    expect(html).toContain('data-k="front">1.50 m<')
    expect(html).toContain('turtlebot3_burger.urdf.xacro#L174')
  })
})
