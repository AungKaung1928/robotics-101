import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ciReaction } from './cimood'
import { STRINGS } from '../i18n'
import CiChapter from '../chapters/l5/CiChapter'

describe('5.2 mascot reaction from the CI run', () => {
  it('right guess of the first red step cheers, wrong one wobbles', () => {
    expect(ciReaction('test', 'test')).toBe('cheer')
    expect(ciReaction('none', 'build')).toBe('oops')
  })
  it('mascot is on the page before any run, named in the page language', () => {
    expect(renderToStaticMarkup(<CiChapter t={STRINGS.en} />)).toMatch(/CI buddy robot[\s\S]*data-act="run"/)
  })
})
