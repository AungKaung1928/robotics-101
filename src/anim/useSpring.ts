import { useEffect, useRef, useState } from 'react'
import { PRESS, springAt, type Spring } from './spring'

const H = 1e-5 // s, for the velocity by central difference of the exact solution

/**
 * One frame of x'' = −k (x − target) − c x', advanced with the exact solution (springAt) rather than Euler: first-order
 * Euler was off by up to 22 % of the move for PRESS at 60 fps (measured), this is exact at any frame rate.
 */
export function springStep(x: number, v: number, target: number, dt: number, s: Spring): [number, number] {
  const d = x - target
  const at = (t: number) => springAt(t, s, d, v)
  return [target + at(dt), (at(dt + H) - at(Math.max(dt - H, 0))) / (dt + H - Math.max(dt - H, 0))]
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A value that follows `target` on a spring (e.g. a threshold line following its slider), carrying its velocity when
 * the target moves again mid-flight. Reduced motion: the target itself. Rests when within `eps` and slow.
 */
export function useSpring(target: number, s: Spring = PRESS, eps = 1e-3): number {
  const [x, setX] = useState(target)
  const st = useRef({ x: target, v: 0 })
  useEffect(() => {
    if (reduced()) { st.current = { x: target, v: 0 }; setX(target); return }
    let id = 0, last = performance.now()
    const frame = (ms: number) => {
      const dt = (ms - last) / 1000
      last = ms
      const [nx, nv] = springStep(st.current.x, st.current.v, target, dt, s)
      st.current = { x: nx, v: nv }
      if (Math.abs(nx - target) < eps && Math.abs(nv) < eps * 10) { st.current = { x: target, v: 0 }; setX(target); return }
      setX(nx)
      id = requestAnimationFrame(frame)
    }
    id = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(id)
  }, [target, s, eps])
  return x
}
