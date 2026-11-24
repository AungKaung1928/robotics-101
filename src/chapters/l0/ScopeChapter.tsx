import { useMemo, useState } from 'react'
import Mascot from '../../anim/Mascot'
import Player from '../../components/Player'
import { findChapter } from '../../content/path'
import { titleOf, stringsFor, type Strings } from '../../i18n'
import { ALL_IDS, ROWS, SKILLS, TAGS, counts, lockedBy, most, scenario, type Skill } from './scope'
import { SCOPE_STRINGS } from './scope.strings'
import './l0.css'
import './scope.css'

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const LX = 96, CW = 128, RH = 44, TOP = 40, DOT = 15

/** 0.12: which skills Levels 1-4 + EP use (dots from scope.ts TAGS); break-it = skip C++; challenge = the most-used skill. */
export default function ScopeChapter({ t }: { t: Strings }) {
  const s = stringsFor(SCOPE_STRINGS, t, 'l0.scope.SCOPE_STRINGS')
  const sc = useMemo(() => scenario(), [])
  const [tS, setTS] = useState(() => (still() ? sc.durationMs / 1000 : 0))
  const now = Math.min(tS, sc.durationMs / 1000)
  const shown = sc.frame(now * 1000).rows
  const [skip, setSkip] = useState(false)
  const [pick, setPick] = useState<Skill | null>(null)
  const [cheer, setCheer] = useState(0)
  const [oops, setOops] = useState(0)
  const c = counts(), locked = lockedBy(skip ? 'cpp' : null), total = ALL_IDS.length
  const name = (id: string) => { const f = findChapter(id); return f ? `${f.num} ${titleOf(f.meta, t)}` : id }
  const answer = (k: Skill) => { setPick(k); if (k === most()) setCheer(cheer + 1); else setOops(oops + 1) }
  const H = TOP + ROWS.length * RH + 8
  return (
    <>
      <div className="figure">
        <svg className="scope" viewBox={`0 0 ${LX + SKILLS.length * CW} ${H}`} role="img" aria-label={`${s.title}: ${s.caption(shown, ROWS.length)}`}>
          {SKILLS.map((k, j) => <text key={k} className="sk" x={LX + j * CW + CW / 2} y={TOP - 16} textAnchor="middle">{s.skill[k]} {c[k]}</text>)}
          {ROWS.map((r, i) => (
            <g key={r.row} className={i < shown ? 'row is-on' : 'row'}>
              <text className="lv" x={LX - 12} y={TOP + i * RH + RH / 2 + 4} textAnchor="end">{s.level(r.row)}</text>
              {SKILLS.map((k, j) => r.ids.filter((id) => TAGS[id].includes(k)).map((id, n) => (
                <circle key={k + id} className={locked.includes(id) ? 'dot is-locked' : 'dot'} data-id={id} data-skill={k}
                  cx={LX + j * CW + 14 + n * DOT} cy={TOP + i * RH + RH / 2} r={6} style={{ transitionDelay: `${n * 40}ms` }}><title>{name(id)}</title></circle>
              )))}
            </g>
          ))}
        </svg>
        <p className="note">{s.epNote}</p>
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t} caption={s.caption(shown, ROWS.length)} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <dl className="readout">
          {SKILLS.map((k) => <div key={k}><dt>{s.skill[k]}</dt><dd data-k={k}>{c[k]} / {total}</dd></div>)}
        </dl>
        <p><button type="button" className="break" onClick={() => { if (!skip) setOops(oops + 1); setSkip(!skip) }}>{skip ? s.fixIt : s.breakIt}</button></p>
        {skip && <p className="note" data-k="locked">{s.brokenNote(locked.length, locked.map(name).join(', '))}</p>}
        <div className="scope-check">
          <Mascot cheer={cheer} oops={oops} label={s.title} />
          <div>
            <p><strong>{s.challenge}</strong></p>
            <p>{SKILLS.map((k) => <button type="button" key={k} className="pick" aria-pressed={pick === k} onClick={() => answer(k)}>{s.skill[k]}</button>)}</p>
            {pick && <p className={`verdict ${pick === most() ? 'ok' : 'no'}`} data-k="challenge">{pick === most() ? '✓ ' + s.solved(s.skill[pick], c[pick], total) : s.wrong(s.skill[pick], c[pick])}</p>}
          </div>
        </div>
        <p className="group-h">{s.words}</p>
        <dl className="gloss">{s.glossary.map(([w, m]) => <div key={w} style={{ display: 'contents' }}><dt>{w}</dt><dd>{m}</dd></div>)}</dl>
        <p className="src">{t.source}: {s.src}</p>
      </div>
    </>
  )
}
