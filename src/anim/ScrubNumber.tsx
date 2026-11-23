import { useRef, useState } from 'react'
import { scrubKey, scrubValue, type ScrubRange } from './scrub'
import { UI_STYLE } from './spring'
import './scrub.css'

/**
 * A number inside a sentence that the reader drags sideways (or steps with the keys) to change; the chapter feeds
 * `value` to its model so the figure follows (a reactive document). It swells a little on the UI spring while held.
 */
export default function ScrubNumber({ value, onChange, range, format, label }: {
  value: number; onChange: (v: number) => void; range: ScrubRange; format: (v: number) => string; label: string
}) {
  const start = useRef<{ x: number; v: number } | null>(null)
  const [drag, setDrag] = useState(false)
  return (
    <span className="scrub-num" role="slider" tabIndex={0} aria-label={label} aria-valuemin={range.min} aria-valuemax={range.max}
      aria-valuenow={value} aria-valuetext={format(value)} style={UI_STYLE} data-drag={drag || undefined}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); start.current = { x: e.clientX, v: value }; setDrag(true) }}
      onPointerMove={(e) => { if (start.current) onChange(scrubValue(start.current.v, e.clientX - start.current.x, range)) }}
      onPointerUp={() => { start.current = null; setDrag(false) }}
      onPointerCancel={() => { start.current = null; setDrag(false) }}
      onKeyDown={(e) => {
        const v = scrubKey(value, e.key, e.shiftKey, range)
        if (v === null) return
        e.preventDefault()
        e.stopPropagation() // arrows here must not also turn the chapter page
        onChange(v)
      }}>
      {format(value)}
    </span>
  )
}
