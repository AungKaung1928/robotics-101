import type { ReactNode } from 'react'
import { SCAN_HZ, type DecideScene } from './decide'

const W = 640, H = 175, WALL = 600, PX = 260 // px per metre: the 2 m start fits left of the wall
const FLOOR = 130, LEN = 0.14 * PX // robot body ~14 cm long

/** Side view shared by 1.1 and 1.4: robot, wall, stop_at line, the scan beam pulsing at 5 Hz. */
export default function RobotSide({ f, stopAt, tS, label, crashed, children, plain }: {
  f: DecideScene; stopAt: number; tS: number; label: string; crashed: string; children?: ReactNode
  /** Level 0 "think" shows the same figure without code words. */
  plain?: { line: string; distance: (m: string) => string; go: string; stop: string }
}) {
  const front = WALL - f.distance * PX
  return (
    <svg className="side" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <line className="floor" x1={10} x2={WALL} y1={FLOOR} y2={FLOOR} />
      <rect className="wall" x={WALL} y={20} width={14} height={FLOOR - 20} />
      <line className="stopline" x1={WALL - stopAt * PX} x2={WALL - stopAt * PX} y1={30} y2={FLOOR} />
      <text x={WALL - stopAt * PX} y={20} textAnchor="middle">{plain ? plain.line : 'stop_at'}</text>
      {!f.crashed && f.distance > 0 && <line className="beam" x1={front} x2={WALL} y1={FLOOR - 26} y2={FLOOR - 26} opacity={1 - ((tS * SCAN_HZ) % 1) * 0.7} />}
      <g className={f.crashed ? 'is-crash' : ''}>
        <rect className="body" x={front - LEN} y={FLOOR - 40} width={LEN} height={30} rx={3} />
        <circle className="wheel" cx={front - LEN / 2} cy={FLOOR - 8} r={8} />
      </g>
      <text x={(front + WALL) / 2} y={FLOOR + 30} textAnchor="middle">{plain ? plain.distance(f.distance.toFixed(2)) : `distance = ${f.distance.toFixed(2)} m`}</text>
      <text className={`tag ${f.crashed ? 'stop' : f.decision}`} x={front - LEN / 2} y={FLOOR - 50} textAnchor="middle">{f.crashed ? crashed : plain ? plain[f.decision] : f.decision}</text>
      {children}
    </svg>
  )
}
