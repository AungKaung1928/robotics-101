import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'
import { BEAMS } from './sense'
import SimwhatChapter from './SimwhatChapter'
import { SIMWHAT_STRINGS } from './simwhat.strings'

const words = (x: string) => x.split(/\s+/).filter(Boolean).length
// Group B rule (research/APP_R101_ONRAMP.md): names tools, teaches no commands.
const COMMANDS = /ros2 |\brun\b|launch|install|apt|pip|sudo/i

describe('simwhat page', () => {
  it('EN and JA have the same keys, steps, glossary rows and answers', () => {
    const { en, ja } = SIMWHAT_STRINGS
    expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort())
    expect(ja.steps.length).toBe(en.steps.length)
    expect(ja.glossary.length).toBe(en.glossary.length)
    expect(Object.keys(ja.answers)).toEqual(Object.keys(en.answers))
  })
  it('on-ramp rules: 3-5 steps, at most 80 words, at most 3 new words, no commands', () => {
    const en = SIMWHAT_STRINGS.en
    expect(en.steps.length).toBeGreaterThanOrEqual(3)
    expect(en.steps.length).toBeLessThanOrEqual(5)
    for (const st of en.steps) expect(words(st)).toBeLessThanOrEqual(80)
    expect(en.glossary.length).toBeLessThanOrEqual(3)
    expect([en.learn, ...en.steps, en.brokenNote, en.check, ...en.glossary.flat()].join(' ')).not.toMatch(COMMANDS)
  })
  it('says RViz is not a simulator, in both languages', () => {
    expect(SIMWHAT_STRINGS.en.steps.join(' ')).toContain('RViz is not a simulator')
    expect(SIMWHAT_STRINGS.ja.steps.join(' ')).toContain('RViz はシミュレーターではない')
  })
  it.each(['en', 'ja'] as const)('%s renders both panels, 360 view dots, the RViz source', (l) => {
    const html = renderToStaticMarkup(<SimwhatChapter t={STRINGS[l]} />)
    expect(html).toContain(SIMWHAT_STRINGS[l].worldTitle)
    expect(html).toContain(SIMWHAT_STRINGS[l].viewTitle.replace("'", '&#x27;'))
    expect(html.match(/class="sw-dot"/g)?.length).toBe(BEAMS)
    expect(html).toContain('docs.ros.org/en/humble/p/rviz2/doc/index.html')
  })
})
