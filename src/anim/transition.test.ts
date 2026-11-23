import { describe, expect, it, vi } from 'vitest'
import { chapterDir, swap } from './transition'

const fakeDoc = (vt: boolean) => {
  const root = { dataset: {} as Record<string, string> }
  const animate = vi.fn()
  let finish = () => {}
  const doc = {
    documentElement: root, querySelector: () => ({ animate }),
    ...(vt ? { startViewTransition: (cb: () => void) => { cb(); return { finished: new Promise<void>((r) => { finish = r }) } } } : {}),
  }
  return { doc: doc as never, root, animate, finish: () => finish() }
}

describe('chapterDir', () => {
  it('forward, back, plan / same = fade', () => {
    expect(chapterDir(1, 2)).toBe(1)
    expect(chapterDir(3, 0)).toBe(-1)
    expect(chapterDir(-1, 2)).toBe(0)
    expect(chapterDir(2, -1)).toBe(0)
    expect(chapterDir(2, 2)).toBe(0)
  })
})

describe('swap', () => {
  it('View Transition: runs the update inside it, marks the direction, clears it when finished', async () => {
    const f = fakeDoc(true), update = vi.fn()
    expect(swap(update, 1, f.doc, false)).toBe('vt')
    expect(update).toHaveBeenCalledOnce()
    expect(f.root.dataset.vt).toBe('next')
    f.finish(); await Promise.resolve(); await Promise.resolve()
    expect(f.root.dataset.vt).toBeUndefined()
  })
  it('no API: updates, then fades the new body in', () => {
    const f = fakeDoc(false), update = vi.fn()
    expect(swap(update, -1, f.doc, false)).toBe('fade')
    expect(update).toHaveBeenCalledOnce()
    expect(f.animate).toHaveBeenCalledOnce()
  })
  it('reduced motion: toned down, not removed: a plain fade (no slide) with the API', () => {
    const f = fakeDoc(true), update = vi.fn()
    expect(swap(update, 1, f.doc, true)).toBe('vt')
    expect(f.root.dataset.vt).toBe('fade')
  })
  it('reduced motion without the API: a shorter fade', () => {
    const f = fakeDoc(false), update = vi.fn()
    expect(swap(update, -1, f.doc, true)).toBe('fade')
    expect(update).toHaveBeenCalledOnce()
    expect(f.animate.mock.calls[0][1]).toMatchObject({ duration: 150 })
  })
})
