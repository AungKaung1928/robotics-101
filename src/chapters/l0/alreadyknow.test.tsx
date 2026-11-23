import type { ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS, type Strings } from '../../i18n'
import ClosestChapter from '../l1/ClosestChapter'
import ActChapter from './ActChapter'
import { L0_TITLES } from './AlreadyKnow'
import MoveChapter from './MoveChapter'
import { LEVEL0_CHAPTERS } from '.'
import { GROWS_FROM } from './onramp'
import SenseChapter from './SenseChapter'
import SimpickChapter from './SimpickChapter'
import SimwhatChapter from './SimwhatChapter'
import ThinkChapter from './ThinkChapter'

// Chapters that show the "you already know" line; 1.1 (decide) and 2.7 (drive) carry their own bridge sentence instead.
const SHOWN: Record<string, ComponentType<{ t: Strings }>> = {
  move: MoveChapter, sense: SenseChapter, think: ThinkChapter, act: ActChapter, simwhat: SimwhatChapter, simpick: SimpickChapter, closest: ClosestChapter,
}
const esc = (x: string) => x.replace(/&/g, '&amp;').replace(/'/g, '&#x27;').replace(/"/g, '&quot;')

describe('"you already know" links', () => {
  it('every GROWS_FROM entry is shown on its page or has its own bridge test (decide, drive)', () => {
    expect(Object.keys(GROWS_FROM).filter((id) => !SHOWN[id]).sort()).toEqual(['decide', 'drive'])
  })
  it.each(Object.keys(SHOWN))('%s links back to its source chapter, with that chapter\'s title, EN and JA', (id) => {
    const from = GROWS_FROM[id]
    for (const l of ['en', 'ja'] as const) {
      const html = renderToStaticMarkup(<Body id={id} l={l} />)
      expect(html).toContain(`href="#/0/${from}"`)
      expect(html).toContain(esc(L0_TITLES[from][l].title))
    }
  })
})

describe('"you already know" targets are routed', () => {
  it('every link points at a Level 0 chapter in the route list (no dead #/0/ link)', () => {
    const routed = new Set(LEVEL0_CHAPTERS.map((c) => c.id))
    for (const id of Object.keys(SHOWN)) expect(routed.has(GROWS_FROM[id]), `${id} -> #/0/${GROWS_FROM[id]}`).toBe(true)
  })
})

function Body({ id, l }: { id: string; l: 'en' | 'ja' }) {
  const C = SHOWN[id]
  return <C t={STRINGS[l]} />
}
