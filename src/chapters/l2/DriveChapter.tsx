import { useMemo, useState } from 'react'
import Player from '../../components/Player'
import Slider from '../../components/Slider'
import { SOURCE_REPO } from '../../content/world'
import { STRINGS, type Strings } from '../../i18n'
import { END_S, GOAL, challengeOk, plan, scenario, simulate, wheels } from './drive'
import { DRIVE_STRINGS } from './drive.strings'
import '../l1/l1.css'
import './l2.css'
import Gloss from '../l1/Gloss'

const W = 640, H = 330, PX = 180, OX = 60, OY = 280 // px per metre; start at (OX, OY), x right, y up
const X = (x: number) => OX + x * PX, Y = (y: number) => OY - y * PX
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** 2.7: a plan of one Twist for some seconds, then zeros (or not); the robot drives it from the same model. */
export default function DriveChapter({ t }: { t: Strings }) {
  const s = DRIVE_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const [v, setV] = useState(0.2)
  const [w, setW] = useState(0.5)
  const [dur, setDur] = useState(4)
  const [zeros, setZeros] = useState(true)
  const cmds = useMemo(() => plan(v, w, dur, zeros), [v, w, dur, zeros])
  const sc = useMemo(() => scenario(cmds), [cmds])
  const [tS, setTS] = useState(() => (still() ? END_S : 0))
  const now = Math.min(tS, END_S)
  const f = sc.frame(now * 1000)
  const end = useMemo(() => simulate(cmds, END_S).at(-1)!, [cmds])
  const wh = wheels(v, w)
  const ok = challengeOk(cmds)
  const show = () => setTS(Infinity)
  const p = f.pose
  return (
    <>
      <div className="figure">
        <svg className="side graph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={s.title}>
          <circle className="goalc" cx={X(GOAL.x)} cy={Y(GOAL.y)} r={GOAL.r * PX} />
          <path className="edge on" d={`M${f.trail.map((q) => `${X(q.x)} ${Y(q.y)}`).join(' L')}`} />
          <g transform={`translate(${X(p.x)} ${Y(p.y)}) rotate(${(-p.th * 180) / Math.PI})`}>
            <rect className="body" x={-0.069 * PX} y={-0.089 * PX} width={0.138 * PX} height={0.178 * PX} rx={4} />
            <path className="fan pick" d={`M0 0H${0.16 * PX}`} />
          </g>
          <text className="legend" x={10} y={H - 8}>1 m = {PX} px · {p.v === 0 ? s.stopped : `${s.moving} ${p.v.toFixed(2)} m/s`}</text>
        </svg>
        <Player t={now} setT={setTS} end={END_S} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t}
          caption={s.caption(now.toFixed(1), p.v.toFixed(2))} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <Slider hint={t.drag} label={s.v} value={v} min={-0.26} max={0.26} step={0.01} onChange={(x) => { setV(x); show() }} fmt={(x) => x.toFixed(2)} />
        <Slider label={s.w} value={w} min={-1} max={1} step={0.01} onChange={(x) => { setW(x); show() }} fmt={(x) => x.toFixed(2)} />
        <Slider label={s.dur} value={dur} min={0} max={10} step={0.1} onChange={(x) => { setDur(x); show() }} fmt={(x) => x.toFixed(1)} />
        <p><label><input type="checkbox" checked={zeros} onChange={(e) => { setZeros(e.target.checked); show() }} /> {s.zeros}</label></p>
        <p><button type="button" className="break" onClick={() => { setZeros(!zeros); setTS(0) }}>{zeros ? s.breakIt : s.fixIt}</button></p>
        {!zeros && <p className="note">{s.brokenNote}</p>}
        <pre className="code" aria-label="bash">{`ros2 topic pub --rate 10 /cmd_vel geometry_msgs/msg/Twist \\\n  "{linear: {x: ${v.toFixed(2)}}, angular: {z: ${w.toFixed(2)}}}"\n# ${dur.toFixed(1)} s later: Ctrl+C${zeros ? '\nros2 topic pub --once /cmd_vel geometry_msgs/msg/Twist "{}"' : ''}`}</pre>
        <dl className="readout">
          <div><dt>{s.wheelL}</dt><dd data-k="wl">{wh.left.toFixed(3)} m/s · {wh.leftRad.toFixed(1)} rad/s</dd></div>
          <div><dt>{s.wheelR}</dt><dd data-k="wr">{wh.right.toFixed(3)} m/s · {wh.rightRad.toFixed(1)} rad/s</dd></div>
        </dl>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? '✓ ' + s.solved : s.notYet} x {end.x.toFixed(2)}, y {end.y.toFixed(2)} m{end.v !== 0 ? ` (${s.moving})` : ''}</p>
        <p className="group-h">{s.words}</p>
        <Gloss items={s.glossary} />
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/description/turtlebot3_burger.urdf.xacro#L143-L154`}>turtlebot3_burger.urdf.xacro:143-154</a> (DiffDrive, wheel separation 0.160 m, radius 0.033 m, max_linear_acceleration 1.0), <a href="https://github.com/gazebosim/gz-sim/blob/gz-sim8/src/systems/diff_drive/DiffDrive.cc#L641-L646">gz-sim DiffDrive.cc:641-646</a> (keeps the last command) · <a href="https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Topics/Understanding-ROS2-Topics.html">Humble: ros2 topic pub</a></p>
      </div>
    </>
  )
}
