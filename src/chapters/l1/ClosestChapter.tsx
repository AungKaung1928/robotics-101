import { useMemo, useState } from 'react'
import Player from '../../components/Player'
import Slider from '../../components/Slider'
import { STRINGS, type Strings } from '../../i18n'
import { BASE, BOX_M, beamDeg, challengeOk, closestOf, readings, scenario, trace, updates, type Start } from './closest'
import { CLOSEST_STRINGS } from './closest.strings'
import './l1.css'
import Gloss from './Gloss'

const W = 640, H = 330, CX = 320, CY = 305, PX = 110 // px per metre, top view, robot at the bottom
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const m = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : 'inf')
const end = (i: number, d: number) => {
  const a = (beamDeg(i) * Math.PI) / 180
  return [CX - Math.sin(a) * d * PX, CY - Math.cos(a) * d * PX] as const
}

/** 1.2: a for loop over 10 readings inside a function. The scenario steps the loop pass by pass. */
export default function ClosestChapter({ t }: { t: Strings }) {
  const s = CLOSEST_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const [boxAt, setBoxAt] = useState(6)
  const [start, setStart] = useState<Start>('inf')
  const sc = useMemo(() => scenario(boxAt, start), [boxAt, start])
  const rs = readings(boxAt)
  const tr = trace(rs, start)
  const [tS, setTS] = useState(() => (still() ? sc.durationMs / 1000 : 0))
  const now = Math.min(tS, sc.durationMs / 1000)
  const f = sc.frame(now * 1000)
  const p = tr[f.pass]
  const n = updates(rs, start)
  const ok = challengeOk(boxAt) && start === 'inf'
  const show = () => setTS(Infinity) // a new setting shows its end frame at once; Play replays it
  const [bx, by] = end(boxAt, BOX_M + 0.16) // box sits just past the hit point
  const line = f.done ? 6 : p.updated ? 4 : 3 // highlighted code line
  return (
    <>
      <div className="figure">
        <svg className="side" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={s.title}>
          <rect className="wall" x={bx - 14} y={by - 14} width={28} height={28} rx={2} transform={`rotate(${-beamDeg(boxAt)} ${bx} ${by})`} />
          {rs.map((d, i) => {
            const [x, y] = end(i, d)
            const cls = i === f.best ? 'best' : i === f.pass && !f.done ? 'now' : i < f.pass || f.done ? 'seen' : 'todo'
            return (
              <g key={i} className={`ray ${cls}`}>
                <line x1={CX} y1={CY} x2={x} y2={y} />
                <circle cx={x} cy={y} r={i === f.best ? 7 : 4} />
                <text x={i === boxAt ? x + 30 : x} y={i === boxAt ? y + 6 : y - 12} textAnchor="middle">{m(d)}</text>
              </g>
            )
          })}
          <circle className="body" cx={CX} cy={CY} r={16} />
        </svg>
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t}
          caption={f.done ? s.ret(m(f.closest)) : s.caption(f.pass, m(p.d), m(p.closest), p.updated)} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <pre className="code" aria-label="Python">
          {[
            <>def closest(readings):</>,
            <>    closest = <span className={start === 'zero' ? 'bad' : 'val'}>{start === 'inf' ? 'float("inf")' : '0'}</span></>,
            <>    for d in readings:   <span className="cmt"># d = <span className="val">{m(p.d)}</span></span></>,
            <>        if d {'<'} closest:</>,
            <>            closest = d   <span className="cmt"># now <span className="val">{m(p.closest)}</span></span></>,
            <>    </>,
            <>    return closest</>,
          ].map((c, i) => <span key={i} className={`ln${i === line ? ' on' : ''}`}>{c}</span>)}
        </pre>
        <p className="runs">{s.runsHere}</p>
        <Slider hint={t.drag} label={s.boxAt} value={boxAt} min={0} max={BASE.length - 1} step={1} fmt={(v) => `${v + 1}/10`}
          onChange={(v) => { setBoxAt(v); show() }} />
        <p><button type="button" className="break" onClick={() => { setStart(start === 'inf' ? 'zero' : 'inf'); show() }}>{start === 'inf' ? s.breakIt : s.fixIt}</button></p>
        {start === 'zero' && <p className="note">{s.brokenNote}</p>}
        <dl className="readout">
          <div><dt>{s.result}</dt><dd data-k="closest">{m(closestOf(rs, start))} m</dd></div>
          <div><dt>{s.changes}</dt><dd data-k="updates">{n}</dd></div>
        </dl>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? '✓ ' + s.solved : s.notYet} {n} {s.times}</p>
        <p className="group-h">{s.words}</p>
        <Gloss items={s.glossary} />
        <p className="src">{t.source}: <a href="https://docs.python.org/3/tutorial/controlflow.html#for-statements">Python tutorial: for</a>, <a href="https://docs.python.org/3/tutorial/controlflow.html#defining-functions">defining functions</a>, <a href="https://docs.python.org/3/library/functions.html#float">float("inf")</a>.</p>
      </div>
    </>
  )
}
