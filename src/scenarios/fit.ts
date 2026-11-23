import { useLayoutEffect, useState, type RefObject } from 'react'

/**
 * Widest rendered width (SVG user units) of the <text> elements under `ref` that match `sel`, measured after layout,
 * so boxes grow to the words of any script (English, Japanese, Burmese) instead of a fixed width. 0 before the first
 * measure (server render, tests without layout): callers keep their minimum size then.
 */
export function useTextWidth(ref: RefObject<SVGElement | null>, sel: string, key: string): number {
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const els = ref.current ? [...ref.current.querySelectorAll<SVGTextElement>(sel)] : []
    const m = Math.max(0, ...els.map((e) => (typeof e.getComputedTextLength === 'function' ? e.getComputedTextLength() : 0)))
    setW((old) => (Math.abs(old - m) > 0.5 ? m : old))
  }, [ref, sel, key])
  return w
}
