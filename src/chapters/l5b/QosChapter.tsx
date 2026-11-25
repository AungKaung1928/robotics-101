import { useState } from 'react'
import Player from '../../anim/Player'
import { END, EVENTS, GAP, arrivedBy, flight, sentBy } from '../../scenarios/qosflight'
import Slider from '../../components/Slider'
import { stringsFor, type Strings } from '../../i18n'
import { DEFAULT_DEPTH, DEFAULT_QOS, MAPS, N, challengeOk, connected, fates, lateJoinerGets, received, type Dur, type Qos, type Rel } from './qos'
import { QOS_STRINGS } from './qos.strings'
import '../l1/l1.css'
import '../l2/l2.css'
import Gloss from '../l1/Gloss'

const W = 640, H = 150, X0 = 30, STEP = (W - 2 * X0) / (N - 1)
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const DOCS = 'https://docs.ros.org/en/jazzy/Concepts/Intermediate/About-Quality-of-Service-Settings.html'

/** 5.4: pick QoS on both ends; the top row is what the scanner sends, the bottom row what the subscriber gets. */
export default function QosChapter({ t }: { t: Strings }) {
  const s = stringsFor(QOS_STRINGS, t, 'l5b.qos.QOS_STRINGS')
  const [pub, setPub0] = useState<Qos>(DEFAULT_QOS)
  const [sub, setSub0] = useState<Qos>(DEFAULT_QOS)
  const [tS, setTS] = useState(() => (still() ? END : 0))
  const now = Math.min(tS, END)
  // a changed setting shows its end frame at once; Play replays the scans under it
  const setPub = (q: Qos) => { setPub0(q); setTS(END) }
  const setSub = (q: Qos) => { setSub0(q); setTS(END) }
  const [depth, setDepth] = useState(DEFAULT_DEPTH)
  const fs = fates(pub, sub), got = received(pub, sub), ok = challengeOk(pub, sub, depth)
  const side = (q: Qos, set: (q: Qos) => void, label: string, k: string) => (
    <div className="stepper-block" data-k={k}>
      <p className="group-h">{label}</p>
      <div className="stepper" role="group" aria-label={`${label} reliability`}>
        {(['reliable', 'best_effort'] as Rel[]).map((r) => <button key={r} type="button" aria-pressed={q.rel === r} onClick={() => set({ ...q, rel: r })}>{s.rel[r]}</button>)}
      </div>
      <div className="stepper" role="group" aria-label={`${label} durability`}>
        {(['volatile', 'transient_local'] as Dur[]).map((d) => <button key={d} type="button" aria-pressed={q.dur === d} onClick={() => set({ ...q, dur: d })}>{s.dur[d]}</button>)}
      </div>
    </div>
  )
  return (
    <>
      <div className="figure">
        <svg className="side graph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={s.title}>
          <text className="legend" x={X0 - 10} y={22}>pub</text>
          <text className="legend" x={X0 - 10} y={H - 12}>sub</text>
          {fs.map((f, k) => {
            const x = X0 + k * STEP, fl = flight(k, f, now), sent = now >= k * GAP
            const done = fl.phase === 'arrived', gone = fl.phase === 'gone' || (f === 'none' && fl.o === 0)
            return (
              <g key={k} data-phase={fl.phase}>
                <circle className="dot" cx={x} cy={45} r={7} opacity={sent ? 1 : 0.25} />
                {done && f === 'ok' && <circle className="dot" cx={x} cy={110} r={7} />}
                {done && f === 'resent' && <circle className="dot cmd" cx={x} cy={110} r={7} />}
                {gone && <circle cx={x} cy={110} r={7} fill="none" stroke="var(--rule)" strokeWidth={2} />}
                {done && f === 'resent' && <circle cx={x} cy={110} r={10} fill="none" stroke="var(--robot)" strokeWidth={2} />}
                {!done && fl.o > 0 && fl.phase !== 'queued' && (
                  <circle className={fl.phase === 'resend' ? 'dot cmd' : 'dot'} cx={x} cy={45 + fl.y * 65} r={fl.phase === 'drop' || fl.phase === 'blocked' ? 7 + 5 * (1 - fl.o) : 5} opacity={fl.o} />
                )}
              </g>
            )
          })}
        </svg>
        <Player t={now} setT={setTS} end={END} events={EVENTS} labels={s.anim.steps} speed={1} autoplay={!still()} s={t}
          caption={<span data-k="anim-caption">{s.anim.sent} {sentBy(now)}/{N} · {s.anim.received} {arrivedBy(fs, now)}</span>} />
        <p className="runs" data-k="caption">{s.caption(got)}</p>
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <p className="note" data-k="everyday">{s.everyday}</p>
        {side(pub, setPub, s.pub, 'pub')}
        {side(sub, setSub, s.sub, 'sub')}
        <Slider hint={t.drag} label={s.depth} value={depth} min={1} max={10} step={1} mark={DEFAULT_DEPTH} fmt={(x) => String(x)} onChange={setDepth} />
        <p><button type="button" className="break" onClick={() => { setPub({ ...pub, rel: 'best_effort' }); setSub({ ...sub, rel: 'reliable' }) }}>{s.breakIt}</button></p>
        <dl className="readout">
          <div><dt>{s.link}</dt><dd data-k="link">{connected(pub, sub) ? s.yes : s.no}</dd></div>
          <div><dt>{s.got}</dt><dd data-k="got">{got}/{N}</dd></div>
          <div><dt>{s.late}</dt><dd data-k="late">{lateJoinerGets(pub, sub, depth)}/{MAPS}</dd></div>
        </dl>
        <p className="runs">{s.resentNote}</p>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? '✓ ' + s.solved : s.notYet} {s.dur[pub.dur]} → {s.dur[sub.dur]}</p>
        <p className="note">{s.trap}</p>
        <p className="group-h">{s.words}</p>
        <Gloss items={s.glossary} />
        <p className="src">{t.source}: <a href={DOCS}>Jazzy: Quality of Service settings</a> (compatibility tables, defaults, QoS events) · <a href="https://docs.ros.org/en/jazzy/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Topics/Understanding-ROS2-Topics.html">Jazzy: ros2 topic info --verbose</a> · <a href="https://github.com/ros2/rclcpp/blob/jazzy/rclcpp/src/rclcpp/publisher_base.cpp#L339-L341">rclcpp publisher_base.cpp:339 (incompatible QoS warning)</a> · <a href="https://github.com/ros-navigation/navigation2/blob/jazzy/nav2_map_server/src/map_server/map_server.cpp#L116-L118">Nav2 map_server.cpp:118 (transient local)</a> · <a href="https://github.com/AungKaung1928/photon-to-torque">{s.depthLink}</a></p>
      </div>
    </>
  )
}
