import { LAUNCH_NAV2_S, LIDAR, NAV2, OBSTACLES, TF_MAX_JUMP, WAYPOINTS } from '../content/world'
import type { Strings } from '../i18n'
import { beamGap } from '../lib/scan'
import { CHAPTERS, type ChapterId } from '../lib/route'
import Arena from './Arena'

const gapCm = (beamGap(LIDAR.maxRange, LIDAR.samples, LIDAR.minAngle, LIDAR.maxAngle) * 100).toFixed(1)
// One value per waypoint, read from the tracked constants; kind = where the value comes from.
const VALUE: Record<ChapterId, { v: string; kind: 'config' | 'formula' }> = {
  bringup: { v: `Nav2 @ ${LAUNCH_NAV2_S} s`, kind: 'config' },
  tf: { v: `jump > ${TF_MAX_JUMP} m`, kind: 'config' },
  scan: { v: `${gapCm} cm @ ${LIDAR.maxRange} m`, kind: 'formula' },
  detect: { v: `${OBSTACLES.length} obstacles`, kind: 'config' },
  grid: { v: `${NAV2.costmapResolution} m cells`, kind: 'config' },
  costmap: { v: `k = ${NAV2.costScaling.toFixed(1)}`, kind: 'config' },
  goal: { v: `± ${NAV2.goalTolerance} m`, kind: 'config' },
}

export default function Overview({ t }: { t: Strings }) {
  const path = WAYPOINTS.map(({ x, y }, i) => `${i ? 'L' : 'M'}${x} ${y}`).join('') + 'Z'
  const labels = CHAPTERS.map((c, i) => {
    const { x, y, side } = WAYPOINTS[i]
    const left = side === 'left'
    const body = (
      <g className={`wp${c.built ? '' : ' wp-planned'}`} transform={`translate(${x} ${-y})`}>
        <circle r="0.32" />
        <text className="wp-n" y="0.11">{i + 1}</text>
        <g transform={`translate(${left ? -0.5 : 0.5} 0)`} textAnchor={left ? 'end' : 'start'}>
          <text className="wp-title" y="-0.08">{t.chapters[c.id]}</text>
          <text className="wp-value" y="0.3">
            {c.built ? VALUE[c.id].v : t.planned}
            {c.built && <tspan className="wp-kind"> · {t.kind[VALUE[c.id].kind]}</tspan>}
          </text>
        </g>
      </g>
    )
    return c.built ? <a key={c.id} href={`#/${c.id}`} aria-label={`${i + 1}. ${t.chapters[c.id]}`}>{body}</a> : <g key={c.id}>{body}</g>
  })
  return (
    <main className="overview">
      <div className="ov-text">
        <h1>{t.title}</h1>
        <p className="lede">{t.lede}</p>
        <p className="note">{t.pathNote}</p>
      </div>
      <Arena label={t.open} overlay={labels}>
        <path className="patrol" d={path} />
      </Arena>
    </main>
  )
}
