import './transition.css'

export type Dir = -1 | 0 | 1

/** Direction of a page change: towards a later chapter (1), an earlier one (-1), or to / from the plan (0, plain fade). */
export function chapterDir(from: number, to: number): Dir {
  return from < 0 || to < 0 || from === to ? 0 : to > from ? 1 : -1
}

type Doc = Pick<Document, 'documentElement' | 'querySelector'> & { startViewTransition?: (cb: () => void) => { finished: Promise<unknown> } }

/**
 * Run `update` (must change the DOM synchronously, e.g. flushSync(() => setRoute(...))) as a page change:
 * View Transition sliding the chapter body the way the reader moved; without the API, a 200 ms fade-in of the new
 * body; under reduced motion, nothing moves.
 */
export function swap(update: () => void, dir: Dir, doc: Doc = document, still = reduced()): 'vt' | 'fade' | 'none' {
  if (still) { update(); return 'none' }
  if (doc.startViewTransition) {
    const root = doc.documentElement
    root.dataset.vt = dir > 0 ? 'next' : dir < 0 ? 'back' : 'fade'
    doc.startViewTransition(update).finished.finally(() => { delete root.dataset.vt })
    return 'vt'
  }
  update()
  doc.querySelector('main')?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' })
  return 'fade'
}

function reduced() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}
