import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Strings } from '../i18n'
import { advance, stepEvent } from '../lib/timeline'

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Scenario controls: step back, play/pause, step forward (by events), and a scrubber over [0, end].
 * The chapter owns the playhead `t` and draws its figure from it; this only moves it.
 * Reduced motion: Play is disabled, the chapter opens on its end frame, Step still works.
 */
export default function Player({ t, setT, end, events, speed, autoplay = false, caption, s }: {
  t: number; setT: (t: number) => void; end: number; events: number[]; speed: number; autoplay?: boolean; caption: ReactNode; s: Strings
}) {
  const still = reducedMotion()
  const [playing, setPlaying] = useState(autoplay && !still)
  const now = useRef(t)
  now.current = t
  useEffect(() => {
    if (!playing) return
    let last = performance.now(), id = 0
    const frame = (ms: number) => {
      const next = advance(now.current, (ms - last) / 1000, speed, end)
      last = ms
      setT(next)
      if (next >= end) setPlaying(false)
      else id = requestAnimationFrame(frame)
    }
    id = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(id)
  }, [playing, speed, end, setT])
  const step = (dir: -1 | 1) => { setPlaying(false); setT(stepEvent(events, t, dir)) }
  const atEnd = t >= end - 1e-9
  return (
    <div className="stepper" role="group" aria-label={s.player.label}>
      <button type="button" onClick={() => step(-1)} disabled={t <= Math.min(...events) + 1e-9}>← {s.back}</button>
      <button type="button" disabled={still} aria-pressed={playing}
        onClick={() => { if (!playing && atEnd) setT(0); setPlaying(!playing) }}>{playing ? s.player.pause : s.player.play}</button>
      <button type="button" onClick={() => step(1)} disabled={t >= Math.max(...events) - 1e-9}>{s.next} →</button>
      <input className="scrub" type="range" min={0} max={end} step={end / 200} value={t} aria-label={s.player.scrub}
        onChange={(e) => { setPlaying(false); setT(Number(e.target.value)) }} />
      <span className="caption" data-k="step">{caption}</span>
    </div>
  )
}
