import { describe, expect, it } from 'vitest'
import { LEVEL0_CHAPTERS, LEVEL0_GROUPS } from './index'

describe('LEVEL0_GROUPS', () => {
  it('covers every Level 0 chapter once, in reading order', () => {
    expect(LEVEL0_GROUPS.flat()).toEqual(LEVEL0_CHAPTERS.map((c) => c.id))
  })
})
