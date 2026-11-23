import { createRoot } from 'react-dom/client'
import '../../index.css'
import { STRINGS } from '../../i18n'
import MoveChapter from '../l0/MoveChapter'
import SenseChapter from '../l0/SenseChapter'
import ThinkChapter from '../l0/ThinkChapter'
import ActChapter from '../l0/ActChapter'
import SimwhatChapter from '../l0/SimwhatChapter'
import { BODIES, INTROS } from '../l2/bodies'

const q = new URLSearchParams(location.search)
const c = q.get('c') ?? 'decide'
const Body = c === 'move' ? MoveChapter : c === 'sense' ? SenseChapter : c === 'think' ? ThinkChapter : c === 'act' ? ActChapter : c === 'simwhat' ? SimwhatChapter : c === 'intro1' ? INTROS[1] : c === 'intro2' ? INTROS[2] : BODIES[c as keyof typeof BODIES]
const t = STRINGS[q.get('lang') === 'ja' ? 'ja' : 'en']
// ?w=390: headless Chrome on Windows will not open a window under ~500 px, so the page frames itself at that width.
const w = q.get('w')
const self = () => { const u = new URL(location.href); u.searchParams.delete('w'); return u.href }
createRoot(document.getElementById('root')!).render(w
  ? <iframe src={self()} style={{ width: `${w}px`, height: '100vh', border: 0 }} />
  : <main className="chapter"><Body t={t} /></main>)
