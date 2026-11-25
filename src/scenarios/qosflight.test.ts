import { describe, expect, it } from 'vitest'
import { DEFAULT_QOS, N, fates, received, type Qos } from '../chapters/l5b/qos'
import { END, EVENTS, GAP, arrivedBy, flight, sentBy } from './qosflight'

const all: Qos[] = (['reliable', 'best_effort'] as const).flatMap((rel) => (['volatile', 'transient_local'] as const).map((dur) => ({ rel, dur })))

describe('qos flight timeline', () => {
  it('end frame equals the model for all 16 QoS pairs', () => {
    for (const p of all) for (const s of all) expect(arrivedBy(fates(p, s), END)).toBe(received(p, s))
  })
  it('nothing has arrived at t=0 and the count never goes down', () => {
    const fs = fates(DEFAULT_QOS, DEFAULT_QOS)
    expect(arrivedBy(fs, 0)).toBe(0)
    let last = 0
    for (let t = 0; t <= END; t += 0.05) { const a = arrivedBy(fs, t); expect(a).toBeGreaterThanOrEqual(last); last = a }
  })
  it('a lost scan drops half way and is gone; a resent one arrives later than its neighbours', () => {
    expect(flight(3, 'lost', 3 * GAP + 0.5).phase).toBe('drop')
    expect(flight(3, 'lost', END).phase).toBe('gone')
    expect(flight(3, 'resent', 3 * GAP + 1).phase).not.toBe('arrived')
    expect(flight(4, 'ok', 3 * GAP + 1 + GAP).phase).toBe('arrived')
    expect(flight(3, 'resent', END).phase).toBe('arrived')
  })
  it('no connection: every scan stops at the gate, none arrive', () => {
    const fs = fates({ rel: 'best_effort', dur: 'volatile' }, DEFAULT_QOS)
    expect(fs.every((f) => f === 'none')).toBe(true)
    expect(flight(0, 'none', 0.2).phase).toBe('fly')
    expect(flight(0, 'none', 0.35).phase).toBe('blocked')
    expect(arrivedBy(fs, END)).toBe(0)
  })
  it('sent count and steps', () => {
    expect(sentBy(0)).toBe(1); expect(sentBy(END)).toBe(N)
    expect(EVENTS).toEqual([...EVENTS].sort((a, b) => a - b))
  })
})
