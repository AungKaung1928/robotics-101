import { describe, expect, it } from 'vitest'
import { NODES, byId, challengeOk, optional, patrols, scenario, working } from './nodes'

describe('2.1 nodes', () => {
  it('launch file start times (TimerAction periods): slam 8 s, custom nodes 9 s, nav2 10 s, rviz 12 s', () => {
    expect([byId.slam.startS, byId.patrol.startS, byId.nav2.startS, byId.rviz.startS]).toEqual([8, 9, 10, 12])
  })

  it('needs only point at listed nodes and contain no cycle (every node can work)', () => {
    for (const n of NODES) for (const d of n.needs) expect(byId[d]).toBeDefined()
    expect(working(new Set()).size).toBe(NODES.length)
    for (const n of NODES) for (const d of n.needs) expect(byId[d].y).toBeLessThan(n.y) // edges always point down
  })

  it('stopping the bridge starves everything that needs sensor data', () => {
    expect([...working(new Set(['bridge']))]).toEqual(['rsp'])
    expect(patrols(new Set(['bridge']))).toBe(false)
  })

  it('rviz2 and tf_anomaly_detector are the only nodes the patrol does not need', () => {
    expect(optional().sort()).toEqual(['anomaly', 'rviz'])
    expect(challengeOk(new Set(['anomaly', 'rviz']))).toBe(true)
    expect(challengeOk(new Set(['rviz']))).toBe(false)
    expect(challengeOk(new Set(['rviz', 'slam']))).toBe(false)
  })

  it('scenario: nothing waits on an unstarted node; at the end all run', () => {
    const sc = scenario(new Set())
    expect(sc.frame(8500).working).not.toContain('nav2')
    expect(sc.frame(9500).working).not.toContain('patrol') // patrol starts at 9 s but Nav2 only at 10 s
    expect(sc.frame(sc.durationMs).working).toHaveLength(NODES.length)
    expect(sc.frame(5000)).toEqual(sc.frame(5000))
  })
})

describe('2.1 strings', () => {
  it('EN and JA have the same keys; every node has a job line in both', async () => {
    const { NODES_STRINGS: S } = await import('./nodes.strings')
    expect(Object.keys(S.ja).sort()).toEqual(Object.keys(S.en).sort())
    for (const n of NODES) { expect(S.en.jobs[n.id]).toBeTruthy(); expect(S.ja.jobs[n.id]).toBeTruthy() }
    expect(S.ja.lines).toHaveLength(S.en.lines.length)
  })
})
