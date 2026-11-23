import { readFileSync, existsSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'
import { LADDER, SOURCES } from './simpick'
import SimpickChapter from './SimpickChapter'
import { SIMPICK_STRINGS } from './simpick.strings'

const words = (x: string) => x.split(/\s+/).filter(Boolean).length
const COMMANDS = /ros2 |sudo|apt |pip |colcon|git clone/i
// SIM_FACTS=<path to R101_SIM_FACTS.md> (kept outside the repo): every cited URL must be a row of it.
const FACTS = process.env.SIM_FACTS ?? ''

describe('simpick page', () => {
  it('EN and JA have the same keys, steps, rows and answers', () => {
    const { en, ja } = SIMPICK_STRINGS
    expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort())
    expect(ja.steps.length).toBe(en.steps.length)
    expect(Object.keys(ja.rows)).toEqual(Object.keys(en.rows))
    expect(Object.keys(en.rows).sort()).toEqual(LADDER.map((r) => r.id).sort())
  })
  it('on-ramp rules: 3-5 steps, at most 80 words, at most 3 new words, no commands', () => {
    const en = SIMPICK_STRINGS.en
    expect(en.steps.length).toBeGreaterThanOrEqual(3)
    expect(en.steps.length).toBeLessThanOrEqual(5)
    for (const st of en.steps) expect(words(st)).toBeLessThanOrEqual(80)
    expect(en.glossary.length).toBeLessThanOrEqual(3)
    expect(JSON.stringify(en)).not.toMatch(COMMANDS)
  })
  it.skipIf(!FACTS || !existsSync(FACTS))('every URL on the page is in the facts file (checked 2026-11-23)', () => {
    const facts = readFileSync(FACTS, 'utf8')
    const urls = [...LADDER.map((r) => r.url).filter(Boolean), SOURCES.classicEol, SOURCES.webots]
    for (const u of urls) expect(facts).toContain(u)
    for (const b of ['humble', 'jazzy']) expect(facts).toContain(`turtlebot3_simulations/${b}/turtlebot3_gazebo/package.xml`)
  })
  it.each(['en', 'ja'] as const)('%s renders all 6 rows, this site lit before any answer', (l) => {
    const html = renderToStaticMarkup(<SimpickChapter t={STRINGS[l]} />)
    expect(html.match(/class="sp-row/g)?.length).toBe(LADDER.length)
    expect(html).toContain('data-lit="site"')
  })
})
