import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { BRAKE } from './act'
import { TOP_SPEED, WHEEL_GAP_M, WHEEL_RADIUS_M } from './move'
import { BEAMS, MAX_M, MIN_M, TURNS_PER_S } from './sense'

/**
 * The new Level 0 pages rest on lines of TF-Transform-Explorer. With TFE_REPO=<a clone>, read each line at origin/main
 * and check it still says what the page uses. Skipped without TFE_REPO. (0.22 m/s is the ROBOTIS e-Manual, not the repo.)
 */
const REPO = process.env.TFE_REPO
const show = (file: string) => spawnSync('git', ['-C', REPO!, 'show', `origin/main:${file}`], { encoding: 'utf8' }).stdout.split('\n')
const X = 'description/turtlebot3_burger.urdf.xacro', N = 'config/nav2_params.yaml'

const NUMBERS: [string, number, RegExp, number, string][] = [
  [X, 146, /<wheel_separation>([\d.]+)</, WHEEL_GAP_M, 'move: wheels 16 cm apart'],
  [X, 147, /<wheel_radius>([\d.]+)</, WHEEL_RADIUS_M, 'move: 6.6 cm wheel'],
  [X, 168, /<update_rate>(\d+)</, TURNS_PER_S, 'sense: 5 turns a second'],
  [X, 174, /<samples>(\d+)</, BEAMS, 'sense: 360 per turn'],
  [X, 181, /<min>([\d.]+)</, MIN_M, 'sense: 12 cm minimum'],
  [X, 182, /<max>([\d.]+)</, MAX_M, 'sense: 3.5 m maximum'],
  [X, 16, /<origin xyz="0\.0 0\.0 ([\d.]+)"/, 0.01, 'meet: body 1 cm above the floor'],
  [X, 118, /<origin xyz="[-\d.]+ 0 ([\d.]+)"/, 0.172, 'meet: sensor 0.172 m above the body'],
  [N, 45, /acc_lim_x: ([\d.]+)/, BRAKE, 'act: speed-up limit'],
  [N, 48, /decel_lim_x: (-[\d.]+)/, -BRAKE, 'act: brake limit'],
]
const PARTS: [string, number, string, string][] = [
  [X, 90, '<joint name="caster_back_joint"', 'move: the free-rolling ball at the back'],
  [X, 108, '<joint name="imu_joint"', 'sense: a sensor that feels the robot turning'],
]

describe.skipIf(!REPO)('Level 0 numbers and parts == TF-Transform-Explorer lines (origin/main)', () => {
  it.each(NUMBERS)('%s:%i %s', (file, line, re, used) => {
    const m = show(file)[line - 1]?.match(re)
    expect(m, `${file}:${line} does not match ${re}`).toBeTruthy()
    expect(Number(m![1])).toBe(used)
  })
  it.each(PARTS)('%s:%i %s', (file, line, needle) => expect(show(file)[line - 1]).toContain(needle))
  it('0.22 m/s (e-Manual) is under his Nav2 max_vel_x, so the Level 0 top speed never exceeds what his robot drives', () => {
    const v = Number(show(N)[38].match(/max_vel_x: ([\d.]+)/)![1])
    expect(TOP_SPEED).toBeLessThanOrEqual(v)
  })
})
