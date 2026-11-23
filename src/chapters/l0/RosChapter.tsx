import { useMemo, useState } from 'react'
import Player from '../../components/Player'
import Slider from '../../components/Slider'
import { STRINGS, type Strings } from '../../i18n'
import { DISTROS, END, TODAY, humbleLast, label, scenario, supported, unsupportedFor } from './ros'
import { ROS_STRINGS } from './ros.strings'
import './l0.css'

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const X0 = 90, X1 = 606, ROW = 34, Y0 = 46
const x = (i: number) => X0 + (i / END) * (X1 - X0)

/** 0.4: ROS distributions on a timeline; the date sweeps to today; break-it = a project on EOL Iron; challenge = Humble's last month. */
export default function RosChapter({ t }: { t: Strings }) {
  const ja = t === STRINGS.ja
  const s = ROS_STRINGS[ja ? 'ja' : 'en']
  const [onIron, setOnIron] = useState(false)
  const [pick, setPick] = useState<number | null>(null)
  const sc = useMemo(() => scenario(), [])
  const [tS, setTS] = useState(() => (still() ? sc.durationMs / 1000 : 0))
  const now = Math.min(tS, sc.durationMs / 1000)
  const at = pick ?? sc.frame(now * 1000).at
  const live = supported(at)
  const { y, m } = label(at)
  const date = ja ? `${y}年${m}月` : `${y}-${String(m).padStart(2, '0')}`
  const ok = humbleLast(at)
  const yBottom = Y0 + DISTROS.length * ROW
  return (
    <>
      <div className="figure">
        <svg className="distros" viewBox="0 0 620 300" role="group" aria-label={`${s.title}: ${s.caption(date, live.length)}`}>
          {Array.from({ length: 13 }, (_, k) => (
            <text key={k} className="yr" x={x(k * 12)} y={yBottom + 22} textAnchor="middle">{k % 2 ? '' : `'${20 + k}`}</text>
          ))}
          {DISTROS.map((d, i) => {
            const cls = `bar${live.includes(d.id) ? ' is-on' : ''}${d.ros === 1 ? ' is-ros1' : ''}${onIron && d.id === 'iron' ? ' is-picked' : ''}`
            return (
              <g key={d.id} className={cls}>
                <text className="name" x={X0 - 8} y={Y0 + i * ROW + 18} textAnchor="end">{d.name}</text>
                <rect x={x(d.from)} y={Y0 + i * ROW + 4} width={x(d.last + 1) - x(d.from)} height={ROW - 12} rx="5" />
                <text className="tag" x={x(d.from) + 6} y={Y0 + i * ROW + 19}>{d.ros === 1 ? s.ros1 : d.lts ? s.lts : ''}</text>
              </g>
            )
          })}
          <line className="today" x1={x(TODAY + 0.5)} x2={x(TODAY + 0.5)} y1={Y0 - 6} y2={yBottom} />
          <text className="today-l" x={x(TODAY + 0.5)} y={Y0 - 12} textAnchor="middle">{s.today}</text>
          <line className="cursor" x1={x(at + 0.5)} x2={x(at + 0.5)} y1={Y0 - 6} y2={yBottom + 6} />
          <text className="say" x="310" y="296" textAnchor="middle">{s.caption(date, live.length)}</text>
        </svg>
        <Player t={now} setT={(v) => { setPick(null); setTS(v) }} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t}
          caption={s.caption(date, live.length)} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <Slider label={s.date} value={at} min={0} max={END - 1} step={1} mark={TODAY} onChange={setPick} fmt={() => date} />
        <dl className="readout">
          <div><dt>{s.supported}</dt><dd data-k="live">{live.length ? live.map((id) => DISTROS.find((d) => d.id === id)!.name).join(' · ') : s.none}</dd></div>
        </dl>
        <p><button type="button" className="break" onClick={() => setOnIron(!onIron)}>{onIron ? s.fixIt : s.breakIt}</button></p>
        {onIron && <p className="note" data-k="iron">{s.brokenNote(unsupportedFor('iron', TODAY))}</p>}
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? '✓ ' + s.solved : s.notYet}</p>
        <p className="group-h">{s.words}</p>
        <dl className="gloss">{s.glossary.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt><code>{k}</code></dt><dd>{v}</dd></div>)}</dl>
        <p className="src">{t.source}: <a href="https://docs.ros.org/en/rolling/Releases.html">ROS 2 Releases</a> · <a href="https://www.ros.org/reps/rep-2000.html">REP 2000</a> · <a href="https://www.ros.org/reps/rep-0003.html">REP 3</a> · <a href="https://design.ros2.org/articles/ros_on_dds.html">ROS on DDS</a></p>
      </div>
    </>
  )
}
