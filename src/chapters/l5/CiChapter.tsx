import { useEffect, useState } from 'react'
import { stringsFor, type Strings } from '../../i18n'
import Gloss from '../l1/Gloss'
import { LINES, PUSHES, REAL, RUN, SECONDS, STEPS, run, secondsToVerdict, type Push, type Step } from './ci'
import { CI_STRINGS } from './ci.strings'
import CiteCode from './CiteCode'
import './l5.css'

const REPO = 'https://github.com/AungKaung1928/TF-Transform-Explorer'
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const LOCAL = 'rosdep install --from-paths src --ignore-src -y\ncolcon build\ncolcon test\ncolcon test-result --verbose'

/** 5.2: one push through ci.yml; steps light up one by one, a failure skips the rest. */
export default function CiChapter({ t }: { t: Strings }) {
  const s = stringsFor(CI_STRINGS, t, 'l5.ci.CI_STRINGS')
  const [push, setPush] = useState<Push>('clean')
  const [guess, setGuess] = useState<Step | 'none'>('none')
  const [shown, setShown] = useState(-1) // steps revealed so far (animation); -1 = not run
  const [zeroTests, setZeroTests] = useState(false)
  const res = run(push)
  const firstRed = STEPS.find((st) => res[st] === 'failure') ?? 'none'
  const done = shown >= STEPS.length
  useEffect(() => {
    if (shown < 0 || done) return
    const id = setTimeout(() => setShown((n) => n + 1), 350)
    return () => clearTimeout(id)
  }, [shown, done])
  useEffect(() => { if (done && res.build === 'failure' && res.test === 'skipped') setZeroTests(true) }, [done, res.build, res.test])
  const go = () => setShown(still() ? STEPS.length : 0)
  const real = REAL[push]
  return (
    <>
      <div className="figure">
        <svg className="ci-bar" viewBox={`0 0 ${STEPS.length * 70} 24`} role="img" aria-label={STEPS.map((st, i) => `${s.step[st]}: ${i < shown || done ? s.result[res[st]] : '·'}`).join(', ')}>
          {STEPS.map((st, i) => <rect key={st} x={i * 70 + 2} y="2" width="64" height="20" rx="3" className={i < shown || done ? res[st] : 'wait'} />)}
        </svg>
        <ol className="ci-pipe" aria-live="polite">
          {STEPS.map((st, i) => {
            const r = i < shown || done ? res[st] : 'wait'
            return <li key={st} className={`ci-step ${r}`} data-k={`step-${st}`}><span>{s.step[st]}</span> <b>{r === 'wait' ? '·' : s.result[r]}</b></li>
          })}
        </ol>
        <p className="note">{s.setup}</p>
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        <h2>{s.pick}</h2>
        <p className="choices">
          {PUSHES.map((p) => <label key={p} className="pick"><input type="radio" name="ci-push" checked={push === p} onChange={() => { setPush(p); setShown(-1) }} /> {s.push[p]}</label>)}
        </p>
        <h2>{s.predict}</h2>
        <p className="choices">
          {(['none', 'build', 'test', 'figure'] as const).map((g) => <label key={g} className="pick"><input type="radio" name="ci-guess" checked={guess === g} onChange={() => { setGuess(g); setShown(-1) }} /> {g === 'none' ? s.none : s.step[g]}</label>)}
        </p>
        <p><button type="button" data-act="run" onClick={go}>{s.runBtn}</button></p>
        {done && <>
          <p className={`verdict ${guess === firstRed ? 'ok' : 'no'}`} data-k="predict">{guess === firstRed ? '✓ ' + s.right : s.wrong}</p>
          <p data-k="seconds">{s.verdictIn} {secondsToVerdict(push)} {s.sec}</p>
          <p data-k="real">{real ? <a href={`${REPO}/actions/runs/${real.id}`}>{s.real}: {real.sha}</a> : s.noReal}</p>
        </>}
        <p className="note">{s.timing}</p>
        <ul className="port-diff">{STEPS.map((st) => <li key={st}><a href={`${REPO}/blob/${RUN.sha}/${LINES[st]}`}><CiteCode p={LINES[st]} /></a> {s.step[st]} ({SECONDS[st]} {s.sec})</li>)}</ul>
        <h2>{s.breakTitle}</h2>
        <p className="note">{s.breakNote}</p>
        <p>{s.challenge}</p>
        <p className={`verdict ${zeroTests ? 'ok' : 'no'}`} data-k="challenge">{zeroTests ? '✓ ' + s.solved : s.notYet}</p>
        <p>{s.local}</p>
        <pre className="code port-code"><code>{LOCAL}</code></pre>
        <Gloss items={s.glossary} />
      </div>
    </>
  )
}
