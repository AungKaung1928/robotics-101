import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SCAN_HZ, SPEED, START_M, run } from './decide'

const hasPython = spawnSync('python3', ['--version']).status === 0
const STOP_ATS = [0, 0.12, 0.3, 0.5, 0.77, 1]

/** Page 1.1 says "Python shown; the page runs the same logic in JavaScript". This runs the shown Python. */
describe.skipIf(!hasPython)('1.1 page Python == TypeScript model', () => {
  const cfg = { start: START_M, speed: SPEED, hz: SCAN_HZ, stop_ats: STOP_ATS }
  const py = JSON.parse(execFileSync('python3', ['-I', fileURLToPath(new URL('./snippets.py', import.meta.url)), JSON.stringify(cfg)], { encoding: 'utf8' }))

  it('1.1 drive: same stop distance, crash and scan count for 6 stop_at values, with < and with >', () => {
    const ts = STOP_ATS.flatMap((s) => (['<', '>'] as const).map((op) => { const r = run(s, op); return { final: r.final, crashed: r.crashed, scans: r.ticks.length } }))
    expect(py.drive).toEqual(ts)
  })

})
