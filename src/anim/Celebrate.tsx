import { useEffect, useState } from 'react'
import { burst } from './mascot'
import './celebrate.css'

const LIFE = 0.8 // s

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A light celebration inside a chapter's SVG figure: when `n` changes (a challenge solved), eight sparks burst from
 * (x, y) and fall away (same physics as the mascot's sparks, scaled to page px by `scale`). Reduced motion: nothing
 * moves (the chapter's own text already says it was solved).
 */
export default function Celebrate({ x, y, n, scale = 2 }: { x: number; y: number; n: number; scale?: number }) {
  const [t, setT] = useState(-1)
  useEffect(() => {
    if (!n || reduced()) return
    const t0 = performance.now()
    let id = 0
    const frame = (ms: number) => {
      const s = (ms - t0) / 1000
      setT(s < LIFE ? s : -1)
      if (s < LIFE) id = requestAnimationFrame(frame)
    }
    id = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(id)
  }, [n])
  return <CelebrateFrame x={x} y={y} t={t} scale={scale} />
}

/** One frame of the burst at `t` s (the render test and GIFs draw frames with it). */
export function CelebrateFrame({ x, y, t, scale = 2 }: { x: number; y: number; t: number; scale?: number }) {
  const ps = burst(t, x, y, 8, 70 * scale, 160 * scale, LIFE)
  return ps.length ? <g className="celebrate" aria-hidden="true">{ps.map((p, i) => <circle key={i} data-i={i % 2} cx={p.x} cy={p.y} r={1.8 * scale} opacity={p.o} />)}</g> : null
}
