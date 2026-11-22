import { useState } from 'react'
import { MEASURED, NAV2, SOURCE_REPO } from '../content/world'
import type { Strings } from '../i18n'
import { driveDistance, minTime, ticksToGoal } from '../lib/goal'
import Arena from './Arena'
import Slider from './Slider'

const START: [number, number] = [-3.5, -0.8]
const { goalTolerance: TOL, maxVelX: V, controllerHz: HZ } = NAV2
const STEP = V / HZ

export default function GoalChapter({ t }: { t: Strings }) {
  const s = t.goal
  const [d, setD] = useState(4)
  const drive = driveDistance(d, TOL)
  const ticks = ticksToGoal(d, TOL, V, HZ)
  const [sx, sy] = START
  const dots = Array.from({ length: Math.floor(ticks / 10) }, (_, i) => sx + (i + 1) * 10 * STEP)
  return (
    <>
      <div className="figure">
        <Arena label={t.chapters.goal}>
          <circle className="tol" cx={sx + d} cy={sy} r={TOL} />
          <path className="goal-x" d={`M${sx + d - 0.1} ${sy - 0.1}l0.2 0.2M${sx + d - 0.1} ${sy + 0.1}l0.2 -0.2`} />
          <path className="track" d={`M${sx} ${sy}H${sx + drive}`} />
          {dots.map((x) => <circle key={x} className="tickdot" cx={x} cy={sy} r="0.025" />)}
          <circle className="robot" cx={sx + drive} cy={sy} r={NAV2.robotRadius} />
        </Arena>
      </div>
      <div className="panel">
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <Slider hint={t.drag} label={s.d} value={d} min={0} max={8} step={0.05} mark={TOL} onChange={setD} fmt={(v) => v.toFixed(2)} />
        <dl className="readout">
          <div><dt>{s.tick}</dt><dd data-k="tick">{(STEP * 100).toFixed(1)} cm</dd></div>
          <div><dt>{s.drive}</dt><dd data-k="drive">{drive.toFixed(2)} m</dd></div>
          <div><dt>{s.time}</dt><dd data-k="time">{minTime(d, TOL, V).toFixed(1)} s</dd></div>
          <div><dt>{s.ticks}</dt><dd data-k="ticks">{ticks}</dd></div>
          <div><dt>{s.measured} <b className="kind">{t.kind.measured}</b></dt><dd data-k="cmdhz">{MEASURED.cmdVelHz.toFixed(1)} Hz</dd></div>
        </dl>
        <p className="note">{s.every}</p>
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/config/nav2_params.yaml#L18-L39`}>nav2_params.yaml:18-39</a>, <a href={`${SOURCE_REPO}/blob/main/README.md`}>README (patrol result)</a></p>
      </div>
    </>
  )
}
