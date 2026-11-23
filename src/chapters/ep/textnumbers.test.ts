import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { CHALLENGE_MIN, NEAR, dijkstra, initialWalls, nearWall, pathCost, search, steps } from './bfs'
import { BFS_STRINGS } from './bfs.strings'
import { DELAYS_MS, PERIOD_MS, messages } from './late'
import { LATE_STRINGS } from './late.strings'

/** EP2 step text states numbers about the model's delay table; this keeps the text and the table in step (EN and JA). */
const [en, ja] = [LATE_STRINGS.en.lines.join(' '), LATE_STRINGS.ja.lines.join(' ')]
const msgs = [...messages()].sort((a, b) => a.i - b.i) // messages() is in arrival order; index by reading number
const normal = DELAYS_MS.filter((d) => d >= 25 && d <= 40)

describe('EP2 text numbers == delay model', () => {
  it('"10 times a second" = one reading every PERIOD_MS', () => {
    expect(1000 / PERIOD_MS).toBe(10)
    expect(en).toContain('10 times a second')
    expect(ja).toContain('1秒に10回')
  })
  it('"most take 25-40 ms": more than half the delays, and the fastest and slowest of those, are 25 and 40', () => {
    expect(normal.length).toBeGreaterThan(DELAYS_MS.length / 2)
    expect([Math.min(...normal), Math.max(...normal)]).toEqual([25, 40])
    expect(en).toContain('25-40 ms')
    expect(ja).toContain('25〜40 ms')
  })
  it('"at 0.6 s, #6-#9 are held up and arrive after #10": true in the table, and #6 is the first late one', () => {
    expect(msgs[6].stamp).toBe(600)
    for (const i of [6, 7, 8, 9]) expect(msgs[i].arrive).toBeGreaterThan(msgs[10].arrive)
    for (const i of [0, 1, 2, 3, 4, 5]) expect(msgs[i].arrive).toBeLessThan(msgs[i + 1].arrive)
    expect(en).toContain('At 0.6 s')
    expect(en).toContain('#6-#9')
    expect(ja).toContain('0.6 秒')
    expect(ja).toContain('#6〜#9')
  })
})

describe('EP1 text numbers == grid model', () => {
  const w = initialWalls(), d = dijkstra(w), b = search(w)
  const [ds, dc, bs, bc] = [steps(d), pathCost(d.path!, w), steps(b), pathCost(b.path!, w)]
  it('costNote: "costs 5 instead of 1", Dijkstra "15 steps at cost 15", BFS "13 steps at cost 41" (EN and JA)', () => {
    expect([1 + NEAR, ds, dc, bs, bc]).toEqual([5, 15, 15, 13, 41])
    expect(BFS_STRINGS.en.costNote).toContain(`costs ${1 + NEAR} instead of 1`)
    expect(BFS_STRINGS.en.costNote).toContain(`${ds} steps at cost ${dc}, against the BFS path's ${bs} steps at cost ${bc}`)
    expect(BFS_STRINGS.ja.costNote).toContain(`${1 + NEAR}。`)
    expect(BFS_STRINGS.ja.costNote).toContain(`${ds} 歩でコスト ${dc}。BFS の道は ${bs} 歩でコスト ${bc}`)
  })
  it('"never brushing a wall": no cell on the Dijkstra path touches a wall', () => {
    expect(d.path!.filter((k) => nearWall(k, w))).toEqual([])
  })
  it('challenge text names CHALLENGE_MIN steps', () => {
    expect(BFS_STRINGS.en.challenge).toContain(`at least ${CHALLENGE_MIN} steps`)
    expect(BFS_STRINGS.ja.challenge).toContain(`${CHALLENGE_MIN} 歩以上`)
  })
})

const REPO = process.env.TFE_REPO
describe.skipIf(!REPO)('EP2 repo note == TF-Transform-Explorer tf_anomaly_detector.cpp:10 (origin/main)', () => {
  it('declares max_transform_age 1.0, and both languages say 1.0', () => {
    const cpp = spawnSync('git', ['-C', REPO!, 'show', 'origin/main:src/tf_anomaly_detector.cpp'], { encoding: 'utf8' }).stdout.split('\n')
    expect(cpp[9]).toMatch(/declare_parameter\("max_transform_age", 1\.0\);/)
    expect(LATE_STRINGS.en.repoNote).toContain('max_transform_age = 1.0 s')
    expect(LATE_STRINGS.ja.repoNote).toContain('max_transform_age = 1.0 秒')
  })
})
