import Mascot from '../anim/Mascot'
import { arrivalScale } from '../anim/spring'
import { bfs, bfsTimeline, layerAt, pathTo, robotAt } from './bfs'
import './bfswave.css'

/**
 * EP1 figure: the BFS wavefront spreads one layer per `layerS` s from the robot; each cell pops in (PRESS spring)
 * at the moment BFS discovers it, so the ripple is the algorithm's own order. When the front reaches the goal the
 * parent chain is drawn and the robot drives it at `cellS` s per cell, cheering on arrival.
 */
export default function BfsWave({ w, h, blocked, start, goal, t, layerS = 0.25, cellS = 0.3, label }: {
  w: number; h: number; blocked: boolean[]; start: number; goal: number; t: number; layerS?: number; cellS?: number; label: string
}) {
  const r = bfs(w, h, blocked, start), path = pathTo(r, goal), gd = r.dist[goal]
  const reach = gd >= 0 ? gd : Math.max(...r.dist)
  const tl = bfsTimeline(reach, layerS, cellS), layer = layerAt(t, layerS, reach)
  const xy = (c: number) => [c % w + 0.5, Math.floor(c / w) + 0.5]
  const found = gd >= 0 && t >= tl.found
  const k = robotAt(t, tl.found, cellS, path.length), i0 = Math.floor(k), f = k - i0
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
        return <rect key={c} className={d === layer && !found ? 'front' : 'seen'} x={x - 0.45} y={y - 0.45} width={0.9} height={0.9} rx={0.15}
          transform={`translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`} />
      })}
      <circle className="goal" cx={gx} cy={gy} r={0.3} />
      {found && <polyline className="path" points={path.map((c) => xy(c).join(',')).join(' ')} />}
      <g transform={`translate(${rx - 0.55} ${ry - 0.6}) scale(${1.1 / 64})`}>
        <Mascot inSvg label="" cheer={gd >= 0 && t >= tl.end ? 1 : 0} thinking={!found} />
      </g>
    </svg>
  )
}
