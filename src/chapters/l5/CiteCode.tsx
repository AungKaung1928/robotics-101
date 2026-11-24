import { citeParts } from './port'

/** A file:lines citation; the ':lines' part never wraps, the path may. */
export default function CiteCode({ p }: { p: string }) {
  const [file, lines] = citeParts(p)
  return <code>{file}<span className="cite-ln">{lines}</span></code>
}
