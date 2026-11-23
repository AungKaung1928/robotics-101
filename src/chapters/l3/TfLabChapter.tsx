import { useState } from 'react'
import { STRINGS, type Strings } from '../../i18n'
import { SOURCE_REPO } from '../../content/world'
import { BROKEN, CHOICES, PAIRS, apply, diagnose, healthy, pairKey, type Edge } from './tflab'
import { TFLAB_STRINGS } from './tflab.strings'
import './l3.css'

const CODE = ['src/tf_anomaly_detector.cpp#L37-L39', 'src/tf_anomaly_detector.cpp#L103-L110', 'test/test_tf_lab_missing_link.cpp#L56-L58']
const TEST = 'TFLabMissingLink.FixedChainReportsMapToBaseLinkHealthy'
const FRAMES = ['map', 'odom', 'base_link'] as const

/** 3.3: predict → see → inspect → fix → verify, on the same broken chain as the repo's lab test. */
export default function TfLabChapter({ t }: { t: Strings }) {
  const s = TFLAB_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const [guess, setGuess] = useState<Set<string>>(new Set())
  const [checked, setChecked] = useState(false)
  const [ran, setRan] = useState(false)
  const [edges, setEdges] = useState<readonly Edge[]>(BROKEN)
  const diag = diagnose(edges), truth = diagnose(BROKEN)
  const right = PAIRS.every((p) => guess.has(pairKey(p)) === (truth[pairKey(p)] === 'MISSING'))
  const has = (p: string, c: string) => edges.some(([a, b]) => a === p && b === c)
  const toggle = (k: string) => { const g = new Set(guess); if (g.has(k)) g.delete(k); else g.add(k); setGuess(g); setChecked(false) }
  return (
    <>
      <div className="figure">
        <svg className="tfchain" viewBox="0 0 600 120" role="img" aria-label={s.setup}>
          {FRAMES.map((f, i) => (
            <g key={f} transform={`translate(${90 + i * 210} 60)`}>
              <circle r="46" /><text y="5" textAnchor="middle">{f}</text>
            </g>
          ))}
          {FRAMES.slice(1).map((c, i) => (
            <line key={c} className={has(FRAMES[i], c) ? 'link' : 'link is-missing'} x1={136 + i * 210} x2={254 + i * 210} y1="60" y2="60" />
          ))}
        </svg>
        <p className="note">{s.setup}</p>
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        <h2>{s.s1}</h2>
        {PAIRS.map((p) => (
          <label key={pairKey(p)} className="pick"><input type="checkbox" checked={guess.has(pairKey(p))} onChange={() => toggle(pairKey(p))} /> <code>{pairKey(p)}</code></label>
        ))}
        <p><button type="button" onClick={() => setChecked(true)}>{s.check}</button></p>
        {checked && <p className={`verdict ${right ? 'ok' : 'no'}`} data-k="predict">{right ? '✓ ' + s.right : s.wrong}</p>}
        <h2>{s.s2}</h2>
        <p><button type="button" onClick={() => setRan(true)}>{s.run}</button></p>
        {ran && <pre role="log" data-k="diag">{PAIRS.map((p) => `${pairKey(p)}: ${diag[pairKey(p)]}`).join('\n')}</pre>}
        <h2>{s.s3}</h2>
        <ul className="tflab-code">{CODE.map((c, i) => <li key={c}><a href={`${SOURCE_REPO}/blob/main/${c}`}><code>{c.replace('#L', ':').replace('-L', '-')}</code></a>: {s.code[i]}</li>)}</ul>
        <h2>{s.s4}</h2>
        <p className="choices">
          {CHOICES.map((c) => <button key={c} type="button" className="break" onClick={() => { setEdges(apply(BROKEN, c)); setRan(true) }}>{s.choice[c]}</button>)}
        </p>
        <h2>{s.s5}</h2>
        <p className={`verdict ${healthy(edges) ? 'ok' : 'no'}`} data-k="challenge">{healthy(edges) ? '✓ ' + s.ok : s.notYet}</p>
        {healthy(edges) && <>
          <pre className="tflab-cmd"><code>{`colcon test --packages-select tf_explorer --ctest-args -R test_tf_lab_missing_link\n# ${TEST}`}</code></pre>
          <p><button type="button" onClick={() => { setEdges(BROKEN); setRan(false) }}>{s.reset}</button></p>
        </>}
      </div>
    </>
  )
}
