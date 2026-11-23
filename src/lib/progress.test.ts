import { describe, expect, it } from 'vitest'
import { markDone, readDone } from './progress'

const memory = (init?: string) => {
  const m = new Map<string, string>(init === undefined ? [] : [['r101-done', init]])
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}

describe('progress', () => {
  it('keeps each opened chapter once', () => {
    const s = memory()
    markDone(s, 'scan')
    markDone(s, 'scan')
    expect([...markDone(s, 'tf')]).toEqual(['scan', 'tf'])
    expect(readDone(s).has('scan')).toBe(true)
  })
  it('treats a corrupt or foreign value as empty', () => {
    expect(readDone(memory('{oops')).size).toBe(0)
    expect(readDone(memory('{"a":1}')).size).toBe(0)
    expect([...readDone(memory('["grid",3]'))]).toEqual(['grid'])
  })
})
