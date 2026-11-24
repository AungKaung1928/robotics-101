import { useMemo, useState } from 'react'
import Player from '../../anim/Player'
import { stringsFor, type Strings } from '../../i18n'
import { CONFIG, POINTS, RETRY_SLEEP_S, goalsPast, run, type Ev } from './patrol'
import { PATROL_STRINGS } from './patrol.strings'
import '../l1/l1.css'
import './l4.css'
import Gloss from '../l1/Gloss'

const S = 300, PAD = 44, M = (S - 2 * PAD) / 4 // turtlebot3_world: -2..2 m
const px = (x: number) => PAD + (x + 2) * M
const py = (y: number) => PAD + (2 - y) * M
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const REPO = 'https://github.com/AungKaung1928/ros2-patrol-project/blob/main'
const CTRL = `${REPO}/patrol_navigation_project/patrol_controller.py`
const BLOCK_CHOICES = [null, 2] as const // none, point_3
const ANSWERS = [2, 3, 4, 5, 6]

/** 4.4: the repo's patrol loop as events; block a point, switch retry / loop, step through what the node decides. */
export default function PatrolChapter({ t }: { t: Strings }) {
  const s = stringsFor(PATROL_STRINGS, t, 'l4.patrol.PATROL_STRINGS')
  const [blocked, setBlocked] = useState<number | null>(2)
  const [retry, setRetry] = useState<boolean>(CONFIG.retry)
  const [loop, setLoop] = useState<boolean>(CONFIG.loop)
  const [pick, setPick] = useState<number | null>(null)
  const ev = useMemo(() => run({ blocked, loop, retry }), [blocked, loop, retry])
  const end = ev.length
  const [tS, setTS] = useState(() => (still() ? end : 0))
  const k = Math.max(1, Math.min(end, Math.floor(Math.min(tS, end)) + 1)) // events shown so far
  const shown = ev.slice(0, k)
  const cur = shown[shown.length - 1]
  const at = [...shown].reverse().find((e) => e.kind === 'reached')?.i ?? 0
  const text = (e: Ev) => {
    const n = POINTS[e.i].name
    if (e.kind === 'send') return `${s.ev.send} ${n}`
    if (e.kind === 'reached') return `${s.ev.reached} ${n}`
    if (e.kind === 'failed') return e.retry ? `${n} ${s.ev.failed} ${e.retry}/${CONFIG.maxRetries}` : `${n} ${s.ev.stopNoRetry}`
    if (e.kind === 'skip') return `${s.ev.skip} ${n}`
    return e.why === 'end' ? s.ev.stopEnd : `${n} ${s.ev.stopNoRetry}`
  }
  const count = (kind: Ev['kind']) => shown.filter((e) => e.kind === kind).length
  const sleeps = shown.filter((e) => e.kind === 'failed' && e.retry > 0 && e.retry <= CONFIG.maxRetries).length
  const answer = goalsPast(run({ blocked: 2, loop: true, retry: true }), 2)
  const ok = pick !== null && pick === answer
  const reset = () => setTS(still() ? Infinity : 0)
  const target = cur.kind === 'send' ? cur.i : null
  return (
    <>
      <div className="figure">
        <svg className="side graph patrolmap" viewBox={`0 0 ${S} ${S}`} role="img" aria-label={s.title}>
          <rect className="arena" x={PAD} y={PAD} width={S - 2 * PAD} height={S - 2 * PAD} rx={6} />
          <polyline className="route" points={[...POINTS, POINTS[0]].map((p) => `${px(p.x)},${py(p.y)}`).join(' ')} />
          {POINTS.map((p, i) => (
            <g key={p.name} className={`wp${i === blocked ? ' blocked' : ''}${i === target ? ' target' : ''}`}>
              <circle cx={px(p.x)} cy={py(p.y)} r={7} />
              {i === blocked && <path d={`M${px(p.x) - 5},${py(p.y) - 5}l10,10m0,-10l-10,10`} />}
              <text className="legend" x={px(p.x)} y={py(p.y) + (p.name === 'origin_station' ? 20 : -11)} textAnchor="middle">{p.name.replace('_station', '').replace('central_', '')}</text>
            </g>
          ))}
          <circle className="bot" cx={px(POINTS[at].x)} cy={py(POINTS[at].y)} r={10} />
        </svg>
        <Player t={Math.min(tS, end)} setT={setTS} end={end} events={Array.from({ length: end + 1 }, (_, j) => j)} speed={1.5} autoplay={!still()} s={t}
          caption={s.caption(k, end, text(cur))} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <p className="note" data-k="everyday">{s.everyday}</p>
        <div className="stepper" role="group" aria-label={s.blocked}>
          <span>{s.blocked}</span>
          {BLOCK_CHOICES.map((b) => <button key={String(b)} type="button" aria-pressed={blocked === b} onClick={() => { setBlocked(b); reset() }}>{b === null ? s.none : POINTS[b].name}</button>)}
        </div>
        <div className="stepper" role="group" aria-label={s.retry}>
          <span>{s.retry}</span>
          <button type="button" aria-pressed={retry} onClick={() => { setRetry(true); reset() }}>{s.on}</button>
          <button type="button" aria-pressed={!retry} onClick={() => { setRetry(false); reset() }}>{s.off}</button>
        </div>
        <div className="stepper" role="group" aria-label={s.loop}>
          <span>{s.loop}</span>
          <button type="button" aria-pressed={loop} onClick={() => { setLoop(true); reset() }}>{s.on}</button>
          <button type="button" aria-pressed={!loop} onClick={() => { setLoop(false); reset() }}>{s.off}</button>
        </div>
        <p><button type="button" className="break" onClick={() => { setBlocked(2); setRetry(false); setLoop(true); reset() }}>{s.breakIt}</button></p>
        <dl className="readout">
          <div><dt>{s.sent}</dt><dd data-k="sent">{count('send')}</dd></div>
          <div><dt>{s.reached}</dt><dd data-k="reached">{count('reached')}</dd></div>
          <div><dt>{s.skipped}</dt><dd data-k="skipped">{count('skip')}</dd></div>
          <div><dt>{s.sleep}</dt><dd data-k="sleep">{sleeps} × {RETRY_SLEEP_S.toFixed(1)} s</dd></div>
          <div><dt>{s.state}</dt><dd data-k="state">{cur.kind === 'stop' ? s.stopped : s.running}</dd></div>
        </dl>
        <p className="note">{s.sleepNote}</p>
        <p><strong>{s.challenge}</strong></p>
        <div className="stepper" role="group" aria-label={s.challenge}>
          {ANSWERS.map((a) => <button key={a} type="button" aria-pressed={pick === a} onClick={() => setPick(a)}>{a}</button>)}
        </div>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? '✓ ' + s.solved : s.notYet} {pick ?? '?'}</p>
        <p className="note">{s.modelNote}</p>
        <p className="group-h">{s.words}</p>
        <Gloss items={s.glossary} />
        <p className="src">{t.source}: <a href={`${REPO}/config/patrol_points.yaml#L2-L49`}>patrol_points.yaml:2-49</a>, <a href={`${CTRL}#L204-L211`}>patrol_controller.py:204-211</a> (rejected), <a href={`${CTRL}#L220-L253`}>:220-253</a> (retry, skip), <a href={`${CTRL}#L260-L308`}>:260-308</a> (result), <a href={`${REPO}/test/test_launch_bounded_retry.py#L67`}>test_launch_bounded_retry.py:67</a></p>
      </div>
    </>
  )
}
