import { useMemo, useState } from 'react'
import Player from '../../components/Player'
import { STRINGS, type Strings } from '../../i18n'
import { JOBS, LAYERS, type JobId, type ToolId, score, scenario, working } from './tools'
import { TOOLS_STRINGS } from './tools.strings'
import './l0.css'

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const BREAKS: ToolId[] = ['python', 'linux'] // which layer goes, per press of break-it
const GH = 'https://github.com/AungKaung1928'
/** Box of each layer in the 620 x 300 figure: bottom row first. */
const BOX: Record<ToolId, { x: number; y: number; w: number }> = {
  linux: { x: 10, y: 236, w: 600 },
  terminal: { x: 10, y: 180, w: 600 },
  python: { x: 10, y: 124, w: 294 },
  cpp: { x: 316, y: 124, w: 294 },
  ros: { x: 10, y: 68, w: 600 },
}
const H = 46

/** 0.3: the tool stack lands layer by layer; break-it pulls one out and what needs it greys; challenge = tool per job. */
export default function ToolsChapter({ t }: { t: Strings }) {
  const s = TOOLS_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const [presses, setPresses] = useState(0)
  const removed = presses % 2 === 1 ? BREAKS[((presses - 1) / 2) % BREAKS.length] : null
  const nextBreak = BREAKS[(presses / 2) % BREAKS.length]
  const ok = working(removed)
  const [picks, setPicks] = useState<Partial<Record<JobId, ToolId>>>({})
  const sc = useMemo(() => scenario(), [])
  const [tS, setTS] = useState(() => (still() ? sc.durationMs / 1000 : 0))
  const now = Math.min(tS, sc.durationMs / 1000)
  const f = sc.frame(now * 1000)
  const right = score(picks)
  const top = LAYERS[f.shown - 1].id
  return (
    <>
      <div className="figure">
        <svg className="stack" viewBox="0 0 620 300" role="group" aria-label={`${s.title}: ${s.caption(s.names[top])}`}>
          {LAYERS.slice(0, f.shown).map((l, i) => {
            const b = BOX[l.id], newest = i === f.shown - 1
            const dy = newest ? -(1 - f.drop) * 50 : 0
            const cls = `layer${l.id === removed ? ' is-gone' : ok.has(l.id) ? '' : ' is-off'}${newest && f.drop < 1 ? ' is-new' : ''}`
            return (
              <g key={l.id} className={cls} transform={`translate(0 ${dy.toFixed(1)})`} opacity={newest ? Math.max(0.15, f.drop) : 1}>
                <rect x={b.x} y={b.y} width={b.w} height={H} rx="8" />
                <text x={b.x + 14} y={b.y + 20}>{s.names[l.id]}</text>
                <text className="why" x={b.x + 14} y={b.y + 37}>{s.why[l.id]}</text>
              </g>
            )
          })}
          <text className="say" x="310" y="36" textAnchor="middle">{s.caption(s.names[top])}</text>
        </svg>
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t}
          caption={s.caption(s.names[top])} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <p><button type="button" className="break" onClick={() => { setPresses(presses + 1); setTS(sc.durationMs / 1000) }}>
          {removed === null ? s.breakIt(s.names[nextBreak]) : s.fixIt}</button></p>
        {removed !== null && <p className="note" data-k="working">{s.brokenNote(ok.size)}</p>}
        <p><strong>{s.challenge}</strong></p>
        {JOBS.map((j) => (
          <fieldset key={j.id} className="job">
            <legend>{s.jobs[j.id]}</legend>
            {(['terminal', 'python', 'cpp', 'ros'] as const).map((tool) => (
              <label key={tool}><input type="radio" name={`job-${j.id}`} checked={picks[j.id] === tool}
                onChange={() => setPicks({ ...picks, [j.id]: tool })} /> {s.names[tool]}</label>
            ))}
          </fieldset>
        ))}
        <p className={`verdict ${right === JOBS.length ? 'ok' : 'no'}`} data-k="challenge">{right === JOBS.length ? '✓ ' + s.solved : s.notYet(right)}</p>
        <p className="group-h">{s.words}</p>
        <dl className="gloss">{s.glossary.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt><code>{k}</code></dt><dd>{v}</dd></div>)}</dl>
        <p className="src">{s.repos}: <a href={`${GH}/python-ros2-reference`}>python-ros2-reference</a> · <a href={`${GH}/cpp-ros2-reference`}>cpp-ros2-reference</a> · {t.source}: <a href="https://www.ros.org/reps/rep-2000.html">REP 2000</a> · <a href="https://github.com/ros2/ros2cli">ros2cli</a></p>
      </div>
    </>
  )
}
