import { describe, expect, it } from 'vitest'
import { BEAMS } from './sense'
import { FRONT_MAX, FRONT_MIN, VIEW, view, world } from './simwhat'

describe('simwhat model', () => {
  it('sensor on: the view gets one dot per reading, the front dot sits on the front wall', () => {
    const v = view(2, true)
    expect(v.length).toBe(BEAMS)
    expect(v[0].x).toBeCloseTo(2)
  })
  it('move the wall in the world: the front dot moves with it', () => {
    expect(view(1, true)[0].x).toBeCloseTo(1)
    expect(view(FRONT_MAX, true)[0].x).toBeCloseTo(FRONT_MAX)
  })
  it('break it: sensor off, the view is empty but the world wall is unchanged', () => {
    expect(view(2, false)).toEqual([])
    expect(world(2).front).toBe(2)
  })
  it('the room at its widest fits one panel', () => {
    const x = (m: number) => VIEW.ox + m * VIEW.px
    expect(x(world(FRONT_MAX).back)).toBeGreaterThan(5)
    expect(x(FRONT_MAX) + 6).toBeLessThan(VIEW.panelW)
    expect(VIEW.oy - world(FRONT_MIN).side * VIEW.px).toBeGreaterThan(40) // room for the panel title
    expect(VIEW.oy + world(FRONT_MIN).side * VIEW.px).toBeLessThan(VIEW.h - 5)
    expect(2 * VIEW.panelW + VIEW.gap).toBe(VIEW.w)
  })
})
