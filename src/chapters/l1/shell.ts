import type { Scenario } from '../../anim/contract'

/**
 * Chapter 1.5 model: a tiny bash over a pretend home folder, enough for the 8 commands a ROS beginner needs.
 * Not a real shell: one argument per command, no quoting, no pipes.
 */
export interface Sh { cwd: string; dirs: string[]; files: Record<string, string>; env: Record<string, string> }
export interface Line { cmd: string; out: string; ok: boolean }

export const HOME = '/root' // home folder of root, the user in the ros:humble Docker image
const SETUP = '/opt/ros/humble/setup.bash'

export const fresh = (): Sh => ({
  cwd: HOME,
  dirs: [HOME, `${HOME}/ros2_ws`, '/opt/ros/humble'],
  files: { [`${HOME}/notes.txt`]: 'stop_at = 0.5', [SETUP]: '# sets ROS_DISTRO, PATH, ...' },
  env: {},
})

const resolve = (cwd: string, p: string) => {
  const parts = (p.startsWith('/') ? p : p.startsWith('~') ? HOME + p.slice(1) : `${cwd}/${p}`).split('/')
  const out: string[] = []
  for (const x of parts) {
    if (x === '' || x === '.') continue
    if (x === '..') out.pop()
    else out.push(x)
  }
  return '/' + out.join('/')
}
const short = (p: string) => (p.startsWith(HOME) ? '~' + p.slice(HOME.length) : p)
export const prompt = (sh: Sh) => `${short(sh.cwd)}$`

/** Run one command line; returns the new state (never mutates) and what the terminal prints. */
export function exec(sh: Sh, cmd: string): { sh: Sh; line: Line } {
  const [name, ...rest] = cmd.trim().split(/\s+/)
  const arg = rest.join(' ')
  const s: Sh = { ...sh, dirs: [...sh.dirs], files: { ...sh.files }, env: { ...sh.env } }
  const say = (out: string, ok = true) => ({ sh: s, line: { cmd, out, ok } })
  const target = resolve(sh.cwd, arg || '~')
  switch (name) {
    case 'pwd': return say(sh.cwd)
    case 'ls': {
      const dir = arg ? target : sh.cwd
      if (!s.dirs.includes(dir)) return say(`ls: cannot access '${arg}': No such file or directory`, false)
      const kids = [...s.dirs, ...Object.keys(s.files)].filter((p) => p !== dir && p.startsWith(dir + '/') && !p.slice(dir.length + 1).includes('/'))
      return say(kids.map((p) => p.slice(dir.length + 1)).sort().join('  '))
    }
    case 'cd':
      if (!s.dirs.includes(target)) return say(`bash: cd: ${arg}: No such file or directory`, false)
      s.cwd = target
      return say('')
    case 'mkdir':
      if (!arg) return say('mkdir: missing operand', false)
      if (s.dirs.includes(target)) return say(`mkdir: cannot create directory '${arg}': File exists`, false)
      if (!s.dirs.includes(target.slice(0, target.lastIndexOf('/')) || '/')) return say(`mkdir: cannot create directory '${arg}': No such file or directory`, false)
      s.dirs.push(target)
      return say('')
    case 'cat':
      if (!(target in s.files)) return say(`cat: ${arg}: No such file or directory`, false)
      return say(s.files[target])
    case 'source':
      if (!(target in s.files)) return say(`bash: ${arg}: No such file or directory`, false)
      if (target === SETUP) s.env.ROS_DISTRO = 'humble'
      return say('')
    case 'echo': return say(arg.startsWith('$') ? s.env[arg.slice(1)] ?? '' : arg)
    case 'ros2':
      if (!s.env.ROS_DISTRO) return say('ros2: command not found', false)
      return say(arg === 'pkg list' ? 'geometry_msgs  rclcpp  rclpy  sensor_msgs  ... (shortened)' : 'usage: ros2 ... (help text, shortened)')
    case '': return say('')
    default: return say(`${name}: command not found`, false)
  }
}

/** Run several lines from a fresh terminal. */
export function session(cmds: string[], start = fresh()): { sh: Sh; lines: Line[] } {
  let sh = start
  const lines = cmds.map((c) => { const r = exec(sh, c); sh = r.sh; return r.line })
  return { sh, lines }
}

/** The scenario's script: each of the 8 commands once, in the order a ROS day starts. */
export const SCRIPT = ['pwd', 'ls', 'cat notes.txt', 'mkdir ros2_ws/src', 'cd ros2_ws/src', 'ros2', `source ${SETUP}`, 'echo $ROS_DISTRO', 'ros2 pkg list']
export const COMMANDS = ['pwd', 'ls', 'cd', 'mkdir', 'cat', 'source', 'echo', 'ros2']
export const CHAR_MS = 45, PAUSE_MS = 700

/** Challenge: in a new terminal, make `ros2 pkg list` print packages. */
export const challengeOk = (lines: Line[]) => lines.some((l) => l.ok && l.cmd.trim().startsWith('ros2'))

export interface ShellScene extends Record<string, unknown> { done: number; typing: string }

/** Scenario: the script typed one character every CHAR_MS, output after each Enter. */
export function scenario(): Scenario<ShellScene> {
  const starts: number[] = []
  let t = 0
  for (const c of SCRIPT) { starts.push(t); t += c.length * CHAR_MS + PAUSE_MS }
  const durationMs = t
  return {
    id: 'l1-shell',
    durationMs,
    eventsMs: [...starts, durationMs],
    frame(tMs) {
      const x = Math.min(Math.max(tMs, 0), durationMs)
      const i = starts.findLastIndex((s) => s <= x)
      const typed = Math.floor((x - starts[i]) / CHAR_MS)
      if (x >= durationMs) return { done: SCRIPT.length, typing: '' }
      return typed >= SCRIPT[i].length ? { done: i + 1, typing: '' } : { done: i, typing: SCRIPT[i].slice(0, typed) }
    },
  }
}
