import { useState } from 'react'
import Mascot from '../../anim/Mascot'
import { SOURCE_REPO } from '../../content/world'
import { STRINGS, type Strings } from '../../i18n'
import { FIG, PARTS, isRobot, rcCar, type PartId } from './meet'
import { MEET_STRINGS } from './meet.strings'
import './l0.css'
import './meet.css'

type Answer = 'robot' | 'notRobot'
const ANSWERS: Answer[] = ['robot', 'notRobot']

/** Level 0 "meet": tap the Burger's parts (side-view drawing); the remote-control car test of what a robot is. */
export default function MeetChapter({ t }: { t: Strings }) {
  const s = MEET_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const [part, setPart] = useState<PartId | null>(null)
  const [up, setUp] = useState(false)
  const [picked, setPicked] = useState<Answer | null>(null)
  const [cheer, setCheer] = useState(0)
  const [oops, setOops] = useState(0)
  const car = rcCar(up)
  const robot = isRobot(car)
  const yn = (b: boolean) => (b ? s.yes : s.no)
  const answer = (a: Answer) => { setPicked(a); if (a === 'notRobot') setCheer(cheer + 1); else setOops(oops + 1) }
  return (
    <>
      <div className="figure">
        <svg className="meet" viewBox={`0 0 ${FIG.w} ${FIG.h}`} role="group" aria-label={`${s.title}: ${s.tapHint}`}>
          <rect className="meet-frame" x="64" y="130" width="172" height="96" rx="8" />
          <line className="meet-post" x1="150" x2="150" y1="126" y2="130" />
          {PARTS.map((p) => (
            <g key={p.id} className={`meet-part is-${p.id}${part === p.id ? ' is-on' : ''}`} role="button" tabIndex={0} aria-label={s.parts[p.id]} aria-pressed={part === p.id}
              onClick={() => setPart(p.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPart(p.id) } }}>
              {p.rects.map(([x, y, w, h], i) => p.id === 'wheels'
                ? <circle key={i} cx={x + w / 2} cy={y + h / 2} r={w / 2 - 2} />
                : <rect key={i} x={x} y={y} width={w} height={h} rx="6" />)}
            </g>
          ))}
          <text className="meet-hint" x={FIG.w / 2} y="40" textAnchor="middle">{part ? '' : s.tapHint}</text>
        </svg>
        <p className="note" data-k="part">{part ? s.parts[part] : s.drawing}</p>
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.steps.map((l) => <p key={l}>{l}</p>)}
        <p><strong>{s.car}</strong></p>
        <p><button type="button" className="break" onClick={() => setUp(!up)}>{up ? s.downgrade : s.upgrade}</button></p>
        <dl className="readout">
          <div><dt>{s.moves}</dt><dd>{yn(car.moves)}</dd></div>
          <div><dt>{s.senses}</dt><dd data-k="senses">{yn(car.senses)}</dd></div>
          <div><dt>{s.decides}</dt><dd data-k="decides">{car.decidesItself ? s.itself : s.person}</dd></div>
          <div><dt>{s.robot}</dt><dd data-k="robot">{yn(robot)}</dd></div>
        </dl>
        <div className="meet-check">
          <Mascot cheer={cheer} oops={oops} label={s.mascot} />
          <div>
            <p><strong>{s.check}</strong></p>
            <p>{ANSWERS.map((a) => <button type="button" key={a} className="pick" aria-pressed={picked === a} onClick={() => answer(a)}>{s.answers[a]}</button>)}</p>
            {picked && <p className={`verdict ${picked === 'notRobot' ? 'ok' : 'no'}`} data-k="check">{picked === 'notRobot' ? '✓ ' + s.right : s.wrong}</p>}
          </div>
        </div>
        <p className="group-h">{s.words}</p>
        <dl className="gloss">{s.glossary.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        <p className="src">{t.source}: <a href="https://emanual.robotis.com/docs/en/platform/turtlebot3/features/">ROBOTIS e-Manual, TurtleBot3 Features</a> (138 × 178 × 192 mm long × wide × tall, 1 kg, 2 h 30 min), <a href={`${SOURCE_REPO}/blob/main/description/turtlebot3_burger.urdf.xacro#L16`}>turtlebot3_burger.urdf.xacro:16</a> + <a href={`${SOURCE_REPO}/blob/main/description/turtlebot3_burger.urdf.xacro#L117`}>:117</a> (sensor 0.010 + 0.172 m above the floor).</p>
      </div>
    </>
  )
}
