import { useState } from 'react'
import { PATROL_WAIT_S, SOURCE_REPO } from '../content/world'
import type { Strings } from '../i18n'
import { Icon } from '../icons'
import { STAGES, earlyStarts, startOrder, type StageId } from '../lib/bringup'
import { routeStep } from '../lib/route'
import Player from './Player'
import Slider from './Slider'

const W = 640, ROW = 34, PAD = 110, T = 30, SPEED = 5 // scenario seconds per real second: the 25 s launch plays in 5 s
const x = (t: number) => PAD + (Math.min(t, T) / T) * (W - PAD - 20)
const y = (i: number) => 30 + i * ROW
const DEFAULT = Object.fromEntries(STAGES.map((s) => [s.id, s.t])) as Record<StageId, number>
const fmt = (v: number) => String(Math.round(v * 10) / 10)
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

export default function BringupChapter({ t }: { t: Strings }) {
  const s = t.bringup
  const [slam, setSlam] = useState(DEFAULT.slam)
  const [nav2, setNav2] = useState(DEFAULT.nav2)
  const times = { ...DEFAULT, slam, nav2, patrol: nav2 + PATROL_WAIT_S }
  const early = earlyStarts(times)
  const order = startOrder(times)
  const events = order.map((id) => times[id])
  const end = Math.max(...events)
  // '#/bringup/3' opens on stage 3, paused; plain '#/bringup' plays the launch from 0 s (end frame under reduced motion).
  const deep = /^#\/bringup\/\d/.test(location.hash)
  const [raw, setT] = useState(() => (deep ? times[order[routeStep(location.hash, order.length)]] : still() ? end : 0))
  const now_t = Math.min(raw, end) // a slider can pull the end in under the playhead
  const started = new Set(order.filter((id) => times[id] <= now_t + 1e-9))
  const now = [...order].reverse().find((id) => started.has(id)) ?? order[0]
  const bad = new Set(early.map(([a]) => a))
  const row = Object.fromEntries(STAGES.map((st, i) => [st.id, i])) as Record<StageId, number>
  const H = STAGES.length * ROW + 50
  return (
    <>
      <div className="figure">
        <svg className="timeline" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.chapters.bringup}>
          {[0, 5, 10, 15, 20, 25, 30].map((v) => (
            <g key={v}><line className="lane" x1={x(v)} x2={x(v)} y1={10} y2={H - 24} /><text x={x(v)} y={H - 8} textAnchor="middle">{v} s</text></g>
          ))}
          {STAGES.flatMap((st) => st.needs.map((n) => (
            <path key={`${n}-${st.id}`} className={`dep${bad.has(st.id) ? ' is-early' : ''}${started.has(st.id) ? '' : ' dep-off'}`}
              d={`M${x(times[n])} ${y(row[n])} C${x(times[st.id]) - 14} ${y(row[n])} ${x(times[st.id]) - 14} ${y(row[st.id])} ${x(times[st.id])} ${y(row[st.id])}`} />
          )))}
          {STAGES.map((st, i) => (
            <g key={st.id} className={`${bad.has(st.id) ? 'is-early' : ''}${started.has(st.id) ? '' : ' is-off'}${st.id === now ? ' is-now' : ''}`} transform={`translate(0 ${y(i)})`}>
              <text x={8} y={5}>{st.id}</text>
              <line className="run" x1={x(times[st.id])} x2={x(Math.max(times[st.id], now_t))} y1={0} y2={0} />
              <circle className="node" cx={x(times[st.id])} cy={0} r={4} />
              <text className="gives" x={x(times[st.id]) + 4} y={-8}>{st.gives}</text>
            </g>
          ))}
          <line className="cursor" x1={x(now_t)} x2={x(now_t)} y1={6} y2={H - 24} />
        </svg>
        <Player t={now_t} setT={setT} end={end} events={events} speed={SPEED} autoplay={!deep} s={t}
          caption={<>t = {fmt(now_t)} s · {now} → {STAGES.find((st) => st.id === now)!.gives}</>} />
      </div>
      <div className="panel">
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <Slider hint={t.drag} label={s.slam} value={slam} min={0} max={20} step={0.5} mark={DEFAULT.slam} onChange={setSlam} />
        <Slider label={s.nav2} value={nav2} min={0} max={20} step={0.5} mark={DEFAULT.nav2} onChange={setNav2} />
        <p><button type="button" className="break" onClick={() => { setNav2(slam - 2); setT(T) }}>{s.breakIt}</button></p>
        <dl className="readout">
          <div><dt>{s.patrol}</dt><dd data-k="patrol">{times.patrol} s</dd></div>
          <div><dt>{s.early}</dt><dd data-k="early" className={early.length ? 'early' : ''}>{early.length ? early.map(([a, b]) => `${a} ${s.waits} ${b}`).join(', ') : s.ok}{early.length > 0 && <> <Icon name="warning" /></>}</dd></div>
        </dl>
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/launch/tf_explorer.launch.py#L68-L137`}>tf_explorer.launch.py:68-137</a>, <a href={`${SOURCE_REPO}/blob/main/README.md`}>README "Run"</a></p>
      </div>
    </>
  )
}
