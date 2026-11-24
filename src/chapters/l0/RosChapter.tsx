import { useMemo, useState } from 'react'
import Player from '../../components/Player'
import Slider from '../../components/Slider'
import { STRINGS, stringsFor, type Strings } from '../../i18n'
import { DISTROS, END, INSTALL, TODAY, distro, humbleLast, label, scenario, supported, unsupportedFor } from './ros'
import { ROS_STRINGS } from './ros.strings'
import './l0.css'

const X0 = 90, X1 = 606, ROW = 34, Y0 = 46
const x = (i: number) => X0 + (i / END) * (X1 - X0)

/** 0.4: ROS distributions on a timeline; opens on today (Play sweeps from 2020); break-it = a project on EOL Iron; challenge = Humble's last month. */
export default function RosChapter({ t }: { t: Strings }) {
  const ja = t === STRINGS.ja
  const s = stringsFor(ROS_STRINGS, t, 'l0.ros.ROS_STRINGS')
  const [onIron, setOnIron] = useState(false)
  const [pick, setPick] = useState<number | null>(null)
  const sc = useMemo(() => scenario(), [])
  const [tS, setTS] = useState(sc.durationMs / 1000) // first view = today, not 2020 (nothing drawn was supported then)
  const now = Math.min(tS, sc.durationMs / 1000)
  const at = pick ?? sc.frame(now * 1000).at
  const live = supported(at)
  const fmtDate = (i: number) => { const { y, m } = label(i); return ja ? `${y}年${m}月` : `${y}-${String(m).padStart(2, '0')}` }
  const date = fmtDate(at)
  const cap = s.caption(date, live.length, DISTROS.length)
  const ok = humbleLast(at)
  const yBottom = Y0 + DISTROS.length * ROW
  return (
    <>
      <div className="figure">
        <svg className="distros" viewBox="0 0 620 300" role="group" aria-label={`${s.title}: ${cap}`}>
          {Array.from({ length: 13 }, (_, k) => (
            <text key={k} className="yr" x={x(k * 12)} y={yBottom + 22} textAnchor="middle">{k % 2 ? '' : `'${20 + k}`}</text>
          ))}
          {DISTROS.map((d, i) => {
            const cls = `bar${live.includes(d.id) ? ' is-on' : ''}${d.ros === 1 ? ' is-ros1' : ''}${onIron && d.id === 'iron' ? ' is-picked' : ''}`
            return (
              <g key={d.id} className={cls}>
                <text className="name" x={X0 - 8} y={Y0 + i * ROW + 18} textAnchor="end">{d.name}</text>
                <rect x={x(d.from)} y={Y0 + i * ROW + 4} width={x(d.last + 1) - x(d.from)} height={ROW - 12} rx="5" />
                <text className="tag" x={x(d.from) + 6} y={Y0 + i * ROW + 19}>{[d.ros === 1 ? s.ros1 : d.lts ? s.lts : '', d.ubuntu].filter(Boolean).join(' · ')}</text>
              </g>
            )
          })}
          <line className="today" x1={x(TODAY + 0.5)} x2={x(TODAY + 0.5)} y1={Y0 - 6} y2={yBottom} />
          <text className="today-l" x={x(TODAY + 0.5)} y={Y0 - 12} textAnchor="middle">{s.today}</text>
          <line className="cursor" x1={x(at + 0.5)} x2={x(at + 0.5)} y1={Y0 - 6} y2={yBottom + 6} />
          <text className="say" x="310" y="296" textAnchor="middle">{cap}</text>
        </svg>
        <Player t={now} setT={(v) => { setPick(null); setTS(v) }} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={false} s={t}
          caption={cap} />
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
        <p className="group-h">{s.installTitle}</p>
        {s.install.map((l) => <p key={l}>{l}</p>)}
        <table className="distro-table" data-k="install">
          <thead><tr><th>{s.th.distro}</th><th>{s.th.ubuntu}</th><th>{s.th.gazebo}</th><th>{s.th.eol}</th><th>{t.source}</th></tr></thead>
          <tbody>{INSTALL.map((r) => { const d = distro(r.id); return (
            <tr key={r.id}><td>{d.name}</td><td>{d.ubuntu}</td><td>{r.gazebo}</td><td>{fmtDate(d.last)}</td><td><a href={r.src}>{new URL(r.src).hostname}</a></td></tr>
          ) })}</tbody>
        </table>
        <p className="note">{s.winMac}</p>
        <div className="note ros-project" data-k="project"><strong>{s.projectTitle}</strong> {s.project}</div>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? '✓ ' + s.solved : s.notYet}</p>
        <p className="group-h">{s.words}</p>
        <dl className="gloss">{s.glossary.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt><code>{k}</code></dt><dd>{v}</dd></div>)}</dl>
        <p className="src">{t.source}: <a href="https://docs.ros.org/en/rolling/Releases.html">ROS 2 Releases</a> · <a href="https://www.ros.org/reps/rep-2000.html">REP 2000</a> · <a href="https://www.ros.org/reps/rep-0003.html">REP 3</a> · <a href="https://design.ros2.org/articles/ros_on_dds.html">ROS on DDS</a> · <a href="http://wiki.ros.org/Master">ROS 1 Master</a> · <a href="https://docs.ros.org/en/jazzy/Concepts/Basic/About-Discovery.html">ROS 2 discovery</a> · <a href="https://gazebosim.org/docs/latest/ros_installation/">Gazebo + ROS pairs</a></p>
      </div>
    </>
  )
}
