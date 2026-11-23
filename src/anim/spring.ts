import type { CSSProperties } from 'react'

/**
 * Damped spring x'' = -k x - c x' (mass 1), closed form, for character motion: overshoot comes from the physics, not
 * from hand-made keyframes. Under-damped (c² < 4k) rings and settles; critical / over-damped never crosses 0.
 */
export type Spring = { k: number; c: number }

/** Displacement at time t (s) from x0 with velocity v0, relaxing towards 0. */
export function springAt(t: number, s: Spring, x0: number, v0 = 0): number {
  const w0 = Math.sqrt(s.k), z = s.c / (2 * w0)
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z)
    return Math.exp(-z * w0 * t) * (x0 * Math.cos(wd * t) + ((v0 + z * w0 * x0) / wd) * Math.sin(wd * t))
  }
  if (z === 1) return Math.exp(-w0 * t) * (x0 + (v0 + w0 * x0) * t)
  const r1 = -w0 * (z - Math.sqrt(z * z - 1)), r2 = -w0 * (z + Math.sqrt(z * z - 1))
  const b = (v0 - r1 * x0) / (r2 - r1)
  return (x0 - b) * Math.exp(r1 * t) + b * Math.exp(r2 * t)
}

/** Time after which the spring stays within `eps` of rest (envelope bound, so it may end a little late, never early). */
export function settleTime(s: Spring, x0: number, v0 = 0, eps = 0.01): number {
  const w0 = Math.sqrt(s.k), z = s.c / (2 * w0)
  const decay = z < 1 ? z * w0 : w0 * (z - Math.sqrt(z * z - 1))
  const amp = Math.abs(x0) + Math.abs(v0) / (z < 1 ? w0 * Math.sqrt(1 - z * z) : w0) + Math.abs(x0) * z
  return amp <= eps ? 0 : Math.log(amp / eps) / decay
}

/** Springs the mascot uses (k, c per unit mass): bouncy landing, wobble, and a calm settle. */
export const BOUNCY: Spring = { k: 400, c: 14 } // ζ = 0.35: two visible overshoots
export const WOBBLE: Spring = { k: 260, c: 8 } // ζ ≈ 0.25: a few rocking swings

/**
 * The spring as a CSS easing: `linear(...)` sampled from 0 → 1 (progress = 1 − displacement from a unit start), plus
 * the duration in ms it needs. CSS transitions then move with the same physics as the JS character motion.
 */
export function springEasing(s: Spring, samples = 40): { easing: string; ms: number } {
  const T = settleTime(s, 1, 0, 0.002)
  const pts = Array.from({ length: samples + 1 }, (_, i) => (i === samples ? 1 : 1 - springAt((i / samples) * T, s, 1)))
  return { easing: `linear(${pts.map((p) => +p.toFixed(4)).join(', ')})`, ms: Math.round(T * 1000) }
}

/** Button release: snappy and a single visible overshoot. */
export const PRESS: Spring = { k: 900, c: 30 } // ζ = 0.5

/** The PRESS spring as CSS variables (--spring easing, --spring-ms) for any transition that should move like it. */
const PRESS_EASE = springEasing(PRESS)
export const PRESS_STYLE = { '--spring': PRESS_EASE.easing, '--spring-ms': `${PRESS_EASE.ms}ms` } as CSSProperties

/**
 * A spring from how long it looks and how bouncy it is (Motion's spring options; motion-dom 14.14.0
 * animation/generators/spring.mjs:28-30, 173-179, bounce ≥ 0 only): ζ = 1 − bounce, ω₀ = 2π / (1.2 · visualDuration).
 */
export function springFrom(visualDuration: number, bounce: number): Spring {
  const z = Math.max(1 - Math.min(Math.max(bounce, 0), 1), 0.05), w0 = (2 * Math.PI) / (visualDuration * 1.2)
  return { k: w0 * w0, c: 2 * z * w0 }
}

const PULSE_V = 2 // scale units / s at the hit

/** Scale of a node `t` s after a message lands on it: a quick swell (≈ 4 %) that springs back; 1 before and after. */
export function arrivalScale(t: number): number {
  return t <= 0 ? 1 : 1 + springAt(t, PRESS, 0, PULSE_V)
}
export const PULSE_S = settleTime(PRESS, 0, PULSE_V, 0.002)

/** For marks that carry data (a threshold line, a bar): no bounce, so the mark never shows a value that is not true. */
export const CALM: Spring = springFrom(0.25, 0)

/** UI controls (buttons, step dots): quick and nearly flat, bounce 0.2 (≈ 1.5 % overshoot), Emil Kowalski's 0.1-0.3. */
export const UI: Spring = springFrom(0.15, 0.2)
const UI_EASE = springEasing(UI)
export const UI_STYLE = { '--spring': UI_EASE.easing, '--spring-ms': `${UI_EASE.ms}ms` } as CSSProperties
