import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { lcReaction } from './lcmood'
import { raiseError, step } from '../chapters/l5b/lifecycle'
import { STRINGS } from '../i18n'
import LifecycleChapter from '../chapters/l5b/LifecycleChapter'

describe('5.5 mascot reaction from the lifecycle model', () => {
  it('configure then activate cheers once, at activate', () => {
    const a = step('unconfigured', 'configure'), b = a && step(a, 'activate')
    expect(lcReaction('unconfigured', a)).toBeNull()
    expect(b).toBe('active')
    expect(lcReaction(a!, b)).toBe('cheer')
  })
  it('a transition the model rejects wobbles', () => {
    expect(step('unconfigured', 'activate')).toBeNull()
    expect(lcReaction('unconfigured', step('unconfigured', 'activate'))).toBe('oops')
  })
  it('mascot is on the page, named in the page language', () => {
    expect(renderToStaticMarkup(<LifecycleChapter t={STRINGS.en} />)).toContain('Lifecycle buddy robot')
  })
  it('a failing transition callback (active -> ErrorProcessing, model raiseError) wobbles', () => {
    expect(raiseError('active')).toBe('errorprocessing')
    expect(lcReaction('active', raiseError('active'))).toBe('oops')
  })
})
