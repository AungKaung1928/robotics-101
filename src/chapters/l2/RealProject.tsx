import { SOURCE_REPO } from '../../content/world'
import { STRINGS, type Strings } from '../../i18n'
import { REAL } from './realproject'

const HEAD = { en: 'From a real project', ja: '実際のプロジェクトから' }

/** The "from a real project" box of one Level 2 chapter: one sentence + the file:line links in TF-Transform-Explorer. */
export default function RealProject({ id, t }: { id: string; t: Strings }) {
  const box = REAL[id]
  if (!box) return null
  const l = t === STRINGS.ja ? 'ja' : 'en'
  return (
    <aside className="real-project" data-k="real">
      <p className="group-h">{HEAD[l]}</p>
      <p>{box[l]}</p>
      <p className="src">{box.cites.map((c, i) => (
        <span key={c.file + c.line}>{i ? ', ' : ''}<a href={`${SOURCE_REPO}/blob/main/${c.file}#L${c.line}`}>{c.file.split('/').pop()}:{c.line}</a></span>
      ))} (TF-Transform-Explorer)</p>
    </aside>
  )
}
