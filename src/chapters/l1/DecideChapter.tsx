import { useMemo, useState } from 'react'
import Player from '../../components/Player'
import Slider from '../../components/Slider'
import { SOURCE_REPO } from '../../content/world'
import { STRINGS, type Strings } from '../../i18n'
import { GOAL, SCAN_HZ, SPEED, inGoal, run, scenario, type Compare } from './decide'
import { DECIDE_STRINGS } from './decide.strings'
import './l1.css'

const W = 640, H = 175, WALL = 600, PX = 260 // px per metre: 2 m start fits left of the wall
const FLOOR = 130, LEN = 0.14 * PX // robot body ~14 cm long
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const m = (v: number) => v.toFixed(2)

/** 1.1: one variable, one `if`. The scenario is the model's run; the slider and break-it rebuild it. */
export default function DecideChapter({ t }: { t: Strings }) {
  const s = DECIDE_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const [stopAt, setStopAt] = useState(0.5)
  const [op, setOp] = useState<Compare>('<')
  const sc = useMemo(() => scenario(stopAt, op), [stopAt, op])
  const r = useMemo(() => run(stopAt, op), [stopAt, op])
  const [tS, setTS] = useState(() => (still() ? sc.durationMs / 1000 : 0))
  const now = Math.min(tS, sc.durationMs / 1000)
  const f = sc.frame(now * 1000)
  const front = WALL - f.distance * PX
  const restart = () => setTS(Infinity) // a new setting shows its end frame at once; Play replays it
  const ok = inGoal(r)
  const tag = f.crashed ? s.crashed : f.decision
  return (
    <>
      <div className="figure">
        <svg className="side" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={s.title}>
          <line className="floor" x1={10} x2={WALL} y1={FLOOR} y2={FLOOR} />
          <rect className="wall" x={WALL} y={20} width={14} height={FLOOR - 20} />
          <line className="stopline" x1={WALL - stopAt * PX} x2={WALL - stopAt * PX} y1={30} y2={FLOOR} />
          <text x={WALL - stopAt * PX} y={20} textAnchor="middle">stop_at</text>
          {!f.crashed && f.distance > 0 && <line className="beam" x1={front} x2={WALL} y1={FLOOR - 26} y2={FLOOR - 26} opacity={1 - ((now * SCAN_HZ) % 1) * 0.7} />}
          <g className={f.crashed ? 'is-crash' : ''}>
            <rect className="body" x={front - LEN} y={FLOOR - 40} width={LEN} height={30} rx={3} />
            <circle className="wheel" cx={front - LEN / 2} cy={FLOOR - 8} r={8} />
          </g>
          <text x={(front + WALL) / 2} y={FLOOR + 30} textAnchor="middle">distance = {m(f.distance)} m</text>
          <text className={`tag ${f.crashed ? 'stop' : f.decision}`} x={front - LEN / 2} y={FLOOR - 50} textAnchor="middle">{tag}</text>
        </svg>
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t}
          caption={s.caption(f.tick + 1, m(r.ticks[f.tick].distance), r.ticks[f.tick].decision)} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <pre className="code" aria-label="Python">
          <span className="ln">distance = <span className="val">{m(r.ticks[f.tick].distance)}</span>   <span className="cmt"># m, from the LiDAR</span></span>
          <span className="ln">stop_at = <span className="val">{m(stopAt)}</span></span>
          <span className="ln">{' '}</span>
          <span className="ln">if distance <span className={op === '>' ? 'bad' : ''}>{op}</span> stop_at:</span>
          <span className={`ln${f.decision === 'stop' ? ' on' : ''}`}>    speed = 0.0    <span className="cmt"># stop</span></span>
          <span className="ln">else:</span>
          <span className={`ln${f.decision === 'go' ? ' on' : ''}`}>    speed = {SPEED}   <span className="cmt"># go</span></span>
        </pre>
        <p className="runs">{s.runsHere}</p>
        <Slider hint={t.drag} label={s.stopAt} value={stopAt} min={0} max={1} step={0.01} mark={0.5} fmt={m}
          onChange={(v) => { setStopAt(v); restart() }} />
        <p><button type="button" className="break" onClick={() => { setOp(op === '<' ? '>' : '<'); restart() }}>{op === '<' ? s.breakIt : s.fixIt}</button></p>
        {op === '>' && <p className="note">{s.brokenNote}</p>}
        <dl className="readout">
          <div><dt>{s.final}</dt><dd data-k="final">{r.crashed ? s.crashed : `${m(r.final)} m`}</dd></div>
          <div><dt>{s.decisions}</dt><dd data-k="reads">{r.ticks.length}</dd></div>
        </dl>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? '✓ ' + s.solved : s.notYet} {r.crashed ? s.crashed : `${m(r.final)} m`} ({GOAL[0]}–{GOAL[1]} m)</p>
        <p className="group-h">{s.words}</p>
        <dl className="gloss">{s.glossary.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/config/nav2_params.yaml#L39`}>nav2_params.yaml:39</a> (max_vel_x {SPEED}), <a href={`${SOURCE_REPO}/blob/main/description/turtlebot3_burger.urdf.xacro#L168`}>turtlebot3_burger.urdf.xacro:168</a> (update_rate {SCAN_HZ}) · <a href="https://docs.python.org/3/tutorial/controlflow.html#if-statements">Python tutorial: if</a>. {s.srcNote}</p>
      </div>
    </>
  )
}
