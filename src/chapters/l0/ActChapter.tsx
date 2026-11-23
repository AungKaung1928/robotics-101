import { useMemo, useState } from 'react'
import Mascot from '../../anim/Mascot'
import Slider from '../../components/Slider'
import { SOURCE_REPO } from '../../content/world'
import { STRINGS, type Strings } from '../../i18n'
import { TURN_MAX, VIEW, rollOnM, rollOnS, tooFast, wheels } from './act'
import { ACT_STRINGS } from './act.strings'
import { SECONDS, TOP_SPEED, path } from './move'
import './l0.css'
import './move.css'
import './act.css'
import AlreadyKnow from './AlreadyKnow'
import Face from './Face'
import { mood } from './robotmood'
import './face.css'

const { px: PX, ox: OX, oy: OY } = VIEW
const sx = (x: number) => OX + x * PX
const sy = (y: number) => OY - y * PX
type Answer = 'atOnce' | 'later' | 'never'
const ANSWERS: Answer[] = ['atOnce', 'later', 'never']

/** Level 0 "act": forward + turn speed -> wheel speeds -> the move path; "stop" shows the roll-on from the brake limit. */
export default function ActChapter({ t }: { t: Strings }) {
  const s = ACT_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const [v, setV] = useState(0.15)
  const [w, setW] = useState(0.5)
  const [stopped, setStopped] = useState(false)
  const [picked, setPicked] = useState<Answer | null>(null)
  const [cheer, setCheer] = useState(0)
  const [oops, setOops] = useState(0)
  const k = wheels(v, w)
  const fast = tooFast(v, w)
  const poses = useMemo(() => path(k.left, k.right, SECONDS), [k.left, k.right])
  const p = poses[poses.length - 1]
  const d = poses.map((q, i) => `${i ? 'L' : 'M'} ${sx(q.x).toFixed(1)} ${sy(q.y).toFixed(1)}`).join(' ')
  const answer = (a: Answer) => { setPicked(a); if (a === 'later') setCheer(cheer + 1); else setOops(oops + 1) }
  const wheel = (x: number) => `${x.toFixed(2)} m/s${Math.abs(x) > TOP_SPEED + 1e-9 ? ` · ${s.tooFast}` : ''}`
  return (
    <>
      <div className="figure">
        <svg className="move" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img" aria-label={`${s.title}: ${s.left} ${k.left.toFixed(2)}, ${s.right} ${k.right.toFixed(2)} m/s`}>
          <path className="move-path" d={d} />
          <circle className="move-start" cx={OX} cy={OY} r="4" />
          <g transform={`translate(${sx(p.x)} ${sy(p.y)}) rotate(${(-p.yaw * 180) / Math.PI})`}>
            <rect className={`move-wheel${Math.abs(k.right) > TOP_SPEED + 1e-9 ? ' is-slip' : ''}`} x="-10" y="-26" width="20" height="8" rx="2" />
            <rect className={`move-wheel${Math.abs(k.left) > TOP_SPEED + 1e-9 ? ' is-slip' : ''}`} x="-10" y="18" width="20" height="8" rx="2" />
            <circle className="move-body" r="19" />
            <Face mood={mood({ broken: fast, solved: picked === 'later' })} />
          </g>
          {stopped && <text className="act-stop" x={sx(p.x)} y={sy(p.y) - 34} textAnchor="middle">+{(rollOnM(v) * 100).toFixed(1)} cm</text>}
        </svg>
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        <AlreadyKnow id="act" t={t} />
        {s.steps.map((l) => <p key={l}>{l}</p>)}
        <Slider hint={t.drag} label={s.forward} value={v} min={0} max={TOP_SPEED} step={0.01} mark={0.15} fmt={(x) => x.toFixed(2)} onChange={(x) => setV(Math.round(x * 100) / 100)} />
        <div className="act-turn"><Slider label={s.turn} value={w} min={-TURN_MAX} max={TURN_MAX} step={0.1} mark={0} fmt={(x) => x.toFixed(1)} onChange={(x) => setW(Math.round(x * 10) / 10)} /></div>
        <dl className="readout">
          <div><dt>{s.left}</dt><dd data-k="left">{wheel(k.left)}</dd></div>
          <div><dt>{s.right}</dt><dd data-k="right">{wheel(k.right)}</dd></div>
          <div><dt>{s.rolled}</dt><dd data-k="rolled">{(rollOnM(v) * 100).toFixed(1)} cm</dd></div>
        </dl>
        <p><button type="button" className="break" onClick={() => { if (!stopped) setOops(oops + 1); setStopped(!stopped) }}>{stopped ? s.fixIt : s.breakIt}</button></p>
        {stopped && <p className="note" data-k="note">{s.brokenNote((rollOnM(v) * 100).toFixed(1), rollOnS(v).toFixed(2))}</p>}
        {fast && <p className="note">{s.tooFast}</p>}
        <div className="act-check">
          <Mascot cheer={cheer} oops={oops} label={s.mascot} />
          <div>
            <p><strong>{s.check}</strong></p>
            <p>{ANSWERS.map((a) => <button type="button" key={a} className="pick" aria-pressed={picked === a} onClick={() => answer(a)}>{s.answers[a]}</button>)}</p>
            {picked && <p className={`verdict ${picked === 'later' ? 'ok' : 'no'}`} data-k="check">{picked === 'later' ? '✓ ' + s.yes : s.no}</p>}
          </div>
        </div>
        <p className="group-h">{s.words}</p>
        <dl className="gloss">{s.glossary.map(([a, b]) => <div key={a} style={{ display: 'contents' }}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/config/nav2_params.yaml#L45-L48`}>nav2_params.yaml:45-48</a> (brake 2.5 m/s²), <a href={`${SOURCE_REPO}/blob/main/description/turtlebot3_burger.urdf.xacro#L146`}>turtlebot3_burger.urdf.xacro:146</a> (wheels 0.16 m apart), <a href="https://emanual.robotis.com/docs/en/platform/turtlebot3/features/">ROBOTIS e-Manual</a> (0.22 m/s).</p>
      </div>
    </>
  )
}
