import { useMemo, useState } from 'react'
import Player from '../../components/Player'
import Slider from '../../components/Slider'
import { SOURCE_REPO } from '../../content/world'
import { STRINGS, type Strings } from '../../i18n'
import { Icon, type IconName } from '../../icons'
import { HZ, START_M, STOP_AT, blindM, inGoal, loopRun, scenario, type Stage } from './loop'
import { LOOP_STRINGS } from './loop.strings'
import './l0.css'

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const STAGES: [Stage, IconName, number][] = [['sense', 'lidar', 100], ['think', 'clock', 300], ['act', 'robot', 500]]
const X0 = 40, X1 = 560 // track: robot start → wall, in svg units
const xAt = (front: number) => X1 - (front / START_M) * (X1 - X0)

/** 0.1: the sense → think → act loop, driven by loopRun (the same model the rate slider and break-it change). */
export default function LoopChapter({ t }: { t: Strings }) {
  const s = LOOP_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const [hz, setHz] = useState(HZ)
  const [blind, setBlind] = useState(false)
  const r = useMemo(() => loopRun(hz, blind ? 2 : Infinity), [hz, blind])
  const sc = useMemo(() => scenario(r, hz), [r, hz])
  const [tS, setTS] = useState(() => (still() ? sc.durationMs / 1000 : 0))
  const now = Math.min(tS, sc.durationMs / 1000)
  const f = sc.frame(now * 1000)
  const restart = () => setTS(Infinity)
  const d = f.t.seen === null ? s.noData : `${f.t.seen.toFixed(2)} m`
  const say: Record<Stage, string> = {
    sense: d,
    think: s.thinkLine(f.t.used.toFixed(2), f.t.decision === 'go'),
    act: f.t.decision === 'go' ? s.actGo((blindM(hz) * 100).toFixed(1)) : s.actStop,
  }
  const result = r.crashed ? s.crashed : `${s.stopped} ${r.final.toFixed(2)} m`
  return (
    <>
      <div className="figure">
        <svg className="loop" viewBox="0 0 600 300" role="img" aria-label={`${s.title}: ${s.caption(f.tick + 1, s.stage[f.stage])}`}>
          <path className="loop-back" d="M 520 70 C 560 -10, 40 -10, 80 70" />
          {STAGES.map(([id, icon, x], i) => (
            <g key={id} className={`stage${f.stage === id ? ' is-on' : ''}`} transform={`translate(${x} 80)`}>
              {i < 2 && <path className="loop-link" d="M 60 0 H 140" />}
              <rect x="-58" y="-30" width="116" height="60" rx="8" />
              <g transform="translate(-44 -10)"><Icon name={icon} /></g>
              <text x="-16" y="5">{s.stage[id]}</text>
              <text className="say" y="58" textAnchor="middle">{f.stage === id ? say[id] : ''}</text>
            </g>
          ))}
          <line className="track" x1={X0 - 20} x2={X1} y1="250" y2="250" />
          <line className="stopline" x1={xAt(STOP_AT)} x2={xAt(STOP_AT)} y1="200" y2="250" />
          <text className="say" x={xAt(STOP_AT)} y="195" textAnchor="middle">0.5 m</text>
          <rect className="wall" x={X1} y="180" width="12" height="70" />
          <rect className={`bot${r.crashed && f.front <= 0 ? ' is-crashed' : ''}`} x={xAt(f.front) - 40} y="222" width="40" height="22" rx="4" />
          {f.stage === 'sense' && f.t.seen !== null && <line className="beam" x1={xAt(f.front)} x2={X1} y1="233" y2="233" />}
        </svg>
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t}
          caption={s.caption(f.tick + 1, s.stage[f.stage])} />
        <p className="note">{s.slow}</p>
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <Slider hint={t.drag} label={s.rate} value={hz} min={1} max={10} step={1} mark={HZ} fmt={(v) => String(v)}
          onChange={(v) => { setHz(v); restart() }} />
        <p><button type="button" className="break" onClick={() => { setBlind(!blind); restart() }}>{blind ? s.fixIt : s.breakIt}</button></p>
        {blind && <p className="note">{s.brokenNote}</p>}
        <dl className="readout">
          <div><dt>{s.blind}</dt><dd data-k="blind">{(blindM(hz) * 100).toFixed(1)} cm</dd></div>
          <div><dt>{s.result}</dt><dd data-k="result">{result}</dd></div>
        </dl>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${inGoal(hz) ? 'ok' : 'no'}`} data-k="challenge">{inGoal(hz) ? '✓ ' + s.solved : s.notYet} {hz} Hz → {(blindM(hz) * 100).toFixed(1)} cm</p>
        <p className="group-h">{s.words}</p>
        <dl className="gloss">{s.glossary.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt><code>{k}</code></dt><dd>{v}</dd></div>)}</dl>
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/description/turtlebot3_burger.urdf.xacro#L168`}>turtlebot3_burger.urdf.xacro:168</a> (LiDAR {HZ} Hz), <a href={`${SOURCE_REPO}/blob/main/config/nav2_params.yaml#L39`}>nav2_params.yaml:39</a> (0.26 m/s).</p>
      </div>
    </>
  )
}
