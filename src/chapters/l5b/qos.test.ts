import { describe, expect, it } from 'vitest'
import { DEFAULT_QOS, N, challengeOk, connected, durOk, fates, lateJoinerGets, received, relOk, type Qos } from './qos'

const BE: Qos = { rel: 'best_effort', dur: 'volatile' }
const TL: Qos = { rel: 'reliable', dur: 'transient_local' }

describe('5.4 QoS', () => {
  it('reliability table (Jazzy docs): only best effort -> reliable fails', () => {
    expect(relOk('best_effort', 'best_effort')).toBe(true)
    expect(relOk('best_effort', 'reliable')).toBe(false)
    expect(relOk('reliable', 'best_effort')).toBe(true)
    expect(relOk('reliable', 'reliable')).toBe(true)
  })
  it('durability table: only volatile -> transient local fails', () => {
    expect(durOk('volatile', 'transient_local')).toBe(false)
    expect(durOk('transient_local', 'volatile')).toBe(true)
  })
  it('defaults talk: reliable pair resends the 5 dropped scans, all 20 arrive', () => {
    expect(received(DEFAULT_QOS, DEFAULT_QOS)).toBe(N)
    expect(fates(DEFAULT_QOS, DEFAULT_QOS).filter((f) => f === 'resent')).toHaveLength(5)
  })
  it('best effort subscriber on a reliable publisher: connects, loses 25 %', () => expect(received(DEFAULT_QOS, BE)).toBe(15))
  it('break it: best effort publisher + reliable subscriber = nothing at all', () => {
    expect(connected(BE, DEFAULT_QOS)).toBe(false)
    expect(received(BE, DEFAULT_QOS)).toBe(0)
  })
  it('late joiner gets the map only with transient local on both ends, at most depth of them', () => {
    expect(lateJoinerGets(DEFAULT_QOS, DEFAULT_QOS, 10)).toBe(0)
    expect(lateJoinerGets(TL, DEFAULT_QOS, 10)).toBe(0)
    expect(lateJoinerGets(DEFAULT_QOS, TL, 10)).toBe(0) // volatile pub + TL sub: not even connected
    expect(lateJoinerGets(TL, TL, 1)).toBe(1)
    expect(lateJoinerGets(TL, TL, 10)).toBe(3)
    expect(challengeOk(TL, TL, 1)).toBe(true)
    expect(challengeOk(TL, TL, 10)).toBe(false) // gets all 3 old maps: only the newest is wanted (Nav2 map_server keeps 1)
    expect(challengeOk(DEFAULT_QOS, DEFAULT_QOS, 1)).toBe(false)
  })
})

describe('5.4 strings', () => {
  it('EN and JA have the same keys and list lengths', async () => {
    const { QOS_STRINGS: S } = await import('./qos.strings')
    expect(Object.keys(S.ja).sort()).toEqual(Object.keys(S.en).sort())
    expect(S.ja.lines).toHaveLength(S.en.lines.length)
    expect(S.ja.glossary).toHaveLength(S.en.glossary.length)
  })
})
