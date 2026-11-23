import { useMemo, useState } from 'react'
import Mascot from '../../anim/Mascot'
import Slider from '../../components/Slider'
import { STRINGS, type Strings } from '../../i18n'
import { FRONT_MAX, FRONT_MIN, FRONT_START, VIEW, view, world } from './simwhat'
import { SIMWHAT_STRINGS } from './simwhat.strings'
import './l0.css'
import './simwhat.css'
import AlreadyKnow from './AlreadyKnow'
import Face from './Face'
import { mood, type Mood } from './face'
import './face.css'

const { px: PX, ox: OX, oy: OY } = VIEW
const RIGHT = VIEW.panelW + VIEW.gap // x offset of the view panel
type Answer = 'wall' | 'empty' | 'gone'
const ANSWERS: Answer[] = ['wall', 'empty', 'gone']

function Bot({ dx, m }: { dx: number; m: Mood }) {
  return (
    <g transform={`translate(${dx + OX} ${OY})`}>
      <circle className="sw-body" r="13" />
      <Face k={0.65} mood={m} />
    </g>
  )
}

/** Level 0 "simwhat": left = the simulated world, right = the view window (RViz) drawing only the sensor dots. */
export default function SimwhatChapter({ t }: { t: Strings }) {
  const s = SIMWHAT_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const [front, setFront] = useState(FRONT_START)
  const [on, setOn] = useState(true)
  const [picked, setPicked] = useState<Answer | null>(null)
  const [cheer, setCheer] = useState(0)
  const [oops, setOops] = useState(0)
  const dots = useMemo(() => view(front, on), [front, on])
  const w = world(front)
  const x = (m: number) => OX + m * PX
  const y = (m: number) => OY - m * PX
  const answer = (a: Answer) => { setPicked(a); if (a === 'empty') setCheer(cheer + 1); else setOops(oops + 1) }
  return (
    <>
      <div className="figure">
        <svg className="simwhat" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img" aria-label={`${s.worldTitle} / ${s.viewTitle}: ${dots.length}`}>
          <rect className="sw-panel" x="0" y="0" width={VIEW.panelW} height={VIEW.h} rx="8" />
          <rect className="sw-panel is-view" x={RIGHT} y="0" width={VIEW.panelW} height={VIEW.h} rx="8" />
          <text className="sw-title" x="12" y="30">{s.worldTitle}</text>
          <text className="sw-title is-view" x={RIGHT + 12} y="30">{s.viewTitle}</text>
          <path className="sw-room" d={`M ${x(w.front)} ${y(w.side)} H ${x(w.back)} V ${y(-w.side)} H ${x(w.front)}`} />
          <rect className="sw-wall" x={x(w.front)} y={y(w.side) - 3} width="7" height={2 * w.side * PX + 6} />
          <Bot dx={0} m="idle" />
          {dots.map((d, i) => <circle key={i} className="sw-dot" r="1.8" cx={RIGHT + x(d.x)} cy={y(d.y)} />)}
          {!on && <text className="sw-empty" x={RIGHT + VIEW.panelW / 2} y={VIEW.h - 16} textAnchor="middle">{s.empty}</text>}
          <Bot dx={RIGHT} m={mood({ broken: !on, solved: picked === 'empty', sensing: true })} />
        </svg>
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        <AlreadyKnow id="simwhat" t={t} />
        {s.steps.map((l) => <p key={l}>{l}</p>)}
        <Slider hint={t.drag} label={s.wall} value={front} min={FRONT_MIN} max={FRONT_MAX} step={0.1} fmt={(v) => v.toFixed(1)} onChange={(v) => setFront(Math.round(v * 10) / 10)} />
        <p><button type="button" className="break" onClick={() => { if (on) setOops(oops + 1); setOn(!on) }}>{on ? s.breakIt : s.fixIt}</button></p>
        {!on && <p className="note">{s.brokenNote}</p>}
        <dl className="readout">
          <div><dt>{s.worldWall}</dt><dd data-k="world">{front.toFixed(1)} m</dd></div>
          <div><dt>{s.dots}</dt><dd data-k="dots">{dots.length}</dd></div>
        </dl>
        <div className="sw-check">
          <Mascot cheer={cheer} oops={oops} label={s.mascot} />
          <div>
            <p><strong>{s.check}</strong></p>
            <p>{ANSWERS.map((a) => <button type="button" key={a} className="pick" aria-pressed={picked === a} onClick={() => answer(a)}>{s.answers[a]}</button>)}</p>
            {picked && <p className={`verdict ${picked === 'empty' ? 'ok' : 'no'}`} data-k="check">{picked === 'empty' ? '✓ ' + s.yes : s.no}</p>}
          </div>
        </div>
        <p className="group-h">{s.words}</p>
        <dl className="gloss">{s.glossary.map(([a, b]) => <div key={a} style={{ display: 'contents' }}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
        <p className="src">{t.source}: <a href="https://docs.ros.org/en/humble/p/rviz2/doc/index.html">RViz User's Guide (ROS 2 Humble)</a>.</p>
      </div>
    </>
  )
}
