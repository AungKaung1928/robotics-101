import { useMemo, useState } from 'react'
import Player from '../../anim/Player'
import Slider from '../../components/Slider'
import { SOURCE_REPO } from '../../content/world'
import { stringsFor, type Strings } from '../../i18n'
import Gloss from '../l1/Gloss'
import '../l1/l1.css'
import LateEnvelopes from '../../scenarios/LateEnvelopes'
import { DELAYS_MS, END_MS, PERIOD_MS, backpressure, inGoal, reorder, run, scenario, summary } from './late'
import { LATE_STRINGS } from './late.strings'
import './ep.css'

/** The same 20 messages in the envelope figure's units (s). anim.test checks it gives the page's fates in keep-latest mode. */
const ENVELOPES = DELAYS_MS.map((d, i) => ({ id: i, stamp: (i * PERIOD_MS) / 1000, latency: d / 1000 }))
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const X0 = 20, PX = 0.3, TOP = 60, BOT = 280 // timeline geometry (SVG units; PX per ms)
const x = (ms: number) => X0 + ms * PX

/** EP2: late messages. The timeline is the model's own stamps and arrivals; the slider and fix toggle re-run it. */
export default function LateChapter({ t }: { t: Strings }) {
  const s = stringsFor(LATE_STRINGS, t, 'ep.late.LATE_STRINGS')
  const [maxAge, setMaxAge] = useState(1)
  const [keepLatest, setKeepLatest] = useState(false)
  const [windowMs, setWindowMs] = useState(200)
  const ro = reorder(windowMs)
  const [workMs, setWorkMs] = useState(150)
  const [depth, setDepth] = useState(10)
  const bp = backpressure(workMs, depth)
  const o = useMemo(() => run(Math.round(maxAge * 1000), keepLatest), [maxAge, keepLatest])
  const sum = summary(o)
  const sc = useMemo(() => scenario(), [])
  const [tS, setTS] = useState(() => (still() ? Infinity : 0))
  const now = Math.min(tS, END_MS / 1000)
  const f = sc.frame(now * 1000)
  const ok = !keepLatest && inGoal(o)
  return (
    <>
      <div className="figure">
        <svg className="ep-late" viewBox={`0 0 ${x(END_MS) + 20} ${BOT + 30}`} role="img" aria-label={s.figLabel}>
          <line className="lane" x1={X0} x2={x(END_MS)} y1={TOP} y2={TOP} /><text x={X0} y={TOP - 36}>{s.sensor}</text>
          <line className="lane" x1={X0} x2={x(END_MS)} y1={BOT} y2={BOT} /><text x={X0} y={BOT + 24}>{s.robot}</text>
          {o.map((m) => {
            const p = Math.max(0, Math.min(1, (f.tMs - m.stamp) / (m.arrive - m.stamp)))
            if (f.tMs < m.stamp) return null
            const cls = p < 1 ? 'fly' : m.backwards ? 'back' : m.fate
            return (
              <g key={m.i} className={`msg ${cls}`}>
                <line x1={x(m.stamp)} y1={TOP} x2={x(m.stamp) + (x(m.arrive) - x(m.stamp)) * p} y2={TOP + (BOT - TOP) * p} />
                <circle cx={x(m.stamp) + (x(m.arrive) - x(m.stamp)) * p} cy={TOP + (BOT - TOP) * p} r={9} />
                {(m.i === 6 || m.i === 10 || m.i === 14) && <text className="id" x={x(m.stamp)} y={TOP - 8}>#{m.i}</text>}
              </g>
            )
          })}
        </svg>
        <p className="bfs-legend">
          <span><i className="lg acted" />{s.acted}</span>
          <span><i className="lg back" />{s.backwards}</span>
          <span><i className="lg stale" />{s.stale} / {s.older}</span>
        </p>
        {keepLatest && <LateEnvelopes msgs={ENVELOPES} maxAge={maxAge} t={now} label={s.envLabel}
          fateText={(f) => s.fateShort[f]} />}
        <Player t={now} setT={setTS} end={END_MS / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={0.5} autoplay={!still()} s={t}
          caption={s.caption(f.arrived, (f.tMs / 1000).toFixed(2))} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <pre className="code" aria-label="Python">
          <span className="ln">def on_msg(msg):</span>
          <span className="ln">    global newest   <span className="cmt"># kept between calls</span></span>
          <span className="ln">    stamp = msg.header.stamp   <span className="cmt"># when it was measured</span></span>
          <span className="ln">    if now() - stamp {'>'} max_age: return   <span className="cmt"># max_age = <span className="val">{maxAge.toFixed(2)}</span></span></span>
          <span className={`ln${keepLatest ? ' on' : ''}`}>    {keepLatest ? '' : '# '}if stamp {'<'} newest: return   <span className="cmt"># stamp check</span></span>
          <span className="ln">    newest = max(newest, stamp)</span>
          <span className="ln">    act(msg)</span>
        </pre>
        <p className="runs">{s.runsHere}</p>
        <Slider hint={t.drag} label={s.maxAge} value={maxAge} min={0.02} max={1} step={0.01} mark={1} fmt={(v) => v.toFixed(2)} onChange={setMaxAge} />
        <p><button type="button" className="break" onClick={() => setKeepLatest(!keepLatest)}>{keepLatest ? s.unfix : s.fixIt}</button></p>
        <dl className="readout">
          <div><dt>{s.acted}</dt><dd data-k="acted">{sum.acted}</dd></div>
          <div><dt>{s.backwards}</dt><dd data-k="backwards">{sum.backwards}</dd></div>
          <div><dt>{s.stale}</dt><dd data-k="stale">{sum.stale}</dd></div>
          <div><dt>{s.older}</dt><dd data-k="older">{sum.older}</dd></div>
          <div><dt>{s.worstAge}</dt><dd data-k="worst">{(sum.worstAge / 1000).toFixed(2)} s</dd></div>
        </dl>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? '✓ ' + s.solved : s.notYet} {s.goalText(sum.acted, sum.backwards)}</p>
        <p className="group-h">{s.reorderTitle}</p>
        <p>{s.reorderText}</p>
        <div className="reorder">
          <Slider label={s.window} value={windowMs} min={0} max={500} step={10} fmt={(v) => String(v)} onChange={setWindowMs} />
        </div>
        <dl className="readout">
          <div><dt>{s.rUsed}</dt><dd data-k="r-used">{ro.used.length}</dd></div>
          <div><dt>{s.rDropped}</dt><dd data-k="r-dropped">{ro.dropped.length}</dd></div>
          <div><dt>{s.rDelay}</dt><dd data-k="r-delay">{(ro.addedDelayMs / 1000).toFixed(2)} s</dd></div>
        </dl>
        <p className="group-h">{s.bpTitle}</p>
        <p>{s.bpText}</p>
        <div className="bp-work"><Slider label={s.work} value={workMs} min={50} max={300} step={10} fmt={(v) => String(v)} onChange={setWorkMs} /></div>
        <div className="bp-depth"><Slider label={s.depth} value={depth} min={1} max={10} step={1} fmt={(v) => String(v)} onChange={setDepth} /></div>
        <dl className="readout">
          <div><dt>{s.bDropped}</dt><dd data-k="b-dropped">{bp.dropped}</dd></div>
          <div><dt>{s.bOldest}</dt><dd data-k="b-oldest">{(bp.oldestMs / 1000).toFixed(2)} s</dd></div>
        </dl>
        <p className="group-h">{s.words}</p>
        <Gloss items={s.glossary} />
        <p className="src">{t.source}: <a href="https://github.com/ros2/common_interfaces/blob/humble/std_msgs/msg/Header.msg">std_msgs/Header.msg (Humble)</a> · <a href={`${SOURCE_REPO}/blob/main/src/tf_anomaly_detector.cpp#L10-L14`}>tf_anomaly_detector.cpp:10-14</a>. {s.repoNote} {s.exampleNote}</p>
      </div>
    </>
  )
}
