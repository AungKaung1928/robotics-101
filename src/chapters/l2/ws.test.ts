import { describe, expect, it } from 'vitest'
import { SCRIPT, STARTED, WS, challengeOk, scenario, session } from './ws'

describe('2.6 workspace', () => {
  it('the README steps build and run the node; build/install/log land in the workspace root', () => {
    const { w, lines } = session(SCRIPT)
    expect(lines.every((l) => l.ok)).toBe(true)
    expect(lines.at(-1)!.out).toBe(STARTED)
    for (const d of ['src', 'src/tf_explorer', 'build', 'install', 'log']) expect(w.dirs).toContain(`${WS}/${d}`)
  })

  it('break it: no ROS source -> colcon cannot find ament_cmake', () => {
    const { lines } = session(SCRIPT.slice(1))
    const build = lines.find((l) => l.cmd.startsWith('colcon'))!
    expect(build.ok).toBe(false)
    expect(build.out).toContain('ament_cmake')
  })

  it('building inside src/ puts build/install/log inside src/', () => {
    const { w } = session([...SCRIPT.slice(0, 4), 'colcon build'])
    expect(w.dirs).toContain(`${WS}/src/install`)
    expect(w.dirs).not.toContain(`${WS}/install`)
  })

  it('a new terminal knows nothing: ros2 run needs both sources again', () => {
    expect(session(['ros2 run tf_explorer patrol_node']).lines[0].out).toBe('ros2: command not found')
    const noOverlay = session(['source /opt/ros/humble/setup.bash', 'ros2 run tf_explorer patrol_node']).lines[1]
    expect(noOverlay.out).toBe("Package 'tf_explorer' not found")
  })

  it('challenge needs a successful ros2 run', () => {
    expect(challengeOk(session(SCRIPT).lines)).toBe(true)
    expect(challengeOk(session(SCRIPT.slice(0, 6)).lines)).toBe(false)
  })

  it('scenario ends with every line typed', () => {
    const sc = scenario(SCRIPT)
    expect(sc.frame(sc.durationMs).done).toBe(SCRIPT.length)
    expect(sc.frame(0)).toEqual({ done: 0, typing: '' })
  })
})

describe('2.6 strings', () => {
  it('EN and JA have the same keys and list lengths', async () => {
    const { WS_STRINGS: S } = await import('./ws.strings')
    expect(Object.keys(S.ja).sort()).toEqual(Object.keys(S.en).sort())
    expect(S.ja.lines).toHaveLength(S.en.lines.length)
    expect(S.ja.glossary).toHaveLength(S.en.glossary.length)
  })
})
