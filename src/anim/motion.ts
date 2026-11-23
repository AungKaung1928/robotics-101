import { easeInOut } from '../lib/timeline'

/** Glide length for a Step: long enough to see the change happen, short enough not to wait for it (ms). */
export const GLIDE_MS = 420

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
