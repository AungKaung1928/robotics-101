import { describe, expect, it } from 'vitest'
import { qosReaction } from './qosmood'
import { DEFAULT_DEPTH, DEFAULT_QOS, challengeOk, connected, type Qos } from '../chapters/l5b/qos'

const view = (pub: Qos, sub: Qos) => ({ ok: challengeOk(pub, sub, DEFAULT_DEPTH), linked: connected(pub, sub) })
const TL: Qos = { ...DEFAULT_QOS, dur: 'transient_local' }
const BE: Qos = { ...DEFAULT_QOS, rel: 'best_effort' }

describe('5.4 mascot reaction from the QoS model', () => {
  it('cheers when both sides switch to transient local (late joiner gets the map)', () => {
    expect(qosReaction(view(TL, DEFAULT_QOS), view(TL, TL))).toBe('cheer')
  })
  it('wobbles when a reliable subscriber meets a best-effort publisher (link breaks silently)', () => {
    expect(connected(BE, DEFAULT_QOS)).toBe(false)
    expect(qosReaction(view(DEFAULT_QOS, DEFAULT_QOS), view(BE, DEFAULT_QOS))).toBe('oops')
  })
  it('stays still on a change that alters neither verdict', () => {
    expect(qosReaction(view(DEFAULT_QOS, DEFAULT_QOS), view(DEFAULT_QOS, BE))).toBeNull()
  })
})
