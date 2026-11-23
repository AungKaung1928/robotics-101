import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'
import { TURN_MAX, VIEW, blindM, wheels } from './act'
import ActChapter from './ActChapter'
import { ACT_STRINGS } from './act.strings'
import { SECONDS, TOP_SPEED, path } from './move'

const words = (x: string) => x.split(/\s+/).filter(Boolean).length
const BANNED = /\b(ROS|node|topic|cmd_vel|Twist|python|code|program|LiDAR|Gazebo|RViz)\b/i

describe('act page', () => {
  it('EN and JA have the same keys, steps, glossary rows and answers', () => {
    const { en, ja } = ACT_STRINGS
    expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort())
    expect(ja.steps.length).toBe(en.steps.length)
    expect(ja.glossary.length).toBe(en.glossary.length)
    expect(Object.keys(ja.answers)).toEqual(Object.keys(en.answers))
  })
  it('on-ramp rules: 3-5 steps, at most 80 words, at most 3 new words, no software words', () => {
    const en = ACT_STRINGS.en
    expect(en.steps.length).toBeGreaterThanOrEqual(3)
    expect(en.steps.length).toBeLessThanOrEqual(5)
    for (const st of en.steps) expect(words(st)).toBeLessThanOrEqual(80)
    expect(en.glossary.length).toBeLessThanOrEqual(3)
    expect([en.learn, ...en.steps, en.check, en.tooFast, ...en.glossary.flat()].join(' ')).not.toMatch(BANNED)
  })
  it('text numbers = model numbers (4.4 cm between checks at top speed, 0.22 m/s)', () => {
    for (const l of ['en', 'ja'] as const) {
      expect(ACT_STRINGS[l].steps.join(' ')).toContain(`${(blindM(TOP_SPEED) * 100).toFixed(1)} cm`)
      expect(ACT_STRINGS[l].tooFast).toContain(`${TOP_SPEED} m/s`)
    }
  })
  it('every slider setting keeps the robot inside the figure', () => {
    for (let v = 0; v <= TOP_SPEED + 1e-9; v += 0.01) for (let w = -TURN_MAX; w <= TURN_MAX + 1e-9; w += 0.1) {
      const k = wheels(v, w)
      for (const q of path(k.left, k.right, SECONDS)) {
        const x = VIEW.ox + q.x * VIEW.px, y = VIEW.oy - q.y * VIEW.px
        expect(x).toBeGreaterThan(20); expect(x).toBeLessThan(VIEW.w - 20)
        expect(y).toBeGreaterThan(20); expect(y).toBeLessThan(VIEW.h - 20)
      }
    }
  })
  it.each(['en', 'ja'] as const)('%s renders: wheel readouts for 0.15 m/s + 0.5 rad/s (0.11 / 0.19), sources', (l) => {
    const html = renderToStaticMarkup(<ActChapter t={STRINGS[l]} />)
    expect(html).toContain('data-k="left">0.11 m/s<')
    expect(html).toContain('data-k="right">0.19 m/s<')
    expect(html).toContain('nav2_params.yaml#L45-L48')
  })
})
