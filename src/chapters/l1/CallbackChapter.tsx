import { useMemo, useState } from 'react'
import Player from '../../components/Player'
import Slider from '../../components/Slider'
import { STRINGS, type Strings } from '../../i18n'
import { DEPTH, PERIOD_MS, challengeOk, dropped, keepsUp, maxAgeMs, scenario, simulate } from './callback'
import { CALLBACK_STRINGS } from './callback.strings'
import './l1.css'

const W = 640, L = 150, R = 625, Y_IN = 40, Y_RUN = 100, Y_Q = 160, H = 200
const REPO = 'https://github.com/AungKaung1928/python-ros2-reference/blob/main/13_classes/classes.py#L111-L112'
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** 1.3: ROS calls the method you registered, one call at a time; a slow callback fills the queue. */
export default function CallbackChapter({ t }: { t: Strings }) {
  const s = CALLBACK_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const [work, setWork] = useState(20)
  const ms = useMemo(() => simulate(work), [work])
  const sc = useMemo(() => scenario(work), [work])
  const [tS, setTS] = useState(() => (still() ? sc.durationMs / 1000 : 0))
  const now = Math.min(tS, sc.durationMs / 1000)
  const f = sc.frame(now * 1000)
  const x = (tMs: number) => L + (tMs / sc.durationMs) * (R - L)
  const show = () => setTS(Infinity) // a new setting shows its end frame at once; Play replays it
  const ok = challengeOk(work)
  const nowMs = now * 1000
  return (
    <>
      <div className="figure">
        <svg className="side" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={s.title}>
          {[[Y_IN, s.arrive], [Y_RUN, s.run], [Y_Q, s.queue]].map(([y, l]) => (
            <g key={l as string}><line className="floor" x1={L} x2={R} y1={y as number} y2={y as number} /><text className="lbl" x={L - 8} y={(y as number) + 5} textAnchor="end">{l}</text></g>
          ))}
          {ms.filter((m) => m.arriveMs <= nowMs).map((m) => (
            <g key={m.k} className={`ray ${m.goneMs !== null && m.goneMs <= nowMs ? 'todo' : 'seen'}`}>
              <circle cx={x(m.arriveMs)} cy={Y_IN} r={5} />
              {m.startMs !== null && m.startMs <= nowMs && (
                <rect className="body" x={x(m.startMs)} y={Y_RUN - 10} width={Math.max(2, x(Math.min(m.endMs!, nowMs)) - x(m.startMs) - 1)} height={20} rx={2} />
              )}
            </g>
          ))}
          {Array.from({ length: DEPTH }, (_, i) => (
            <rect key={i} className={i < f.waiting ? 'qfull' : 'qslot'} x={L + i * 26} y={Y_Q - 10} width={22} height={20} rx={2} />
          ))}
          <line className="stopline" x1={x(nowMs)} x2={x(nowMs)} y1={20} y2={Y_Q + 20} />
        </svg>
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t}
          caption={s.caption(now.toFixed(1), f.done + (f.running === null ? 0 : 1), f.waiting)} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <pre className="code" aria-label="Python">
          {[
            <>class Stopper:</>,
            <>    def __init__(self, stop_at):</>,
            <>        self.stop_at = stop_at</>,
            <>        self.count = 0</>,
            <>{' '}</>,
            <>    def on_scan(self, distance):   <span className="cmt"># ROS calls this</span></>,
            <>        self.count += 1             <span className="cmt"># now <span className="val">{f.done + (f.running === null ? 0 : 1)}</span></span></>,
            <>        work(<span className={keepsUp(work) ? 'val' : 'bad'}>{work / 1000}</span>)                 <span className="cmt"># seconds</span></>,
            <>        return distance {'<'} self.stop_at</>,
          ].map((c, i) => <span key={i} className={`ln${f.running !== null && i >= 6 ? ' on' : ''}`}>{c}</span>)}
        </pre>
        <p className="runs">{s.runsHere}</p>
        <Slider hint={t.drag} label={s.work} value={work} min={10} max={800} step={10} mark={PERIOD_MS} onChange={(v) => { setWork(v); show() }} />
        <p><button type="button" className="break" onClick={() => { setWork(600); show() }}>{s.breakIt}</button></p>
        <dl className="readout">
          <div><dt>{s.count}</dt><dd data-k="count">{ms.filter((m) => m.endMs !== null).length}</dd></div>
          <div><dt>{s.lost}</dt><dd data-k="dropped">{dropped(ms)}</dd></div>
          <div><dt>{s.age}</dt><dd data-k="age">{(maxAgeMs(ms) / 1000).toFixed(2)} s</dd></div>
        </dl>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? '✓ ' + s.solved : s.notYet} {work} ms · {keepsUp(work) ? s.keeps : s.lags}</p>
        <p className="src">{s.repo} <a href={REPO}>13_classes/classes.py:111-112</a></p>
        <pre className="code">{"self.scan_sub_ = self.create_subscription(\n    LaserScan, 'scan', self.scan_callback, 10)"}</pre>
        <p className="group-h">{s.words}</p>
        <dl className="gloss">{s.glossary.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt><code>{k}</code></dt><dd>{v}</dd></div>)}</dl>
        <p className="src">{t.source}: <a href="https://docs.ros.org/en/humble/Concepts/Intermediate/About-Executors.html">ROS 2 Humble: Executors</a>, <a href="https://docs.ros.org/en/humble/Concepts/Intermediate/About-Quality-of-Service-Settings.html">Quality of Service (history depth)</a>, <a href="https://docs.python.org/3/tutorial/classes.html">Python tutorial: classes</a></p>
      </div>
    </>
  )
}
