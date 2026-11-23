import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import type { Strings } from '../i18n'
import { advance, stepEvent } from '../lib/timeline'
import { GLIDE_MS, HOLD_KEY, currentStep, fromKeyboard, glide, playerKey, shouldAutoplay } from './motion'
import { UI_STYLE } from './spring'
import './player.css'

const held = () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem(HOLD_KEY) === '1'
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Scenario controls: step back, play/pause, step forward (by events), and a scrubber over [0, end].
 * The chapter owns the playhead `t` and draws its figure from it; this only moves it.
 * Step by click glides the playhead to the event (eased, GLIDE_MS) so the change is seen happening; Step by key jumps.
 * Keys inside the group: Space / k play-pause, r replay, ← / → step, Home / End jump.
 * `labels` (one per event, ascending order): a numbered step rail under the controls, current step filled, each a
 * button that glides there, and Next names the step it goes to.
 * Reduced motion: Play is disabled, Step jumps, the chapter opens on its end frame.
 * Pausing holds autoplay off for the rest of the session; pressing Play again releases it.
 */
export default function Player({ t, setT, end, events, speed, autoplay = false, caption, labels, s }: {
  t: number; setT: (t: number) => void; end: number; events: number[]; speed: number; autoplay?: boolean; caption: ReactNode
  labels?: string[]; s: Strings
}) {
  const still = reducedMotion()
  const [playing, setPlaying] = useState(() => shouldAutoplay(autoplay, still, held()))
  const [target, setTarget] = useState<number | null>(null)
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
  useEffect(() => {
    if (target === null) return
    const from = now.current, t0 = performance.now()
    let id = 0
    const frame = (ms: number) => {
      const elapsed = ms - t0
      setT(glide(from, target, elapsed))
      if (elapsed >= GLIDE_MS) setTarget(null)
      else id = requestAnimationFrame(frame)
    }
    id = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(id)
  }, [target, setT])
  // instant: reduced motion, or a key press (keys repeat; an animated step feels slow, Emil Kowalski's review standards)
  const go = (to: number, instant = still) => { setPlaying(false); if (instant) { setTarget(null); setT(to) } else setTarget(to) }
  const from = target ?? t
  const step = (dir: -1 | 1, instant = still) => go(stepEvent(events, from, dir), instant)
  const atEnd = t >= end - 1e-9
  const toggle = () => {
    setTarget(null)
    if (playing) sessionStorage.setItem(HOLD_KEY, '1') // paused once: later chapters open paused
    else sessionStorage.removeItem(HOLD_KEY)
    if (!playing && atEnd) setT(0)
    setPlaying(!playing && !still)
  }
  const replay = () => { setTarget(null); sessionStorage.removeItem(HOLD_KEY); setT(0); setPlaying(!still) }
  const sorted = [...events].sort((a, b) => a - b)
  const here = currentStep(sorted, from)
  const nextLabel = labels?.[here + 1]
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const k = playerKey(e.key, (e.target as HTMLElement).classList?.contains('scrub'))
    if (!k) return
    e.preventDefault()
    e.stopPropagation() // inside the Player, ← / → step the scenario; the page's chapter arrows must not also fire
    if (k === 'toggle') toggle()
    else if (k === 'replay') replay()
    else if (k === 'back') step(-1, true)
    else if (k === 'next') step(1, true)
    else go(k === 'start' ? 0 : end, true)
  }
  return (
    <div className="stepper" role="group" aria-label={s.player.label} onKeyDown={onKey} style={UI_STYLE}>
      <button type="button" onClick={(e) => step(-1, still || fromKeyboard(e))} disabled={from <= Math.min(...events) + 1e-9}>← {s.back}</button>
      <button type="button" disabled={still} aria-pressed={playing} onClick={toggle}>{playing ? s.player.pause : s.player.play}</button>
      <button type="button" onClick={(e) => step(1, still || fromKeyboard(e))} disabled={from >= Math.max(...events) - 1e-9}>
        {s.next}{nextLabel && <span className="wide">: {nextLabel}</span>} →
      </button>
      <input className="scrub" type="range" min={0} max={end} step={end / 200} value={t} aria-label={s.player.scrub}
        onChange={(e) => { setPlaying(false); setTarget(null); setT(Number(e.target.value)) }} />
      <span className="caption" data-k="step" aria-live="polite">{caption}</span>
      {labels && (
        <ol className="rail">
          {labels.map((l, i) => (
            <li key={i}>
              <button type="button" aria-current={i === here ? 'step' : undefined} data-done={i < here || undefined}
                onClick={(e) => go(sorted[i], still || fromKeyboard(e))} title={l}>
                <span className="dot">{i + 1}</span><span className="wide">{l}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
      <span className="keys wide" aria-hidden="true">
        <kbd>Space</kbd> {s.player.play} · <kbd>←</kbd><kbd>→</kbd> {s.back} / {s.next} · <kbd>R</kbd> ↺
      </span>
    </div>
  )
}
