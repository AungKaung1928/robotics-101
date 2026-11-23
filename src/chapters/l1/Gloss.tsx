import './l1.css'

/** Glossary list shared by Level 1-2 chapters: term in <code> (verify.mjs skips pure-code terms in its JA prose check). */
export default function Gloss({ items }: { items: [string, string][] }) {
  return <dl className="gloss">{items.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt><code>{k}</code></dt><dd>{v}</dd></div>)}</dl>
}
