import { useMemo, useState } from 'react'
import Player from '../../components/Player'
import { STRINGS, type Strings } from '../../i18n'
import { BENCH } from './bench/result'
import { COMPILE_MS, DECLS, GCC_ERROR, compile, line, outcome, scenario, type Decl } from './cpp'
import { CPP_STRINGS } from './cpp.strings'
import RobotSide from './RobotSide'
import './l1.css'

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** 1.4: the 1.1 example in C++. The declaration picks what the compiler stores, or whether it builds at all. */
export default function CppChapter({ t }: { t: Strings }) {
  const s = CPP_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const [decl, setDecl] = useState<Decl>('double')
  const sc = useMemo(() => scenario(decl), [decl])
  const [tS, setTS] = useState(() => (still() ? sc.durationMs / 1000 : 0))
  const now = Math.min(tS, sc.durationMs / 1000)
  const f = sc.frame(now * 1000)
  const c = compile(decl)
  const r = outcome(decl)
  const ok = decl === 'int{}'
  const ratio = BENCH.pyNs / BENCH.cppNs
  const max = BENCH.pyNs
  const status = f.phase === 'compile' ? s.compiling : f.phase === 'error' ? s.failed : s.built
  return (
    <>
      <div className="figure">
        <RobotSide f={f.drive ?? { distance: 2, tick: 0, decision: 'go', moving: false, crashed: false }} stopAt={c.value ?? 0.5} tS={Math.max(0, now - COMPILE_MS / 1000)} label={s.title} crashed={s.crashed}>
          <rect className="qslot" x={20} y={8} width={160} height={10} />
          <rect className={f.phase === 'error' ? 'qfull' : 'body'} x={20} y={8} width={160 * f.compiled} height={10} />
          <text className="lbl" x={190} y={18}>{status}</text>
        </RobotSide>
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t}
          caption={<>{line(decl)} → {status}</>} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <div className="stepper" role="group" aria-label={s.decl}>
          {DECLS.map((d) => <button key={d} type="button" aria-pressed={decl === d} onClick={() => { setDecl(d); setTS(0) }}>{line(d)}</button>)}
        </div>
        <pre className="code" aria-label="C++">
          {[
            <>{line(decl)}</>,
            <>{' '}</>,
            <>if (distance {'<'} stop_at) {'{'}</>,
            <>  speed = 0.0;   <span className="cmt">// stop</span></>,
            <>{'}'} else {'{'}</>,
            <>  speed = 0.26;  <span className="cmt">// go</span></>,
            <>{'}'}</>,
          ].map((x, i) => <span key={i} className={`ln${i === 0 ? ' on' : ''}`}>{x}</span>)}
          {!c.ok && <span className="ln bad">{GCC_ERROR}</span>}
        </pre>
        <p className="note">{s.note[decl]}</p>
        <dl className="readout">
          <div><dt>{s.held}</dt><dd data-k="value">{c.ok ? c.value : '—'}</dd></div>
          <div><dt>{s.result}</dt><dd data-k="robot">{!r ? s.noRun : r.crashed ? s.crashed : `${s.stopped} ${r.final.toFixed(2)} m`}</dd></div>
        </dl>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? '✓ ' + s.solved : s.notYet} {line(decl)}</p>
        <p className="group-h">{s.bench}</p>
        <svg className="side" viewBox="0 0 640 80" role="img" aria-label={s.bench}>
          {[['Python', BENCH.pyNs], ['C++', BENCH.cppNs]].map(([k, v], i) => (
            <g key={k as string} transform={`translate(0 ${10 + i * 36})`}>
              <text className="lbl" x={0} y={18}>{k}</text>
              <rect className={i ? 'body' : 'qfull'} x={70} y={4} width={Math.max(2, ((v as number) / max) * 440)} height={18} rx={2} />
              <text className="lbl" x={78 + ((v as number) / max) * 440} y={18}>{v} ns</text>
            </g>
          ))}
        </svg>
        <p className="runs" data-k="bench">{s.benchNote(`${BENCH.pyNs} ns`, `C++ ${BENCH.cppNs} ns (${ratio.toFixed(0)}×)`)} {BENCH.compiler}, Python {BENCH.python}.</p>
        <p className="group-h">{s.words}</p>
        <dl className="gloss">{s.glossary.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt><code>{k}</code></dt><dd>{v}</dd></div>)}</dl>
        <p className="src">{t.source}: <a href="https://en.cppreference.com/w/cpp/language/list_initialization">cppreference: list initialization (narrowing)</a>, <a href="https://en.cppreference.com/w/cpp/language/implicit_conversion">implicit conversions (floating → integral truncates)</a></p>
      </div>
    </>
  )
}
