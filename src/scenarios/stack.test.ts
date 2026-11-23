import { describe, expect, it } from 'vitest'
import { LAYERS, STACK_END, layerAt, stackEvents } from './stack'

describe('tool stack', () => {
  it('every layer lands after the layers it rests on', () => {
    const land = stackEvents()
    LAYERS.forEach((l, i) => LAYERS.forEach((m, j) => { if (m.slot < l.slot) expect(land[j]).toBeLessThan(land[i]) }))
  })
  it('a layer is hidden before its drop, falls, and is at rest on its event', () => {
    const land = stackEvents()
    expect(layerAt(2, land[2] - 0.8).shown).toBe(false)
    const mid = layerAt(2, land[2] - 0.15)
    expect(mid.shown && mid.lift > 0 && mid.lift < 120).toBe(true)
    expect(layerAt(2, land[2]).lift).toBe(0)
  })
  it('lands with a squash that overshoots and settles by the end', () => {
    const land = stackEvents()[0]
    const sy = Array.from({ length: 200 }, (_, k) => layerAt(0, land + k * 0.003).sy)
    expect(Math.min(...sy)).toBeLessThan(0.94)
    expect(Math.max(...sy.slice(20))).toBeGreaterThan(1.005)
    expect(Math.abs(layerAt(LAYERS.length - 1, STACK_END).sy - 1)).toBeLessThan(0.01)
  })
})
