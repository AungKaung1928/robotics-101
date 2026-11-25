import { useMemo, useState } from 'react'
import Player from '../../anim/Player'
import { wallErr } from '../../scenarios/wallerr'
import Slider from '../../components/Slider'
import { stringsFor, type Strings } from '../../i18n'
import { KP_RANGE, N, P, START_D, avoided, challengeOk, closest, run, scenario, settleS, spun, tooCloseTicks } from './wall'
import { WALL_STRINGS } from './wall.strings'
import '../l1/l1.css'
import './l3.css'
import Gloss from '../l1/Gloss'

const W = 640, H = 230, X0 = 20, WALL_Y = 200, PX = 140 // px per metre
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const REPO = 'https://github.com/AungKaung1928/turtlebot3-wall-follower/blob/main'
const CTRL = `${REPO}/wall_following_project/wall_follower_controller.py`

/** 3.2: the repo's PD wall follower on one straight wall; kp slider + look-ahead toggle drive the same model the path is drawn from. */
export default function WallChapter({ t }: { t: Strings }) {
  const s = stringsFor(WALL_STRINGS, t, 'l3.wall.WALL_STRINGS')
  const [kp, setKp] = useState(0.5)
  const [la, setLa] = useState(true)
  const ts = useMemo(() => run(kp, la ? P.lookahead : 0), [kp, la])
  const sc = useMemo(() => scenario(ts), [ts])
  const end = sc.durationMs / 1000
  const [tS, setTS] = useState(() => (still() ? end : 0))
  const now = Math.min(tS, end)
  const f = sc.frame(now * 1000)
  // x along the wall, from the same ticks the readouts use
  const xs = useMemo(() => { let x = 0; return ts.map((k) => { const r = x; x += k.v * Math.cos(k.alpha) * P.dt; return r }) }, [ts])
  const sx = (W - 2 * X0) / Math.max(1, xs[xs.length - 1] || 1)
  const pt = (k: number) => `${(X0 + xs[k] * sx).toFixed(1)},${(WALL_Y - ts[k].d * PX).toFixed(1)}`
  const path = ts.slice(0, f.k + 1).map((_, k) => pt(k)).join(' ')
  const [rx, ry] = pt(f.k).split(',').map(Number)
  const we = wallErr(f.tick.d, f.tick.alpha, la ? P.lookahead : 0), ax = rx + we.ahead * sx, ay = WALL_Y - we.dAhead * PX
  const head = f.tick.alpha // alpha > 0 = heading into the wall = down on screen (SVG rotate is clockwise)
  const st = settleS(ts), ok = challengeOk(ts)
  const reset = () => setTS(still() ? Infinity : 0)
  return (
    <>
      <div className="figure">
        <svg className="side graph wallfig" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={s.title}>
          <line className="stopline lim" x1={X0} x2={W - X0} y1={WALL_Y - P.desired * PX} y2={WALL_Y - P.desired * PX} />
          <text className="legend" x={X0} y={WALL_Y - P.desired * PX - 6}>0.5 m</text>
          <line className="stopline" x1={X0} x2={W - X0} y1={WALL_Y - P.wallMin * PX} y2={WALL_Y - P.wallMin * PX} strokeDasharray="4 4" />
          <text className="legend" x={X0} y={WALL_Y - P.wallMin * PX - 6}>0.28 m</text>
          <polyline className="trail" points={path} />
          {/* what the PD law sees this tick: the look-ahead point and its error to the 0.5 m line */}
          <line className="wall-err" x1={ax} x2={ax} y1={ay} y2={WALL_Y - P.desired * PX} stroke="var(--ray)" strokeWidth={3} strokeLinecap="round" />
          {la && <circle className="wall-ahead" cx={ax} cy={ay} r={4} fill="none" stroke="var(--ray)" strokeWidth={2} />}
          <g transform={`translate(${rx} ${ry}) rotate(${(head * 180) / Math.PI})`}>
            <circle className="body" r={9} />
            <line className="stopline" x1={0} y1={0} x2={16} y2={0} />
          </g>
          <line className="floor" x1={X0} x2={W - X0} y1={WALL_Y} y2={WALL_Y} />
          <text className="legend" x={X0} y={H - 8}>wall</text>
        </svg>
        <Player t={now} setT={setTS} end={end} events={Array.from({ length: 16 }, (_, k) => k)} speed={1} autoplay={!still()} s={t}
          caption={s.caption(f.k * P.dt, f.tick.d)} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <p className="note" data-k="everyday">{s.everyday}</p>
        <Slider hint={t.drag} label={s.kp} value={kp} min={KP_RANGE[0]} max={KP_RANGE[1]} step={0.1} mark={P.kp} fmt={(x) => x.toFixed(1)}
          onChange={(x) => { setKp(Math.round(x * 10) / 10); reset() }} />
        <div className="stepper" role="group" aria-label={s.lookahead}>
          <span>{s.lookahead}</span>
          <button type="button" aria-pressed={la} onClick={() => { setLa(true); reset() }}>{s.on}</button>
          <button type="button" aria-pressed={!la} onClick={() => { setLa(false); reset() }}>{s.off}</button>
        </div>
        <p><button type="button" className="break" onClick={() => { setKp(P.kp); setLa(false); reset() }}>{s.breakIt}</button></p>
        <dl className="readout">
          <div><dt>{s.closest}</dt><dd data-k="closest">{closest(ts).toFixed(2)} m</dd></div>
          <div><dt>{s.settle}</dt><dd data-k="settle">{st === null ? s.never : `${st.toFixed(1)} s`}</dd></div>
          <div><dt>{s.tooClose}</dt><dd data-k="tooclose">{tooCloseTicks(ts)}</dd></div>
          <div><dt>{s.spun}</dt><dd data-k="spun">{spun(ts) ? s.yes : s.no}</dd></div>
        </dl>
        {spun(ts) && <p className="note" data-k="spunnote">{s.spunNote}</p>}
        {avoided(ts) && <p className="note" data-k="avoidnote">{s.avoidNote}</p>}
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? '✓ ' + s.solved : s.notYet} kp {kp.toFixed(1)}</p>
        <p className="note">{s.modelNote} ({START_D} m, {N / 20} s)</p>
        <p className="group-h">{s.words}</p>
        <Gloss items={s.glossary} />
        <p className="src">{t.source}: <a href={`${REPO}/config/wall_following_params.yaml#L8-L31`}>wall_following_params.yaml:8-31</a>, <a href={`${CTRL}#L268-L286`}>wall_follower_controller.py:268-286</a> (two-beam estimate), <a href={`${CTRL}#L320-L357`}>:320-357</a> (PD + speed), <a href={`${CTRL}#L184-L226`}>:184-226</a> (collision zones), <a href={`${CTRL}#L97`}>:97</a> (look-ahead 0.1-1.0 m)</p>
      </div>
    </>
  )
}
