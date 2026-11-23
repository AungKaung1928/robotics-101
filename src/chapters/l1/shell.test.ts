import { describe, expect, it } from 'vitest'
import { COMMANDS, HOME, SCRIPT, challengeOk, exec, fresh, scenario, session } from './shell'

describe('1.5 shell model', () => {
  it('the script uses each of the 8 commands', () => {
    expect(COMMANDS.every((c) => SCRIPT.some((l) => l.split(' ')[0] === c))).toBe(true)
  })

  it('ros2 fails before source and works after; ROS_DISTRO comes from setup.bash', () => {
    const { lines } = session(SCRIPT)
    const out = Object.fromEntries(lines.map((l) => [l.cmd, l]))
    expect(out.ros2.ok).toBe(false)
    expect(out['echo $ROS_DISTRO'].out).toBe('humble')
    expect(out['ros2 pkg list'].ok).toBe(true)
  })

  it('cd, mkdir, pwd keep a consistent path', () => {
    const { sh, lines } = session(['mkdir ros2_ws/src', 'cd ros2_ws/src', 'pwd', 'cd ..', 'pwd', 'cd ~', 'pwd'])
    expect(lines.map((l) => l.out).filter(Boolean)).toEqual([`${HOME}/ros2_ws/src`, `${HOME}/ros2_ws`, HOME])
    expect(sh.cwd).toBe(HOME)
  })

  it('real-looking errors for the common mistakes', () => {
    expect(exec(fresh(), 'cd nowhere').line).toMatchObject({ ok: false, out: 'bash: cd: nowhere: No such file or directory' })
    expect(exec(fresh(), 'mkdir a/b').line.ok).toBe(false) // parent missing
    expect(exec(fresh(), 'ls').line.out).toBe('notes.txt  ros2_ws')
  })

  it('exec never mutates the state it was given', () => {
    const s = fresh()
    exec(s, 'mkdir x'); exec(s, `source /opt/ros/humble/setup.bash`); exec(s, 'cd ros2_ws')
    expect(s).toEqual(fresh())
  })

  it('a new terminal forgets source: the challenge needs it again', () => {
    expect(challengeOk(session(['ros2 pkg list']).lines)).toBe(false)
    expect(challengeOk(session(['source /opt/ros/humble/setup.bash', 'ros2 pkg list']).lines)).toBe(true)
  })

  it('scenario: pure, ends with every command done', () => {
    const sc = scenario()
    expect(sc.frame(0)).toEqual({ done: 0, typing: '' })
    expect(sc.frame(100).typing).toBe('pw')
    expect(sc.frame(sc.durationMs).done).toBe(SCRIPT.length)
    expect(sc.frame(2345)).toEqual(sc.frame(2345))
  })
})

describe('1.5 strings', () => {
  it('EN and JA have the same keys; the glossary lists the 8 commands in both', async () => {
    const { SHELL_STRINGS: S } = await import('./shell.strings')
    expect(Object.keys(S.ja).sort()).toEqual(Object.keys(S.en).sort())
    expect(S.en.glossary.map(([k]) => k)).toEqual(COMMANDS)
    expect(S.ja.glossary.map(([k]) => k)).toEqual(COMMANDS)
  })
})
