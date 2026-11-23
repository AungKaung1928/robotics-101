import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'
import MeetChapter from './MeetChapter'
import { PARTS } from './meet'
import { MEET_STRINGS } from './meet.strings'

const words = (x: string) => x.split(/\s+/).filter(Boolean).length
const BANNED = /\b(ROS|node|topic|python|code|program|LiDAR|Gazebo|RViz)\b/i
// e-Manual Features: 138 x 178 x 192 mm (L x W x H), 1 kg, 2 h 30 min; xacro:16 + :118: sensor 0.010 + 0.172 m up.
const SPEC = { l: 13.8, w: 17.8, h: 19.2, sensorCm: (0.01 + 0.172) * 100, hours: 2.5 }

describe('meet page', () => {
  it('EN and JA have the same keys, steps, parts and answers', () => {
    const { en, ja } = MEET_STRINGS
    expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort())
    expect(ja.steps.length).toBe(en.steps.length)
    expect(Object.keys(ja.parts)).toEqual(Object.keys(en.parts))
    expect(Object.keys(en.parts).sort()).toEqual(PARTS.map((p) => p.id).sort())
  })
  it('on-ramp rules: 3-5 steps, at most 80 words, at most 3 new words, no software words', () => {
    const en = MEET_STRINGS.en
    expect(en.steps.length).toBeGreaterThanOrEqual(3)
    expect(en.steps.length).toBeLessThanOrEqual(5)
    for (const st of en.steps) expect(words(st)).toBeLessThanOrEqual(80)
    expect(en.glossary.length).toBeLessThanOrEqual(3)
    expect(JSON.stringify(en)).not.toMatch(BANNED)
  })
  it('sizes in the text are the e-Manual numbers rounded to whole cm, the sensor height from the robot file', () => {
    for (const l of ['en', 'ja'] as const) {
      const m = MEET_STRINGS[l], all = [...m.steps, ...Object.values(m.parts)].join(' ')
      for (const n of [Math.round(SPEC.l), Math.round(SPEC.w), Math.round(SPEC.h), Math.round(SPEC.sensorCm)]) expect(all).toContain(`${n} cm`)
      expect(all).toContain(String(SPEC.hours))
    }
  })
  it.each(['en', 'ja'] as const)('%s renders 4 tappable parts with names, the car readout says not a robot', (l) => {
    const html = renderToStaticMarkup(<MeetChapter t={STRINGS[l]} />)
    expect(html.match(/role="button"/g)?.length).toBe(PARTS.length)
    expect(html).toContain(`data-k="robot">${MEET_STRINGS[l].no}<`)
  })
})
