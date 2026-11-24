import { useState } from 'react'
import { stringsFor, type Strings } from '../../i18n'
import Slider from '../../components/Slider'
import Gloss from '../l1/Gloss'
import { CPP_REPO, DIFFS, HALF, LDS, PY_REPO, REFS, cppIndex, pyIndex, type Scan } from './port'
import { PORT_STRINGS } from './port.strings'
import CiteCode from './CiteCode'
import './l5.css'

/** Ray i of `s` drawn as a spoke from the robot (front = up, left = left, as ROS: x forward, y left). */
function spoke(s: Scan, i: number, r: number): [number, number] {
  const a = s.angleMin + i * s.inc
  return [120 - r * Math.sin(a), 120 - r * Math.cos(a)]
}

/** 5.1: one bearing → the ray each language reads; break it by deleting the C++ wrap fix. */
export default function PortChapter({ t }: { t: Strings }) {
  const s = stringsFor(PORT_STRINGS, t, 'l5.port.PORT_STRINGS')
  const [deg, setDeg] = useState(-90)
  const [half, setHalf] = useState(false)
  const [broken, setBroken] = useState(false)
  const [seen, setSeen] = useState({ agree: false, disagree: false })
  const scan = half ? HALF : LDS
  const py = pyIndex(scan, deg), c = cppIndex(scan, deg, !broken), same = py === c.idx
  const move = (v: number) => {
    setDeg(v)
    const ok = pyIndex(scan, v) === cppIndex(scan, v, !broken).idx
    if (broken) setSeen((x) => ({ ...x, [ok ? 'agree' : 'disagree']: true }))
  }
  const [px, py2] = spoke(scan, py, 96), [cx, cy] = spoke(scan, c.idx, 80)
  const link = (base: string, p: string) => <a href={`${base}/${p}`}><CiteCode p={p} /></a>
  return (
    <>
      <div className="figure">
        <svg className="port-ring" viewBox="0 0 240 240" role="img" aria-label={`${s.py} ${py}, ${s.cpp} ${c.idx}`}>
          <circle className="ring" cx="120" cy="120" r="100" />
          <circle className="body" cx="120" cy="120" r="16" />
          <line className="front" x1="120" y1="120" x2="120" y2="98" />
          <line className="py" x1="120" y1="120" x2={px} y2={py2} />
          <line className={`cpp ${same ? '' : 'bad'}`} x1="120" y1="120" x2={cx} y2={cy} />
        </svg>
        <p className="note">{s.setup}</p>
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        <Slider label={s.bearing} value={deg} min={-180} max={180} step={1} mark={-90} onChange={move} fmt={(v) => `${v}°`} />
        <p className="choices">
          {(['lds', 'half'] as const).map((k) => (
            <label key={k} className="pick"><input type="radio" name="port-layout" checked={half === (k === 'half')} onChange={() => setHalf(k === 'half')} /> {s.layoutName[k]}</label>
          ))}
        </p>
        <dl className="readout">
          <div><dt>{s.py}</dt><dd data-k="py">{py}</dd></div>
          <div><dt>{s.cpp}</dt><dd data-k="cpp">{c.idx}</dd></div>
          <div><dt>{s.readout.offset}</dt><dd data-k="offset">{c.offset.toFixed(3)}</dd></div>
          <div><dt>{s.readout.raw}</dt><dd data-k="raw" className="port-raw">{c.raw.toString()}</dd></div>
        </dl>
        <p className={`verdict ${same ? 'ok' : 'no'}`} data-k="same">{same ? '✓ ' + s.same : s.differ}</p>
        <p className="note">{s.valid}</p>
        <h2>{s.diffTitle}</h2>
        <ul className="port-diff">
          {DIFFS.map((d) => (
            <li key={d}><b>{s.diff[d][0]}</b>: {s.diff[d][1]}<br />
              {s.repoPy} {link(PY_REPO, REFS[d].py)} · {s.repoCpp} {link(CPP_REPO, REFS[d].cpp)}</li>
          ))}
        </ul>
        <h2>{s.breakTitle}</h2>
        <p><button type="button" className="break" data-act="break" onClick={() => { setBroken(!broken); setSeen({ agree: false, disagree: false }) }}>{broken ? s.fixBtn : s.breakBtn}</button></p>
        <pre className="code port-code" aria-label="C++"><span className="ln">{'double offset = std::fmod(angle_deg * M_PI / 180.0 - scan.angle_min, kTwoPi);'}</span>
{broken ? <span className="ln bad">{'// (deleted) if (offset < 0.0) { offset += kTwoPi; }'}</span> : <span className="ln on">{'if (offset < 0.0) {\n  offset += kTwoPi;\n}'}</span>}
<span className="ln">{'const auto idx = static_cast<std::size_t>(std::lround(offset / scan.angle_increment));'}</span></pre>
        {broken && <p className="note">{s.breakNote}</p>}
        <p>{s.challenge}</p>
        <p className={`verdict ${seen.agree && seen.disagree ? 'ok' : 'no'}`} data-k="challenge">
          {seen.agree && seen.disagree ? '✓ ' + s.solved : `${s.notYet} (${s.agreeFound} ${seen.agree ? '✓' : '—'}, ${s.disagreeFound} ${seen.disagree ? '✓' : '—'})`}
        </p>
        <Gloss items={s.glossary} />
      </div>
    </>
  )
}
