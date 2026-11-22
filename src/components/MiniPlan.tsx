import { OBSTACLES, WAYPOINTS } from '../content/world'
import type { Strings } from '../i18n'
import { CHAPTERS, type ChapterId } from '../lib/route'

/** The overview plan in small: patrol loop with the current waypoint lit; every dot opens its chapter. */
export default function MiniPlan({ current, t }: { current: ChapterId; t: Strings }) {
  const path = WAYPOINTS.map(({ x, y }, i) => `${i ? 'L' : 'M'}${x} ${-y}`).join('') + 'Z'
  return (
    <nav className="miniplan" aria-label={t.plan}>
      <svg viewBox="-5.2 -5.2 10.4 10.4">
        <rect className="mp-wall" x="-5" y="-5" width="10" height="10" />
        {OBSTACLES.map((o) =>
          o.kind === 'disc' ? <circle key={o.name} className="mp-occ" cx={o.x} cy={-o.y} r={o.r} />
            : <rect key={o.name} className="mp-occ" x={-o.w / 2} y={-o.h / 2} width={o.w} height={o.h} transform={`translate(${o.x} ${-o.y}) rotate(${(-o.yaw * 180) / Math.PI})`} />)}
        <path className="mp-path" d={path} />
        {CHAPTERS.map((c, i) => (
          <a key={c} href={`#/${c}`} aria-label={`${i + 1}. ${t.chapters[c]}`} aria-current={c === current ? 'step' : undefined}>
            <circle className={c === current ? 'mp-wp mp-here' : 'mp-wp'} cx={WAYPOINTS[i].x} cy={-WAYPOINTS[i].y} r={c === current ? 0.7 : 0.45} />
          </a>
        ))}
      </svg>
    </nav>
  )
}
