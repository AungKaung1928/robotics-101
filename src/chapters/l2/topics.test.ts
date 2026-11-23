import { describe, expect, it } from 'vitest'
import { DURATION_MS, TRAVEL_MS, TOPICS, challengeOk, received, resolve, scenario, subs } from './topics'

describe('2.2 topics', () => {
  it('rates come from the config: /scan 5 Hz (measured 4.5–4.8), /cmd_vel 20 Hz (measured 20.0)', () => {
    expect(TOPICS.map((t) => [t.name, t.hz, t.measuredHz])).toEqual([['/scan', 5, '4.5–4.8'], ['/cmd_vel', 20, '20.0']])
  })

  it('name resolution: relative, absolute, private, invalid', () => {
    expect(resolve('scan', 'my_node')).toBe('/scan')
    expect(resolve('/scan', 'my_node')).toBe('/scan')
    expect(resolve('~/scan', 'my_node')).toBe('/my_node/scan')
    expect(resolve('1scan', 'my_node')).toBeNull()
    expect(resolve('', 'my_node')).toBeNull()
    expect(resolve('sc an', 'my_node')).toBeNull()
    expect(resolve('_scan', 'my_node')).toBeNull()
    expect(resolve('my__scan', 'my_node')).toBeNull()
  })

  it('every matching subscriber gets every message; a wrong name gets 0 and no error', () => {
    const ss = subs('/laser_scan', 'scan')
    const by = Object.fromEntries(ss.map((s) => [s.node, received(s, 1)]))
    expect(by).toEqual({ slam_toolbox: 0, nav2: 6, rviz2: 6, my_node: 6, ros_gz_bridge: 21 })
  })

  it('challenge: scan and /scan work, ~/scan and typos do not', () => {
    expect(['scan', '/scan'].every(challengeOk)).toBe(true)
    expect(['~/scan', '/Scan', '/scan_', 'laser'].some(challengeOk)).toBe(false)
  })

  it('scenario: dots move forward, received counts match the publisher minus dots still on the wire', () => {
    const sc = scenario('/scan', '/scan')
    const end = sc.frame(DURATION_MS)
    const onWire = (n: string) => end.dots.filter((d) => d.node === n).length
    expect(end.counts.nav2 + onWire('nav2')).toBe(received({ node: 'nav2', topic: '/scan' }, DURATION_MS / 1000))
    expect(end.dots.every((d) => d.p >= 0 && d.p < 1)).toBe(true)
    expect(sc.frame(TRAVEL_MS - 1).counts.nav2).toBe(0)
    expect(sc.frame(TRAVEL_MS).counts.nav2).toBe(1)
    expect(scenario('/laser_scan', 'x').frame(DURATION_MS).counts.slam_toolbox).toBe(0)
    expect(sc.frame(1234)).toEqual(sc.frame(1234))
  })
})

describe('2.2 strings', () => {
  it('EN and JA have the same keys and list lengths', async () => {
    const { TOPICS_STRINGS: S } = await import('./topics.strings')
    expect(Object.keys(S.ja).sort()).toEqual(Object.keys(S.en).sort())
    expect(S.ja.lines).toHaveLength(S.en.lines.length)
    expect(S.ja.glossary).toHaveLength(S.en.glossary.length)
  })
})
