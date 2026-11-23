import { NODES, byId, type NodeId, type NodesScene } from './nodes'
import './l2.css'

const W = 640, H = 365, BW = 264, BH = 42
const px = (x: number) => (x ? 488 : 152)
const py = (y: number) => 30 + y * 92
export type NodeState = 'ok' | 'starved' | 'off'

/**
 * The 2.1 node graph (layered: a node sits below what it needs). With onToggle the boxes are buttons (chapter 2.1);
 * without it the graph is a picture (Level 2 intro).
 */
export default function NodeGraph({ f, label, legend, stopped, onToggle, stateName }: {
  f: NodesScene; label: string; legend?: string; stopped?: Set<NodeId>
  onToggle?: (id: NodeId) => void; stateName: Record<NodeState, string>
}) {
  const state = (id: NodeId): NodeState => (f.working.includes(id) ? 'ok' : f.started.includes(id) ? 'starved' : 'off')
  return (
    <svg className="side graph" viewBox={`0 0 ${W} ${H}`} role={onToggle ? 'group' : 'img'} aria-label={label}>
      {NODES.flatMap((n) => n.needs.map((d) => {
        const a = byId[d]
        const live = f.working.includes(d) && f.working.includes(n.id)
        const [x1, y1, x2, y2] = [px(a.x), py(a.y) + BH / 2, px(n.x), py(n.y) - BH / 2]
        // a link that skips a layer in the same column bends outward so it never runs through the box between
        const bend = a.x === n.x && n.y - a.y > 1 ? (a.x ? 110 : -110) : 0
        return <path key={`${d}-${n.id}`} className={`edge${live ? ' live' : ''}`}
          d={`M${x1} ${y1} C${x1 + bend} ${y1 + 40} ${x2 + bend} ${y2 - 40} ${x2} ${y2}`} />
      }))}
      {NODES.map((n) => {
        const box = (
          <>
            <rect x={px(n.x) - BW / 2} y={py(n.y) - BH / 2} width={BW} height={BH} />
            <text x={px(n.x)} y={py(n.y) + 6} textAnchor="middle">{n.name.split(' ')[0]}</text>
          </>
        )
        return onToggle ? (
          <g key={n.id} className={`nd ${state(n.id)}`} role="button" tabIndex={0} aria-pressed={stopped?.has(n.id) ?? false}
            aria-label={`${n.name}: ${stateName[state(n.id)]}`} onClick={() => onToggle(n.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(n.id) } }}>{box}</g>
        ) : <g key={n.id} className={`nd still ${state(n.id)}`}>{box}</g>
      })}
      {legend && <text className="legend" x={W - 10} y={H - 8} textAnchor="end">{legend}</text>}
    </svg>
  )
}
