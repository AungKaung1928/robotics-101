import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { STATUS } from './actions'
import { LASERSCAN, TWIST_FIELDS } from './msgtypes'

/** Level 2 quotes ROS 2 Humble interface files by line. Where Humble is installed, read the real files and compare. */
const SHARE = '/opt/ros/humble/share'
const lines = (p: string) => readFileSync(`${SHARE}/${p}`, 'utf8').split('\n')

describe.skipIf(!existsSync(`${SHARE}/sensor_msgs/msg/LaserScan.msg`))('Level 2 == installed ROS 2 Humble interfaces', () => {
  it('2.3 LaserScan: every field the page lists is on the quoted line, with the quoted type', () => {
    const msg = lines('sensor_msgs/msg/LaserScan.msg')
    for (const f of LASERSCAN) expect(msg[f.line - 1]).toMatch(new RegExp(`^${f.type.replace(/[[\]]/g, '\\$&')}\\s+${f.name}\\b`))
  })

  it('2.3 Twist: linear and angular are Vector3 with x, y, z (the six fields the page names)', () => {
    const tw = lines('geometry_msgs/msg/Twist.msg').filter((l) => /^\w/.test(l))
    expect(tw).toEqual(['Vector3  linear', 'Vector3  angular'])
    const v3 = lines('geometry_msgs/msg/Vector3.msg').filter((l) => /^\w/.test(l)).map((l) => l.split(/\s+/)[1])
    expect(TWIST_FIELDS).toEqual(['linear', 'angular'].flatMap((p) => v3.map((c) => `${p}.${c}`)))
  })

  it('2.4 action status codes and NavigateToPose feedback field', () => {
    const gs = lines('action_msgs/msg/GoalStatus.msg').join('\n')
    for (const [k, v] of Object.entries(STATUS)) expect(gs).toMatch(new RegExp(`int8 STATUS_${k}\\s*=\\s*${v}\\b`))
    expect(lines('nav2_msgs/action/NavigateToPose.action')).toContain('float32 distance_remaining')
  })
})
