import { useEffect, useRef, useState } from 'react'
import { CALM, springAt, type Spring } from './spring'

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

/**
 * springStep for marks that carry data: velocity pointing away from the (new) target is dropped and the step never
 * crosses the target, so the mark only moves monotonically from where it is towards the true value. Measured without
 * this, CALM retargeted 1 -> 0.5 mid-flight reached 0.513 (past) or went 0.619 -> 0.690 (wrong way first).
 */
export function stepData(x: number, v: number, target: number, dt: number, s: Spring): [number, number] {
  const v0 = v * (target - x) < 0 ? 0 : v
  const [nx, nv] = springStep(x, v0, target, dt, s)
  return (x - target) * (nx - target) < 0 ? [target, 0] : [nx, nv]
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A value that follows `target` on a spring (e.g. a threshold line following its slider), carrying its velocity when
 * the target moves again mid-flight. Default CALM: data marks must not overshoot past the true value; pass a bouncy
 * spring only for decoration (`data` false: carries velocity freely). Reduced motion: the target itself. Rests when within `eps` and slow.
 */
export function useSpring(target: number, s: Spring = CALM, eps = 1e-3, data = s === CALM): number {
  const [x, setX] = useState(target)
  const st = useRef({ x: target, v: 0 })
  useEffect(() => {
    if (reduced()) { st.current = { x: target, v: 0 }; setX(target); return }
    let id = 0, last = performance.now()
    const frame = (ms: number) => {
      const dt = (ms - last) / 1000
      last = ms
      const [nx, nv] = (data ? stepData : springStep)(st.current.x, st.current.v, target, dt, s)
      st.current = { x: nx, v: nv }
      if (Math.abs(nx - target) < eps && Math.abs(nv) < eps * 10) { st.current = { x: target, v: 0 }; setX(target); return }
      setX(nx)
      id = requestAnimationFrame(frame)
    }
    id = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(id)
  }, [target, s, eps, data])
  return x
}
