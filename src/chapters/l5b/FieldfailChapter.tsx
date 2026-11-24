import { useState } from 'react'
import { stringsFor, type Strings } from '../../i18n'
import { FAILS, challengeOk, correct, options, url, type FailId } from './fieldfail'
import { FIELDFAIL_STRINGS } from './fieldfail.strings'
import '../l1/l1.css'
import '../l2/l2.css'
import Gloss from '../l1/Gloss'

/** 5.6: one failure at a time: read the symptom, pick the cause, see the fix and the repo line it comes from. */
export default function FieldfailChapter({ t }: { t: Strings }) {
  const s = stringsFor(FIELDFAIL_STRINGS, t, 'l5b.fieldfail.FIELDFAIL_STRINGS')
  const [i, setI] = useState(0)
  const [pick, setPick] = useState<FailId | null>(null)
  const [first, setFirst] = useState<Record<string, boolean>>({})
  const f = FAILS[i], txt = s.fails[f.id], solved = pick !== null && correct(i, pick)
  const choose = (p: FailId) => {
    setPick(p)
    if (!(f.id in first)) setFirst({ ...first, [f.id]: correct(i, p) })
  }
  const nRight = Object.values(first).filter(Boolean).length, ok = challengeOk(first)
  return (
    <>
      <div className="figure">
        <svg className="side graph" viewBox="0 0 640 60" role="img" aria-label={`${s.score}: ${nRight}/${FAILS.length}`}>
          {FAILS.map((x, k) => (
            <rect key={x.id} className={first[x.id] === true ? 'body' : first[x.id] === false ? 'qfull' : 'qslot'} x={10 + k * 105} y={10} width={95} height={40} rx={4}
              stroke={k === i ? 'var(--robot)' : 'none'} strokeWidth={3} />
          ))}
        </svg>
        <div className="real-project" data-k="card">
          <p><strong>{i + 1}/{FAILS.length} · {s.symptom}:</strong> {txt.symptom}</p>
          {solved && <>
            <p data-k="cause"><strong>{s.cause}:</strong> {txt.cause}</p>
            <p data-k="fix"><strong>{s.fix}:</strong> {txt.fix}</p>
            <p className="src"><a href={url(f)}>{f.repo} {f.path}:{f.line}</a></p>
          </>}
        </div>
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        <p className="note" data-k="everyday">{s.everyday}</p>
        <p className="group-h">{s.ask}</p>
        <div className="choices" role="group" aria-label={s.ask}>
          {options(i).map((p) => (
            <p key={p}><button type="button" data-pick={p} aria-pressed={pick === p} onClick={() => choose(p)}>{s.fails[p].cause}</button></p>
          ))}
        </div>
        {pick && <p className={`verdict ${solved ? 'ok' : 'no'}`} data-k="verdict">{solved ? '✓ ' + s.right : s.wrong}</p>}
        <p><button type="button" data-k="next" onClick={() => { setI((i + 1) % FAILS.length); setPick(null) }}>{s.next} →</button>{' '}<button type="button" data-k="reset" disabled={Object.keys(first).length === 0} onClick={() => { setI(0); setPick(null); setFirst({}) }}>{s.reset}</button></p>
        <dl className="readout">
          <div><dt>{s.score}</dt><dd data-k="score">{nRight}/{FAILS.length}</dd></div>
        </dl>
        <p className="runs">{s.measured}</p>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? '✓ ' + s.solved : s.notYet} {nRight}/{FAILS.length}</p>
        <p className="group-h">{s.words}</p>
        <Gloss items={s.glossary} />
        <p className="src">{t.source}: {FAILS.map((x, k) => <span key={x.id}>{k ? ' · ' : ''}<a href={url(x)}>{x.repo} {x.path}:{x.line}</a></span>)}</p>
      </div>
    </>
  )
}
