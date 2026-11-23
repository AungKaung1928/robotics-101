import { easeInOut } from '../lib/timeline'

/** Glide length for a Step: long enough to see the change happen, inside the 300 ms UI limit (ms). */
export const GLIDE_MS = 300

/** Playhead `elapsed` ms into a glide from `from` to `to` lasting `dur` ms; lands exactly on `to`. */
export function glide(from: number, to: number, elapsed: number, dur = GLIDE_MS): number {
  if (dur <= 0 || elapsed >= dur) return to
  return from + (to - from) * easeInOut(elapsed / dur)
}

export type PlayerKey = 'toggle' | 'replay' | 'back' | 'next' | 'start' | 'end' | 'slower' | 'faster' | null

/**
 * Keyboard map of the Player group: Space / k play-pause, r replay from 0, ← / → step by event, Home / End jump,
 * < / > slower / faster (video players' Shift+, / Shift+.).
 * On the scrubber the arrows and Home/End stay the range input's own (fine scrubbing), so they map to null there.
 */
export function playerKey(key: string, onScrubber: boolean): PlayerKey {
  if (key === ' ' || key === 'k') return 'toggle'
  if (key === 'r' || key === 'R') return 'replay'
  if (key === '<') return 'slower'
  if (key === '>') return 'faster'
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

/** Most step gaps the scrubber draws; with more events it shows the plain fill. */
export const SCRUB_MAX_GAPS = 12
/** Shortest segment (share of the bar) that still gets its gaps; any shorter one and the bar shows the plain fill. */
export const SCRUB_MIN_PART = 0.075 // just under 1/13: 12 equal inner steps (13 parts) still get their gaps, like SCRUB_MAX_GAPS

/** Thumb diameter of .squish-range (range.css); the thumb centre travels from THUMB/2 to width - THUMB/2. */
export const SCRUB_THUMB_PX = 22

/**
 * Scrubber track as one CSS gradient: played part filled, the rest in --scrub-rest (player.css), a 3 px transparent gap at every step event
 * inside (0, end), like chapter markers on a video progress bar, so the segments are seen before Play. Gaps show the
 * page behind (any theme). Positions follow the thumb centre (THUMB/2 + (100% - THUMB) * f), so the thumb sits exactly
 * on a gap when t is at that event.
 */
export function scrubTrack(events: number[], t: number, end: number): string {
  const at = (f: number) => `calc(${SCRUB_THUMB_PX / 2}px + (100% - ${SCRUB_THUMB_PX}px) * ${+f.toFixed(4)})`
  const f = end > 0 ? Math.min(1, Math.max(0, t / end)) : 0
  const inner = [...new Set(events)].filter((e) => e > 1e-9 && e < end - 1e-9).map((e) => e / end).sort((a, b) => a - b)
  // segments help only when there are few and none is tiny (a story in parts): one event per sensor check (think: 30) or
  // a cluster of close steps (msgtypes, nodes) would read as a dashed line, not as parts
  const edges = [0, ...inner, 1], minPart = Math.min(...edges.slice(1).map((e, i) => e - edges[i]))
  const gaps = inner.length <= SCRUB_MAX_GAPS && minPart >= SCRUB_MIN_PART ? inner : []
  const stops: string[] = []
  const seg = (a: number, b: number, to: string) => {
    if (f > a && f < b) stops.push(`var(--robot) 0 ${at(f)}`)
    stops.push(`${b <= f ? 'var(--robot)' : 'var(--scrub-rest)'} 0 ${to}`)
  }
  let prev = 0
  for (const g of gaps) { seg(prev, g, `calc(${at(g)} - 1.5px)`); stops.push(`transparent 0 calc(${at(g)} + 1.5px)`); prev = g }
  seg(prev, 1, '100%')
  return `linear-gradient(to right, ${stops.join(', ')})`
}

/** Track fraction under a pointer x (px from the input's left edge) on the thumb-centre scale of scrubTrack, clamped. */
export function scrubFrac(x: number, width: number): number {
  const span = width - SCRUB_THUMB_PX
  return span > 0 ? Math.min(1, Math.max(0, (x - SCRUB_THUMB_PX / 2) / span)) : 0
}

// Play triangle and pause bars as the same two 4-corner shapes (left half, right half), so CSS morphs one into the other.
export const PLAY_D = 'M2 1L5.5 3L5.5 7L2 9ZM5.5 3L9 5L9 5L5.5 7Z'
// At the end Play restarts from 0, so the icon becomes a replay arrow (video players' end state): three-quarter circle + chevron.
export const REPLAY_D = 'M8.5 5A3.5 3.5 0 1 1 5 1.5M3.6 0.2L5 1.5L3.6 2.8'
export const PAUSE_D = 'M2 1L4 1L4 9L2 9ZM6 1L8 1L8 9L6 9Z'

/** Playback rates the speed button cycles through (protocol-explorer reference: a speed select next to Play). */
export const RATES = [1, 2, 0.5] as const
export const RATE_KEY = 'r101-rate'
/** Next rate in the cycle; an unknown rate starts the cycle again at 1×. */
export function nextRate(rate: number): number {
  const i = RATES.indexOf(rate as (typeof RATES)[number])
  return RATES[(i + 1) % RATES.length]
}
/** Stored rate if it is one of RATES, else 1 (the reader's choice carries to later chapters, like the pause hold). */
export function storedRate(raw: string | null): number {
  const r = Number(raw)
  return (RATES as readonly number[]).includes(r) ? r : 1
}
/** One rate step slower (dir -1) or faster (dir 1) in 0.5 < 1 < 2 order, held at the ends. */
export function shiftRate(rate: number, dir: -1 | 1): number {
  const up = [...RATES].sort((a, b) => a - b), i = up.indexOf(rate as (typeof RATES)[number])
  return i < 0 ? 1 : up[Math.min(up.length - 1, Math.max(0, i + dir))]
}
