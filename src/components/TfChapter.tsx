import { useState } from 'react'
import { BASE_TO_SCAN, FOOTPRINT_TO_BASE, MEASURED, ODOM_CONFIG_HZ, NAV2, SLAM, SOURCE_REPO, TF_CHECK_PERIOD, TF_MAX_AGE, TF_MAX_JUMP } from '../content/world'
import type { Strings } from '../i18n'
import { maxDrivePerCheck, verdict } from '../lib/anomaly'
import { apply, compose, invert, type TF } from '../lib/tf2d'
import Arena from './Arena'
import { routeParam } from '../lib/route'
import Slider from './Slider'

const HIT: [number, number] = [1.5, 1.5] // box1's south-west corner in map (explorer_world.sdf:106-109)
const rad = (d: number) => (d * Math.PI) / 180

function Axes({ t, name, size = 0.6, at = [0.1, -0.3] }: { t: TF; name: string; size?: number; at?: [number, number] }) {
  const [xx, xy] = apply(t, [size, 0]), [yx, yy] = apply(t, [0, size])
  return (
    <g className="frame">
      <path className="ax-x" d={`M${t.x} ${t.y}L${xx} ${xy}`} />
      <path className="ax-y" d={`M${t.x} ${t.y}L${yx} ${yy}`} />
      <text transform={`translate(${t.x + at[0]} ${t.y + at[1]}) scale(1 -1)`}>{name}</text>
    </g>
  )
}

export default function TfChapter({ t }: { t: Strings }) {
  const s = t.tf
  const [dx, setDx] = useState(0.3)
  const [dyaw, setDyaw] = useState(5)
  const [x, setX] = useState(-1)
  const [y, setY] = useState(-2.5)
  const [yaw, setYaw] = useState(30)
  const [jump, setJump] = useState(() => routeParam(location.hash, 'jump', 0.1, 0, 1))
  const [age, setAge] = useState(0.2)
  const mapOdom = { x: dx, y: 0, yaw: rad(dyaw) }
  const mapFoot = compose(mapOdom, { x, y, yaw: rad(yaw) })
  const mapBase = compose(mapFoot, FOOTPRINT_TO_BASE)
  const mapScan = compose(mapBase, BASE_TO_SCAN)
  const rows: [string, TF][] = [['map', { x: 0, y: 0, yaw: 0 }], ['odom', mapOdom], ['base_footprint', mapFoot], ['base_link', mapBase], ['base_scan', mapScan]]
  const v = verdict(age, jump, TF_MAX_AGE, TF_MAX_JUMP)
  return (
    <>
      <div className="figure">
        <Arena label={t.chapters.tf}>
          <path className="chain" d={`M0 0L${mapOdom.x} ${mapOdom.y}L${mapBase.x} ${mapBase.y}`} />
          <path className="beam" d={`M${mapScan.x} ${mapScan.y}L${HIT[0]} ${HIT[1]}`} />
          <circle className="hit" cx={HIT[0]} cy={HIT[1]} r="0.07" />
          <Axes t={rows[0][1]} name="map" size={1} at={[-0.6, -0.3]} />
          <Axes t={mapOdom} name="odom" size={0.8} at={[0.15, -0.3]} />
          {/* where base_link was at the previous check: `jump` m back along the heading */}
          <circle className={`ghost${v === 'jump' ? ' is-bad' : ''}`} cx={mapBase.x - jump * Math.cos(mapBase.yaw)} cy={mapBase.y - jump * Math.sin(mapBase.yaw)} r="0.22" />
          <path className={`ghost-move${v === 'jump' ? ' is-bad' : ''}`} d={`M${mapBase.x - jump * Math.cos(mapBase.yaw)} ${mapBase.y - jump * Math.sin(mapBase.yaw)}L${mapBase.x} ${mapBase.y}`} />
          <circle className="robot" cx={mapBase.x} cy={mapBase.y} r="0.22" />
          <Axes t={mapBase} name="base_link" />
        </Arena>
      </div>
      <div className="panel">
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <fieldset className="group">
        <legend>{s.gFrames}</legend>
        <Slider hint={t.drag} label={s.drift} value={dx} min={-1} max={1} step={0.05} mark={0} onChange={setDx} fmt={(v) => v.toFixed(2)} />
        <Slider label={s.driftYaw} value={dyaw} min={-30} max={30} step={1} mark={0} onChange={setDyaw} />
        <Slider label={s.x} value={x} min={-3} max={3} step={0.05} onChange={setX} fmt={(v) => v.toFixed(2)} />
        <Slider label={s.y} value={y} min={-3} max={3} step={0.05} onChange={setY} fmt={(v) => v.toFixed(2)} />
        <Slider label={s.yaw} value={yaw} min={-180} max={180} step={1} onChange={setYaw} />
        <table className="frames">
          <thead><tr><th>{s.frame}</th><th colSpan={2}>{s.point} (m)</th></tr></thead>
          <tbody>
            {rows.map(([name, tf]) => {
              const [px, py] = apply(invert(tf), HIT)
              return <tr key={name}><td>{name}</td><td data-k={`hit-${name}`}>{px.toFixed(2)}</td><td>{py.toFixed(2)}</td></tr>
            })}
          </tbody>
        </table>
        </fieldset>
        <fieldset className="group">
        <legend>{s.gDetector}</legend>
        <Slider label={s.jump} value={jump} min={0} max={1} step={0.05} mark={TF_MAX_JUMP} onChange={setJump} fmt={(v) => v.toFixed(2)} />
        <Slider label={s.age} value={age} min={0} max={2} step={0.1} mark={TF_MAX_AGE} onChange={setAge} fmt={(v) => v.toFixed(1)} />
        <dl className="readout">
          <div><dt>{s.verdict}</dt><dd data-k="verdict" className={`v-${v}`}>{s.v[v]}</dd></div>
          <div><dt>{s.mapOdom}</dt><dd data-k="mapodom">{SLAM.tfPublishS} s ({(1 / SLAM.tfPublishS).toFixed(0)} Hz)</dd></div>
          <div><dt>{s.drive}</dt><dd data-k="drive">{maxDrivePerCheck(NAV2.maxVelX, TF_CHECK_PERIOD).toFixed(2)} m</dd></div>
          <div><dt>{s.odom} ({t.kind.config} {ODOM_CONFIG_HZ} Hz) <b className="kind">{t.kind.measured}</b></dt><dd data-k="odomhz">{MEASURED.odomHz.join('–')} Hz (≈ {Math.round(MEASURED.odomHz[0] * TF_CHECK_PERIOD)}–{Math.round(MEASURED.odomHz[1] * TF_CHECK_PERIOD)})</dd></div>
        </dl>
        <p className="note">{s.driveNote}</p>
        </fieldset>
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/src/tf_anomaly_detector.cpp#L10-L97`}>tf_anomaly_detector.cpp:10-97</a>, <a href={`${SOURCE_REPO}/blob/main/description/turtlebot3_burger.urdf.xacro#L12-L154`}>turtlebot3_burger.urdf.xacro:12-16, 115-119, 148-154</a>, <a href={`${SOURCE_REPO}/blob/main/config/slam_params.yaml#L47`}>slam_params.yaml:47</a>, <a href="https://www.ros.org/reps/rep-0105.html">REP 105</a></p>
      </div>
    </>
  )
}
