import { describe, expect, it } from 'vitest'
import { bfs as waveBfs, pathTo } from '../../scenarios/bfs'
import { consume } from '../../scenarios/late'
import { GOAL, H, START, W, initialWalls, key, search } from './bfs'
import { DELAYS_MS, PERIOD_MS, run } from './late'

/** The anim lane's EP figures (src/scenarios) run their own copies of the algorithms. These tests say where they
 * agree with the page models, so a figure is wired only where it shows the same answer as the page's readouts. */
describe('EP figures vs page models', () => {
  const walls = initialWalls()
  const blocked = Array.from({ length: W * H }, (_, k) => walls.has(k))
  const wave = waveBfs(W, H, blocked, key(START))
  const page = search(walls)

  it('BfsWave: same distance for every reached cell (the rings match)', () => {
    for (const [k, d] of page.dist) expect(wave.dist[k]).toBe(d)
  })

  it('BfsWave: same path length to G', () => {
    expect(pathTo(wave, key(GOAL)).length).toBe(page.path!.length)
  })

  it('BfsWave path cells vs page path cells (neighbour order: page up-right-down-left, figure right-down-left-up)', () => {
    expect(pathTo(wave, key(GOAL))).not.toEqual(page.path) // different tie-break: a different, equally short path
  })

  const msgs = DELAYS_MS.map((d, i) => ({ id: i, stamp: (i * PERIOD_MS) / 1000, latency: d / 1000 }))
  const NAME = { used: 'acted', old: 'stale', stale: 'older' } as const // figure name -> page name

  it('LateEnvelopes: same fate per message as the page in keep-latest mode, at every slider position', () => {
    for (let v = 2; v <= 100; v++) {
      const fig = new Map(consume(msgs, v / 100).map((f) => [f.id, NAME[f.fate]]))
      for (const m of run(v * 10, true)) expect(fig.get(m.i), `max_age ${v / 100}, #${m.i}`).toBe(m.fate)
    }
  })
})
