import { useState } from 'react'
import { LIDAR, SOURCE_REPO, WALLS, WORLD } from '../content/world'
import type { Strings } from '../i18n'
import { clusterCount, clusters, objectsInView } from '../lib/cluster'
import { beamAngles, castRayHit } from '../lib/scan'
import Arena from './Arena'
import Slider from './Slider'

const L = LIDAR
const ANGLES = beamAngles(L.samples, L.minAngle, L.maxAngle)
const YAW = Math.PI / 4
// Cluster colours: hues spread by the golden angle so neighbours differ; lightness set per theme in CSS.
const hue = (k: number) => (k * 137.5) % 360

export default function DetectChapter({ t }: { t: Strings }) {
  const s = t.detect
  const [x, setX] = useState(0.5)
  const [y, setY] = useState(0.5)
  const [th, setTh] = useState(0.1)
  const hits = ANGLES.map((a) => castRayHit({ x, y, yaw: YAW }, a, WORLD, L.minRange, L.maxRange))
  const pts = hits.map((h, i): [number, number] | null =>
    h.d === Infinity ? null : [x + h.d * Math.cos(YAW + ANGLES[i]), y + h.d * Math.sin(YAW + ANGLES[i])])
  const label = clusters(pts, th)
  const truth = objectsInView(hits.map((h) => h.shape), WALLS.length)
  return (
    <>
      <div className="figure">
        <Arena label={t.chapters.detect}>
          <circle className="range" cx={x} cy={y} r={L.maxRange} />
          {pts.map((p, i) => p && <circle key={i} className="cl" style={{ '--h': hue(label[i]) } as React.CSSProperties} cx={p[0]} cy={p[1]} r="0.05" />)}
          <circle className="robot" cx={x} cy={y} r="0.22" />
        </Arena>
      </div>
      <div className="panel">
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <Slider hint={t.drag} label={s.x} value={x} min={-4.5} max={4.5} step={0.05} onChange={setX} fmt={(v) => v.toFixed(2)} />
        <Slider label={s.y} value={y} min={-4.5} max={4.5} step={0.05} onChange={setY} fmt={(v) => v.toFixed(2)} />
        <Slider label={s.th} value={th} min={0.01} max={1.5} step={0.01} onChange={setTh} fmt={(v) => v.toFixed(2)} />
        <dl className="readout">
          <div><dt>{s.found}</dt><dd data-k="found" className={clusterCount(label) === truth ? '' : 'early'}>{clusterCount(label)}</dd></div>
          <div><dt>{s.truth}</dt><dd data-k="truth">{truth}</dd></div>
        </dl>
        <p className="note">{s.next}</p>
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/worlds/explorer_world.sdf#L104-L140`}>explorer_world.sdf:104-140</a>, Borges &amp; Aldon, J. Intell. Robot. Syst. 40 (2004) 267–297, <a href="https://doi.org/10.1023/B:JINT.0000038945.55712.65">doi</a></p>
      </div>
    </>
  )
}
