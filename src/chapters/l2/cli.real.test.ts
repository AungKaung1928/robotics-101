import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DRIVE_STRINGS } from './drive.strings'

/** The ros2 commands Levels 1-2 show exist in the installed Humble CLI with the flags shown, and 2.7's
 * "without --rate: once a second" is the CLI's own default. Runs only where /opt/ros/humble exists. */
const SETUP = '/opt/ros/humble/setup.bash'
const help = (verb: string) => spawnSync('bash', ['-c', `source ${SETUP} && ros2 ${verb} -h`], { encoding: 'utf8', timeout: 60_000 })

describe.skipIf(!existsSync(SETUP))('ros2 CLI on the pages == ROS 2 Humble', () => {
  it.each(['pkg list', 'run', 'topic list', 'topic info', 'topic hz', 'topic pub', 'param set'])('ros2 %s exists', (verb) => {
    expect(help(verb).status).toBe(0)
  }, 60_000)
  it('topic pub: --rate defaults to 1 Hz and --once exists, as 2.7 says', () => {
    const h = help('topic pub').stdout
    expect(h).toMatch(/--rate N\s+Publishing rate in Hz \(default: 1\)/)
    expect(h).toContain('--once')
    expect(DRIVE_STRINGS.en.lines[0]).toContain('without --rate: once a second')
    expect(DRIVE_STRINGS.ja.lines[0]).toContain('--rate なしなら1秒1回')
  }, 60_000)
})
