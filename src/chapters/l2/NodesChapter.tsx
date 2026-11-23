import { useMemo, useState } from 'react'
import Player from '../../anim/Player'
import { SOURCE_REPO } from '../../content/world'
import { STRINGS, type Strings } from '../../i18n'
import { byId, challengeOk, optional, patrols, scenario, working, type NodeId } from './nodes'
import { NODES_STRINGS } from './nodes.strings'
import '../l1/l1.css'
import './l2.css'
import Gloss from '../l1/Gloss'
import NodeGraph from './NodeGraph'

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
  const ok = challengeOk(stopped)
  const allOk = working(stopped)
  return (
    <>
      <div className="figure">
        <NodeGraph f={f} label={s.title} legend={s.tap} stopped={stopped} onToggle={toggle} stateName={s.state} />
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={2} autoplay={!still()} s={t}
          caption={s.caption(now.toFixed(1), f.working.length)} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <dl className="readout">
          <div><dt><code>{byId[sel].name}</code></dt><dd data-k="sel">{s.state[allOk.has(sel) ? 'ok' : stopped.has(sel) ? 'off' : 'starved']}</dd></div>
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
