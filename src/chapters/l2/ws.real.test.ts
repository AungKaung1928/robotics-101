import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NO_AMENT } from './ws'

/** 2.6 prints these terminal lines. Where cmake and ROS 2 Humble exist, produce them for real and compare. */
const HUMBLE = '/opt/ros/humble/setup.bash'
const has = (cmd: string) => spawnSync('bash', ['-c', `command -v ${cmd}`]).status === 0
const flat = (s: string) => s.replace(/\s+/g, ' ')
const CLEAN = { PATH: '/usr/bin:/bin', HOME: tmpdir() } // a new terminal: ROS not sourced

describe.skipIf(!has('cmake') || !existsSync(HUMBLE))('2.6 terminal lines == real tools', () => {
  it('cmake without ROS sourced: the ament_cmake error the page shows; with ROS sourced: configures', () => {
    const dir = mkdtempSync(join(tmpdir(), 'r101-ament-'))
    try {
      writeFileSync(join(dir, 'CMakeLists.txt'), 'cmake_minimum_required(VERSION 3.8)\nproject(t)\nfind_package(ament_cmake REQUIRED)\n')
      const bare = spawnSync('cmake', ['-S', dir, '-B', join(dir, 'b1')], { encoding: 'utf8', env: CLEAN })
      expect(bare.status).not.toBe(0)
      expect(flat(bare.stderr)).toContain('CMake Error')
      expect(flat(bare.stderr)).toContain(NO_AMENT.split('... ')[1])
      const sourced = spawnSync('bash', ['-c', `source ${HUMBLE} && cmake -S ${dir} -B ${join(dir, 'b2')}`], { encoding: 'utf8', env: CLEAN })
      expect(sourced.status).toBe(0)
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })

  it("ros2 run before the workspace is sourced: Package 'tf_explorer' not found", () => {
    const r = spawnSync('bash', ['-c', `source ${HUMBLE} && ros2 run tf_explorer tf_anomaly_detector`], { encoding: 'utf8', env: CLEAN, timeout: 30000 })
    expect(r.status).not.toBe(0)
    expect(r.stderr + r.stdout).toContain("Package 'tf_explorer' not found")
  })
})
