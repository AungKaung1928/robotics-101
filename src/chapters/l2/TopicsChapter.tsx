import { useMemo, useState } from 'react'
import Player from '../../anim/Player'
import { SOURCE_REPO } from '../../content/world'
import { STRINGS, type Strings } from '../../i18n'
import { DURATION_MS, TOPICS, challengeOk, received, resolve, scenario, subs } from './topics'
import { TOPICS_STRINGS } from './topics.strings'
import '../l1/l1.css'
import './l2.css'
import Gloss from '../l1/Gloss'

const W = 640, H = 330, BW = 170, BH = 40
const PUB = { x: 100, y: 150 }
const SUB_Y: Record<string, number> = { slam_toolbox: 40, nav2: 120, rviz2: 200, my_node: 280 }
const SUB_X = 530
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2)
/** Wire for a subscriber: /scan runs bridge → node; /cmd_vel runs nav2 → bridge along a lower curve. */
const wire = (node: string, topic: string) =>
  topic === '/cmd_vel'
    ? ([SUB_X - BW / 2, SUB_Y.nav2 + 12, PUB.x + BW / 2, PUB.y + 12] as const)
    : ([PUB.x + BW / 2, PUB.y, SUB_X - BW / 2, SUB_Y[node]] as const)

/** 2.2: one publisher, many subscribers, dots per message; the reader names my_node's topic. */
export default function TopicsChapter({ t }: { t: Strings }) {
  const s = TOPICS_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const [slamTopic, setSlamTopic] = useState('/scan')
  const [mine, setMine] = useState('/scna')
  const sc = useMemo(() => scenario(slamTopic, mine), [slamTopic, mine])
  const [tS, setTS] = useState(() => (still() ? DURATION_MS / 1000 : 0))
  const now = Math.min(tS, DURATION_MS / 1000)
  const f = sc.frame(now * 1000)
  const ss = subs(slamTopic, mine)
  const mineFull = resolve(mine, 'my_node')
  const ok = challengeOk(mine)
  const live = (node: string) => TOPICS.some((x) => x.name === resolve(ss.find((q) => q.node === node)!.topic, node))
  return (
    <>
      <div className="figure">
        <svg className="side graph" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={s.title}>
          {ss.filter((q) => q.node !== 'ros_gz_bridge').map((q) => {
            const [x1, y1, x2, y2] = wire(q.node, '/scan')
            return (
              <g key={q.node}>
                <path className={`edge${live(q.node) ? ' on' : ''}`} d={`M${x1} ${y1} C${x1 + 90} ${y1} ${x2 - 90} ${y2} ${x2} ${y2}`} />
                <text className="legend" x={x2 - 6} y={y2 - 8} textAnchor="end">{resolve(q.topic, q.node) ?? q.topic}</text>
              </g>
            )
          })}
          {(() => { const [x1, y1, x2, y2] = wire('', '/cmd_vel'); return <><path className="edge on" d={`M${x1} ${y1} C${x1 - 120} ${y1 + 70} ${x2 + 120} ${y2 + 70} ${x2} ${y2}`} /><text className="legend" x={315} y={225} textAnchor="middle">/cmd_vel</text></> })()}
          {f.dots.map((d, i) => {
            const [x1, y1, x2, y2] = wire(d.node, d.topic)
            const p = ease(d.p), q = 1 - p
            const [c1x, c1y, c2x, c2y] = d.topic === '/cmd_vel' ? [x1 - 120, y1 + 70, x2 + 120, y2 + 70] : [x1 + 90, y1, x2 - 90, y2]
            const x = q ** 3 * x1 + 3 * q * q * p * c1x + 3 * q * p * p * c2x + p ** 3 * x2
            const y = q ** 3 * y1 + 3 * q * q * p * c1y + 3 * q * p * p * c2y + p ** 3 * y2
            return <circle key={i} className={d.topic === '/cmd_vel' ? 'dot cmd' : 'dot'} cx={x} cy={y} r={d.topic === '/cmd_vel' ? 3.5 : 6} />
          })}
          <g className="nd ok"><rect x={PUB.x - BW / 2} y={PUB.y - BH / 2} width={BW} height={BH} /><text x={PUB.x} y={PUB.y + 6} textAnchor="middle">ros_gz_bridge</text></g>
          {Object.entries(SUB_Y).map(([n, y]) => (
            <g key={n} className={`nd ${live(n) ? 'ok' : 'starved'}`}>
              <rect x={SUB_X - BW / 2} y={y - BH / 2} width={BW} height={BH} />
              <text x={SUB_X} y={y + 6} textAnchor="middle">{n} {f.counts[n]}</text>
            </g>
          ))}
        </svg>
        <Player t={now} setT={setTS} end={DURATION_MS / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t}
          caption={s.caption(now.toFixed(1), f.dots.length)} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <label className="slider"><span>{s.mine}</span>
          <input className="code" style={{ width: '100%', minWidth: 0 }} value={mine} spellCheck={false} autoCapitalize="off"
            onChange={(e) => { setMine(e.target.value); setTS(DURATION_MS / 1000) }} />
        </label>
        <p className="note" data-k="resolves">{mineFull ? `${s.resolves} ${mineFull}` : s.invalid}</p>
        <p><button type="button" className="break" onClick={() => { setSlamTopic(slamTopic === '/scan' ? '/laser_scan' : '/scan'); setTS(DURATION_MS / 1000) }}>{slamTopic === '/scan' ? s.breakIt : s.fixIt}</button></p>
        {slamTopic !== '/scan' && <p className="note">{s.brokenNote}</p>}
        <p className="group-h">{s.got}</p>
        <dl className="readout">
          {ss.map((q) => <div key={q.node}><dt><code>{q.node} ← {resolve(q.topic, q.node) ?? q.topic}</code></dt><dd data-k={`got-${q.node}`}>{received(q, DURATION_MS / 1000)}</dd></div>)}
        </dl>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? `✓ ${s.solved} /scan` : `${s.notYet}: ${s.nothing}`}</p>
        <p className="group-h">{s.cli}</p>
        <pre className="code">{'ros2 topic list\nros2 topic info /scan     # 1 publisher, 3 subscribers\nros2 topic hz /scan'}</pre>
        <p className="runs">{s.cliNote(TOPICS[0].measuredHz)}</p>
        <p className="group-h">{s.words}</p>
        <Gloss items={s.glossary} />
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/config/gz_bridge.yaml#L8-L31`}>gz_bridge.yaml:8-31</a>, <a href={`${SOURCE_REPO}/blob/main/config/slam_params.yaml#L7`}>slam_params.yaml:7</a>, <a href={`${SOURCE_REPO}/blob/main/config/nav2_params.yaml#L99`}>nav2_params.yaml:99, 129</a>, <a href={`${SOURCE_REPO}/blob/main/README.md`}>README (measured rates)</a> · <a href="https://design.ros2.org/articles/topic_and_service_names.html">ROS 2 design: topic names</a>, <a href="https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Understanding-ROS2-Topics/Understanding-ROS2-Topics.html">Humble: Understanding topics</a></p>
      </div>
    </>
  )
}
