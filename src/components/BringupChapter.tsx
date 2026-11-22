import { useEffect, useState } from 'react'
import { PATROL_WAIT_S, SOURCE_REPO } from '../content/world'
import type { Strings } from '../i18n'
import { STAGES, earlyStarts, startOrder, type StageId } from '../lib/bringup'
import { routeStep } from '../lib/route'
import Slider from './Slider'

const W = 640, ROW = 34, PAD = 110, T = 30
const x = (t: number) => PAD + (Math.min(t, T) / T) * (W - PAD - 20)
const DEFAULT = Object.fromEntries(STAGES.map((s) => [s.id, s.t])) as Record<StageId, number>

export default function BringupChapter({ t }: { t: Strings }) {
  const s = t.bringup
  const [slam, setSlam] = useState(DEFAULT.slam)
  const [nav2, setNav2] = useState(DEFAULT.nav2)
  const times = { ...DEFAULT, slam, nav2, patrol: nav2 + PATROL_WAIT_S }
  const early = earlyStarts(times)
  const order = startOrder(times)
  const [step, setStep] = useState(() => routeStep(location.hash, order.length))
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    if (step >= order.length - 1) { setPlaying(false); return }
    const id = setTimeout(() => setStep(step + 1), 1000)
    return () => clearTimeout(id)
  }, [playing, step, order.length])
  const started = new Set(order.slice(0, step + 1))
  const now = order[step]
  const cursor = times[now]
  const bad = new Set(early.map(([a]) => a))
  const H = STAGES.length * ROW + 40
  return (
    <>
      <div className="figure">
        <svg className="timeline" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.chapters.bringup}>
          {[0, 5, 10, 15, 20, 25, 30].map((v) => (
            <g key={v}><line className="lane" x1={x(v)} x2={x(v)} y1={10} y2={H - 24} /><text x={x(v)} y={H - 8} textAnchor="middle">{v} s</text></g>
          ))}
          {STAGES.map((st, i) => (
            <g key={st.id} className={`${bad.has(st.id) ? 'is-early' : ''}${started.has(st.id) ? '' : ' is-off'}${st.id === now ? ' is-now' : ''}`} transform={`translate(0 ${20 + i * ROW})`}>
              <text x={8} y={5}>{st.id}</text>
              <line className="run" x1={x(times[st.id])} x2={x(T)} y1={0} y2={0} />
              <text className="gives" x={x(times[st.id]) + 4} y={-8}>{st.gives}</text>
            </g>
          ))}
          <line className="cursor" x1={x(cursor)} x2={x(cursor)} y1={6} y2={H - 24} />
        </svg>
        <div className="stepper">
          <button type="button" onClick={() => { setPlaying(false); setStep(Math.max(0, step - 1)) }} disabled={step === 0}>← {t.back}</button>
          <button type="button" onClick={() => { if (!playing && step === order.length - 1) setStep(0); setPlaying(!playing) }}>{playing ? s.pause : s.play}</button>
          <button type="button" onClick={() => { setPlaying(false); setStep(Math.min(order.length - 1, step + 1)) }} disabled={step === order.length - 1}>{t.next} →</button>
          <span className="caption" data-k="step">t = {cursor} s · {now} → {STAGES.find((x) => x.id === now)!.gives}</span>
        </div>
      </div>
      <div className="panel">
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <Slider hint={t.drag} label={s.slam} value={slam} min={0} max={20} step={0.5} mark={DEFAULT.slam} onChange={setSlam} />
        <Slider label={s.nav2} value={nav2} min={0} max={20} step={0.5} mark={DEFAULT.nav2} onChange={setNav2} />
        <dl className="readout">
          <div><dt>{s.patrol}</dt><dd data-k="patrol">{times.patrol} s</dd></div>
          <div><dt>{s.early}</dt><dd data-k="early" className={early.length ? 'early' : ''}>{early.length ? early.map(([a, b]) => `${a} ${s.waits} ${b}`).join(', ') : s.ok}</dd></div>
        </dl>
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/launch/tf_explorer.launch.py#L68-L137`}>tf_explorer.launch.py:68-137</a>, <a href={`${SOURCE_REPO}/blob/main/README.md`}>README "Run"</a></p>
      </div>
    </>
  )
}
