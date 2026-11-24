import type { Scenario } from '../../anim/contract'
import { HOME, HUMBLE_HINT, JAZZY_SETUP, resolve, short, type Line } from '../l1/shell'

/**
 * Chapter 2.6 model: a colcon workspace, following TF-Transform-Explorer README:27-33.
 * colcon builds in the folder you run it from: build/, install/, log/ appear there.
 * Outputs: real messages where known (CMake, ros2 run, the node's own start-up log); paraphrases are in (parentheses).
 */
export const WS = `${HOME}/tf_explorer_ws`
const ROS_SETUP = '/opt/ros/humble/setup.bash'
export const EXECUTABLES = ['tf_monitor_node', 'frame_broadcaster_node', 'tf_anomaly_detector', 'simple_wiggle_recovery', 'patrol_node'] // CMakeLists.txt:108-112

export interface Ws { cwd: string; dirs: string[]; ros: boolean; overlay: string | null; builtIn: string | null }
export const fresh = (): Ws => ({ cwd: HOME, dirs: [HOME, '/opt/ros/humble'], ros: false, overlay: null, builtIn: null })

export const NO_AMENT = 'CMake Error: ... asked CMake to find a package configuration file provided by "ament_cmake", but CMake did not find one.'
export const STARTED = '[INFO] [...] [tf_anomaly_detector]: TF Anomaly Detector started (max_age=1.00s, max_jump=0.50m)' // tf_anomaly_detector.cpp:30-31

export function exec(w: Ws, cmd: string): { w: Ws; line: Line } {
  const [name, ...rest] = cmd.trim().split(/\s+/)
  const s: Ws = { ...w, dirs: [...w.dirs] }
  const say = (out: string, ok = true) => ({ w: s, line: { cmd, out, ok } })
  const arg = rest.filter((a) => a !== '-p').join(' ')
  const target = resolve(w.cwd, arg || '~')
  switch (name) {
    case 'mkdir': {
      let p = ''
      for (const part of target.split('/').filter(Boolean)) { p += '/' + part; if (!s.dirs.includes(p)) s.dirs.push(p) }
      return say('')
    }
    case 'cd':
      if (!s.dirs.includes(target)) return say(`bash: cd: ${arg}: No such file or directory`, false)
      s.cwd = target
      return say('')
    case 'ls': return say(s.dirs.filter((d) => d.startsWith(s.cwd + '/') && !d.slice(s.cwd.length + 1).includes('/')).map((d) => d.slice(s.cwd.length + 1)).sort().join('  '))
    case 'git':
      if (rest[0] !== 'clone' || !rest[2]) return say('(usage: git clone <url> <folder>)', false)
      s.dirs.push(resolve(w.cwd, rest[2]))
      return say(`Cloning into '${rest[2]}'...`)
    case 'source': {
      if (target === ROS_SETUP) { s.ros = true; return say('') }
      if (target === JAZZY_SETUP) return say(`bash: ${arg}: No such file or directory\n${HUMBLE_HINT}`, false)
      const base = target.replace(/\/install\/setup\.bash$/, '')
      if (base === target || s.builtIn !== base) return say(`bash: ${arg}: No such file or directory`, false)
      s.overlay = base
      return say('')
    }
    case 'colcon': {
      if (rest[0] !== 'build') return say('(colcon: only "colcon build" here)', false)
      const pkgs = s.dirs.filter((d) => d.startsWith(s.cwd + '/') && d.endsWith('/tf_explorer'))
      if (!pkgs.length) return say('(no package tf_explorer found under this folder)\nSummary: 0 packages finished', false)
      if (!s.ros) return say(`Starting >>> tf_explorer\n${NO_AMENT}\nFailed   <<< tf_explorer`, false)
      for (const d of ['build', 'install', 'log']) if (!s.dirs.includes(`${s.cwd}/${d}`)) s.dirs.push(`${s.cwd}/${d}`)
      s.builtIn = s.cwd
      return say('Starting >>> tf_explorer\nFinished <<< tf_explorer\nSummary: 1 package finished')
    }
    case 'ros2':
      if (!s.ros) return say('bash: ros2: command not found', false)
      if (rest[0] !== 'run' || rest[1] !== 'tf_explorer') return say('(usage: ros2 run tf_explorer <executable>)', false)
      if (!s.overlay) return say("Package 'tf_explorer' not found", false)
      if (!EXECUTABLES.includes(rest[2])) return say(`No executable found`, false)
      return say(rest[2] === 'tf_anomaly_detector' ? STARTED : `(${rest[2]} starts)`)
    case '': return say('')
    default: return say(`bash: ${name}: command not found`, false) // interactive bash, no command-not-found helper
  }
}

export function session(cmds: string[]): { w: Ws; lines: Line[] } {
  let w = fresh()
  const lines = cmds.map((c) => { const r = exec(w, c); w = r.w; return r.line })
  return { w, lines }
}
export const prompts = (cmds: string[]) => {
  let w = fresh()
  return [`${short(w.cwd)}$`, ...cmds.map((c) => { w = exec(w, c).w; return `${short(w.cwd)}$` })]
}

/** README:27-33, with the ROS source line first (the README assumes it is in ~/.bashrc). */
export const SCRIPT = [
  `source ${ROS_SETUP}`,
  'mkdir -p ~/tf_explorer_ws/src',
  'cd ~/tf_explorer_ws/src',
  'git clone <repo-url> tf_explorer',
  'cd ~/tf_explorer_ws',
  'colcon build --symlink-install --packages-select tf_explorer',
  'source install/setup.bash',
  'ros2 run tf_explorer tf_anomaly_detector',
]

export const challengeOk = (lines: Line[]) => lines.some((l) => l.ok && l.cmd.trim().startsWith('ros2 run'))

export const CHAR_MS = 30, PAUSE_MS = 900
export interface WsScene extends Record<string, unknown> { done: number; typing: string }
export function scenario(script: string[]): Scenario<WsScene> {
  const starts: number[] = []
  let t = 0
  for (const c of script) { starts.push(t); t += c.length * CHAR_MS + PAUSE_MS }
  return {
    id: 'l2-ws',
    durationMs: t,
    eventsMs: [...starts, t],
    frame(tMs) {
      const x = Math.min(Math.max(tMs, 0), t)
      if (x >= t) return { done: script.length, typing: '' }
      const i = starts.findLastIndex((s) => s <= x)
      const typed = Math.floor((x - starts[i]) / CHAR_MS)
      return typed >= script[i].length ? { done: i + 1, typing: '' } : { done: i, typing: script[i].slice(0, typed) }
    },
  }
}
