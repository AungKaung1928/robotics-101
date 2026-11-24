import { useState } from 'react'
import { stringsFor, type Strings } from '../../i18n'
import { HORIZON, SLOW_AT, SLOW_MS, TRANSITIONS, late, processes, starts, step, ticks, worstDelay, type Exec, type State } from './lifecycle'
import { LIFECYCLE_STRINGS } from './lifecycle.strings'
import '../l1/l1.css'
import '../l2/l2.css'
import Gloss from '../l1/Gloss'

const W = 640, H = 120, X0 = 20, PX = (W - 2 * X0) / (HORIZON + 100)
const STATES: State[] = ['unconfigured', 'inactive', 'active', 'finalized']
const DESIGN = 'https://design.ros2.org/articles/node_lifecycle.html'
const EXEC = 'https://docs.ros.org/en/jazzy/Concepts/Intermediate/About-Executors.html'
const GROUPS = 'https://docs.ros.org/en/jazzy/How-To-Guides/Using-callback-groups.html'
const AUTOWARE = 'https://github.com/AungKaung1928/Autoware-Simulation-Demo/blob/main/src/main.cpp#L16'

/** 5.5: drive a lifecycle node through its transitions; then pick an executor and watch the control ticks. */
export default function LifecycleChapter({ t }: { t: Strings }) {
  const s = stringsFor(LIFECYCLE_STRINGS, t, 'l5b.lifecycle.LIFECYCLE_STRINGS')
  const [st, setSt] = useState<State>('unconfigured')
  const [msg, setMsg] = useState('')
  const [ex, setEx] = useState<Exec>('single')
  const go = (tr: (typeof TRANSITIONS)[number]) => {
    const n = step(st, tr)
    if (n) { setSt(n); setMsg('') } else setMsg(s.rejected(tr, s.states[st]))
  }
  const ss = starts(ex), nLate = late(ex), ok = nLate === 0
  return (
    <>
      <div className="figure">
        <svg className="side graph" viewBox={`0 0 ${W} 90`} role="img" aria-label={s.stateH}>
          {STATES.map((name, i) => (
            <g key={name} className={`nd still ${name === st ? 'ok' : 'off'}`} data-state={name}>
              <rect x={X0 + i * 155} y={20} width={140} height={44} />
              <text x={X0 + i * 155 + 70} y={48} textAnchor="middle">{s.states[name]}</text>
            </g>
          ))}
        </svg>
        <svg className="side graph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={s.execH}>
          <rect className="qfull" x={X0 + SLOW_AT * PX} y={70} width={SLOW_MS * PX} height={24} rx={3} />
          <text className="legend" x={X0 + SLOW_AT * PX} y={112}>map save</text>
          {ticks().map((due, k) => (
            <g key={due}>
              <line className="floor" x1={X0 + due * PX} x2={X0 + due * PX} y1={14} y2={60} />
              <rect className={ss[k] > due ? 'qfull' : 'body'} x={X0 + ss[k] * PX - 5} y={24 + (ss[k] > due ? (k % 3) * 10 : 0)} width={10} height={10} rx={2} />
            </g>
          ))}
          <text className="legend" x={X0} y={H - 4}>0 ms</text>
          <text className="legend" x={X0 + HORIZON * PX} y={H - 4} textAnchor="middle">{HORIZON}</text>
        </svg>
        <p className="runs" data-k="caption">{s.caption(nLate)}</p>
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        <p className="note" data-k="everyday">{s.everyday}</p>
        <p className="group-h">{s.stateH}</p>
        <div className="stepper" role="group" aria-label={s.stateH}>
          {TRANSITIONS.map((tr) => <button key={tr} type="button" data-tr={tr} onClick={() => go(tr)}>{tr}</button>)}
          <button type="button" onClick={() => { setSt('unconfigured'); setMsg('') }}>{s.reset}</button>
        </div>
        <dl className="readout">
          <div><dt>{s.state}</dt><dd data-k="state">{s.states[st]}</dd></div>
          <div><dt>{s.processing}</dt><dd data-k="processing">{processes(st) ? s.yes : s.no}</dd></div>
        </dl>
        {msg && <p className="verdict no" data-k="rejected">{msg}</p>}
        <p>{s.lcNote}</p>
        <p className="group-h">{s.execH}</p>
        <div className="stepper" role="group" aria-label={s.execH}>
          {(['single', 'multi_default', 'multi_groups'] as Exec[]).map((k) => <button key={k} type="button" aria-pressed={ex === k} onClick={() => setEx(k)}>{s.execs[k]}</button>)}
        </div>
        <p><button type="button" className="break" onClick={() => setEx('multi_default')}>{s.breakIt}</button></p>
        <dl className="readout">
          <div><dt>{s.lateLbl}</dt><dd data-k="late">{nLate}</dd></div>
          <div><dt>{s.worst}</dt><dd data-k="worst">{worstDelay(ex)}</dd></div>
        </dl>
        <p className="runs">{s.timingNote}</p>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? '✓ ' + s.solved : s.notYet} {s.execs[ex]}</p>
        <p className="note">{s.trap}</p>
        <div className="real-project"><p>{s.real}</p></div>
        <p className="group-h">{s.words}</p>
        <Gloss items={s.glossary} />
        <p className="src">{t.source}: <a href={DESIGN}>design.ros2.org: Managed nodes</a> · <a href={EXEC}>Jazzy: Executors</a> · <a href={GROUPS}>Jazzy: Using callback groups</a> · <a href={AUTOWARE}>Autoware-Simulation-Demo src/main.cpp:16</a></p>
      </div>
    </>
  )
}
