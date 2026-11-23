import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'
import { TOP_SPEED } from './move'
import { RULE_M, SCAN_HZ, SPEED, blindCm, largestBumpCm, run } from './think'
import ThinkChapter from './ThinkChapter'
import { THINK_STRINGS } from './think.strings'

const words = (x: string) => x.split(/\s+/).filter(Boolean).length
const BANNED = /\b(ROS|node|topic|python|code|program|variable|stop_at|LiDAR|Gazebo|RViz)\b/

describe('think page', () => {
  it('EN and JA have the same keys, steps, glossary rows and answers', () => {
    const { en, ja } = THINK_STRINGS
    expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort())
    expect(ja.steps.length).toBe(en.steps.length)
    expect(ja.glossary.length).toBe(en.glossary.length)
    expect(Object.keys(ja.answers)).toEqual(Object.keys(en.answers))
  })
  it('on-ramp rules: 3-5 steps, at most 80 words, at most 3 new words, no software words or code', () => {
    const en = THINK_STRINGS.en
    expect(en.steps.length).toBeGreaterThanOrEqual(3)
    expect(en.steps.length).toBeLessThanOrEqual(5)
    for (const st of en.steps) expect(words(st)).toBeLessThanOrEqual(80)
    expect(en.glossary.length).toBeLessThanOrEqual(3)
    expect([en.learn, ...en.steps, en.brokenNote, en.check, ...en.glossary.flat()].join(' ')).not.toMatch(BANNED)
  })
  it('says why it drives 0.26 m/s when move and act give the real Burger 0.22 m/s as top speed', () => {
    expect(SPEED).toBeGreaterThan(TOP_SPEED)
    for (const l of ['en', 'ja'] as const) {
      const step = THINK_STRINGS[l].steps.find((st) => st.includes(`${blindCm()} cm`))!
      for (const n of [`${SPEED} m/s`, `${TOP_SPEED} m/s`]) expect(step).toContain(n)
    }
  })
  it('text numbers = model numbers (0.5 m, 5 checks/s, 5.2 cm, 2 cm bump) and the page opens at the rule', () => {
    for (const l of ['en', 'ja'] as const) {
      const all = THINK_STRINGS[l].steps.join(' ')
      for (const n of [`${RULE_M} m`, `${SCAN_HZ} `, `${blindCm()} cm`, `${largestBumpCm()} cm`]) expect(all).toContain(n)
    }
    expect(renderToStaticMarkup(<ThinkChapter t={STRINGS.en} />)).toContain(`data-k="final">${run(RULE_M).final.toFixed(2)} m<`)
  })
  it.each(['en', 'ja'] as const)('%s renders without code: no <pre>, the 1.1 figure, sources', (l) => {
    const html = renderToStaticMarkup(<ThinkChapter t={STRINGS[l]} />)
    expect(html).not.toContain('<pre')
    expect(html).not.toMatch(/stop_at|distance =/)
    expect(html).toContain('nav2_params.yaml#L39')
  })
})
