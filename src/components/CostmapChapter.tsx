import { useState } from 'react'
import { NAV2, OBSTACLES, SOURCE_REPO, type Box } from '../content/world'
import type { Strings } from '../i18n'
import { INSCRIBED, LETHAL, distToBox, inflationCost, kForEdgeCost } from '../lib/inflation'
import { routeParam } from '../lib/route'
import Slider from './Slider'

const R = NAV2.robotRadius, RAD = NAV2.inflationRadius
const DMAX = 0.8, W = 640, H = 300, PAD = 36
const sx = (d: number) => PAD + (d / DMAX) * (W - 2 * PAD)
const sy = (c: number) => H - PAD - (c / LETHAL) * (H - 2 * PAD)
// Top-down inset: the costmap cells around box1 at his 0.05 m resolution.
const BOX1 = OBSTACLES.find((o) => o.name === 'box1') as Box
const RES = NAV2.costmapResolution, X0 = 0.6, SPAN = 2.8, N = Math.round(SPAN / RES)
const CELLS = Array.from({ length: N * N }, (_, k) => {
  const x = X0 + (k % N) * RES, y = X0 + Math.floor(k / N) * RES
  return { x, y, d: distToBox(x + RES / 2, y + RES / 2, BOX1) }
})

export default function CostmapChapter({ t }: { t: Strings }) {
  const c = t.costmap
  const [k, setK] = useState(() => routeParam(location.hash, 'k', NAV2.costScaling, 0.5, 10))
  const [d, setD] = useState(() => routeParam(location.hash, 'd', 0.35, 0, DMAX))
  const cost = (x: number) => inflationCost(x, k, R, RAD)
  const xs = Array.from({ length: 321 }, (_, i) => (i / 320) * DMAX)
  const curve = xs.map((x, i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(cost(x)).toFixed(1)}`).join('')
  const edge = cost(RAD)
  return (
    <>
      <div className="figure">
        <svg className="inset" viewBox={`${X0} ${-X0 - SPAN} ${SPAN} ${SPAN}`} role="img" aria-label={`${t.chapters.costmap}: box1`}>
          <g transform="scale(1 -1)">
            {CELLS.map((c) => {
              const v = cost(c.d)
              return v > 0 && <rect key={`${c.x} ${c.y}`} className={v === LETHAL ? 'c-lethal' : 'c-cost'} x={c.x} y={c.y} width={RES} height={RES} opacity={v === LETHAL ? 1 : v / LETHAL} />
            })}
            <circle className="robot" cx={BOX1.x - BOX1.w / 2 - d} cy={BOX1.y} r={R} />
            <circle className="probe-dot" cx={BOX1.x - BOX1.w / 2 - d} cy={BOX1.y} r="0.03" />
          </g>
        </svg>
        <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.chapters.costmap}>
          <rect className="band-insc" x={sx(0)} y={PAD} width={sx(R) - sx(0)} height={H - 2 * PAD} />
          <rect className="band-infl" x={sx(R)} y={PAD} width={sx(RAD) - sx(R)} height={H - 2 * PAD} />
          <path className="axis" d={`M${PAD} ${PAD}V${H - PAD}H${W - PAD}`} />
          {[0, 0.2, 0.4, 0.6, 0.8].map((v) => <text key={v} className="tick" x={sx(v)} y={H - PAD + 18} textAnchor="middle">{v.toFixed(1)}</text>)}
          {[0, 128, LETHAL].map((v) => <text key={v} className="tick" x={PAD - 6} y={sy(v) + 4} textAnchor="end">{v}</text>)}
          <text className="tick" x={sx(R / 2)} y={PAD - 8} textAnchor="middle">{c.inscribed} {INSCRIBED}</text>
          <text className="tick" x={sx(RAD)} y={PAD - 8} textAnchor="middle">{RAD} m</text>
          <path className="cost" d={curve} />
          <line className="probe" x1={sx(d)} x2={sx(d)} y1={PAD} y2={H - PAD} />
          <circle className="probe-dot" cx={sx(d)} cy={sy(cost(d))} r="5" />
        </svg>
      </div>
      <div className="panel">
        {c.lines.map((l) => <p key={l}>{l}</p>)}
        <Slider hint={t.drag} label={c.k} value={k} min={0.5} max={10} step={0.5} mark={NAV2.costScaling} onChange={setK} fmt={(v) => v.toFixed(1)} />
        <Slider label={c.d} value={d} min={0} max={DMAX} step={0.01} mark={R} onChange={setD} fmt={(v) => v.toFixed(2)} />
        <dl className="readout">
          <div><dt>{c.cost}</dt><dd data-k="cost">{cost(d)}{cost(d) === LETHAL ? ` (${c.lethal})` : cost(d) === INSCRIBED ? ` (${c.inscribed})` : ''}</dd></div>
          <div><dt>{c.zero}</dt><dd data-k="edge">{RAD} m ({edge} → 0)</dd></div>
          <div><dt>{c.smooth}</dt><dd data-k="smooth">{kForEdgeCost(10, R, RAD).toFixed(1)}</dd></div>
        </dl>
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/config/nav2_params.yaml#L81-L87`}>nav2_params.yaml:81-87</a>, <a href="https://docs.nav2.org/configuration/packages/costmap-plugins/inflation.html">Nav2 InflationLayer</a></p>
      </div>
    </>
  )
}
