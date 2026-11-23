import { describe, expect, it } from 'vitest'
import { mood } from './robotmood'

describe('robot face mood', () => {
  it('broken beats everything, then solved, then sensing', () => {
    expect(mood({ broken: true, solved: true, sensing: true })).toBe('dizzy')
    expect(mood({ broken: false, solved: true, sensing: true })).toBe('proud')
    expect(mood({ broken: false, solved: false, sensing: true })).toBe('curious')
    expect(mood({ broken: false, solved: false })).toBe('idle')
  })
})
