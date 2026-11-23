import { createRoot } from 'react-dom/client'
import '../../index.css'
import { STRINGS } from '../../i18n'
import { CallbackChapter, ClosestChapter, CppChapter, DecideChapter, ShellChapter } from './index'
import { ActionsChapter, ParamsChapter, MsgTypesChapter, NodesChapter, TopicsChapter } from '../l2'

const BODIES = { decide: DecideChapter, closest: ClosestChapter, callback: CallbackChapter, cpp: CppChapter, shell: ShellChapter, nodes: NodesChapter, topics: TopicsChapter, msgtypes: MsgTypesChapter, actions: ActionsChapter, params: ParamsChapter }
const q = new URLSearchParams(location.search)
const Body = BODIES[(q.get('c') ?? 'decide') as keyof typeof BODIES]
const t = STRINGS[q.get('lang') === 'ja' ? 'ja' : 'en']
// ?w=390: headless Chrome on Windows will not open a window under ~500 px, so the page frames itself at that width.
const w = q.get('w')
const self = () => { const u = new URL(location.href); u.searchParams.delete('w'); return u.href }
createRoot(document.getElementById('root')!).render(w
  ? <iframe src={self()} style={{ width: `${w}px`, height: '100vh', border: 0 }} />
  : <main className="chapter"><Body t={t} /></main>)
