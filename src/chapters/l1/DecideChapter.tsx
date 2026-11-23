import { useMemo, useState } from 'react'
import Player from '../../components/Player'
import Slider from '../../components/Slider'
import { SOURCE_REPO } from '../../content/world'
import { STRINGS, type Strings } from '../../i18n'
import { GOAL, SCAN_HZ, SPEED, inGoal, run, scenario, type Compare } from './decide'
import { DECIDE_STRINGS } from './decide.strings'
import RobotSide from './RobotSide'
import './l1.css'
import Gloss from './Gloss'

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
  const restart = () => setTS(Infinity) // a new setting shows its end frame at once; Play replays it
  const ok = inGoal(r)
  return (
    <>
      <div className="figure">
        <RobotSide f={f} stopAt={stopAt} tS={now} label={s.title} crashed={s.crashed} />
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
        <Gloss items={s.glossary} />
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/config/nav2_params.yaml#L39`}>nav2_params.yaml:39</a> (max_vel_x {SPEED}), <a href={`${SOURCE_REPO}/blob/main/description/turtlebot3_burger.urdf.xacro#L168`}>turtlebot3_burger.urdf.xacro:168</a> (update_rate {SCAN_HZ}) · <a href="https://docs.python.org/3/tutorial/controlflow.html#if-statements">Python tutorial: if</a>. {s.srcNote}</p>
      </div>
    </>
  )
}
