import './tread.css'

/** Stripe phase in [0, pitch) after rolling `dist` (same units): the pattern repeats every pitch, backwards too. */
export function treadPhase(dist: number, pitch: number): number {
  return ((dist % pitch) + pitch) % pitch
}

/**
 * Smallest stripe pitch that still reads as moving forward at `speed` (units / s) and `fps`: a stripe that moves more
 * than half a pitch per frame looks like it runs backwards (wagon-wheel effect); 2.5x the per-frame step keeps margin.
 */
export function minPitch(speed: number, fps = 60): number {
  return (2.5 * Math.abs(speed)) / fps
}

/**
 * A wheel seen from above (top-down figures): a rounded rect whose tread stripes slide by the distance this wheel
 * has rolled, so two wheels at different speeds (a turn) show it. Local frame: the wheel runs along +y (rotate the
 * parent group to the robot's heading). `rolled` and sizes in the figure's own units.
 */
export default function TreadWheel({ x, y, w, h, rolled, pitch = h / 4 }: { x: number; y: number; w: number; h: number; rolled: number; pitch?: number }) {
  const off = treadPhase(rolled, pitch), n = Math.ceil(h / pitch) + 1
  const id = `tw-${Math.round(x * 100)}-${Math.round(y * 100)}`
  return (
    <g className="tread">
      <clipPath id={id}><rect x={x} y={y} width={w} height={h} rx={w / 3} /></clipPath>
      <rect className="tread-body" x={x} y={y} width={w} height={h} rx={w / 3} />
      <g clipPath={`url(#${id})`}>
        {Array.from({ length: n }, (_, k) => {
          const sy = y - pitch + off + k * pitch
          return <line key={k} className="tread-stripe" x1={x} x2={x + w} y1={sy} y2={sy} />
        })}
      </g>
    </g>
  )
}
