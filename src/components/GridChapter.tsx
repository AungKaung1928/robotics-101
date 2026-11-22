import { useEffect, useMemo, useRef, useState } from 'react'
import { LIDAR, SLAM_MAX_LASER_RANGE, SLAM_RESOLUTION, WAYPOINTS, WORLD } from '../content/world'
import type { Strings } from '../i18n'
import { addBeam, cellCount, makeGrid, prob } from '../lib/grid'
import { beamAngles, castRay } from '../lib/scan'
import { routeParam, routeStep } from '../lib/route'
import Slider from './Slider'

const SIZE = 10
const L_MAX = LIDAR.maxRange
const ANGLES = beamAngles(LIDAR.samples, LIDAR.minAngle, LIDAR.maxAngle)
const P_HIT = 0.7, P_FREE = 0.4 // page choice, shown under the figure

function build(res: number, scans: number) {
  const g = makeGrid(SIZE, res)
  for (let k = 0; k < scans; k++) {
    const { x, y } = WAYPOINTS[k % WAYPOINTS.length]
    for (const a of ANGLES) addBeam(g, x, y, a, castRay({ x, y, yaw: 0 }, a, WORLD, LIDAR.minRange, LIDAR.maxRange), P_HIT, P_FREE)
  }
  return g
}

export default function GridChapter({ t }: { t: Strings }) {
  const s = t.grid
  const [res, setRes] = useState(() => routeParam(location.hash, 'res', SLAM_RESOLUTION, 0.025, 0.2))
  // '#/grid/7' opens with 7 scans added (one per waypoint); plain '#/grid' with 1.
  const [scans, setScans] = useState(() => (/^#\/grid\/\d/.test(location.hash) ? routeStep(location.hash, 99) + 1 : 1))
  const g = useMemo(() => build(res, scans), [res, scans])
  const known = g.l.reduce((n, v) => n + (v !== 0 ? 1 : 0), 0)
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = canvas.current!
    const css = getComputedStyle(c)
    const ctx = c.getContext('2d')!
    const fill = { occ: css.getPropertyValue('--occ'), free: css.getPropertyValue('--free'), unknown: css.getPropertyValue('--grid') }
    ctx.fillStyle = fill.unknown
    ctx.fillRect(0, 0, g.n, g.n)
    for (let j = 0; j < g.n; j++) {
      for (let i = 0; i < g.n; i++) {
        const p = prob(g.l[j * g.n + i])
        if (p !== 0.5) {
          ctx.fillStyle = p > 0.5 ? fill.occ : fill.free
          ctx.globalAlpha = Math.min(1, Math.abs(p - 0.5) * 3)
          ctx.fillRect(i, g.n - 1 - j, 1, 1) // canvas y points down, map y up
        }
      }
    }
    ctx.globalAlpha = 1
  }, [g])
  const last = WAYPOINTS[(scans - 1) % WAYPOINTS.length]
  return (
    <>
      <div className="figure">
        <div className="gridwrap">
          <canvas ref={canvas} className="gridmap" width={g.n} height={g.n} role="img"
            aria-label={`${t.chapters.grid}: ${s.scans} ${scans}, ${s.known} ${((known / (g.n * g.n)) * 100).toFixed(1)} %`} />
          <i className="gridrobot" style={{ left: `${((last.x + SIZE / 2) / SIZE) * 100}%`, top: `${((SIZE / 2 - last.y) / SIZE) * 100}%` }} aria-hidden="true" />
        </div>
        <p className="note">{s.model}</p>
      </div>
      <div className="panel">
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <div className="buttons">
          <button type="button" onClick={() => setScans(scans + 1)}>{s.add}</button>
          <button type="button" onClick={() => setScans(1)}>{s.reset}</button>
        </div>
        <Slider hint={t.drag} label={s.res} value={res} min={0.025} max={0.2} step={0.025} mark={SLAM_RESOLUTION} onChange={setRes} fmt={(v) => v.toFixed(3)} />
        <dl className="readout">
          <div><dt>{s.cells}</dt><dd data-k="cells">{cellCount(SIZE, res).toLocaleString('en-US')}</dd></div>
          <div><dt>{s.scans}</dt><dd data-k="scans">{scans}</dd></div>
          <div><dt>{s.known}</dt><dd data-k="known">{((known / (g.n * g.n)) * 100).toFixed(1)} %</dd></div>
        </dl>
        <p className="note">{s.limit(SLAM_MAX_LASER_RANGE, L_MAX)}</p>
        <p className="note">{s.same}</p>
        <p className="src">{t.source}: <a href="https://github.com/AungKaung1928/TF-Transform-Explorer/blob/main/config/slam_params.yaml#L11-L12">slam_params.yaml:11-12</a>, <a href="https://github.com/AungKaung1928/TF-Transform-Explorer/blob/main/config/nav2_params.yaml#L81">nav2_params.yaml:81, 119</a>, Thrun, Burgard, Fox, <i>Probabilistic Robotics</i>, ch. 9</p>
      </div>
    </>
  )
}
