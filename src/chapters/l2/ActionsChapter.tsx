import { useMemo, useState } from 'react'
import Player from '../../anim/Player'
import Slider from '../../components/Slider'
import { stringsFor, type Strings } from '../../i18n'
import { STATUS, challengeOk, run, scenario, type Ev } from './actions'
import { ACTIONS_STRINGS } from './actions.strings'
import '../l1/l1.css'
import './l2.css'
import Gloss from '../l1/Gloss'
import RealProject from './RealProject'

const REPO = 'https://github.com/AungKaung1928/ros2-patrol-project/blob/main'
const L = 150, R = 490, ROWS = 8
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** 2.4: one NavigateToPose goal as a sequence diagram; the reader cancels it or makes it unreachable. */
export default function ActionsChapter({ t }: { t: Strings }) {
  const s = stringsFor(ACTIONS_STRINGS, t, 'l2.actions.ACTIONS_STRINGS')
  const [distance, setDistance] = useState(2)
  const [reachable, setReachable] = useState(true)
  const [cancelAt, setCancelAt] = useState<number | null>(null)
  const sc = useMemo(() => scenario(distance, reachable, cancelAt), [distance, reachable, cancelAt])
  const evs = useMemo(() => run(distance, reachable, cancelAt), [distance, reachable, cancelAt])
  const [tS, setTS] = useState(() => (still() ? sc.durationMs / 1000 : 0))
  const now = Math.min(tS, sc.durationMs / 1000)
  const f = sc.frame(now * 1000)
  const label = (e: Ev) =>
    e.kind === 'goal' ? `${s.ev.goal} (${s.attempt} ${e.attempt})` : e.kind === 'feedback' ? `distance_remaining = ${e.remaining.toFixed(2)} m`
      : e.kind === 'result' ? `${s.ev.result}: ${e.status} (${STATUS[e.status]})` : s.ev[e.kind]
  const shown = f.seen.slice(-ROWS)
  const res = evs.filter((e) => e.kind === 'result').at(-1)
  const ok = challengeOk(evs, distance)
  const lastFb = evs.filter((e) => e.kind === 'feedback').at(-1)
  const restart = (fn: () => void) => { fn(); setCancelAt(null); setTS(0) }
  return (
    <>
      <div className="figure">
        <svg className="side graph" viewBox={`0 0 640 ${70 + ROWS * 30}`} role="img" aria-label={s.title}>
          <g className="nd ok"><rect x={L - 110} y={6} width={220} height={36} /><text x={L} y={30} textAnchor="middle">patrol_controller</text></g>
          <g className="nd ok"><rect x={R - 110} y={6} width={220} height={36} /><text x={R} y={30} textAnchor="middle">navigate_to_pose</text></g>
          <line className="stopline" x1={L} x2={L} y1={42} y2={70 + ROWS * 30} />
          <line className="stopline" x1={R} x2={R} y1={42} y2={70 + ROWS * 30} />
          {shown.map((e, k) => {
            const y = 66 + k * 30
            const right = e.kind === 'goal'
            const cls = e.kind === 'result' ? (e.status === 'SUCCEEDED' ? 'msg ok' : 'msg bad') : e.kind === 'feedback' ? 'msg fb' : 'msg'
            if (e.kind === 'skip') return <text key={`${e.tMs}-${k}`} className="legend" x={L} y={y + 4} textAnchor="middle">{label(e)}</text>
            return (
              <g key={`${e.tMs}-${k}`} className={cls}>
                <line x1={right ? L : R} x2={right ? R - 8 : L + 8} y1={y} y2={y} />
                <path d={right ? `M${R - 8} ${y - 5}L${R} ${y}L${R - 8} ${y + 5}` : `M${L + 8} ${y - 5}L${L} ${y}L${L + 8} ${y + 5}`} />
                <text x={(L + R) / 2} y={y - 6} textAnchor="middle">{label(e)}</text>
              </g>
            )
          })}
        </svg>
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t}
          caption={s.caption(now.toFixed(1), f.seen.length ? label(f.seen.at(-1)!) : '')} />
        <p><button type="button" className="break" disabled={!reachable || f.seen.some((e) => e.kind === 'result')} onClick={() => setCancelAt(now * 1000)}>{s.cancel}</button></p>
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <p className="note" data-k="everyday">{s.everyday}</p>
        <dl className="gloss">{s.compare.map(([k, v, ex]) => <div key={k} style={{ display: 'contents' }}><dt><code>{k}</code></dt><dd>{v} · <code>{ex}</code></dd></div>)}</dl>
        <Slider hint={t.drag} label={s.distance} value={distance} min={1} max={4} step={0.25} onChange={(v) => restart(() => setDistance(v))} fmt={(v) => v.toFixed(2)} />
        <p>
          <button type="button" className="break" onClick={() => restart(() => setReachable(!reachable))}>{reachable ? s.breakIt : s.fixIt}</button>{' '}
          <button type="button" className="break" onClick={() => restart(() => undefined)}>{s.reset}</button>
        </p>
        {!reachable && <p className="note">{s.brokenNote}</p>}
        <dl className="readout">
          <div><dt>{s.status}</dt><dd data-k="status">{res && res.kind === 'result' ? `${res.status} (${STATUS[res.status]})` : '—'}</dd></div>
        </dl>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">
          {ok && lastFb?.kind === 'feedback' ? `✓ ${s.solved} ${lastFb.remaining.toFixed(2)} ${s.left}` : `${s.notYet} ${res && res.kind === 'result' ? res.status : ''}`}
        </p>
        <pre className="code" aria-label="Python">{"self.navigate_to_pose_client = ActionClient(\n  self, NavigateToPose, 'navigate_to_pose')\n...\nsend_goal_async(goal_msg,\n  feedback_callback=self.feedback_callback)"}</pre>
        <RealProject id="actions" t={t} />
        <p className="src"><a href={`${REPO}/patrol_navigation_project/patrol_controller.py#L32-L36`}>patrol_controller.py:32-36</a>, <a href={`${REPO}/patrol_navigation_project/patrol_controller.py#L198-L200`}>:198-200</a>, <a href={`${REPO}/patrol_navigation_project/patrol_controller.py#L220-L237`}>:220-237</a> ({s.srcGloss.retry}), <a href={`${REPO}/config/patrol_points.yaml#L49`}>patrol_points.yaml:49</a> (max_retries 3)</p>
        <p className="group-h">{s.words}</p>
        <Gloss items={s.glossary} />
        <p className="src">{t.source}: <a href="https://github.com/ros-navigation/navigation2/blob/humble/nav2_msgs/action/NavigateToPose.action">NavigateToPose.action (Humble)</a>, <a href="https://github.com/ros2/rcl_interfaces/blob/humble/action_msgs/msg/GoalStatus.msg">GoalStatus.msg</a>, <a href="https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Actions/Understanding-ROS2-Actions.html">Humble: Understanding actions</a>, <a href="https://github.com/SteveMacenski/slam_toolbox/tree/humble">{s.srcGloss.saveMap}</a></p>
      </div>
    </>
  )
}
