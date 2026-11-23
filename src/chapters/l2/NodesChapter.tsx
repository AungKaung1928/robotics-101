import { useMemo, useState } from 'react'
import Player from '../../anim/Player'
import { SOURCE_REPO } from '../../content/world'
import { STRINGS, type Strings } from '../../i18n'
import { NODES, byId, challengeOk, optional, patrols, scenario, working, type NodeId } from './nodes'
import { NODES_STRINGS } from './nodes.strings'
import '../l1/l1.css'
import './l2.css'
import Gloss from '../l1/Gloss'

const W = 640, H = 365, BW = 264, BH = 42
const px = (x: number) => (x ? 488 : 152)
const py = (y: number) => 30 + y * 92
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const LAUNCH = `${SOURCE_REPO}/blob/main/launch/tf_explorer.launch.py`

/** 2.1: the patrol robot as 7 nodes from its launch file; click a node to stop it and see who starves. */
export default function NodesChapter({ t }: { t: Strings }) {
  const s = NODES_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const [stopped, setStopped] = useState<Set<NodeId>>(new Set())
  const sc = useMemo(() => scenario(stopped), [stopped])
  const [tS, setTS] = useState(() => (still() ? sc.durationMs / 1000 : 0))
  const now = Math.min(tS, sc.durationMs / 1000)
  const f = sc.frame(now * 1000)
  const [sel, setSel] = useState<NodeId>('patrol')
  const toggle = (id: NodeId) => {
    const next = new Set(stopped)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setStopped(next); setSel(id); setTS(Infinity) // show the result at once; Play replays the start-up
  }
  const state = (id: NodeId) => (f.working.includes(id) ? 'ok' : f.started.includes(id) ? 'starved' : 'off')
  const ok = challengeOk(stopped)
  const allOk = working(stopped)
  return (
    <>
      <div className="figure">
        <svg className="side graph" viewBox={`0 0 ${W} ${H}`} role="group" aria-label={s.title}>
          {NODES.flatMap((n) => n.needs.map((d) => {
            const a = byId[d]
            const live = f.working.includes(d) && f.working.includes(n.id)
            const [x1, y1, x2, y2] = [px(a.x), py(a.y) + BH / 2, px(n.x), py(n.y) - BH / 2]
            // a link that skips a layer in the same column bends outward so it never runs through the box between
            const bend = a.x === n.x && n.y - a.y > 1 ? (a.x ? 110 : -110) : 0
            return <path key={`${d}-${n.id}`} className={`edge${live ? ' live' : ''}`}
              d={`M${x1} ${y1} C${x1 + bend} ${y1 + 40} ${x2 + bend} ${y2 - 40} ${x2} ${y2}`} />
          }))}
          {NODES.map((n) => (
            <g key={n.id} className={`nd ${state(n.id)}`} role="button" tabIndex={0} aria-pressed={stopped.has(n.id)}
              aria-label={`${n.name}: ${s.state[state(n.id)]}`} onClick={() => toggle(n.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(n.id) } }}>
              <rect x={px(n.x) - BW / 2} y={py(n.y) - BH / 2} width={BW} height={BH} />
              <text x={px(n.x)} y={py(n.y) + 6} textAnchor="middle">{n.name.split(' ')[0]}</text>
            </g>
          ))}
          <text className="legend" x={W - 10} y={H - 8} textAnchor="end">{s.tap}</text>
        </svg>
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={2} autoplay={!still()} s={t}
          caption={s.caption(now.toFixed(1), f.working.length)} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <dl className="readout">
          <div><dt>{byId[sel].name}</dt><dd data-k="sel">{s.state[allOk.has(sel) ? 'ok' : stopped.has(sel) ? 'off' : 'starved']}</dd></div>
        </dl>
        <p className="note" data-k="job">{s.jobs[sel]} · <a href={`${LAUNCH}#L${byId[sel].lines.replace('-', '-L')}`}>tf_explorer.launch.py:{byId[sel].lines}</a></p>
        <p>
          <button type="button" className="break" onClick={() => { setStopped(new Set(['bridge'])); setSel('bridge'); setTS(Infinity) }}>{s.breakIt}</button>{' '}
          <button type="button" className="break" onClick={() => { setStopped(new Set()); setTS(0) }}>{s.reset}</button>
        </p>
        <dl className="readout">
          <div><dt>{s.patrol}</dt><dd data-k="patrols">{patrols(stopped) ? s.yes : s.no}</dd></div>
          <div><dt>{s.stoppedN}</dt><dd data-k="stopped">{stopped.size}</dd></div>
        </dl>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">
          {ok ? `✓ ${s.solved} ${optional().map((id) => byId[id].name).join(', ')}` : `${s.notYet} ${stopped.size} ${s.stopped}`}
        </p>
        <p className="runs">{s.left}</p>
        <p className="group-h">{s.words}</p>
        <Gloss items={s.glossary} />
        <p className="src">{t.source}: <a href={`${LAUNCH}#L131-L142`}>tf_explorer.launch.py:131-142</a> (TF-Transform-Explorer, start delays), <a href="https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Nodes/Understanding-ROS2-Nodes.html">ROS 2 Humble: Understanding nodes</a></p>
      </div>
    </>
  )
}
