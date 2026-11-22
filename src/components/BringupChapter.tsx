import { useState } from 'react'
import { SOURCE_REPO } from '../content/world'
import type { Strings } from '../i18n'
import { STAGES, earlyStarts, type StageId } from '../lib/bringup'
import Slider from './Slider'

const PATROL_WAIT = 15 // README "Run": patrol waits 15 s after Nav2
const W = 640, ROW = 34, PAD = 110, T = 30
const x = (t: number) => PAD + (Math.min(t, T) / T) * (W - PAD - 20)
const DEFAULT = Object.fromEntries(STAGES.map((s) => [s.id, s.t])) as Record<StageId, number>

export default function BringupChapter({ t }: { t: Strings }) {
  const s = t.bringup
  const [slam, setSlam] = useState(DEFAULT.slam)
  const [nav2, setNav2] = useState(DEFAULT.nav2)
  const times = { ...DEFAULT, slam, nav2, patrol: nav2 + PATROL_WAIT }
  const early = earlyStarts(times)
  const bad = new Set(early.map(([a]) => a))
  const H = STAGES.length * ROW + 40
  return (
    <>
      <div className="figure">
        <svg className="timeline" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.chapters.bringup}>
          {[0, 5, 10, 15, 20, 25, 30].map((v) => (
            <g key={v}><line className="lane" x1={x(v)} x2={x(v)} y1={10} y2={H - 24} /><text x={x(v)} y={H - 8} textAnchor="middle">{v} s</text></g>
          ))}
          {STAGES.map((st, i) => (
            <g key={st.id} className={bad.has(st.id) ? 'is-early' : ''} transform={`translate(0 ${20 + i * ROW})`}>
              <text x={8} y={5}>{st.id}</text>
              <line className="run" x1={x(times[st.id])} x2={x(T)} y1={0} y2={0} />
              <text className="gives" x={x(times[st.id]) + 4} y={-8}>{st.gives}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="panel">
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <Slider label={s.slam} value={slam} min={0} max={20} step={0.5} mark={DEFAULT.slam} onChange={setSlam} />
        <Slider label={s.nav2} value={nav2} min={0} max={20} step={0.5} mark={DEFAULT.nav2} onChange={setNav2} />
        <dl className="readout">
          <div><dt>{s.patrol}</dt><dd data-k="patrol">{times.patrol} s</dd></div>
          <div><dt>{s.early}</dt><dd data-k="early" className={early.length ? 'early' : ''}>{early.length ? early.map(([a, b]) => `${a} ${s.waits} ${b}`).join(', ') : s.ok}</dd></div>
        </dl>
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/launch/tf_explorer.launch.py#L68-L137`}>tf_explorer.launch.py:68-137</a>, <a href={`${SOURCE_REPO}/blob/main/README.md`}>README "Run"</a></p>
      </div>
    </>
  )
}
