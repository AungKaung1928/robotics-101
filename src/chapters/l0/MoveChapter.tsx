import { useMemo, useState } from 'react'
import Mascot from '../../anim/Mascot'
import Player from '../../components/Player'
import Slider from '../../components/Slider'
import { SOURCE_REPO } from '../../content/world'
import { stringsFor, type Strings } from '../../i18n'
import { LEFT, SECONDS, SLIP, TOP_SPEED, WHEEL_GAP_M, fill, kind, path, slipFacts, turnsPerS, VIEW, type Kind } from './move'
import { MOVE_STRINGS } from './move.strings'
import './l0.css'
import './move.css'
import Face from './Face'
import { mood } from './robotmood'
import './face.css'

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const { px: PX, ox: OX, oy: OY } = VIEW
const sx = (x: number) => OX + x * PX
const sy = (y: number) => OY - y * PX // svg y points down, the robot's y (left) points up
const R_BODY = 0.07 * PX, HALF_GAP = (WHEEL_GAP_M / 2) * PX
const ANSWERS: Kind[] = ['curveLeft', 'curveRight', 'straight']

/** The break-it sentence from the actual slider value (move.test checks it at several values). */
export function slipText(s: typeof MOVE_STRINGS.en, right: number) {
  const f = slipFacts(right)
  const tpl = f.dir === 'stop' ? s.slipStop : f.same ? s.slipSame : s.slipDiff
  return fill(tpl, { told: f.told, eff: f.eff, right: f.right, dir: f.dir === 'stop' ? '' : s.dir[f.dir], turn: s.turn[f.turn] })
}

/** Level 0 "move": drag the right wheel speed, the path of the two-wheel model is drawn; break it = the left wheel slips. */
export default function MoveChapter({ t }: { t: Strings }) {
  const s = stringsFor(MOVE_STRINGS, t, 'l0.move.MOVE_STRINGS')
  const [right, setRight] = useState(LEFT)
  const [slip, setSlip] = useState(false)
  const [picked, setPicked] = useState<Kind | null>(null)
  const [cheer, setCheer] = useState(0)
  const [oops, setOops] = useState(0)
  const poses = useMemo(() => path(LEFT, right, SECONDS, slip ? SLIP : 1), [right, slip])
  const [tS, setTS] = useState(() => (still() ? SECONDS : 0))
  const now = Math.min(tS, SECONDS)
  const p = poses[Math.round((now / SECONDS) * (poses.length - 1))]
  const k = kind(slip ? LEFT * SLIP : LEFT, right)
  const d = poses.map((q, i) => `${i ? 'L' : 'M'} ${sx(q.x).toFixed(1)} ${sy(q.y).toFixed(1)}`).join(' ')
  const restart = () => setTS(still() ? SECONDS : 0)
  const answer = (a: Kind) => {
    setPicked(a)
    if (a === 'curveRight') setCheer(cheer + 1)
    else setOops(oops + 1)
  }
  return (
    <>
      <div className="figure">
        <svg className="move" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img" aria-label={`${s.title}: ${s.kind[k]}`}>
          <path className="move-path" d={d} data-k="path" />
          <circle className="move-start" cx={OX} cy={OY} r="4" />
          <g transform={`translate(${sx(p.x)} ${sy(p.y)}) rotate(${(-p.yaw * 180) / Math.PI})`}>
            <rect className={`move-wheel${slip ? ' is-slip' : ''}`} x="-10" y={-HALF_GAP - 5} width="20" height="8" rx="2" />
            <rect className="move-wheel" x="-10" y={HALF_GAP - 3} width="20" height="8" rx="2" />
            <circle className="move-body" r={R_BODY} />
            <Face mood={mood({ broken: slip, solved: picked === 'curveRight' })} />
            <circle className="move-sensor" cx="-3" r="5" />
          </g>
        </svg>
        <Player t={now} setT={setTS} end={SECONDS} events={[0, SECONDS]} speed={1} autoplay={!still()} s={t} caption={s.caption(now.toFixed(1))} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.steps.map((l) => <p key={l}>{l}</p>)}
        <Slider hint={t.drag} label={s.right} value={right} min={-TOP_SPEED} max={TOP_SPEED} step={0.01} mark={LEFT} fmt={(v) => v.toFixed(2)}
          onChange={(v) => { setRight(Math.round(v * 100) / 100); restart() }} />
        <p><button type="button" className="break" onClick={() => { setSlip(!slip); if (!slip) setOops(oops + 1); restart() }}>{slip ? s.fixIt : s.breakIt}</button></p>
        {slip && <p className="note" data-k="slip">{slipText(s, right)} {s.slipTrust}</p>}
        {k === 'spin' && <p className="verdict ok" data-k="spin">✓ {s.spinOk}</p>}
        <dl className="readout">
          <div><dt>{s.path}</dt><dd data-k="kind">{s.kind[k]}</dd></div>
          <div><dt>{s.told}</dt><dd data-k="told">{LEFT.toFixed(3)}</dd></div>
          <div><dt>{s.delivers}</dt><dd data-k="delivers">{(slip ? LEFT * SLIP : LEFT).toFixed(3)}</dd></div>
          <div><dt>{s.turns}</dt><dd data-k="turns">{turnsPerS(Math.abs(right)).toFixed(2)}</dd></div>
        </dl>
        <p className="note">{s.real}</p>
        <div className="move-check">
          <Mascot cheer={cheer} oops={oops} label={s.mascot} />
          <div>
            <p><strong>{s.check}</strong></p>
            <p>{ANSWERS.map((a) => <button type="button" key={a} className="pick" aria-pressed={picked === a} onClick={() => answer(a)}>{s.answers[a as keyof typeof s.answers]}</button>)}</p>
            {picked && <p className={`verdict ${picked === 'curveRight' ? 'ok' : 'no'}`} data-k="check">{picked === 'curveRight' ? '✓ ' + s.right_ : s.wrong}</p>}
          </div>
        </div>
        <p className="group-h">{s.words}</p>
        <dl className="gloss">{s.glossary.map(([w, m]) => <div key={w} style={{ display: 'contents' }}><dt>{w}</dt><dd>{m}</dd></div>)}</dl>
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/description/turtlebot3_burger.urdf.xacro#L146-L147`}>turtlebot3_burger.urdf.xacro:146-147</a> ({s.srcGloss.wheels}), <a href="https://emanual.robotis.com/docs/en/platform/turtlebot3/features/">ROBOTIS e-Manual, TurtleBot3 Features</a> (0.22 m/s).</p>
      </div>
    </>
  )
}
