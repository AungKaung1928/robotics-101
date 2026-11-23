import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { LIDAR, NAV2 } from '../../content/world'
import { CHECK_MS, DEFAULT } from './params'
import { MAX_ACC, WHEEL_R, WHEEL_SEP } from './drive'
import { LIMITS } from './msgtypes'
import { NODES } from './nodes'
import { NODES_STRINGS } from './nodes.strings'
import { ACTIONS_STRINGS } from './actions.strings'

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
  ['config/nav2_params.yaml', 18, /controller_frequency: ([\d.]+)/, 20],
  ['config/nav2_params.yaml', 39, /max_vel_x: ([\d.]+)/, NAV2.maxVelX],
]

describe.skipIf(!REPO)('Level 1-2 numbers == TF-Transform-Explorer cited lines (origin/main)', () => {
  it.each(CITES)('%s:%i', (file, line, re, used) => {
    const m = show(file)[line - 1]?.match(re)
    expect(m, `${file}:${line} does not match ${re}`).toBeTruthy()
    expect(Number(m![1])).toBe(used)
  })
  it.each(NODES.map((n) => [n.name, n.lines, n.startS] as const))('2.1 %s (launch:%s) starts at %d s', (_, lines, startS) => {
    const [a, b] = lines.split('-').map(Number)
    const period = show('launch/tf_explorer.launch.py').slice(a - 1, b).join('\n').match(/period=([\d.]+)/)
    expect(period ? Number(period[1]) : 0).toBe(startS) // no TimerAction in the range = starts at launch
  })
  it('2.2 nav2 reads /scan on nav2_params.yaml:99 and :129 (local + global costmap)', () => {
    const y = show('config/nav2_params.yaml')
    for (const n of [99, 129]) expect(y[n - 1]).toMatch(/^\s*topic: \/scan\s*$/)
  })
  it('2.3 velocity limits = velocity_smoother max_velocity on nav2_params.yaml:207', () => {
    expect(show('config/nav2_params.yaml')[206]).toMatch(new RegExp(`max_velocity: \\[${LIMITS.linX}, 0\\.0, ${LIMITS.angZ.toFixed(1)}\\]`))
  })
  it('2.1 patrol goals: x and y uniform in [-1.0, 1.0] (the "2 × 2 m area" the page names)', () => {
    const hpp = show('include/tf_explorer/patrol_node.hpp')
    for (const [n, v] of [[50, 'x'], [51, 'y']] as const) expect(hpp[n - 1]).toMatch(new RegExp(`dis_${v}\\(-1\\.0, 1\\.0\\)`))
    expect(NODES_STRINGS.en.jobs.patrol).toContain('2 × 2 m')
  })
})


/** 2.4 cites ros2-patrol-project; with PATROL_REPO=<a clone>, check the retry facts its break-it note states. */
const PATROL = process.env.PATROL_REPO
const showP = (file: string) => spawnSync('git', ['-C', PATROL!, 'show', `origin/main:${file}`], { encoding: 'utf8' }).stdout.split('\n')
describe.skipIf(!PATROL)('2.4 retry note == ros2-patrol-project (origin/main)', () => {
  it('max_retries 3 (patrol_points.yaml:49), 2 s wait before a retry (patrol_controller.py:232), skip after the last', () => {
    expect(showP('config/patrol_points.yaml')[48]).toMatch(/^\s*max_retries: 3\s*$/)
    const py = showP('patrol_navigation_project/patrol_controller.py')
    expect(py[231]).toMatch(/time\.sleep\(2\.0\)/)
    expect(py.slice(219, 240).join('\n')).toContain('Skipping waypoint')
    for (const l of ['en', 'ja'] as const) expect(ACTIONS_STRINGS[l].brokenNote).toMatch(/max_retries = 3/)
    expect(ACTIONS_STRINGS.en.brokenNote).toContain('waits 2 s')
  })
})
