import { useEffect, useState } from 'react'
import './livenote.css'

/**
 * Says a scene's outcome to screen readers when it changes ("stopped 0.48 m from the wall", "bumped into the wall"):
 * a visually hidden polite live region. MDN ARIA live regions: render the region empty first and fill it in a separate
 * step, since only changes are announced; polite, so it never interrupts. `text` = the chapter's own words; '' = silent.
 */
export default function LiveNote({ text }: { text: string }) {
  const [said, setSaid] = useState('') // empty on the first render, even when text is set: the region must exist first
  useEffect(() => { setSaid(text) }, [text])
  return <div className="live-note" role="status" aria-live="polite" aria-atomic="true">{said}</div>
}
