import { describe, expect, it } from 'vitest'
import { TRANSITIONS, onError, raiseError, step, type State } from '../chapters/l5b/lifecycle'
import { EP, reaction, tokenAt } from './lctoken'

const ALL: State[] = ['unconfigured', 'inactive', 'active', 'finalized', 'errorprocessing']
describe('lifecycle token', () => {
  it('every legal transition moves the token to a different box; every rejected one wobbles in place', () => {
    for (const s of ALL) for (const tr of TRANSITIONS) {
      const r = reaction(s, step(s, tr))
      if (step(s, tr)) { expect(r.wobble).toBe(false); expect(tokenAt(r.at)).not.toEqual(tokenAt(s)) } else expect(r).toEqual({ at: s, wobble: true })
    }
  })
  it('the error path goes down to ErrorProcessing and back to unconfigured or finalized', () => {
    expect(tokenAt(reaction('active', raiseError('active')).at)).toEqual({ x: EP.x + EP.w / 2, y: EP.y })
    expect(reaction('inactive', raiseError('inactive')).wobble).toBe(true)
    expect(reaction('errorprocessing', onError('errorprocessing', true)).at).toBe('unconfigured')
    expect(reaction('errorprocessing', onError('errorprocessing', false)).at).toBe('finalized')
  })
  it('five distinct positions', () => {
    expect(new Set(ALL.map((s) => JSON.stringify(tokenAt(s)))).size).toBe(5)
  })
})
