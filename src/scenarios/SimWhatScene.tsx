import { useState, type PointerEvent } from 'react'
import RobotTop from './RobotTop'
import { sweep } from './sense'
import { roomLayout, type Box } from './room'
import './robottop.css'

const M = 12, PW = 1.5 * 130 + 2 * M, PH = 130 + 2 * M // panel size stays fixed; the world is scaled into it

/** The simulator panel's layout (built-in room or a chapter box). */
export const layout = (wallX: number, box?: Box) => roomLayout(wallX, box, PW, PH, M, 130)
export type { Box }

export default function SimWhatScene({ wallX = 1, box, sensorOn = true, worldWord, viewWord, label, hot0 = null, hot: hotIn, onHot }: {
  wallX?: number; box?: Box; sensorOn?: boolean; worldWord: string; viewWord: string; label: string; hot0?: number | null
  hot?: number | null; onHot?: (wall: number | null) => void
}) {
  const { walls, O, movable, X, Y } = layout(wallX, box), hits = sweep(O, walls, 1, 1, Math.PI / 90, !sensorOn), [own, setOwn] = useState<number | null>(hot0)
  // controlled when the chapter passes `hot` (its text can light a wall, Nicky Case's 'text sets the diagram'); else own state
  const hot = hotIn !== undefined ? hotIn : own
  const setHot = (v: number | null | ((h: number | null) => number | null)) => { const next = typeof v === 'function' ? v(hot) : v; setOwn(next); onHot?.(next) }
  const cls = (base: string, i: number) => `${base}${hot === null ? '' : hot === i ? ' is-hot' : ' is-dim'}`
  // Mouse: hover lights, leave clears. Touch has no hover and fires pointerleave right after pointerup (W3C pointerevents
  // issue #431), so a tap toggles instead and touch enter/leave are ignored. Keyboard: focus / blur.
  const link = (i: number) => ({
    onPointerEnter: (e: PointerEvent) => { if (e.pointerType !== 'touch') setHot(i) },
    onPointerLeave: (e: PointerEvent) => { if (e.pointerType !== 'touch') setHot(null) },
    onPointerDown: (e: PointerEvent) => { if (e.pointerType === 'touch') setHot((h) => (h === i ? null : i)) },
    onFocus: () => setHot(i), onBlur: () => setHot(null),
  })
  return (
    <svg className="simwhat-scene" viewBox={`0 0 ${2 * PW + 10} ${PH + 22}`} role="img" aria-label={label} data-points={hits.length}>
      <g>
        <rect className="sw-pane" width={PW} height={PH} rx={8} />
        {walls.map(([x1, y1, x2, y2], i) => (
          <g key={i} className="sw-link" tabIndex={0} role="button" aria-label={`${worldWord} ${i + 1}`} {...link(i)}>
            <line className="sw-hitarea" x1={X(x1)} y1={Y(y1)} x2={X(x2)} y2={Y(y2)} />
            <line className={cls(i === movable ? 'ss-wall is-movable' : 'ss-wall', i)} x1={X(x1)} y1={Y(y1)} x2={X(x2)} y2={Y(y2)} />
          </g>
        ))}
        <g transform={`translate(${X(O.x)} ${Y(O.y)}) scale(0.7) translate(${-X(O.x)} ${-Y(O.y)})`}><RobotTop x={X(O.x)} y={Y(O.y)} deg={0} mood={sensorOn ? 'idle' : 'worried'} sensor={sensorOn} /></g>
        <text className="sw-cap" x={PW / 2} y={PH + 16} textAnchor="middle">{worldWord}</text>
      </g>
      <g transform={`translate(${PW + 10} 0)`}>
        <rect className="sw-pane is-view" width={PW} height={PH} rx={8} />
        {hits.map((h, i) => <circle key={i} className={cls('ss-hit', h.w)} cx={X(h.x)} cy={Y(h.y)} r={1.8} {...link(h.w)} />)}
        <circle className="sw-self" cx={X(O.x)} cy={Y(O.y)} r={5} />
        <text className="sw-cap" x={PW / 2} y={PH + 16} textAnchor="middle">{viewWord}</text>
      </g>
    </svg>
  )
}
