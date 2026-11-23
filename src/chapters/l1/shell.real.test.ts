import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { exec, fresh, HOME, type Sh } from './shell'

/** The page's pretend terminal (1.5) against real interactive bash: same home layout in a temp folder, no ~/.bashrc,
 * no ROS sourced, so each command starts like the page's "new terminal". Messages that name the home path are
 * compared after mapping the temp home to the page's HOME. Needs bash and ROS 2 Humble at /opt/ros/humble. */
const SETUP = '/opt/ros/humble/setup.bash'
const ok = spawnSync('bash', ['--version']).status === 0 && existsSync(SETUP)

describe.skipIf(!ok)('1.5 pretend terminal == real bash (Humble)', () => {
  const home = mkdtempSync(join(tmpdir(), 'r101-sh-'))
  mkdirSync(join(home, 'ros2_ws'))
  writeFileSync(join(home, 'notes.txt'), 'stop_at = 0.5\n')
  afterAll(() => rmSync(home, { recursive: true, force: true }))

  /** Run lines in one interactive bash (its error wording: "bash: cd: ..."); each line's stdout + stderr, in order.
   * Interactive bash also echoes its input to stderr when stdin is not a terminal, so only stdout is read. A terminal
   * shows ls in columns; ls writes one name per line into a pipe, so ls runs as ls -C here. */
  const bash = (lines: string[]) => {
    const script = lines.map((l, i) => `{ ${l.replace(/^ls\b/, 'ls -C')}; } 2>&1\necho "@@${i}"`).join('\n')
    const r = spawnSync('env', ['-i', `HOME=${home}`, 'PATH=/usr/bin:/bin', 'TERM=dumb', 'COLUMNS=80', 'PS1=', 'bash', '--norc', '--noprofile', '-i'],
      { cwd: home, input: script + '\n', encoding: 'utf8', timeout: 60_000 })
    return r.stdout.split(/@@\d+\n?/).slice(0, lines.length).map((x) => x.trim().split(home).join(HOME))
  }
  const page = (lines: string[]) => {
    let sh: Sh = fresh()
    return lines.map((l) => { const r = exec(sh, l); sh = r.sh; return r.line.out })
  }

  it('errors read the same: cd, ls, cat, mkdir, source, unknown command, ros2 before source', () => {
    const lines = ['cd nowhere', 'ls nowhere', 'cat missing.txt', 'mkdir ros2_ws', 'mkdir a/b', 'source missing.sh', 'pwdd', 'ros2']
    expect(bash(lines)).toEqual(page(lines))
  })
  it('ls, cat and pwd in the home folder print the same', () => {
    const lines = ['ls', 'cat notes.txt', 'pwd']
    expect(bash(lines)).toEqual(page(lines))
  })
  it('after source: ROS_DISTRO is humble and ros2 pkg list holds the packages the page names', () => {
    const [distro, pkgs] = bash([`source ${SETUP}`, 'echo $ROS_DISTRO', 'ros2 pkg list']).slice(1)
    expect(distro).toBe(page([`source ${SETUP}`, 'echo $ROS_DISTRO'])[1])
    const shown = page([`source ${SETUP}`, 'ros2 pkg list'])[1].split(/\s+/).filter((w) => /^[a-z_]+$/.test(w))
    for (const p of shown) expect(pkgs.split('\n'), p).toContain(p)
  }, 60_000)
})
