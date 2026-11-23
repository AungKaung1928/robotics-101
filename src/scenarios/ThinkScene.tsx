import { useRef } from 'react'
import RobotTop from './RobotTop'
import { useTextWidth } from './fit'
import { BOUNCY, arrivalScale, springAt } from '../anim/spring'
import { cast, room } from './sense'
import { RADIUS, thinkRun, thinkX } from './think'
import { roomLayout } from './room'
import './robottop.css'

const S = 280, M = 20, VW = 2 * M + 1.5 * S, VH = 2 * M + S

/** The chapter's own model (src/chapters/l0/think.ts = l1/decide): d = the robot's FRONT to the wall, one decision per
 * scan, starting startM away; run(stopAt) gives where it stopped (final) or that it crashed. */
export type ThinkModel = { run: (stopAt: number) => { final: number; crashed: boolean; stopS: number }; speed: number; startM: number }

type Out = { stopX: number; tStop: number; fired: boolean; bumped: boolean }
/** Geometry and outcomes for the built-in model (think.ts: centre reading, 0.12 m sensor floor) or a chapter model. */
function simOf(wallX: number, v: number, model?: ThinkModel) {
  if (!model) {
    const walls = room(wallX), L = roomLayout(wallX, undefined, VW, VH, M, S)
    const out = (a: number): Out => thinkRun(a, v, walls)
    // d = the centre reading (null under the sensor's floor), measured from the robot's centre
    return { ...L, y0: 0.5, x0: 0.3, out, xAt: (r: Out, t: number) => thinkX(r as never, v, t), mark: (a: number) => wallX - a,
      from: (x: number) => x, wallAt: wallX, reading: (x: number) => cast({ x, y: 0.5 }, 0, walls) }
  }
  const { run, speed, startM } = model, wall = startM + RADIUS // robot centre starts at 0, its front RADIUS ahead
  // side 0.75: deep enough that the thought bubble stays inside the room
  const L = roomLayout(0, { back: -0.35, front: wall, side: 0.75, maxFront: wall }, VW, VH, M, S)
  const out = (a: number): Out => { const r = run(a); return { stopX: startM - r.final, tStop: r.crashed ? startM / speed : r.stopS, fired: !r.crashed, bumped: r.crashed } }
  return { ...L, y0: 0, x0: 0, out, xAt: (r: Out, t: number) => Math.min(speed * Math.max(0, t), r.stopX), mark: (a: number) => wall - a,
    from: (x: number) => x + RADIUS, wallAt: wall, reading: (x: number): number | null => Math.max(0, startM - x) } // d from the front
}

/**
 * On-ramp "think": the robot drives at v toward the wall at `wallX`; its thought bubble holds the rule
 * "d < stopAt -> stop". When the rule fires the bubble lights with a pop and the robot is proud; if it never fires
 * (stopAt under the sensor's 0.12 m) the robot hits the wall: a squash on a bouncy spring and dizzy stars. From think.ts,
 * or from the chapter's own model via `model` (then d is measured from the robot's front, as the chapter says).
 */
export default function ThinkScene({ stopAt, t, v = 0.2, wallX = 1.2, stopWord = 'stop', ladder, model, label }: {
  stopAt: number; t: number; v?: number; wallX?: number; stopWord?: string; ladder?: number[]; model?: ThinkModel; label: string
}) {
  const ref = useRef<SVGSVGElement>(null), rule = `d < ${stopAt.toFixed(2)} m → ${stopWord}`
  const bw = Math.max(150, useTextWidth(ref, '.tk-bubble text', rule) + 28) // bubble grows with the words
  const sim = simOf(wallX, v, model), { walls, movable, X, Y } = sim, Y0 = sim.y0
  const run = sim.out(stopAt), x = sim.xAt(run, t), done = t >= run.tStop
  const since = t - run.tStop, fired = run.fired && done, bumped = run.bumped && done
  const sx = bumped ? 1 + springAt(since, BOUNCY, -0.22) : 1 // squash against the wall, springs back with overshoot
  const pop = fired ? arrivalScale(since) : 1, by0 = Y(Y0), bx = Math.max(M + 34, Math.min(X(x), VW - M - bw + 24)), by = Y(Y0) - 98 // bubble inside the room, above the wall top
  // The d the rule reads, drawn at sensor height: a line from where d is measured to the wall, its value on top; lit while d < stopAt.
  // '?' = the sensor sees nothing (built-in model under 0.12 m): the reader sees why a tiny rule never fires.
  const d = sim.reading(x), dOn = d !== null && d < stopAt, dy = Y(Y0), d0 = X(sim.from(x)), d1 = X(d === null ? sim.wallAt : sim.from(x) + d)
  const dText = d === null ? 'd = ?' : `d = ${d.toFixed(2)} m`, dw = dText.length * 8.4 // 14 px monospace: 0.6 em per letter
  const wide = d1 - d0 > dw + 10
  const beyond = !wide && d1 + 8 + dw < VW - M // short line, room past the wall (built-in room): label there
  const [dx, anchor] = wide ? [(d0 + d1) / 2, 'middle' as const] : beyond ? [d1 + 8, 'start' as const] : [d1 - 6, 'end' as const]
  const ly = wide ? dy - 6 : beyond ? dy - 26 : dy + 54 // else under the robot and the ladder row (+34), clear of the bubble tail
  return (
    <svg ref={ref} className="think-scene" viewBox={`0 0 ${VW} ${VH}`} role="img" aria-label={label} data-state={fired ? 'fired' : bumped ? 'bumped' : 'driving'}>
      {walls.map(([x1, y1, x2, y2], i) => <line key={i} className={i === movable ? 'ss-wall is-movable' : 'ss-wall'} x1={X(x1)} y1={Y(y1)} x2={X(x2)} y2={Y(y2)} />)}
      {/* up the ladder of abstraction (Victor): where the robot would end for every stopAt in `ladder`, faint; a bump = x */}
      {ladder?.map((a) => { const r = sim.out(a), cx = X(r.stopX); return r.bumped
        ? <path key={a} className="tk-rung is-bump" d={`M${cx - 4} ${Y(Y0) + 30}l8 8m0 -8l-8 8`} />
        : <circle key={a} className={a === stopAt ? 'tk-rung is-pick' : 'tk-rung'} cx={cx} cy={Y(Y0) + 34} r={a === stopAt ? 5 : 4} /> })}
      <line className="ts-mark" x1={X(sim.mark(stopAt))} x2={X(sim.mark(stopAt))} y1={by0 - 50} y2={by0 + 50} />
      <g transform={`translate(${X(x) + 20} ${Y(Y0)}) scale(${sx} ${1 / sx}) translate(${-X(x) - 20} ${-Y(Y0)})`}>
        <RobotTop x={X(x)} y={Y(Y0)} deg={0} rolledL={X(x) - X(sim.x0)} rolledR={X(x) - X(sim.x0)} mood={bumped ? 'dizzy' : fired ? 'proud' : 'curious'} t={since} />
      </g>
      <g className={dOn ? 'tk-d is-on' : d === null ? 'tk-d is-blind' : 'tk-d'} data-d={d === null ? 'none' : d.toFixed(2)}>
        <line x1={d0} x2={d1} y1={dy} y2={dy} /><line x1={d1} x2={d1} y1={dy - 4} y2={dy + 4} />
        {/* room on the line: centred above it; near the wall: beyond the wall if the room goes on, else below the robot */}
        <text x={dx} y={ly} textAnchor={anchor}>{dText}</text>
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
