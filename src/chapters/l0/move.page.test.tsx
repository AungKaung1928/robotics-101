import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'
import { body, LEFT, TOP_SPEED, turnsPerS, WHEEL_GAP_M, WHEEL_RADIUS_M } from './move'
import MoveChapter from './MoveChapter'
import { MOVE_STRINGS } from './move.strings'

const words = (x: string) => x.split(/\s+/).filter(Boolean).length
// Group A rule (research/APP_R101_ONRAMP.md): no software words and no code before the reader has seen the robot move.
const BANNED = /\b(ROS|node|topic|cmd_vel|Twist|python|code|program|LiDAR|Gazebo|RViz)\b/i

describe('move page', () => {
  it('EN and JA have the same keys and the same number of steps, glossary rows and answers', () => {
    const { en, ja } = MOVE_STRINGS
    expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort())
    expect(ja.steps.length).toBe(en.steps.length)
    expect(ja.glossary.length).toBe(en.glossary.length)
    expect(Object.keys(ja.answers)).toEqual(Object.keys(en.answers))
  })
  it('on-ramp rules: 3-5 steps, at most 80 words each, at most 3 new words, no software words', () => {
    const en = MOVE_STRINGS.en
    expect(en.steps.length).toBeGreaterThanOrEqual(3)
    expect(en.steps.length).toBeLessThanOrEqual(5)
    for (const st of en.steps) expect(words(st)).toBeLessThanOrEqual(80)
    expect(en.glossary.length).toBeLessThanOrEqual(3)
    const all = [en.learn, ...en.steps, en.slipSame, en.slipDiff, en.slipTrust, en.real, en.check, ...en.glossary.flat()].join(' ')
    expect(all).not.toMatch(BANNED)
  })
  it('numbers in the text are the model numbers (left 0.15, gap 16 cm, wheel 6.6 cm, 0.22 m/s, ~1 turn/s)', () => {
    for (const l of ['en', 'ja'] as const) {
      const m = MOVE_STRINGS[l]
      expect(m.steps.join(' ')).toContain(LEFT.toFixed(2))
      expect(m.real).toContain(`${WHEEL_GAP_M * 100} cm`)
      expect(m.real).toContain(`${(WHEEL_RADIUS_M * 200).toFixed(1)} cm`)
      expect(m.real).toContain(`${TOP_SPEED} m/s`)
      expect(m.real).toContain(`${LEFT} m/s`) // the page-choice line names the held left speed
    }
    expect(Math.round(turnsPerS(TOP_SPEED))).toBe(1)
  })
  it('shopping-cart example is the model: left side faster turns right', () => {
    expect(body(0.2, 0.1).w).toBeLessThan(0)
  })
  it.each(['en', 'ja'] as const)('%s renders: path, readouts, check question, both sources', (l) => {
    const html = renderToStaticMarkup(<MoveChapter t={STRINGS[l]} />)
    expect(html).toContain('class="move-path"')
    expect(html).toContain(`data-k="kind">${MOVE_STRINGS[l].kind.straight}<`) // opens with equal wheels: predict first
    expect(html).toContain('data-k="told">0.150<')
    expect(html).toContain('data-k="delivers">0.150<') // no slip until break it
    expect(html).not.toContain('data-k="spin"')
    expect(html).toContain(MOVE_STRINGS[l].check)
    expect(html).toContain('turtlebot3_burger.urdf.xacro#L146-L147')
    expect(html).toContain('emanual.robotis.com/docs/en/platform/turtlebot3/features/')
  })
})
