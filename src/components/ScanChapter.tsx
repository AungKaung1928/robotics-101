import { useState } from 'react'
import { LIDAR, MEASURED, NAV2, SOURCE_REPO, WORLD } from '../content/world'
import type { Strings } from '../i18n'
import { beamAngles, beamGap, castRay, movePerScan } from '../lib/scan'
import Arena from './Arena'
import Slider from './Slider'

const L = LIDAR
const ANGLES = beamAngles(L.samples, L.minAngle, L.maxAngle)

export default function ScanChapter({ t }: { t: Strings }) {
  const s = t.scan
  const [x, setX] = useState(0.5)
  const [y, setY] = useState(0.5)
  const [yaw, setYaw] = useState(45)
  const [r, setR] = useState(L.maxRange)
  const [hz, setHz] = useState(L.hz)
  const pose = { x, y, yaw: (yaw * Math.PI) / 180 }
  const hits = ANGLES.map((rel) => ({ rel, a: pose.yaw + rel, d: castRay(pose, rel, WORLD, L.minRange, L.maxRange) })).filter((h) => h.d < Infinity)
  const [hover, setHover] = useState<number | null>(null)
  // Shown beam: the hovered one, else the return closest to straight ahead.
  const ahead = hits.reduce((b, h, i) => (b < 0 || Math.abs(h.rel) < Math.abs(hits[b].rel) ? i : b), -1)
  const sel = hover !== null && hover < hits.length ? hits[hover] : hits[ahead]
  const gap = beamGap(r, L.samples, L.minAngle, L.maxAngle)
  return (
    <>
      <div className="figure">
        <Arena label={t.chapters.scan}>
          <circle className="range" cx={x} cy={y} r={L.maxRange} />
          <circle className="inspect" cx={x} cy={y} r={r} />
          <path className="rays" d={hits.map((h) => `M${x} ${y}L${x + h.d * Math.cos(h.a)} ${y + h.d * Math.sin(h.a)}`).join('')} />
          {hits.map((h, i) => <circle key={i} className="hit" cx={x + h.d * Math.cos(h.a)} cy={y + h.d * Math.sin(h.a)} r="0.035" />)}
          {sel && <path className="sel-ray" d={`M${x} ${y}L${x + sel.d * Math.cos(sel.a)} ${y + sel.d * Math.sin(sel.a)}`} />}
          {hits.map((h, i) => <circle key={`t${i}`} className="hit-target" cx={x + h.d * Math.cos(h.a)} cy={y + h.d * Math.sin(h.a)} r="0.12"
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />)}
          <circle className="robot" cx={x} cy={y} r={NAV2.robotRadius} />
          <path className="heading" d={`M${x} ${y}l${0.35 * Math.cos(pose.yaw)} ${0.35 * Math.sin(pose.yaw)}`} />
        </Arena>
      </div>
      <div className="panel">
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <Slider hint={t.drag} label={s.x} value={x} min={-4.5} max={4.5} step={0.05} onChange={setX} fmt={(v) => v.toFixed(2)} />
        <Slider label={s.y} value={y} min={-4.5} max={4.5} step={0.05} onChange={setY} fmt={(v) => v.toFixed(2)} />
        <Slider label={s.yaw} value={yaw} min={-180} max={180} step={1} onChange={setYaw} />
        <Slider label={s.range} value={r} min={0.5} max={L.maxRange} step={0.1} mark={L.maxRange} onChange={setR} fmt={(v) => v.toFixed(1)} />
        <fieldset className="seg">
          <legend>{s.rate}</legend>
          {[5, 10].map((h) => (
            <label key={h}><input type="radio" name="hz" checked={hz === h} onChange={() => setHz(h)} /> {h} Hz{h === L.hz ? ' ●' : ''}</label>
          ))}
        </fieldset>
        <dl className="readout">
          <div><dt>{s.beam}</dt><dd data-k="beam">{sel ? `${Math.round((sel.rel * 180) / Math.PI)}° → ${sel.d.toFixed(2)} m` : '–'}</dd></div>
          <div><dt>{s.hits}</dt><dd data-k="hits">{hits.length} / {L.samples}</dd></div>
          <div><dt>{s.gap} @ {r.toFixed(1)} m</dt><dd data-k="gap">{(gap * 100).toFixed(1)} cm</dd></div>
          <div><dt>{s.measured}</dt><dd data-k="scanhz">{MEASURED.scanHz.join('–')} Hz</dd></div>
          <div><dt>{s.move}</dt><dd data-k="move">{(movePerScan(NAV2.maxVelX, hz) * 100).toFixed(1)} cm</dd></div>
        </dl>
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/description/turtlebot3_burger.urdf.xacro#L168-L182`}>turtlebot3_burger.urdf.xacro:168-182</a>, <a href={`${SOURCE_REPO}/blob/main/worlds/explorer_world.sdf#L47-L140`}>explorer_world.sdf:47-140</a>, <a href={`${SOURCE_REPO}/blob/main/README.md`}>README (measured)</a></p>
      </div>
    </>
  )
}
