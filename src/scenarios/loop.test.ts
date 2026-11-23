import { describe, expect, it } from 'vitest'
import { LIDAR, NAV2 } from '../content/world'
import { loopAt, senseThinkAct } from './loop'

const HZ = LIDAR.hz, V = NAV2.maxVelX // 5 Hz scans, 0.26 m/s
const run = () => senseThinkAct(2, 0, V, HZ, 0.5)

describe('senseThinkAct', () => {
  it('goes until the sensed distance is at or under the stop distance, then stops once', () => {
    const k = run()
    expect(k.slice(0, -1).every((x) => x.go)).toBe(true)
    expect(k[k.length - 1].go).toBe(false)
    expect(k[k.length - 1].d).toBeLessThanOrEqual(0.5)
  })
  it('his numbers: 0.052 m driven blind per scan, so it stops 0 … 5.2 cm past the line, after 30 scans', () => {
    const k = run(), last = k[k.length - 1]
    expect(V / HZ).toBeCloseTo(0.052, 12)
    expect(0.5 - last.d).toBeGreaterThanOrEqual(-1e-12)
    expect(0.5 - last.d).toBeLessThan(0.052)
    expect(k).toHaveLength(Math.ceil(1.5 / 0.052) + 1)
  })
  it('a slower loop drives further blind: 1 Hz overshoots more than 5 Hz', () => {
    const at = (hz: number) => 0.5 - senseThinkAct(2, 0, V, hz, 0.5).at(-1)!.d
    expect(at(1)).toBeGreaterThan(at(HZ))
  })
})

describe('loopAt', () => {
  it('thirds of a tick are sense, think, act; position moves the whole tick; clamps at the end', () => {
    const k = run()
    expect(loopAt(k, HZ, 0).phase).toBe('sense')
    expect(loopAt(k, HZ, 0.1).phase).toBe('think')
    expect(loopAt(k, HZ, 0.19).phase).toBe('act')
    expect(loopAt(k, HZ, 0.1).x).toBeCloseTo(0.026, 9)
    const end = loopAt(k, HZ, 1e6)
    expect(end.i).toBe(k.length - 1)
    expect(end.x).toBe(k.at(-1)!.x1)
  })
})
