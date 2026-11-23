import { easeInOut } from '../lib/timeline'

/** Glide length for a Step: long enough to see the change happen, inside the 300 ms UI limit (ms). */
export const GLIDE_MS = 300

/** Playhead `elapsed` ms into a glide from `from` to `to` lasting `dur` ms; lands exactly on `to`. */
export function glide(from: number, to: number, elapsed: number, dur = GLIDE_MS): number {
  if (dur <= 0 || elapsed >= dur) return to
  return from + (to - from) * easeInOut(elapsed / dur)
}

export type PlayerKey = 'toggle' | 'replay' | 'back' | 'next' | 'start' | 'end' | null

/**
 * Keyboard map of the Player group: Space / k play-pause, r replay from 0, ← / → step by event, Home / End jump.
 * On the scrubber the arrows and Home/End stay the range input's own (fine scrubbing), so they map to null there.
 */
export function playerKey(key: string, onScrubber: boolean): PlayerKey {
  if (key === ' ' || key === 'k') return 'toggle'
  if (key === 'r' || key === 'R') return 'replay'
  if (onScrubber) return null
  if (key === 'ArrowLeft') return 'back'
  if (key === 'ArrowRight') return 'next'
  if (key === 'Home') return 'start'
  if (key === 'End') return 'end'
  return null
}

/** Index of the step the playhead is on: the last event at or before `t` (events sorted ascending), -1 before the first. */
export function currentStep(events: number[], t: number): number {
  let i = -1
  for (let k = 0; k < events.length; k++) if (events[k] <= t + 1e-9) i = k
  return i
}

/** Session key set when the reader pauses a scenario: later chapters then open paused (ciechanow.ski "globally pause"). */
export const HOLD_KEY = 'r101-hold'

/** Whether a chapter should start playing: it asks to, motion is allowed, and the reader has not paused this session. */
export function shouldAutoplay(asked: boolean, still: boolean, held: boolean): boolean {
  return asked && !still && !held
}

/** A click that came from the keyboard (Enter / Space on a focused button): browsers report it with detail 0. */
export const fromKeyboard = (e: { detail: number }) => e.detail === 0

/** Where Play stops: the end, or with pauseAtSteps the next step after t (the end when no step is left). */
export function playStop(events: number[], t: number, end: number, pauseAtSteps: boolean): number {
  if (!pauseAtSteps) return end
  const next = [...events].sort((a, b) => a - b).find((e) => e > t + 1e-9)
  return next === undefined ? end : Math.min(next, end)
}

/** Thumb diameter of .squish-range (range.css); the thumb centre travels from THUMB/2 to width - THUMB/2. */
export const SCRUB_THUMB_PX = 22

/**
 * Scrubber track as one CSS gradient: played part filled, the rest plain, a 3 px transparent gap at every step event
 * inside (0, end), like chapter markers on a video progress bar, so the segments are seen before Play. Gaps show the
 * page behind (any theme). Positions follow the thumb centre (THUMB/2 + (100% - THUMB) * f), so the thumb sits exactly
 * on a gap when t is at that event.
 */
export function scrubTrack(events: number[], t: number, end: number): string {
  const at = (f: number) => `calc(${SCRUB_THUMB_PX / 2}px + (100% - ${SCRUB_THUMB_PX}px) * ${+f.toFixed(4)})`
  const f = end > 0 ? Math.min(1, Math.max(0, t / end)) : 0
  const gaps = [...new Set(events)].filter((e) => e > 1e-9 && e < end - 1e-9).map((e) => e / end).sort((a, b) => a - b)
  const stops: string[] = []
  const seg = (a: number, b: number, to: string) => {
    if (f > a && f < b) stops.push(`var(--robot) 0 ${at(f)}`)
    stops.push(`${b <= f ? 'var(--robot)' : 'var(--rule)'} 0 ${to}`)
  }
  let prev = 0
  for (const g of gaps) { seg(prev, g, `calc(${at(g)} - 1.5px)`); stops.push(`transparent 0 calc(${at(g)} + 1.5px)`); prev = g }
  seg(prev, 1, '100%')
  return `linear-gradient(to right, ${stops.join(', ')})`
}
