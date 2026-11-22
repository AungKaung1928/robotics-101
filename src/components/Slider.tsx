import { useState } from 'react'

/** Labelled range input; `mark` draws a tick at his configured value; `hint` shows until the first drag. */
export default function Slider(p: {
  label: string; value: number; min: number; max: number; step: number; mark?: number
  onChange: (v: number) => void; fmt?: (v: number) => string; hint?: string
}) {
  const [touched, setTouched] = useState(false)
  const pct = p.mark === undefined ? null : ((p.mark - p.min) / (p.max - p.min)) * 100
  return (
    <label className="slider">
      <span>{p.label} <output>{(p.fmt ?? String)(p.value)}</output></span>
      <input type="range" min={p.min} max={p.max} step={p.step} value={p.value}
        onChange={(e) => { setTouched(true); p.onChange(Number(e.target.value)) }} />
      {p.hint && !touched && <em className="hint">{p.hint}</em>}
      {pct !== null && <i className="mark" style={{ left: `${pct}%` }} aria-hidden="true" />}
    </label>
  )
}
