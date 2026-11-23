import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { BASE, closestOf, readings, updates } from './closest'
import { SCAN_HZ, SPEED, START_M, run } from './decide'

const hasPython = spawnSync('python3', ['--version']).status === 0
const STOP_ATS = [0, 0.12, 0.3, 0.5, 0.77, 1]
const RS = BASE.map((_, i) => readings(i))

/** Pages 1.1 and 1.2 say "Python shown; the page runs the same logic in JavaScript". This runs the shown Python. */
describe.skipIf(!hasPython)('1.1-1.2 page Python == TypeScript model', () => {
  const cfg = { start: START_M, speed: SPEED, hz: SCAN_HZ, stop_ats: STOP_ATS, readings: RS }
  const py = JSON.parse(execFileSync('python3', ['-I', fileURLToPath(new URL('./snippets.py', import.meta.url)), JSON.stringify(cfg)], { encoding: 'utf8' }))

  it('1.1 drive: same stop distance, crash and scan count for 6 stop_at values, with < and with >', () => {
    const ts = STOP_ATS.flatMap((s) => (['<', '>'] as const).map((op) => { const r = run(s, op); return { final: r.final, crashed: r.crashed, scans: r.ticks.length } }))
    expect(py.drive).toEqual(ts)
  })

  it('1.2 closest: same value and update count for the box at each of the 10 beams, from inf and from 0', () => {
    const ts = [...RS.map((rs) => [closestOf(rs), updates(rs)]), ...RS.map((rs) => [closestOf(rs, 'zero'), updates(rs, 'zero')])]
    expect(py.closest).toEqual(ts)
  })
})
