import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { LIDAR, NAV2 } from '../../content/world'
import { CHECK_MS, DEFAULT } from './params'
import { MAX_ACC, WHEEL_R, WHEEL_SEP } from './drive'

/**
 * Level 1-2 numbers cite TF-Transform-Explorer by file:line. With TFE_REPO=<a clone of it>, read each cited line at
 * origin/main and check the number the page uses is the number on that line. Skipped without TFE_REPO.
 */
const REPO = process.env.TFE_REPO
const show = (file: string) => spawnSync('git', ['-C', REPO!, 'show', `origin/main:${file}`], { encoding: 'utf8' }).stdout.split('\n')
const XACRO = 'description/turtlebot3_burger.urdf.xacro', DET = 'src/tf_anomaly_detector.cpp'

const CITES: [string, number, RegExp, number][] = [
  [DET, 11, /declare_parameter\("max_position_jump", ([\d.]+)\)/, DEFAULT],
  [DET, 26, /milliseconds\((\d+)\)/, CHECK_MS],
  [XACRO, 146, /<wheel_separation>([\d.]+)</, WHEEL_SEP],
  [XACRO, 147, /<wheel_radius>([\d.]+)</, WHEEL_R],
  [XACRO, 149, /<max_linear_acceleration>([\d.]+)</, MAX_ACC],
  [XACRO, 168, /<update_rate>(\d+)</, LIDAR.hz],
  [XACRO, 174, /<samples>(\d+)</, LIDAR.samples],
  [XACRO, 176, /<min_angle>([-\d.]+)</, LIDAR.minAngle],
  [XACRO, 177, /<max_angle>([-\d.]+)</, LIDAR.maxAngle],
  ['config/nav2_params.yaml', 39, /max_vel_x: ([\d.]+)/, NAV2.maxVelX],
]

describe.skipIf(!REPO)('Level 1-2 numbers == TF-Transform-Explorer cited lines (origin/main)', () => {
  it.each(CITES)('%s:%i', (file, line, re, used) => {
    const m = show(file)[line - 1]?.match(re)
    expect(m, `${file}:${line} does not match ${re}`).toBeTruthy()
    expect(Number(m![1])).toBe(used)
  })
})
