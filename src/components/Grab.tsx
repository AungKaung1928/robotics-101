import type { PointerEvent } from 'react'
import { arenaPoint } from '../lib/drag'

/** Invisible 0.4 m handle on the robot inside an Arena: drag it to move the robot; the x/y sliders stay the keyboard path. */
export default function Grab({ x, y, onMove }: { x: number; y: number; onMove: (p: { x: number; y: number }) => void }) {
  const drag = (e: PointerEvent<SVGCircleElement>) => {
    if (e.type === 'pointerdown') e.currentTarget.setPointerCapture(e.pointerId)
    else if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    onMove(arenaPoint(e.clientX, e.clientY, e.currentTarget.ownerSVGElement!.getBoundingClientRect()))
  }
  return <circle className="grab" cx={x} cy={y} r="0.4" onPointerDown={drag} onPointerMove={drag} />
}
