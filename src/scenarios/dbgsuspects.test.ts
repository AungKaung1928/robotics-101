import { describe, expect, it } from 'vitest'
import { FAULTS, TOOLS, look, remaining, type Fault, type Tool } from '../chapters/l5/debug'
import { marks } from './dbgsuspects'

const seen = (fault: Fault, tools: Tool[]) => tools.map((tool) => ({ tool, clue: look(fault, tool) }))
describe('debug suspect marks', () => {
  it('no clue: all suspects in', () => expect(Object.values(marks([]))).toEqual(['in', 'in', 'in']))
  it('echo alone rules nothing out (the symptom tool)', () => {
    for (const f of FAULTS) expect(Object.values(marks(seen(f, ['echo'])))).toEqual(['in', 'in', 'in'])
  })
  it('graph on the remap fault: the other two struck now, remap found', () => {
    expect(marks(seen('remap', ['graph']))).toEqual({ sensor: 'struck', remap: 'found', tf: 'struck' })
  })
  it('a strike drawn by an earlier clue is "out", not drawn again', () => {
    expect(marks(seen('tf', ['hz', 'graph']))).toEqual({ sensor: 'out', remap: 'struck', tf: 'found' })
  })
  it('marks agree with remaining() for every fault and every 2-tool sequence', () => {
    for (const f of FAULTS) for (const a of TOOLS) for (const b of TOOLS) {
      const sn = seen(f, [a, b]), m = marks(sn), left = remaining(sn)
      for (const g of FAULTS) expect(left.includes(g)).toBe(m[g] === 'in' || m[g] === 'found')
    }
  })
})
