import { describe, expect, it } from 'vitest'
import { FAULTS, TOOLS, fewestTools, look, remaining } from './debug'
import { DEBUG_STRINGS } from './debug.strings'

const keys = (o: object): string[] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? keys(v).map((x) => `${k}.${x}`) : [k]))

describe('5.3 debugging model', () => {
  it('the symptom (echo /cmd_vel) is the same for every fault: it rules nothing out', () => {
    for (const f of FAULTS) expect(remaining([{ tool: 'echo', clue: look(f, 'echo') }])).toEqual([...FAULTS])
  })
  it('rqt_graph alone names each fault; one tool is the minimum', () => {
    for (const f of FAULTS) expect(remaining([{ tool: 'graph', clue: look(f, 'graph') }])).toEqual([f])
    expect(fewestTools()).toBe(1)
  })
  it('topic hz splits sensor from the rest; tf2_echo then splits remap from tf', () => {
    expect(remaining([{ tool: 'hz', clue: look('remap', 'hz') }])).toEqual(['remap', 'tf'])
    const two = (f: (typeof FAULTS)[number]) => remaining((['hz', 'tf'] as const).map((tool) => ({ tool, clue: look(f, tool) })))
    expect(FAULTS.map(two)).toEqual([['sensor'], ['remap'], ['tf']])
  })
  it('bag replay on a laptop says "not hardware" for remap and tf alike', () => {
    expect(look('remap', 'bag')).toEqual(look('tf', 'bag'))
    expect(look('sensor', 'bag')).not.toEqual(look('tf', 'bag'))
  })
  it('every clue key has EN text; EN and JA have the same keys', () => {
    for (const f of FAULTS) for (const tool of TOOLS) expect(DEBUG_STRINGS.en.clues).toHaveProperty(look(f, tool).key)
    expect(keys(DEBUG_STRINGS.ja)).toEqual(keys(DEBUG_STRINGS.en))
  })
})
