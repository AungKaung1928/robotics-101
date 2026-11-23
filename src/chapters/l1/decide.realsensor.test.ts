import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { LIDAR } from '../../content/world'
import { decide, run } from './decide'
import { DECIDE_STRINGS } from './decide.strings'

/** 1.1 "real sensor" line. Facts: REP 117 (Final): too close = -Inf; gz-sensors8 GpuLidarSensor.cc:201-202 masks
 * out-of-range to +/- inf (Gazebo Harmonic, which TF-Transform-Explorer uses). The scanner sits 0.070 m behind the
 * robot's front in TF-Transform-Explorer's xacro (base_scan x = -0.032 at :118; body box origin -0.032, 0.140 long at :28-29). */
const SCANNER_BEHIND_FRONT_M = 0.07
const reading = (front: number) => (front + SCANNER_BEHIND_FRONT_M < LIDAR.minRange ? -Infinity : front)

describe('1.1 on the real sensor (too close = -inf)', () => {
  it('with stop_at = 0 the page model never stops, a -inf reading does: first such check is 2.4 cm out', () => {
    const fronts = run(0).ticks.map((k) => k.distance)
    expect(run(0).crashed).toBe(true)
    const first = fronts.find((d) => reading(d) === -Infinity)!
    expect(Math.round(first * 1000) / 10).toBe(2.4)
    expect(decide(reading(first), 0)).toBe('stop')
    for (const l of ['en', 'ja'] as const) {
      expect(DECIDE_STRINGS[l].realSensor).toContain(`${Math.round(first * 1000) / 10} cm`)
      expect(DECIDE_STRINGS[l].realSensor).toContain(`${Math.round(LIDAR.minRange * 100)} cm`)
      expect(DECIDE_STRINGS[l].realSensor).toContain('REP 117')
    }
  })
  it.skipIf(spawnSync('python3', ['--version']).status !== 0)('Python: -inf < 0.0 is True', () => {
    expect(spawnSync('python3', ['-c', "print(float('-inf') < 0.0)"], { encoding: 'utf8' }).stdout.trim()).toBe('True')
  })
  const REPO = process.env.TFE_REPO
  it.skipIf(!REPO)('scanner 0.070 m behind the front (TF-Transform-Explorer xacro, origin/main)', () => {
    const x = spawnSync('git', ['-C', REPO!, 'show', 'origin/main:description/turtlebot3_burger.urdf.xacro'], { encoding: 'utf8' }).stdout.split('\n')
    const scanX = Number(x[117].match(/<origin xyz="([-\d.]+) /)![1])
    const boxX = Number(x[27].match(/<origin xyz="([-\d.]+) /)![1])
    const boxL = Number(x[28].match(/<box size="([\d.]+) /)![1])
    expect(Math.round((boxX + boxL / 2 - scanX) * 1000) / 1000).toBe(SCANNER_BEHIND_FRONT_M)
  })
})
