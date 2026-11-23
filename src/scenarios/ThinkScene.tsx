import { useRef } from 'react'
import RobotTop from './RobotTop'
import { useTextWidth } from './fit'
import { BOUNCY, arrivalScale, springAt } from '../anim/spring'
import { room } from './sense'
import { thinkRun, thinkX } from './think'
import './robottop.css'

const S = 280, M = 20, Y0 = 0.5, VW = 2 * M + 1.5 * S
const X = (x: number) => M + x * S, Y = (y: number) => M + (1 - y) * S

/**
 * On-ramp "think": the robot drives at v toward the wall at `wallX`; its thought bubble holds the rule
 * "d < stopAt -> stop". When the rule fires the bubble lights with a pop and the robot is proud; if it never fires
 * (stopAt under the sensor's 0.12 m) the robot hits the wall: a squash on a bouncy spring and dizzy stars. From think.ts.
 */
export default function ThinkScene({ stopAt, t, v = 0.2, wallX = 1.2, stopWord = 'stop', label }: {
  stopAt: number; t: number; v?: number; wallX?: number; stopWord?: string; label: string
}) {
  const ref = useRef<SVGSVGElement>(null), rule = `d < ${stopAt.toFixed(2)} m → ${stopWord}`
  const bw = Math.max(150, useTextWidth(ref, '.tk-bubble text', rule) + 28) // bubble grows with the words
  const walls = room(wallX), run = thinkRun(stopAt, v, walls), x = thinkX(run, v, t), done = t >= run.tStop
  const since = t - run.tStop, fired = run.fired && done, bumped = run.bumped && done
  const sx = bumped ? 1 + springAt(since, BOUNCY, -0.22) : 1 // squash against the wall, springs back with overshoot
  const pop = fired ? arrivalScale(since) : 1, bx = Math.max(M + 34, Math.min(X(x), VW - M - bw + 24)), by = Y(Y0) - 98 // bubble inside the room, above the wall top
  return (
    <svg ref={ref} className="think-scene" viewBox={`0 0 ${VW} ${2 * M + S}`} role="img" aria-label={label} data-state={fired ? 'fired' : bumped ? 'bumped' : 'driving'}>
      {walls.map(([x1, y1, x2, y2], i) => <line key={i} className={i === 4 ? 'ss-wall is-movable' : 'ss-wall'} x1={X(x1)} y1={Y(y1)} x2={X(x2)} y2={Y(y2)} />)}
      <line className="ts-mark" x1={X(wallX - stopAt)} x2={X(wallX - stopAt)} y1={Y(0.32)} y2={Y(0.68)} />
      <g transform={`translate(${X(x) + 20} ${Y(Y0)}) scale(${sx} ${1 / sx}) translate(${-X(x) - 20} ${-Y(Y0)})`}>
        <RobotTop x={X(x)} y={Y(Y0)} deg={0} rolledL={(x - 0.3) * S} rolledR={(x - 0.3) * S} mood={bumped ? 'dizzy' : fired ? 'proud' : 'curious'} t={since} />
      </g>
      <g className={fired ? 'tk-bubble is-fired' : 'tk-bubble'}>{/* tail on the robot's head, bubble clamped */}
        <circle cx={X(x) - 6} cy={Y(Y0) - 32} r={3} /><circle cx={X(x) - 11} cy={Y(Y0) - 45} r={4.5} /><circle cx={X(x) - 14} cy={Y(Y0) - 62} r={6} />
      </g>
      <g className={fired ? 'tk-bubble is-fired' : 'tk-bubble'} transform={`translate(${bx} ${by}) scale(${pop})`}>
        <rect x={-30} y={-16} width={bw} height={32} rx={16} />
        <text x={-30 + bw / 2} y={5} textAnchor="middle">{rule}</text>
      </g>
    </svg>
  )
}
