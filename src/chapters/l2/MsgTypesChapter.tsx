import { useMemo, useState } from 'react'
import Player from '../../anim/Player'
import Slider from '../../components/Slider'
import { LIDAR, SOURCE_REPO } from '../../content/world'
import { stringsFor, type Strings } from '../../i18n'
import { LASERSCAN, LIMITS, SAMPLES, beamAngle, challengeOk, ignored, indexAt, pose, scenario, type Twist } from './msgtypes'
import { MSGTYPES_STRINGS } from './msgtypes.strings'
import '../l1/l1.css'
import './l2.css'
import Gloss from '../l1/Gloss'
import RealProject from './RealProject'

const MSG = 'https://github.com/ros2/common_interfaces/blob/humble'
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const deg = (r: number) => ((r * 180) / Math.PI).toFixed(1)
const R = 70 // beam length in px (fan drawn at one radius: this chapter is about indices, not distances)

/** 2.3: LaserScan fields fill in, ranges draws as a fan; index slider maps i to its angle; Twist sliders drive a path. */
export default function MsgTypesChapter({ t }: { t: Strings }) {
  const s = stringsFor(MSGTYPES_STRINGS, t, 'l2.msgtypes.MSGTYPES_STRINGS')
  const sc = useMemo(() => scenario(), [])
  const [tS, setTS] = useState(() => (still() ? sc.durationMs / 1000 : 0))
  const now = Math.min(tS, sc.durationMs / 1000)
  const f = sc.frame(now * 1000)
  const [i, setI] = useState(0)
  const [tw, setTw] = useState<Twist>({ linear: [0.2, 0, 0], angular: [0, 0, 0.5] })
  const a = beamAngle(i)
  const path = Array.from({ length: 21 }, (_, k) => pose(tw, (k / 20) * 2))
  const end = path[20]
  const ign = ignored(tw)
  const ok = challengeOk(tw)
  const setLin = (v: number) => setTw({ ...tw, linear: [v, 0, 0] })
  const setAng = (v: number) => setTw({ ...tw, angular: [tw.angular[0], 0, v] })
  // top view, robot at the centre, x forward = up on screen, y left = left on screen
  const PR = 260 // px per metre in the path preview
  const sx = (y: number) => 150 - y * PR, sy = (x: number) => 150 - x * PR
  return (
    <>
      <div className="figure">
        <svg className="side graph" viewBox="0 0 640 260" role="img" aria-label={s.title}>
          {LASERSCAN.slice(0, f.shown).map((fl, k) => (
            <text key={fl.name} className="legend" x={210} y={24 + k * 23}>
              <tspan className="ftype">{fl.type} </tspan>{fl.name}<tspan className="fval"> = {fl.value ?? `(${s.unknown})`}</tspan>
            </text>
          ))}
          {Array.from({ length: f.beams }, (_, k) => {
            const b = beamAngle(k)
            return <line key={k} className="fan" x1={90} y1={150} x2={90 - Math.sin(b) * R} y2={150 - Math.cos(b) * R} />
          })}
          <line className="fan pick" x1={90} y1={150} x2={90 - Math.sin(a) * (R + 14)} y2={150 - Math.cos(a) * (R + 14)} />
          <circle className="dot cmd" cx={90} cy={150} r={7} />
          <text className="legend" x={90} y={250} textAnchor="middle">ranges[{i}]</text>
        </svg>
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t}
          caption={s.caption(f.shown, f.beams)} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <Slider hint={t.drag} label={s.index} value={i} min={0} max={SAMPLES - 1} step={1} mark={indexAt(0)} onChange={setI} />
        <dl className="readout">
          <div><dt>{s.angle}</dt><dd data-k="angle">{a.toFixed(3)} rad = {deg(a)}°</dd></div>
          <div><dt>{s.ahead}</dt><dd data-k="ahead">{indexAt(0)}</dd></div>
        </dl>
        <p className="group-h">geometry_msgs/msg/Twist</p>
        <Slider label={s.linX} value={tw.linear[0]} min={-LIMITS.linX} max={LIMITS.linX} step={0.01} onChange={setLin} fmt={(v) => v.toFixed(2)} />
        <Slider label={s.angZ} value={tw.angular[2]} min={-LIMITS.angZ} max={LIMITS.angZ} step={0.05} onChange={setAng} fmt={(v) => v.toFixed(2)} />
        <p>
          <button type="button" className="break" onClick={() => setTw({ linear: [0, 0, 0], angular: [0.8, 0, 0] })}>{s.breakIt}</button>{' '}
          <button type="button" className="break" onClick={() => setTw({ linear: [0.2, 0, 0], angular: [0, 0, 0.5] })}>{s.reset}</button>
        </p>
        <pre className="code" aria-label="Twist">{`linear:  {x: ${tw.linear[0].toFixed(2)}, y: 0.0, z: 0.0}\nangular: {x: ${tw.angular[0].toFixed(2)}, y: 0.0, z: ${tw.angular[2].toFixed(2)}}`}</pre>
        {ign.length > 0 && <p className="note" data-k="ignored">{s.ignoredNote(ign.join(', '))}</p>}
        <svg className="side graph" viewBox="0 0 300 170" role="img" aria-label={s.after} style={{ maxWidth: 320 }}>
          <path className="edge on" d={`M${path.map(([x, y]) => `${sx(y)} ${sy(x)}`).join(' L')}`} />
          <circle className="dot cmd" cx={sx(0)} cy={sy(0)} r={6} />
          <line className="fan pick" x1={sx(end[1])} y1={sy(end[0])} x2={sx(end[1]) - Math.sin(end[2]) * 26} y2={sy(end[0]) - Math.cos(end[2]) * 26} />
        </svg>
        <p className="runs" data-k="after">{s.after}: x {end[0].toFixed(2)} m, y {end[1].toFixed(2)} m, {deg(end[2])}°</p>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? `✓ ${s.solved} ${tw.angular[2].toFixed(2)} rad/s` : `${s.notYet} linear.x ${tw.linear[0].toFixed(2)}, angular.z ${tw.angular[2].toFixed(2)}`}</p>
        <p className="group-h">{s.words}</p>
        <Gloss items={s.glossary} />
        <RealProject id="msgtypes" t={t} />
        <p className="src">{t.source}: <a href={`${MSG}/sensor_msgs/msg/LaserScan.msg`}>LaserScan.msg</a>, <a href={`${MSG}/geometry_msgs/msg/Twist.msg`}>Twist.msg</a> (Humble), <a href={`${SOURCE_REPO}/blob/main/description/turtlebot3_burger.urdf.xacro#L174-L182`}>turtlebot3_burger.urdf.xacro:174-182</a> ({SAMPLES} {s.srcGloss.samples}, {LIDAR.minAngle} {s.srcGloss.to} {LIDAR.maxAngle} rad), <a href="https://github.com/gazebosim/gz-sensors/blob/ign-sensors6/src/Lidar.cc#L346-L350">ign-sensors6 Lidar.cc:346-350</a> (angle_increment = (max − min) / (samples − 1)), <a href={`${SOURCE_REPO}/blob/main/config/nav2_params.yaml#L207`}>nav2_params.yaml:207</a>, <a href="https://github.com/gazebosim/gz-sim/blob/gz-sim8/src/systems/diff_drive/DiffDrive.cc#L618-L619">gz-sim DiffDrive.cc:618-619</a> ({s.srcGloss.reads}), <a href="https://www.ros.org/reps/rep-0103.html">REP 103</a></p>
      </div>
    </>
  )
}
