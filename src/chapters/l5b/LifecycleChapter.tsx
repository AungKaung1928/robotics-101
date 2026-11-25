import { useState } from 'react'
import Mascot from '../../anim/Mascot'
import { lcReaction } from '../../scenarios/lcmood'
import { EP, tokenAt } from '../../scenarios/lctoken'
import '../../scenarios/lifecycle.css'
import { stringsFor, type Strings } from '../../i18n'
import { HORIZON, SLOW_AT, SLOW_MS, TRANSITIONS, late, onError, processes, raiseError, starts, step, ticks, worstDelay, type Exec, type State } from './lifecycle'
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
  const [cheer, setCheer] = useState(0)
  const [wob, setWob] = useState(0) // rejected transitions so far: a new key replays the wobble
  const apply = (n: State | null, label: string) => {
    if (lcReaction(st, n) === 'cheer') setCheer((c) => c + 1)
    if (n) { setSt(n); setMsg('') } else { setMsg(s.rejected(label, s.states[st])); setWob((w) => w + 1) }
  }
  const go = (tr: (typeof TRANSITIONS)[number]) => apply(step(st, tr), tr)
  const ss = starts(ex), nLate = late(ex), ok = nLate === 0
  return (
    <>
      <div className="figure">
        <svg className="side graph" viewBox={`0 0 ${W} 170`} role="img" aria-label={s.stateH}>
          <line className="floor" x1={X0 + 2 * 155 + 70} y1={64} x2={EP.x + EP.w - 40} y2={EP.y} />
          <line className="floor" x1={EP.x + 10} y1={EP.y} x2={X0 + 70} y2={64} />
          <line className="floor" x1={EP.x + EP.w} y1={EP.y + 22} x2={X0 + 3 * 155 + 70} y2={64} />
          <g key={st === 'errorprocessing' ? wob : 'ep'} className={`nd still ${st === 'errorprocessing' ? 'ok' : 'off'}${st === 'errorprocessing' && wob ? ' lc-wobble' : ''}`} data-state="errorprocessing">
            <rect x={EP.x} y={EP.y} width={EP.w} height={44} strokeDasharray="6 4" />
            <text x={EP.x + EP.w / 2} y={EP.y + 28} textAnchor="middle">{s.states.errorprocessing}</text>
          </g>
          {STATES.map((name, i) => (
            <g key={name === st ? `${name}-${wob}` : name} className={`nd still ${name === st ? 'ok' : 'off'}${name === st && wob ? ' lc-wobble' : ''}`} data-state={name}>
              <rect x={X0 + i * 155} y={20} width={140} height={44} />
              <text x={X0 + i * 155 + 70} y={48} textAnchor="middle">{s.states[name]}</text>
            </g>
          ))}
          <g className="lc-token" data-at={st} aria-hidden="true" style={{ transform: `translate(${tokenAt(st).x}px, ${tokenAt(st).y}px)` }}><circle r={8} /></g>
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
        <Mascot cheer={cheer} oops={wob} size={56} label={s.anim.mascot} />
        <p className="group-h">{s.stateH}</p>
        <div className="stepper" role="group" aria-label={s.stateH}>
          {TRANSITIONS.map((tr) => <button key={tr} type="button" data-tr={tr} onClick={() => go(tr)}>{tr}</button>)}
          <button type="button" data-tr="error" onClick={() => apply(raiseError(st), s.anim.errBtn)}>{s.anim.errBtn}</button>
          <button type="button" data-tr="onerror-ok" onClick={() => apply(onError(st, true), s.errTr.ok)}>{s.errTr.ok}</button>
          <button type="button" data-tr="onerror-fail" onClick={() => apply(onError(st, false), s.errTr.fail)}>{s.errTr.fail}</button>
          <button type="button" onClick={() => { setSt('unconfigured'); setMsg('') }}>{s.reset}</button>
        </div>
        <dl className="readout">
          <div><dt>{s.state}</dt><dd data-k="state">{s.states[st]}</dd></div>
          <div><dt>{s.processing}</dt><dd data-k="processing">{processes(st) ? s.yes : s.no}</dd></div>
        </dl>
        {msg && <p className="verdict no" data-k="rejected">{msg}</p>}
        <p>{s.lcNote}</p>
        <details className="note"><summary>{s.anim.more}</summary><p>{s.errNote}</p></details>
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
