import { useState } from 'react'
import { NAV2, SOURCE_REPO } from '../content/world'
import type { Strings } from '../i18n'
import { INSCRIBED, LETHAL, inflationCost } from '../lib/inflation'
import Slider from './Slider'

const R = NAV2.robotRadius, RAD = NAV2.inflationRadius
const DMAX = 0.8, W = 640, H = 300, PAD = 36
const sx = (d: number) => PAD + (d / DMAX) * (W - 2 * PAD)
const sy = (c: number) => H - PAD - (c / LETHAL) * (H - 2 * PAD)

export default function CostmapChapter({ t }: { t: Strings }) {
  const c = t.costmap
  const [k, setK] = useState(NAV2.costScaling)
  const [d, setD] = useState(0.35)
  const cost = (x: number) => inflationCost(x, k, R, RAD)
  const xs = Array.from({ length: 321 }, (_, i) => (i / 320) * DMAX)
  const curve = xs.map((x, i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(cost(x)).toFixed(1)}`).join('')
  const edge = cost(RAD)
  return (
    <>
      <div className="figure">
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
        <Slider label={c.k} value={k} min={0.5} max={10} step={0.5} mark={NAV2.costScaling} onChange={setK} fmt={(v) => v.toFixed(1)} />
        <Slider label={c.d} value={d} min={0} max={DMAX} step={0.01} mark={R} onChange={setD} fmt={(v) => v.toFixed(2)} />
        <dl className="readout">
          <div><dt>{c.cost}</dt><dd data-k="cost">{cost(d)}{cost(d) === LETHAL ? ` (${c.lethal})` : cost(d) === INSCRIBED ? ` (${c.inscribed})` : ''}</dd></div>
          <div><dt>{c.zero}</dt><dd data-k="edge">{RAD} m ({edge} → 0)</dd></div>
        </dl>
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/config/nav2_params.yaml#L81-L87`}>nav2_params.yaml:81-87</a>, <a href="https://docs.nav2.org/configuration/packages/costmap-plugins/inflation.html">Nav2 InflationLayer</a></p>
      </div>
    </>
  )
}
