import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { cellOf, dijkstra, initialWalls, pathCost, search } from './bfs'
import { renderToStaticMarkup } from 'react-dom/server'
import { STRINGS } from '../../i18n'
import BfsChapter from './BfsChapter'
import LateChapter from './LateChapter'
import { DELAYS_MS, run, summary } from './late'

const hasPython = spawnSync('python3', ['--version']).status === 0
const cells = (p: number[] | null) => p!.map((k) => cellOf(k))

/** The pages say "Python shown; the page runs the same logic in JavaScript". This runs the shown Python and checks it. */
describe.skipIf(!hasPython)('EP1-EP2 page Python == TypeScript model', () => {
  const py = JSON.parse(execFileSync('python3', ['-I', fileURLToPath(new URL('./snippets.py', import.meta.url))], { encoding: 'utf8' }))
  const w = initialWalls()

  it('BFS (popleft) and the break-it (pop) give the same cells in the same order', () => {
    expect(py.bfs_path).toEqual(cells(search(w).path))
    expect(py.stack_path).toEqual(cells(search(w, 'stack').path))
  })

  it('costmap Dijkstra: same path and cost (15 steps, cost 15; BFS path cost 41)', () => {
    const d = dijkstra(w)
    expect(py.dijkstra_path).toEqual(cells(d.path))
    expect([py.dijkstra_steps, py.dijkstra_cost, py.bfs_path_cost]).toEqual([15, pathCost(d.path!, w), pathCost(search(w).path!, w)])
  })

  it('late messages: acted / back-in-time counts match for 1 s, 179 ms, 180 ms and keep-latest', () => {
    const pair = (a: number, k = false) => { const s = summary(run(a, k)); return [s.acted, s.backwards] }
    expect([py.late_1000, py.late_179, py.late_180, py.late_keep]).toEqual([pair(1000), pair(179), pair(180), pair(1000, true)])
  })

  it('EP2 on_msg exactly as the page shows it runs in Python and gives the page counts (plain + stamp check)', () => {
    const html = renderToStaticMarkup(<LateChapter t={STRINGS.en} />)
    const pre = html.match(/<pre class="code" aria-label="Python">([\s\S]*?)<\/pre>/)![1]
    const code = pre.replace(/<\/span><span class="ln[^"]*">/g, '\n').replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&#x27;/g, "'").replace(/&amp;/g, '&')
    const harness = fileURLToPath(new URL('./on_msg_harness.py', import.meta.url))
    for (const [age, keep] of [[1000, false], [179, false], [180, false], [1000, true]] as const) {
      const r = spawnSync('python3', ['-I', harness, code, keep ? '1' : '0', String(age), JSON.stringify(DELAYS_MS)], { encoding: 'utf8' })
      expect(r.stderr, code).toBe('')
      const s = summary(run(age, keep))
      expect(JSON.parse(r.stdout)).toEqual([s.acted, s.backwards])
    }
  })

  it('EP1 BFS code exactly as the page shows it runs in Python: same path as the model, and pop() gives the break-it path', () => {
    const pre = renderToStaticMarkup(<BfsChapter t={STRINGS.en} />).match(/<pre class="code" aria-label="Python">([\s\S]*?)<\/pre>/)![1]
    const code = pre.replace(/<\/span><span class="ln[^"]*">/g, '\n').replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&#x27;/g, "'").replace(/&amp;/g, '&')
    const harness = fileURLToPath(new URL('./bfs_harness.py', import.meta.url))
    for (const [flag, order] of [['0', 'queue'], ['1', 'stack']] as const) {
      const r = spawnSync('python3', ['-I', harness, code, flag], { encoding: 'utf8' })
      expect(r.stderr, code).toBe('')
      expect(JSON.parse(r.stdout)).toEqual(cells(search(w, order).path))
    }
  })
})
