import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const CH = ['l5/PortChapter', 'l5/CiChapter', 'l5/DebugChapter', 'l5b/QosChapter', 'l5b/LifecycleChapter', 'l5b/FieldfailChapter']

describe('Level 5 mascot', () => {
  it('every Level 5 chapter has exactly one mascot, all at the same size', () => {
    const sizes = CH.map((c) => {
      const src = readFileSync(new URL(`../chapters/${c}.tsx`, import.meta.url), 'utf8')
      const m = [...src.matchAll(/<Mascot\b[^\n]*?size=\{(\d+)\}/g)]
      expect(m, c).toHaveLength(1)
      return Number(m[0][1])
    })
    expect(new Set(sizes).size).toBe(1)
  })
})
