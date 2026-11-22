/** Labelled range input; `mark` draws a tick at his configured value. */
export default function Slider(p: {
  label: string; value: number; min: number; max: number; step: number; mark?: number
  onChange: (v: number) => void; fmt?: (v: number) => string
}) {
  const pct = p.mark === undefined ? null : ((p.mark - p.min) / (p.max - p.min)) * 100
  return (
    <label className="slider">
      <span>{p.label} <output>{(p.fmt ?? String)(p.value)}</output></span>
      <input type="range" min={p.min} max={p.max} step={p.step} value={p.value}
        onChange={(e) => p.onChange(Number(e.target.value))} />
      {pct !== null && <i className="mark" style={{ left: `${pct}%` }} aria-hidden="true" />}
    </label>
  )
}
