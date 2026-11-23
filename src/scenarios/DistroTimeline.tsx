import { DISTROS, ROS2_FIRST, supportedAt, year, type Distro } from './distros'
import './distros.css'

const W = 640, ROW = 26, TOP = 34, PAD = 108, Y0 = 2017.5, Y1 = 2031.7
const sx = (y: number) => PAD + ((y - Y0) / (Y1 - Y0)) * (W - PAD - 12)

/**
 * Level 0.4 figure: one bar per distribution from release to end of life. Bars fill up to the playhead `at`
 * (fractional year), what is still ahead is an outline; rows not supported at the playhead fade. `mine` is
 * highlighted (the distro the app's examples use), `today` marked.
 */
export default function DistroTimeline({ at, today, mine = 'Humble', label, words }: {
  at: number; today: number; mine?: string; label: string; words: { today: string; lts: string; mine: string; first: string }
}) {
  const H = TOP + DISTROS.length * ROW + 34
  const live = new Set(supportedAt(at).map((d) => d.name))
  const row = (d: Distro, i: number) => {
    const y = TOP + i * ROW, a = year(d.release), b = year(d.eol), fill = Math.min(Math.max(at, a), b)
    return (
      <g key={d.name} className="dt-row" data-ros={d.ros} data-live={live.has(d.name) || undefined} data-mine={d.name === mine || undefined}>
        <text x={PAD - 8} y={y + 13} textAnchor="end">{d.ros === 1 ? 'ROS 1 ' : ''}{d.name}</text>
        <rect className="dt-life" x={sx(a)} y={y + 3} width={sx(b) - sx(a)} height={ROW - 8} rx="3" data-lts={d.lts || undefined} />
        {at > a && <rect className="dt-fill" x={sx(a)} y={y + 3} width={sx(fill) - sx(a)} height={ROW - 8} rx="3" />}
        {d.name === mine && <text className="dt-note" x={sx(b) + 4} y={y + 13}>{words.mine}</text>}
      </g>
    )
  }
  return (
    <svg className="dt" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {Array.from({ length: 7 }, (_, k) => 2018 + 2 * k).map((y) => (
        <g key={y}><line className="dt-grid" x1={sx(y)} x2={sx(y)} y1={TOP - 6} y2={H - 30} /><text className="dt-axis" x={sx(y)} y={H - 14} textAnchor="middle">{y}</text></g>
      ))}
      <line className="dt-first" x1={sx(year(ROS2_FIRST))} x2={sx(year(ROS2_FIRST))} y1={TOP - 6} y2={H - 30} />
      <text className="dt-axis" x={sx(year(ROS2_FIRST))} y={TOP - 12} textAnchor="middle">{words.first}</text>
      {DISTROS.map(row)}
      <line className="dt-today" x1={sx(today)} x2={sx(today)} y1={TOP - 6} y2={H - 30} />
      <text className="dt-axis" x={sx(today)} y={TOP - 12} textAnchor="middle">{words.today}</text>
      <line className="dt-head" x1={sx(at)} x2={sx(at)} y1={TOP - 4} y2={H - 30} />
    </svg>
  )
}
