import type { ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS, type Strings } from '../../i18n'
import BfsChapter from '../ep/BfsChapter'
import LateChapter from '../ep/LateChapter'
import { BODIES, INTROS } from '../l2/bodies'
import ActChapter from './ActChapter'
import MeetChapter from './MeetChapter'
import MoveChapter from './MoveChapter'
import SenseChapter from './SenseChapter'
import SimpickChapter from './SimpickChapter'
import SimwhatChapter from './SimwhatChapter'
import ThinkChapter from './ThinkChapter'

// Same rule as the site's page check (scripts/verify.mjs): on a Japanese page every plain/lede/note paragraph and every
// glossary term that is not <code> holds Japanese, unless it is a proper name. Here it runs on every chapter this lane owns.
const JA_TEXT = /[぀-ヿ一-龯]/
const PROPER_NAMES = new Set(['TurtleBot3 Burger'])
const PAGES: Record<string, ComponentType<{ t: Strings }>> = {
  meet: MeetChapter, move: MoveChapter, sense: SenseChapter, think: ThinkChapter, act: ActChapter, simwhat: SimwhatChapter, simpick: SimpickChapter,
  ...BODIES, intro1: INTROS[1], intro2: INTROS[2], bfs: BfsChapter, late: LateChapter,
}

describe('Japanese pages have no English prose left (page-check rule)', () => {
  it.each(Object.keys(PAGES))('%s', (id) => {
    const Page = PAGES[id]
    const dom = renderToStaticMarkup(<Page t={STRINGS.ja} />)
    const prose = [...dom.matchAll(/<p(?: class="(?:lede|note)")?>([^<]+)<\/p>|<dt>(?!<code>[^<]*<\/code><\/dt>)(.*?)<\/dt>/g)].map((m) => (m[1] ?? m[2]).replace(/<[^>]+>/g, '').trim())
    expect(prose.filter((t) => !JA_TEXT.test(t) && !PROPER_NAMES.has(t))).toEqual([])
  })
})
