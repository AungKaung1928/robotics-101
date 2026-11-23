import { MascotFigure } from '../anim/Mascot'
import { REST } from '../anim/mascot'
import { LAYERS, layerAt, type Layer } from './stack'
import './stack.css'

const W = 640, H = 330, BASE = 300, ROWH = 52, X = 150, WIDTH = 340, SEP = 10

/**
 * Level 0.3 figure: the tools land one by one onto what they need, bottom-up. `words[id]` = name and a short role
 * line; the robot hops onto the top layer once it lands (your code is what makes it move).
 */
export default function ToolStack({ t, words, label }: { t: number; label: string; words: Record<Layer['id'], { name: string; role: string }> }) {
  return (
    <svg className="ts" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <line className="ts-ground" x1={X - 30} x2={X + WIDTH + 30} y1={BASE} y2={BASE} />
      {LAYERS.map((l, i) => {
        const s = layerAt(i, t)
        if (!s.shown) return null
        const w = l.col === null ? WIDTH : (WIDTH - SEP) / 2, x = X + (l.col === 1 ? w + SEP : 0)
        const bottom = BASE - l.slot * (ROWH + 4), y = bottom - ROWH
        return (
          <g key={l.id} className="ts-layer" data-id={l.id}
            transform={`translate(0 ${-s.lift}) translate(0 ${bottom}) scale(1 ${s.sy}) translate(0 ${-bottom})`}>
            <rect x={x} y={y} width={w} height={ROWH} rx="10" />
            <text className="ts-name" x={x + w / 2} y={y + 22} textAnchor="middle">{words[l.id].name}</text>
            <text className="ts-role" x={x + w / 2} y={y + 40} textAnchor="middle">{words[l.id].role}</text>
            {l.id === 'app' && s.lift === 0 && (
              <g transform={`translate(${x + w - 58} ${y - 50})`}><MascotFigure pose={REST} mood="happy" size={52} label="" /></g>
            )}
          </g>
        )
      })}
    </svg>
  )
}
