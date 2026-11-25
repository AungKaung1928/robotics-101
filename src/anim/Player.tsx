import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import type { Strings } from '../i18n'
import { advance, stepEvent } from '../lib/timeline'
import { GLIDE_MS, HOLD_KEY, PAUSE_D, PLAY_D, RATE_KEY, REPLAY_D, nextRate, shiftRate, storedRate, currentStep, fromKeyboard, glide, playStop, playerKey, SCRUB_THUMB_PX, scrubFrac, scrubTrack, shouldAutoplay } from './motion'
import { UI_STYLE } from './spring'
import './player.css'
import './range.css'

const held = () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem(HOLD_KEY) === '1'
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Scenario controls: step back, play/pause, step forward (by events), and a scrubber over [0, end].
 * The chapter owns the playhead `t` and draws its figure from it; this only moves it.
 * Step by click glides the playhead to the event (eased, GLIDE_MS) so the change is seen happening; Step by key jumps.
 * Keys inside the group: Space / k play-pause, r replay, ← / → step, Home / End jump, < / > speed (with speedLabel).
 * `labels` (one per event, ascending order): a numbered step rail under the controls, current step filled, each a
 * button that glides there, and Next names the step it goes to.
 * `speedLabel`: a rate button (1× → 2× → 0.5×) after Play; the rate is kept for the session.
 * Reduced motion: Play is disabled (and the rate button hidden), Step jumps, the chapter opens on its end frame.
 * Pausing holds autoplay off for the rest of the session; pressing Play again releases it.
 */
export default function Player({ t, setT, end, events, speed, autoplay = false, pauseAtSteps = false, caption, labels, speedLabel, s }: {
  t: number; setT: (t: number) => void; end: number; events: number[]; speed: number; autoplay?: boolean; caption: ReactNode
  labels?: string[]; s: Strings
  speedLabel?: string // given: a 1× / 2× / 0.5× button after Play (accessible name = this word + the rate); the rate carries to later chapters
  pauseAtSteps?: boolean // Play stops at the next step (Mayer's segmenting: learner-paced segments, d = 0.98)
}) {
  const still = reducedMotion()
  const [playing, setPlaying] = useState(() => shouldAutoplay(autoplay, still, held()))
  const [target, setTarget] = useState<number | null>(null)
  const [rate, setRate] = useState(() => typeof sessionStorage === 'undefined' ? 1 : storedRate(sessionStorage.getItem(RATE_KEY)))
  useEffect(() => { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(RATE_KEY, String(rate)) }, [rate])
  const [kbd, setKbd] = useState(false) // last input was a Player key
  const [tip, setTip] = useState<{ i: number; x: number; f: number } | null>(null) // step name under the pointer on the scrubber
  const now = useRef(t)
  now.current = t
  useEffect(() => {
    if (!playing) return
    let last = performance.now(), id = 0
    const stop = playStop(events, now.current, end, pauseAtSteps)
    const frame = (ms: number) => {
      const next = advance(now.current, (ms - last) / 1000, speed * rate, stop)
      last = ms
      setT(next)
      if (next >= stop) setPlaying(false)
      else id = requestAnimationFrame(frame)
    }
    id = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(id)
  }, [playing, speed, rate, end, setT, pauseAtSteps, events])
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
  const stepAt = (x: number) => currentStep(sorted, x)
  const here = stepAt(from), atT = stepAt(t)
  const nextLabel = labels?.[here + 1]
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const k = playerKey(e.key, (e.target as HTMLElement).classList?.contains('scrub'))
    if (!k) return
    e.preventDefault()
    setKbd(true) // keyboard actions repeat often: no pops or morphs for them (Emil Kowalski: never animate keyboard-initiated actions)
    e.stopPropagation() // inside the Player, ← / → step the scenario; the page's chapter arrows must not also fire
    if (k === 'toggle') toggle()
    else if (k === 'replay') replay()
    else if (k === 'back') step(-1, true)
    else if (k === 'next') step(1, true)
    else if (k === 'slower' || k === 'faster') { if (speedLabel) setRate((r) => shiftRate(r, k === 'faster' ? 1 : -1)) }
    else go(k === 'start' ? 0 : end, true)
  }
  // aria-disabled, not disabled: a disabled button drops keyboard focus to <body> and the Player keys stop.
  const atFirst = from <= Math.min(...events) + 1e-9, atLast = from >= Math.max(...events) - 1e-9
  return (
    <div className="stepper" role="group" aria-label={s.player.label} onKeyDown={onKey} onPointerDown={() => setKbd(false)} data-kbd={kbd || undefined} style={UI_STYLE}>
      <button type="button" onClick={(e) => { if (!atFirst) step(-1, still || fromKeyboard(e)) }} aria-disabled={atFirst}>← {s.back}</button>
      <button type="button" disabled={still} aria-pressed={playing} onClick={toggle}>
        {atEnd && !playing && !still
          ? <svg className="pp is-replay" viewBox="0 0 10 10" aria-hidden="true"><path d={REPLAY_D} /></svg>
          : <svg className="pp" viewBox="0 0 10 10" aria-hidden="true"><path d={playing ? PAUSE_D : PLAY_D} /></svg>}{playing ? s.player.pause : s.player.play}
      </button>
      {speedLabel && !still && (
        <button type="button" className="rate" aria-label={`${speedLabel} ${rate}×`}
          onClick={() => setRate((r) => nextRate(r))}>
          <span key={rate}>{rate}×</span>
        </button>
      )}
      <button type="button" onClick={(e) => { if (!atLast) step(1, still || fromKeyboard(e)) }} aria-disabled={atLast}>
        {s.next}{nextLabel && <span className="wide">: {nextLabel}</span>} →
      </button>
      <span className="scrub-wrap">
        <input className="scrub squish-range" type="range" min={0} max={end} step={end / 200} value={t} aria-label={s.player.scrub}
          aria-valuetext={labels?.[atT] && `${atT + 1}/${labels.length} ${labels[atT]}`}
          style={{ backgroundImage: scrubTrack(events, t, end) }}
          onPointerMove={labels && ((e) => {
            const r = e.currentTarget.getBoundingClientRect(), f = scrubFrac(e.clientX - r.left, r.width)
            setTip({ i: stepAt(f * end), x: e.currentTarget.offsetLeft + SCRUB_THUMB_PX / 2 + (r.width - SCRUB_THUMB_PX) * f, f })
          })}
          onPointerLeave={() => setTip(null)}
          onChange={(e) => { setPlaying(false); setTarget(null); setT(Number(e.target.value)) }} />
        {tip && labels?.[tip.i] && <span className="scrub-tip" aria-hidden="true" style={{ left: tip.x, '--f': tip.f } as CSSProperties} key={tip.i}>{labels[tip.i]}</span>}
      </span>
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
        <kbd>Space</kbd> {s.player.play} · <kbd>←</kbd><kbd>→</kbd> {s.back} / {s.next} · <kbd>R</kbd> ↺{speedLabel && !still && <> · <kbd>&lt;</kbd><kbd>&gt;</kbd> {speedLabel}</>}
      </span>
    </div>
  )
}
