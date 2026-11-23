import { useMemo, useState } from 'react'
import Player from '../../components/Player'
import { arrivalScale } from '../../anim/spring'
import { SOURCE_REPO } from '../../content/world'
import { STRINGS, type Strings } from '../../i18n'
import { easeInOut } from '../../lib/timeline'
import { HOP_S, PIPE, found, scenario } from './pipe'
import { PIPE_STRINGS } from './pipe.strings'
import './l0.css'

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const BREAKS = [2, 1, 3] // which program stops, per press of break-it (costmap, SLAM, planner)
const W = 108, GAP = 14, x0 = (i: number) => 8 + i * (W + GAP)

/** 0.2: one scan hops through the programs of his stack; break-it stops one, the reader finds which. */
export default function PipeChapter({ t }: { t: Strings }) {
  const s = PIPE_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const [presses, setPresses] = useState(0)
  const broken = presses % 2 === 1 ? BREAKS[((presses - 1) / 2) % BREAKS.length] : null
  const [clicked, setClicked] = useState<number | null>(null)
  const sc = useMemo(() => scenario(broken), [broken])
  const [tS, setTS] = useState(() => (still() ? sc.durationMs / 1000 : 0))
  const now = Math.min(tS, sc.durationMs / 1000)
  const f = sc.frame(now * 1000)
  const ok = broken !== null && found(broken, clicked)
  const hop = (now / HOP_S) % 1
  const px = x0(f.at) + W / 2 + (f.moving ? easeInOut((hop - 0.6) / 0.4) * (W + GAP) : 0)
  // The receiving box swells and springs back as the scan lands (box 0 holds it from t = 0, no landing).
  const landed = f.at > 0 ? now - f.at * HOP_S : 0
  return (
    <>
      <div className="figure">
        <svg className="pipe" viewBox="0 0 620 220" role="group" aria-label={`${s.title}: ${s.caption(s.names[PIPE[f.at].id])}`}>
          {PIPE.map((p, i) => {
            const box = (
              <>
                <g transform={i === f.at && landed > 0 ? `translate(${x0(i) + W / 2} 72) scale(${arrivalScale(landed)}) translate(${-(x0(i) + W / 2)} -72)` : undefined}>
                  <rect x={x0(i)} y="40" width={W} height="64" rx="8" />
                  <text x={x0(i) + W / 2} y="77" textAnchor="middle">{s.names[p.id]}</text>
                </g>
                {i < PIPE.length - 1 && <path className="pipe-link" d={`M ${x0(i) + W} 72 h ${GAP}`} />}
              </>
            )
            const cls = `stage${i <= f.at ? ' is-on' : ''}${clicked === i ? (ok ? ' is-found' : ' is-wrong') : ''}`
            return broken === null
              ? <a key={p.id} href={p.chapter} className={cls}>{box}</a>
              : <g key={p.id} className={cls} role="button" tabIndex={0} aria-label={s.names[p.id]}
                  onClick={() => setClicked(i)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setClicked(i) } }}>{box}</g>
          })}
          {!f.arrived && <circle className="packet" cx={px} cy="120" r="6" />}
          <text className="say" x="310" y="156" textAnchor="middle">{s.does[PIPE[f.at].id]}</text>
          <text className={`say${f.arrived && broken === null ? ' go' : ''}`} x="310" y="190" textAnchor="middle">
            {f.arrived ? (broken === null ? `→ ${s.wheels}` : s.stuck) : ''}
          </text>
        </svg>
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t}
          caption={s.caption(s.names[PIPE[f.at].id])} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <p><button type="button" className="break" onClick={() => { setPresses(presses + 1); setClicked(null); setTS(0) }}>{broken === null ? s.breakIt : s.fixIt}</button></p>
        {broken !== null && <p className="note">{s.brokenNote}</p>}
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? '✓ ' + s.solved : s.notYet}</p>
        <p className="group-h">{s.words}</p>
        <dl className="gloss">{s.glossary.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt><code>{k}</code></dt><dd>{v}</dd></div>)}</dl>
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/config/nav2_params.yaml`}>nav2_params.yaml</a> · <a href="https://docs.nav2.org/concepts/index.html">Nav2 concepts</a></p>
      </div>
    </>
  )
}
