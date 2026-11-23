import { createRoot } from 'react-dom/client'
import '../../index.css'
import { STRINGS } from '../../i18n'
import BfsChapter from './BfsChapter'
import LateChapter from './LateChapter'

const q = new URLSearchParams(location.search)
const Body = q.get('c') === 'late' ? LateChapter : BfsChapter
const t = STRINGS[q.get('lang') === 'ja' ? 'ja' : 'en']
// ?w=390: headless Chrome on Windows will not open a window under ~500 px, so the page frames itself at that width.
const w = q.get('w')
const self = () => { const u = new URL(location.href); u.searchParams.delete('w'); return u.href }
createRoot(document.getElementById('root')!).render(w
  ? <iframe src={self()} style={{ width: `${w}px`, height: '100vh', border: 0 }} />
  : <main className="chapter"><Body t={t} /></main>)
// ?click=<selector>: click it once after mount, to look at a state behind a button (e.g. button.costmap).
const click = q.get('click')
if (click && !w) setTimeout(() => document.querySelector<HTMLElement>(click)?.click(), 300)
