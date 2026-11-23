import { useState } from 'react'
import Mascot from '../../anim/Mascot'
import { stringsFor, type Strings } from '../../i18n'
import { LADDER, SOURCES, pick, type Answers } from './simpick'
import { SIMPICK_STRINGS } from './simpick.strings'
import './l0.css'
import './simpick.css'
import AlreadyKnow from './AlreadyKnow'

type Q = keyof Answers
const QS: Q[] = ['gpu', 'sensor', 'physics']
type Answer = 'mvsim' | 'gazebo' | 'isaac'
const ANSWERS: Answer[] = ['mvsim', 'gazebo', 'isaac']

/** Level 0 "simpick": the ladder of simulators; three yes/no questions light the one row to start with. */
export default function SimpickChapter({ t }: { t: Strings }) {
  const s = stringsFor(SIMPICK_STRINGS, t, 'l0.simpick.SIMPICK_STRINGS')
  const [a, setA] = useState<Answers>({ gpu: null, sensor: null, physics: null })
  const [picked, setPicked] = useState<Answer | null>(null)
  const [cheer, setCheer] = useState(0)
  const [oops, setOops] = useState(0)
  const lit = pick(a)
  const answer = (x: Answer) => { setPicked(x); if (x === 'mvsim') setCheer(cheer + 1); else setOops(oops + 1) }
  return (
    <>
      <div className="figure">
        <div className="sp-helper">
          {QS.map((q) => (
            <div key={q} className="sp-q" data-q={q}>
              <span>{s.q[q]}</span>
              <span className="sp-yn">
                {([true, false] as const).map((v) => (
                  <button type="button" key={String(v)} className="pick" aria-pressed={a[q] === v} onClick={() => setA({ ...a, [q]: v })}>{v ? s.yes : s.no}</button>
                ))}
              </span>
            </div>
          ))}
        </div>
        <ol className="sp-ladder" data-k="lit" data-lit={lit}>
          {[...LADDER].reverse().map((r) => {
            const row = s.rows[r.id]
            return (
              <li key={r.id} className={`sp-row${r.id === lit ? ' is-lit' : ''}${r.mentionOnly ? ' is-mention' : ''}`} data-row={r.id}>
                <div className="sp-head">
                  <strong>{r.url ? <a href={r.url}>{row.name}</a> : row.name}</strong>
                  <span className="sp-dim">{s.dim[r.dim]}{r.mentionOnly ? ` · ${s.mentionOnly}` : ''}</span>
                  {r.id === lit && <span className="sp-start">{s.start}</span>}
                </div>
                <p>{row.what}</p>
                <p className="sp-learn">{row.learn}</p>
              </li>
            )
          })}
        </ol>
        <p className="note">{s.others} <a href={SOURCES.stage}>stage_ros2</a>, <a href={SOURCES.flatland}>Flatland (ROS index)</a></p>
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        <AlreadyKnow id="simpick" t={t} />
        {s.steps.map((l) => <p key={l}>{l}</p>)}
        <p className="note" data-k="everyday">{s.everyday}</p>
        <p className="readout-line" data-k="start">{s.start}: {s.rows[lit].name}</p>
        <div className="sp-check">
          <Mascot cheer={cheer} oops={oops} label={s.mascot} />
          <div>
            <p><strong>{s.check}</strong></p>
            <p>{ANSWERS.map((x) => <button type="button" key={x} className="pick" aria-pressed={picked === x} onClick={() => answer(x)}>{s.answers[x]}</button>)}</p>
            {picked && <p className={`verdict ${picked === 'mvsim' ? 'ok' : 'no'}`} data-k="check">{picked === 'mvsim' ? '✓ ' + s.right : s.wrong}</p>}
          </div>
        </div>
        <p className="group-h">{s.words}</p>
        <dl className="gloss">{s.glossary.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        <p className="src">{t.source}: {s.checked} <a href={SOURCES.gazeboHumble}>turtlebot3_gazebo humble</a>, <a href={SOURCES.gazeboJazzy}>jazzy</a> (package.xml), <a href={SOURCES.classicEol}>Gazebo Classic</a>, <a href={SOURCES.webots}>Webots TurtleBot3</a>; row links above.</p>
      </div>
    </>
  )
}
