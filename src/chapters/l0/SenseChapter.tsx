import { useMemo, useState } from 'react'
import Mascot from '../../anim/Mascot'
import Slider from '../../components/Slider'
import { SOURCE_REPO } from '../../content/world'
import { STRINGS, type Strings } from '../../i18n'
import { BEAMS, FRONT_MAX, FRONT_START, MAX_M, ROOM, VIEW, front, perSecond, turn, valid } from './sense'
import { SENSE_STRINGS } from './sense.strings'
import './l0.css'
import './sense.css'
import Face from './Face'
import { mood } from './robotmood'
import './face.css'

const { px: PX, ox: OX, oy: OY } = VIEW
const sx = (x: number) => OX + x * PX
const sy = (y: number) => OY - y * PX
type Answer = 'five' | 'limit' | 'nothing'
const ANSWERS: Answer[] = ['five', 'limit', 'nothing']

/** Level 0 "sense": drag the front wall; one beam gives the front number, the ring shows all BEAMS readings; break it = cover. */
export default function SenseChapter({ t }: { t: Strings }) {
  const s = SENSE_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const [wall, setWall] = useState(FRONT_START)
  const [covered, setCovered] = useState(false)
  const [picked, setPicked] = useState<Answer | null>(null)
  const [cheer, setCheer] = useState(0)
  const [oops, setOops] = useState(0)
  const ranges = useMemo(() => turn(wall, covered), [wall, covered])
  const f = front(ranges)
  const counted = ranges.filter(valid).length
  const answer = (a: Answer) => { setPicked(a); if (a === 'nothing') setCheer(cheer + 1); else setOops(oops + 1) }
  const room = `M ${sx(wall)} ${sy(ROOM.side)} H ${sx(ROOM.back)} V ${sy(-ROOM.side)} H ${sx(wall)}`
  return (
    <>
      <div className="figure">
        <svg className="sense" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img" aria-label={`${s.title}: ${s.front} ${f === null ? s.nothing : `${f.toFixed(2)} m`}`}>
          <path className="sense-room" d={room} />
          <rect className="sense-wall" x={sx(wall)} y={sy(ROOM.side) - 3} width="8" height={2 * ROOM.side * PX + 6} />
          <circle className="sense-limit" cx={OX} cy={OY} r={MAX_M * PX} />
          {ranges.map((r, i) => valid(r) && (
            <circle key={i} className="sense-dot" r="2" cx={sx(r * Math.cos((2 * Math.PI * i) / BEAMS))} cy={sy(r * Math.sin((2 * Math.PI * i) / BEAMS))} />
          ))}
          <line className={`sense-beam${f === null ? ' is-none' : ''}`} x1={OX} y1={OY} x2={sx(f ?? Math.min(wall, MAX_M))} y2={OY} />
          {!covered && <line className="sense-sweep" x1={OX} y1={OY} x2={OX + 60} y2={OY} />}
          <rect x={OX - 12} y={OY - 18} width="24" height="6" rx="2" fill="currentColor" />
          <rect x={OX - 12} y={OY + 12} width="24" height="6" rx="2" fill="currentColor" />
          <circle className="sense-body" cx={OX} cy={OY} r="18" />
          <g transform={`translate(${OX} ${OY})`}><Face k={0.9} mood={mood({ broken: covered, solved: picked === 'nothing', sensing: true })} /></g>
          <circle className="sense-top" cx={OX - 3} cy={OY} r="5" />
          {covered && <circle className="sense-hand" cx={OX - 3} cy={OY} r="12" />}
          <text className="sense-say" x={sx(Math.min(wall, MAX_M) / 2)} y={OY - 10} textAnchor="middle">{f === null ? s.nothing : `${f.toFixed(2)} m`}</text>
        </svg>
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.steps.map((l) => <p key={l}>{l}</p>)}
        <Slider hint={t.drag} label={s.wall} value={wall} min={0.3} max={FRONT_MAX} step={0.1} mark={MAX_M} fmt={(v) => v.toFixed(1)}
          onChange={(v) => setWall(Math.round(v * 10) / 10)} />
        <p><button type="button" className="break" onClick={() => { if (!covered) setOops(oops + 1); setCovered(!covered) }}>{covered ? s.fixIt : s.breakIt}</button></p>
        {covered && <p className="note">{s.brokenNote}</p>}
        <dl className="readout">
          <div><dt>{s.front}</dt><dd data-k="front">{f === null ? s.nothing : `${f.toFixed(2)} m`}</dd></div>
          <div><dt>{s.count}</dt><dd data-k="count">{counted} / {BEAMS}</dd></div>
          <div><dt>{s.perSecond}</dt><dd data-k="persec">{perSecond()}</dd></div>
        </dl>
        <p className="note">{s.real}</p>
        <div className="sense-check">
          <Mascot cheer={cheer} oops={oops} label={s.mascot} />
          <div>
            <p><strong>{s.check}</strong></p>
            <p>{ANSWERS.map((a) => <button type="button" key={a} className="pick" aria-pressed={picked === a} onClick={() => answer(a)}>{s.answers[a]}</button>)}</p>
            {picked && <p className={`verdict ${picked === 'nothing' ? 'ok' : 'no'}`} data-k="check">{picked === 'nothing' ? '✓ ' + s.yes : s.no}</p>}
          </div>
        </div>
        <p className="group-h">{s.words}</p>
        <dl className="gloss">{s.glossary.map(([w, m]) => <div key={w} style={{ display: 'contents' }}><dt>{w}</dt><dd>{m}</dd></div>)}</dl>
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/description/turtlebot3_burger.urdf.xacro#L168`}>turtlebot3_burger.urdf.xacro:168</a> (5 turns/s), <a href={`${SOURCE_REPO}/blob/main/description/turtlebot3_burger.urdf.xacro#L174`}>:174</a> (360), <a href={`${SOURCE_REPO}/blob/main/description/turtlebot3_burger.urdf.xacro#L181-L182`}>:181-182</a> (0.12-3.5 m), <a href="https://emanual.robotis.com/docs/en/platform/turtlebot3/appendix_lds_01/">LDS-01</a> and <a href="https://emanual.robotis.com/docs/en/platform/turtlebot3/appendix_lds_02/">LDS-02</a> specifications, <a href="https://emanual.robotis.com/docs/en/platform/turtlebot3/sbc_setup/">SBC setup</a> (three LDS models) (ROBOTIS e-Manual).</p>
      </div>
    </>
  )
}
