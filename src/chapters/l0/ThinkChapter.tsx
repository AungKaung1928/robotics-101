import { useMemo, useState } from 'react'
import Mascot from '../../anim/Mascot'
import Player from '../../anim/Player'
import Slider from '../../components/Slider'
import { SOURCE_REPO } from '../../content/world'
import { stringsFor, type Strings } from '../../i18n'
import RobotSide from '../l1/RobotSide'
import '../l1/l1.css'
import { RULE_M, SCAN_HZ, SPEED, run, scenario } from './think'
import { THINK_STRINGS } from './think.strings'
import './l0.css'
import './think.css'
import AlreadyKnow from './AlreadyKnow'

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const m = (v: number) => v.toFixed(2)
type Answer = 'earlier' | 'later' | 'never'
const ANSWERS: Answer[] = ['earlier', 'later', 'never']

/** Level 0 "think": the 1.1 rule and figure (RobotSide, decide.run) with the number as the only control; no code. */
export default function ThinkChapter({ t }: { t: Strings }) {
  const s = stringsFor(THINK_STRINGS, t, 'l0.think.THINK_STRINGS')
  const [rule, setRule] = useState(RULE_M)
  const [picked, setPicked] = useState<Answer | null>(null)
  const [cheer, setCheer] = useState(0)
  const [oops, setOops] = useState(0)
  const r = useMemo(() => run(rule), [rule])
  const sc = useMemo(() => scenario(rule), [rule])
  const [tS, setTS] = useState(() => (still() ? sc.durationMs / 1000 : 0))
  const now = Math.min(tS, sc.durationMs / 1000)
  const f = sc.frame(now * 1000)
  const set = (v: number) => { const n = Math.round(v * 100) / 100; if (run(n).crashed && !r.crashed) setOops(oops + 1); setRule(n); setTS(Infinity) }
  const answer = (a: Answer) => { setPicked(a); if (a === 'earlier') setCheer(cheer + 1); else setOops(oops + 1) }
  const k = r.ticks[f.tick]
  return (
    <>
      <div className="figure">
        <RobotSide f={f} stopAt={rule} tS={now} label={s.title} crashed={s.bumped} plain={s.fig} />
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t}
          caption={s.caption(f.tick + 1, m(k.distance), k.decision === 'go')} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        <AlreadyKnow id="think" t={t} />
        {s.steps.map((l) => <p key={l}>{l}</p>)}
        <Slider hint={t.drag} label={s.rule} value={rule} min={0} max={1} step={0.01} mark={RULE_M} fmt={m} onChange={set} />
        <p><button type="button" className="break" onClick={() => set(rule === 0 ? RULE_M : 0)}>{rule === 0 ? s.fixIt : s.breakIt}</button></p>
        {rule === 0 && <p className="note">{s.brokenNote}</p>}
        <dl className="readout">
          <div><dt>{s.final}</dt><dd data-k="final">{r.crashed ? s.bumped : `${m(r.final)} m`}</dd></div>
          <div><dt>{s.checks}</dt><dd data-k="checks">{r.ticks.length}</dd></div>
        </dl>
        <div className="think-check">
          <Mascot cheer={cheer} oops={oops} label={s.mascot} />
          <div>
            <p><strong>{s.check}</strong></p>
            <p>{ANSWERS.map((a) => <button type="button" key={a} className="pick" aria-pressed={picked === a} onClick={() => answer(a)}>{s.answers[a]}</button>)}</p>
            {picked && <p className={`verdict ${picked === 'earlier' ? 'ok' : 'no'}`} data-k="check">{picked === 'earlier' ? '✓ ' + s.yes : s.no}</p>}
          </div>
        </div>
        <p className="group-h">{s.words}</p>
        <dl className="gloss">{s.glossary.map(([w, d]) => <div key={w} style={{ display: 'contents' }}><dt>{w}</dt><dd>{d}</dd></div>)}</dl>
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/config/nav2_params.yaml#L39`}>nav2_params.yaml:39</a> ({SPEED} m/s), <a href={`${SOURCE_REPO}/blob/main/description/turtlebot3_burger.urdf.xacro#L168`}>turtlebot3_burger.urdf.xacro:168</a> ({SCAN_HZ} checks/s).</p>
      </div>
    </>
  )
}
