import type { Mood } from './robotmood'

/** Eyes of the round robot, drawn in the robot's own frame (it faces +x); k scales a 19-unit body. */
export default function Face({ mood, k = 1 }: { mood: Mood; k?: number }) {
  const ex = 10 * k, ey = 6 * k, r = 2.5 * k
  const eyes = [-ey, ey]
  return (
    <g className={`face is-${mood}`} data-mood={mood}>
      {eyes.map((y) => mood === 'dizzy'
        ? <g key={y}><line x1={ex - r} y1={y - r} x2={ex + r} y2={y + r} /><line x1={ex - r} y1={y + r} x2={ex + r} y2={y - r} /></g>
        : mood === 'proud'
          ? <path key={y} d={`M ${ex - r} ${y - r * 1.2} Q ${ex + r * 1.6} ${y} ${ex - r} ${y + r * 1.2}`} />
          : <circle key={y} cx={mood === 'curious' ? ex + 1.5 * k : ex} cy={y} r={mood === 'curious' ? r * 1.3 : r} />)}
    </g>
  )
}
