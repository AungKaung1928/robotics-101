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

  it('costmap Dijkstra (heapq, as the costmap mode shows it): same path and cost, 15 steps at cost 15', () => {
    const d = dijkstra(w)
    expect(py.dijkstra_path).toEqual(cells(d.path))
    expect([py.dijkstra_steps, py.dijkstra_cost]).toEqual([15, pathCost(d.path!, w)])
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
