import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../../i18n'
import ActChapter from './ActChapter'
import MoveChapter from './MoveChapter'
import SenseChapter from './SenseChapter'
import SimwhatChapter from './SimwhatChapter'

const moods = (html: string) => [...html.matchAll(/class="face is-(\w+)"/g)].map((m) => m[1]) // the mascot has its own data-mood

describe('robot faces at page open', () => {
  it('move and act: idle; sense: curious (it is sensing); simwhat: world robot idle, view robot curious', () => {
    expect(moods(renderToStaticMarkup(<MoveChapter t={STRINGS.en} />))).toEqual(['idle'])
    expect(moods(renderToStaticMarkup(<ActChapter t={STRINGS.en} />))).toEqual(['idle'])
    expect(moods(renderToStaticMarkup(<SenseChapter t={STRINGS.en} />))).toEqual(['curious'])
    expect(moods(renderToStaticMarkup(<SimwhatChapter t={STRINGS.en} />))).toEqual(['idle', 'curious'])
  })
})
