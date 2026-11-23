import RobotTop from './RobotTop'
import { room, sweep } from './sense'
import './robottop.css'

const S = 130, M = 12, O = { x: 0.3, y: 0.5 }, PW = 1.5 * S + 2 * M, PH = S + 2 * M
const X = (x: number) => M + x * S, Y = (y: number) => M + (1 - y) * S

/**
 * On-ramp "simulator": left, the world (the simulator: walls, the robot); right, what the robot believes (the
 * RViz-style view: only its own scan points, nothing else). One scan from sense.sweep() feeds the right side, so
 * moving the wall moves the points; `sensorOn` false empties the view while the world keeps its wall.
 */
export default function SimWhatScene({ wallX, sensorOn = true, worldWord, viewWord, label }: {
  wallX: number; sensorOn?: boolean; worldWord: string; viewWord: string; label: string
}) {
  const walls = room(wallX), hits = sweep(O, walls, 1, 1, Math.PI / 90, !sensorOn)
  return (
    <svg className="simwhat-scene" viewBox={`0 0 ${2 * PW + 10} ${PH + 22}`} role="img" aria-label={label} data-points={hits.length}>
      <g>
        <rect className="sw-pane" width={PW} height={PH} rx={8} />
        {walls.map(([x1, y1, x2, y2], i) => <line key={i} className={i === 4 ? 'ss-wall is-movable' : 'ss-wall'} x1={X(x1)} y1={Y(y1)} x2={X(x2)} y2={Y(y2)} />)}
        <g transform={`translate(${X(O.x)} ${Y(O.y)}) scale(0.7) translate(${-X(O.x)} ${-Y(O.y)})`}><RobotTop x={X(O.x)} y={Y(O.y)} deg={0} mood={sensorOn ? 'idle' : 'worried'} sensor={sensorOn} /></g>
        <text className="sw-cap" x={PW / 2} y={PH + 16} textAnchor="middle">{worldWord}</text>
      </g>
      <g transform={`translate(${PW + 10} 0)`}>
        <rect className="sw-pane is-view" width={PW} height={PH} rx={8} />
        {hits.map((h, i) => <circle key={i} className="ss-hit" cx={X(h.x)} cy={Y(h.y)} r={1.8} />)}
        <circle className="sw-self" cx={X(O.x)} cy={Y(O.y)} r={5} />
        <text className="sw-cap" x={PW / 2} y={PH + 16} textAnchor="middle">{viewWord}</text>
      </g>
    </svg>
  )
}
