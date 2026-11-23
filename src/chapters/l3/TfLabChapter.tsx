import { useState } from 'react'
import { stringsFor, type Strings } from '../../i18n'
import { SOURCE_REPO } from '../../content/world'
import { BROKEN, CHOICES, PAIRS, apply, diagnose, healthy, pairKey, type Edge } from './tflab'
import { TFLAB_STRINGS } from './tflab.strings'
import { TfChainLive } from '../../scenarios/TfChain'
import './l3.css'

const CODE = ['src/tf_anomaly_detector.cpp#L37-L39', 'src/tf_anomaly_detector.cpp#L103-L110', 'test/test_tf_lab_missing_link.cpp#L56-L58']
const TEST = 'TFLabMissingLink.FixedChainReportsMapToBaseLinkHealthy'

/** 3.3: predict → see → inspect → fix → verify, on the same broken chain as the repo's lab test. */
export default function TfLabChapter({ t }: { t: Strings }) {
  const s = stringsFor(TFLAB_STRINGS, t, 'l3.tflab.TFLAB_STRINGS')
  const [guess, setGuess] = useState<Set<string>>(new Set())
  const [checked, setChecked] = useState(false)
  const [ran, setRan] = useState(false)
  const [edges, setEdges] = useState<readonly Edge[]>(BROKEN)
  const diag = diagnose(edges), truth = diagnose(BROKEN)
  const right = PAIRS.every((p) => guess.has(pairKey(p)) === (truth[pairKey(p)] === 'MISSING'))
  const toggle = (k: string) => { const g = new Set(guess); if (g.has(k)) g.delete(k); else g.add(k); setGuess(g); setChecked(false) }
  return (
    <>
      <div className="figure">
        <TfChainLive edges={edges} label={s.setup} />
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
