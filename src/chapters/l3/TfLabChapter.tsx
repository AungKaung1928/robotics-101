import { useEffect, useState } from 'react'
import { stringsFor, type Strings } from '../../i18n'
import { SOURCE_REPO } from '../../content/world'
import { BROKEN, CHOICES, HITS, MOUNT, PAIRS, TURN, WALL_X, ageStatus, apply, diagnose, healthy, pairKey, type Edge } from './tflab'
import { TFLAB_STRINGS } from './tflab.strings'
import { TfChainLive } from '../../scenarios/TfChain'
import TfLab from '../../scenarios/TfLab'
import { fixSettle, fixedYaw, staleYaw, toMap, wallResidual } from '../../scenarios/tflab'
import Slider from '../../components/Slider'
import './l3.css'

const CODE = ['src/tf_anomaly_detector.cpp#L37-L39', 'src/tf_anomaly_detector.cpp#L103-L110', 'test/test_tf_lab_missing_link.cpp#L56-L58']
const TEST = 'TFLabMissingLink.FixedChainReportsMapToBaseLinkHealthy'
const BASE = { x: 0, y: 0, yaw: 0 }
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const cm = (m: number) => `${(m * 100).toFixed(1)} cm`

/** 3.3: predict → see → inspect → fix → verify, on the same broken chain as the repo's lab test. */
export default function TfLabChapter({ t }: { t: Strings }) {
  const s = stringsFor(TFLAB_STRINGS, t, 'l3.tflab.TFLAB_STRINGS')
  const [guess, setGuess] = useState<Set<string>>(new Set())
  const [checked, setChecked] = useState(false)
  const [ran, setRan] = useState(false)
  const [edges, setEdges] = useState<readonly Edge[]>(BROKEN)
  const diag = diagnose(edges), truth = diagnose(BROKEN)
  const right = PAIRS.every((p) => guess.has(pairKey(p)) === (truth[pairKey(p)] === 'MISSING'))
  // Second failure: the hits drawn through a stale transform; 'fresh' springs the error to 0 (anim's TfLab, FIX spring).
  const [age, setAge] = useState(0.3)
  const [fixAt, setFixAt] = useState<number | null>(null) // performance.now() of the fresh transform
  const [now, setNow] = useState(0)
  const err0 = staleYaw(TURN, age)
  const since = fixAt === null ? -1 : Math.max(0, (now - fixAt) / 1000)
  const yawNow = fixedYaw(err0, since), off = wallResidual(toMap(BASE, { ...MOUNT, yaw: yawNow }, HITS), WALL_X)
  useEffect(() => {
    if (fixAt === null) return
    let id = requestAnimationFrame(function tick(n) { setNow(n); if ((n - fixAt) / 1000 < fixSettle(err0)) id = requestAnimationFrame(tick) })
    return () => cancelAnimationFrame(id)
  }, [fixAt, err0])
  const fresh = () => { const n = performance.now(); setNow(n); setFixAt(still() ? n - 99_000 : n) }
  const status = fixAt === null ? ageStatus(age) : 'OK'
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
        <p><button type="button" data-act="check" onClick={() => setChecked(true)}>{s.check}</button></p>
        {checked && <p className={`verdict ${right ? 'ok' : 'no'}`} data-k="predict">{right ? '✓ ' + s.right : s.wrong}</p>}
        <h2>{s.s2}</h2>
        <p><button type="button" data-act="run" onClick={() => setRan(true)}>{s.run}</button></p>
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
          <p><button type="button" data-act="reset" onClick={() => { setEdges(BROKEN); setRan(false) }}>{s.reset}</button></p>
        </>}
        <h2>{s.stale.title}</h2>
        <p className="note">{s.stale.note}</p>
        <TfLab hits={HITS} base={BASE} mount={MOUNT} wallX={WALL_X} err0={err0} sinceFix={since} label={s.stale.title} residualText={(m) => `${cm(m)} ${s.stale.off}`} />
        <Slider label={s.stale.age} value={age} min={0} max={2} step={0.1} mark={1} onChange={(v) => { setAge(v); setFixAt(null) }} fmt={(v) => v.toFixed(1)} />
        <dl className="readout">
          <div><dt>{s.stale.status}</dt><dd data-k="stale">{status}</dd></div>
          <div><dt>{s.stale.yaw}</dt><dd data-k="staleyaw">{((yawNow * 180) / Math.PI).toFixed(1)}°</dd></div>
          <div><dt>{s.stale.off}</dt><dd data-k="staleoff">{cm(off)}</dd></div>
        </dl>
        {status === 'OK' && off > 0.01 && <p className="verdict no" data-k="stalelesson">{s.stale.lesson}</p>}
        <p><button type="button" data-act="fresh" disabled={err0 === 0 || fixAt !== null} onClick={fresh}>{s.stale.fresh}</button></p>
      </div>
    </>
  )
}
