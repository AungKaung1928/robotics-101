import { useEffect, useState } from 'react'
import Mascot from './Mascot'
import { CelebrateFrame } from './Celebrate'
import { arrivalScale } from './spring'
import './celebrate.css'

export const STAGGER = 0.08 // s between two dots popping in (short rows)
export const STAGGER_MAX = 0.5 // s: the whole ripple is capped, a long level does not make the reader wait (stagger cap for long lists)
/** Seconds between two dots for a row of `done` dots: STAGGER, shortened so done * step never exceeds STAGGER_MAX. */
export const staggerStep = (done: number) => Math.min(STAGGER, STAGGER_MAX / Math.max(1, done))
const GAP = 22, R = 7, LIFE = 0.8

/** One frame of the level-complete row `t` s after the level was completed: chapter dots (done ones filled) pop in one
 * after another, then the burst over the robot once the last dot has landed. t < 0 = before: all dots at rest. */
export function LevelDoneFrame({ done, total, t, label }: { done: number; total: number; t: number; label: string }) {
  const w = total * GAP + 70, step = staggerStep(done), burstAt = done * step
  return (
    <svg className="level-done" viewBox={`0 0 ${w} 70`} role="img" aria-label={label} data-done={done}>
      {Array.from({ length: total }, (_, i) => {
        const on = i < done, s = on && t >= 0 ? arrivalScale(t - i * step) : 1, cx = 14 + i * GAP
        return <circle key={i} className={on ? 'ld-dot is-done' : 'ld-dot'} cx={cx} cy={46} r={R} transform={`translate(${cx} 46) scale(${s}) translate(${-cx} -46)`} />
      })}
      <CelebrateFrame x={w - 30} y={20} t={t - burstAt} scale={1.2} />
    </svg>
  )
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Level complete: the row plays when `n` changes (the chapter's level-done counter) and the robot cheers. */
export default function LevelDone({ done, total, n, label }: { done: number; total: number; n: number; label: string }) {
  const [t, setT] = useState(-1)
  useEffect(() => {
    if (!n || reduced()) return
    const t0 = performance.now(), end = done * staggerStep(done) + LIFE + 0.4
    let id = 0
    const f = (ms: number) => { const s = (ms - t0) / 1000; setT(s < end ? s : -1); if (s < end) id = requestAnimationFrame(f) }
    id = requestAnimationFrame(f)
    return () => cancelAnimationFrame(id)
  }, [n, done])
  return (
    <span className="level-done-wrap">
      <LevelDoneFrame done={done} total={total} t={t} label={label} />
      <Mascot cheer={n} size={44} label="" />
    </span>
  )
}
