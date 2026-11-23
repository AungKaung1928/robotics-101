import { useMemo, useState, type KeyboardEvent } from 'react'
import Player from '../../anim/Player'
import { STRINGS, type Strings } from '../../i18n'
import Gloss from '../l1/Gloss'
import '../l1/l1.css'
import { GOAL, H, START, W, cellOf, initialWalls, inGoal, key, nearWall, pathCost, scenario, steps, type Order } from './bfs'
import { BFS_STRINGS } from './bfs.strings'
import './ep.css'

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const CS = 40 // px per cell in the SVG

/** EP1: BFS on an occupancy grid. The animation is the model's own pop order; clicks and break-it rebuild it. */
export default function BfsChapter({ t }: { t: Strings }) {
  const s = BFS_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const [walls, setWalls] = useState(initialWalls)
  const [order, setOrder] = useState<Order>('queue')
  const sc = useMemo(() => scenario(walls, order), [walls, order])
  const r = sc.result
  const [tS, setTS] = useState(() => (still() ? Infinity : 0))
  const now = Math.min(tS, sc.durationMs / 1000)
  const f = sc.frame(now * 1000)
  const restart = () => setTS(Infinity) // a changed map shows its end frame at once; Play replays it
  const [focus, setFocus] = useState(key(START)) // one tab stop for the grid; arrow keys move it (roving tabindex)
  const ARROWS: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }
  const onKey = (e: KeyboardEvent<SVGRectElement>, k: number) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(k); return }
    const d = ARROWS[e.key]
    if (!d) return
    e.preventDefault()
    const [x, y] = cellOf(k), nx = Math.max(0, Math.min(W - 1, x + d[0])), ny = Math.max(0, Math.min(H - 1, y + d[1]))
    const nk = key([nx, ny])
    setFocus(nk)
    e.currentTarget.parentElement?.querySelector<SVGRectElement>(`[data-cell="${nk}"]`)?.focus()
  }
  const toggle = (k: number) => {
    if (k === key(START) || k === key(GOAL)) return
    const w = new Set(walls)
    if (!w.delete(k)) w.add(k)
    setWalls(w); restart()
  }
  const queued = [...f.states.values()].filter((v) => v === 'queued').length
  const len = steps(r)
  const lenTxt = len === null ? s.none : String(len)
  const ok = order === 'queue' && inGoal(r)
  const cost = order === 'cost'
  return (
    <>
      <div className="figure">
        <svg className="bfs" viewBox={`0 0 ${W * CS} ${H * CS}`} role="group" aria-label={s.figLabel}>
          {Array.from({ length: W * H }, (_, k) => {
            const [x, y] = cellOf(k)
            const wall = walls.has(k)
            const st = (wall ? 'wall' : f.states.get(k) ?? '') + (cost && !wall && nearWall(k, walls) ? ' near' : '')
            return (
              <rect key={k} className={`c ${st}${f.current === k && !f.showPath ? ' cur' : ''}`} x={x * CS} y={y * CS} width={CS} height={CS}
                role="button" tabIndex={k === focus ? 0 : -1} data-cell={k} aria-label={s.cellLabel(x, y, wall)} aria-pressed={wall}
                onClick={() => { setFocus(k); toggle(k) }} onKeyDown={(e) => onKey(e, k)} />
            )
          })}
          <text x={START[0] * CS + CS / 2} y={START[1] * CS + CS / 2}>S</text>
          <text x={GOAL[0] * CS + CS / 2} y={GOAL[1] * CS + CS / 2}>G</text>
        </svg>
        <p className="bfs-legend">
          <span><i style={{ background: 'var(--ray)', opacity: 0.5 }} />{s.legendQueued}</span>
          <span><i style={{ background: 'var(--cost)', opacity: 0.5 }} />{s.legendDone}</span>
          <span><i style={{ background: 'var(--robot)' }} />{s.legendPath}</span>
          {cost && <span><i style={{ background: 'var(--cost)', opacity: 0.2 }} />{s.legendNear}</span>}
        </p>
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t}
          caption={s.caption(f.k, r.popped.length, queued)} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        {cost ? (
          <pre className="code" aria-label="Python">
            <span className="ln">import heapq</span>
            <span className="ln">frontier = [(0, start)]; best = {'{start: 0}'}</span>
            <span className="ln">while frontier:</span>
            <span className="ln on">    c, cell = heapq.heappop(frontier)   <span className="cmt"># cheapest first</span></span>
            <span className="ln">    if cell == goal: break</span>
            <span className="ln">    if c {'>'} best[cell]: continue   <span className="cmt"># older, dearer entry</span></span>
            <span className="ln">    for n in neighbours(cell):</span>
            <span className="ln">        nc = c + cost(n)   <span className="cmt"># 1, or 5 by a wall</span></span>
            <span className="ln">        if nc {'<'} best.get(n, inf):</span>
            <span className="ln">            best[n] = nc; parent[n] = cell</span>
            <span className="ln">            heapq.heappush(frontier, (nc, n))</span>
          </pre>
        ) : (
          <pre className="code" aria-label="Python">
            <span className="ln">from collections import deque</span>
            <span className="ln">queue = deque([start]); parent = {'{start: None}'}</span>
            <span className="ln">while queue:</span>
            <span className="ln on">    cell = queue.<span className={order === 'stack' ? 'bad' : ''}>{order === 'queue' ? 'popleft()' : 'pop()'}</span>   <span className="cmt"># {order === 'queue' ? 'oldest first' : 'newest first'}</span></span>
            <span className="ln">    if cell == goal: break</span>
            <span className="ln">    for n in neighbours(cell):   <span className="cmt"># free cells, 4 ways</span></span>
            <span className="ln">        if n not in parent:</span>
            <span className="ln">            parent[n] = cell; queue.append(n)</span>
          </pre>
        )}
        <p className="runs">{s.runsHere} {s.clickHint}</p>
        <p>
          {!cost && <button type="button" className="break" onClick={() => { setOrder(order === 'queue' ? 'stack' : 'queue'); restart() }}>{order === 'stack' ? s.fixIt : s.breakIt}</button>}{' '}
          <button type="button" className="costmap" aria-pressed={cost} onClick={() => { setOrder(cost ? 'queue' : 'cost'); restart() }}>{cost ? s.costOff : s.costOn}</button>{' '}
          <button type="button" onClick={() => { setWalls(initialWalls()); restart() }}>{s.reset}</button>
        </p>
        {order === 'stack' && <p className="note">{s.brokenNote}</p>}
        {cost && <p className="note">{s.costNote}</p>}
        <dl className="readout">
          <div><dt>{s.pathLen}</dt><dd data-k="len">{lenTxt}</dd></div>
          {cost && r.path && <div><dt>{s.pathCost}</dt><dd data-k="cost">{pathCost(r.path, walls)}</dd></div>}
          <div><dt>{s.visited}</dt><dd data-k="visited">{r.popped.length}</dd></div>
          <div><dt>{s.maxQueue}</dt><dd data-k="maxq">{r.maxQueue}</dd></div>
        </dl>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? '✓ ' + s.solved : s.notYet} {lenTxt}</p>
        <p className="group-h">{s.costTitle}</p>
        {s.cost.map((l) => <p key={l}>{l}</p>)}
        <p className="group-h">{s.words}</p>
        <Gloss items={s.glossary} />
        <p className="src">{t.source}: <a href="https://docs.python.org/3/library/collections.html#collections.deque">Python docs: collections.deque</a> · <a href="https://github.com/ros-navigation/navigation2/blob/humble/nav2_costmap_2d/include/nav2_costmap_2d/cost_values.hpp#L42-L46">nav2_costmap_2d cost_values.hpp:42-46 (Humble)</a> · <a href="https://docs.nav2.org/configuration/packages/configuring-navfn.html">Nav2: NavFn planner (use_astar)</a> · <a href="https://docs.nav2.org/configuration/packages/costmap-plugins/inflation.html">Nav2: inflation layer</a></p>
      </div>
    </>
  )
}
