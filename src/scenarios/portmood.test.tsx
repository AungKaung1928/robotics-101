import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { portReaction } from './portmood'
import { HALF, LDS, cppIndex, pyIndex } from '../chapters/l5/port'
import { STRINGS } from '../i18n'
import PortChapter from '../chapters/l5/PortChapter'

describe('5.1 mascot reaction from the port model', () => {
  it('broken C++ index: some bearing disagrees, saying "differ" there cheers, saying "agree" wobbles', () => {
    const scan = [LDS, HALF].find((sc) => [...Array(360).keys()].some((d) => pyIndex(sc, d - 180) !== cppIndex(sc, d - 180, false).idx))
    expect(scan).toBeDefined()
    const d = [...Array(360).keys()].map((k) => k - 180).find((x) => pyIndex(scan!, x) !== cppIndex(scan!, x, false).idx)!
    const same = pyIndex(scan!, d) === cppIndex(scan!, d, false).idx
    expect(portReaction(false, same)).toBe('cheer')
    expect(portReaction(true, same)).toBe('oops')
  })
  it('mascot is on the page, named in the page language', () => {
    expect(renderToStaticMarkup(<PortChapter t={STRINGS.en} />)).toMatch(/Port buddy robot[\s\S]*data-k="same"/)
  })
})
