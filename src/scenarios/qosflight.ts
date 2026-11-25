import { N, type Fate } from '../chapters/l5b/qos'

/**
 * Chapter 5.4 scene: each scan k leaves the publisher at k * GAP and crosses the link in TRAVEL (slow motion; the
 * model's real rate is 10 Hz). Its fate comes from qos.fates(): ok arrives, lost drops halfway and is gone,
 * resent drops halfway and a copy is sent again RESEND later (reliable), none stops at the gate (no connection).
 */
export const GAP = 0.4, TRAVEL = 1, RESEND = 0.6, FADE = 0.3, GATE = 0.3
const DROP = 0.5 // the wire loses a sample at half way
export const END = (N - 1) * GAP + DROP * TRAVEL + RESEND + TRAVEL

export type Phase = 'queued' | 'fly' | 'drop' | 'resend' | 'blocked' | 'arrived' | 'gone'
export interface Flight { y: number; phase: Phase; o: number } // y: 0 publisher row .. 1 subscriber row; o: opacity

export function flight(k: number, fate: Fate, t: number): Flight {
  const t0 = k * GAP, p = (t - t0 + 1e-9) / TRAVEL
  if (p < 0) return { y: 0, phase: 'queued', o: 0 }
  if (fate === 'ok') return p >= 1 ? { y: 1, phase: 'arrived', o: 1 } : { y: p, phase: 'fly', o: 1 }
  const stop = fate === 'none' ? GATE : DROP
  if (p < stop) return { y: p, phase: 'fly', o: 1 }
  const since = t - (t0 + stop * TRAVEL) + 1e-9
  if (fate === 'resent' && since >= RESEND) {
    const q = (since - RESEND) / TRAVEL
    return q >= 1 ? { y: 1, phase: 'arrived', o: 1 } : { y: q, phase: 'resend', o: 1 }
  }
  if (since < FADE) return { y: stop, phase: fate === 'none' ? 'blocked' : 'drop', o: 1 - since / FADE }
  return { y: stop, phase: fate === 'resent' ? 'drop' : 'gone', o: 0 }
}

/** Scans that reached the subscriber by time t. At END this equals qos.received(). */
export const arrivedBy = (fs: Fate[], t: number) => fs.filter((f, k) => flight(k, f, t).phase === 'arrived').length
export const sentBy = (t: number) => Math.max(0, Math.min(N, Math.floor(t / GAP) + 1))
/** Player steps: start, the first loss on the wire (scan 3), the end. */
export const EVENTS = [0, 3 * GAP + DROP * TRAVEL, END]
