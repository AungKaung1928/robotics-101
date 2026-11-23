import Mascot from '../anim/Mascot'
import { arrivalScale } from '../anim/spring'
import { bfs, bfsTimeline, layerAt, pathTo, robotAt, tracedCells } from './bfs'
import './bfswave.css'

/**
 * EP1 figure: the BFS wavefront spreads one layer per `layerS` s from the robot; each cell pops in (PRESS spring)
 * at the moment BFS discovers it, so the ripple is the algorithm's own order. Each reached cell carries an arrow to the
 * cell it was reached from (came_from, as redblobgames.com/pathfinding/a-star/implementation.html draws it). When the front reaches the goal the
 * parent chain is walked back from the goal (how BFS recovers the path: each cell only knows its parent), then the robot drives it at `cellS` s per cell, cheering on arrival.
 */
export default function BfsWave({ w, h, blocked, start, goal, t, layerS = 0.25, cellS = 0.3, traceS = 0.06, label, onCell }: {
  w: number; h: number; blocked: boolean[]; start: number; goal: number; t: number; layerS?: number; cellS?: number; traceS?: number; label: string
  onCell?: (c: number) => void // break-it: the chapter flips the cell (toggleCell) and the search reruns
}) {
  const r = bfs(w, h, blocked, start), path = pathTo(r, goal), gd = r.dist[goal]
  const reach = gd >= 0 ? gd : Math.max(...r.dist)
  const tl = bfsTimeline(reach, layerS, cellS, traceS), layer = layerAt(t, layerS, reach)
  const xy = (c: number) => [c % w + 0.5, Math.floor(c / w) + 0.5]
  const found = gd >= 0 && t >= tl.found
  const shown = path.slice(path.length - tracedCells(t, tl.found, traceS, path.length))
  const k = robotAt(t, tl.traced, cellS, path.length), i0 = Math.floor(k), f = k - i0
  const [ax, ay] = xy(path[i0] ?? start), [bx, by] = xy(path[Math.min(i0 + 1, path.length - 1)] ?? start)
  const rx = ax + (bx - ax) * f, ry = ay + (by - ay) * f
  const [gx, gy] = xy(goal)
  return (
    <svg className="inset bfs" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} data-layer={layer}>
      {Array.from({ length: w * h }, (_, c) => {
        const [x, y] = xy(c)
        if (blocked[c]) return <rect key={c} className="wall" x={x - 0.5} y={y - 0.5} width={1} height={1} />
        const d = r.dist[c]
        if (d < 0 || d > layer) return null
        const s = arrivalScale(t - d * layerS)
        const front = d === layer && !found
        const p = r.parent[c], deg = p < 0 ? 0 : (Math.atan2(Math.floor(p / w) - Math.floor(c / w), (p % w) - (c % w)) * 180) / Math.PI
        return (
          <g key={c} transform={`translate(${x} ${y}) scale(${s})`}>
            <rect className={front ? 'front' : 'seen'} x={-0.45} y={-0.45} width={0.9} height={0.9} rx={0.15} />
            {p >= 0 && <path className={front ? 'came on-front' : 'came'} d="M-0.18 0 L0.2 0 M0.08 -0.11 L0.2 0 L0.08 0.11" transform={`rotate(${deg})`} />}
          </g>
        )
      })}
      {onCell && Array.from({ length: w * h }, (_, c) => (
        <rect key={`hit${c}`} className="cell-hit" x={c % w} y={Math.floor(c / w)} width={1} height={1} onClick={() => onCell(c)} />
      ))}
      <circle className="goal" cx={gx} cy={gy} r={0.3} />
      {found && shown.length > 1 && <polyline className="path" points={shown.map((c) => xy(c).join(',')).join(' ')} />}
      <g transform={`translate(${rx - 0.55} ${ry - 0.6}) scale(${1.1 / 64})`}>
        <Mascot inSvg label="" cheer={gd >= 0 && t >= tl.end ? 1 : 0} thinking={!found} />
      </g>
    </svg>
  )
}
