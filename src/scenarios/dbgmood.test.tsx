import { describe, expect, it } from 'vitest'
import { dbgReaction } from './dbgmood'
import { FAULTS, TOOLS, look, remaining, type Fault, type Tool } from '../chapters/l5/debug'

const after = (fault: Fault, tools: Tool[]) => remaining(tools.map((tool) => ({ tool, clue: look(fault, tool) }))).length

describe('5.3 mascot reaction from the debug model', () => {
  it('every fault can be named by some tool sequence, and the naming run cheers', () => {
    for (const f of FAULTS) {
      const run: Tool[] = []
      let r: string | null = null
      for (const tool of TOOLS) { const b = after(f, run); run.push(tool); r = dbgReaction(b, after(f, run)); if (r === 'cheer') break }
      expect(r).toBe('cheer')
    }
  })
  it('a run that leaves the same faults open wobbles; nothing happens once named', () => {
    expect(dbgReaction(3, 3)).toBe('oops')
    expect(dbgReaction(3, 2)).toBeNull()
    expect(dbgReaction(1, 1)).toBeNull()
  })
  it('mascot sits before the verdict, named in the page language', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server')
    const { STRINGS } = await import('../i18n')
    const { default: DebugChapter } = await import('../chapters/l5/DebugChapter')
    expect(renderToStaticMarkup(<DebugChapter t={STRINGS.en} />)).toMatch(/Debug buddy robot[\s\S]*data-k="named"/)
  })
})
