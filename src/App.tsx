import { useEffect, useState } from 'react'
import CostmapChapter from './components/CostmapChapter'
import Overview from './components/Overview'
import ScanChapter from './components/ScanChapter'
import TfChapter from './components/TfChapter'
import { STRINGS, initialLang, type Lang } from './i18n'
import { CHAPTERS, neighbour, parseRoute, type ChapterId } from './lib/route'

const BODY: Partial<Record<ChapterId, typeof ScanChapter>> = { tf: TfChapter, scan: ScanChapter, costmap: CostmapChapter }

export default function App() {
  const [route, setRoute] = useState(() => parseRoute(location.hash))
  const [lang, setLang] = useState<Lang>(initialLang)
  const t = STRINGS[lang]

  useEffect(() => {
    const on = () => { setRoute(parseRoute(location.hash)); window.scrollTo(0, 0) }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  useEffect(() => {
    document.documentElement.lang = lang
    localStorage.setItem('rfs-lang', lang)
  }, [lang])
  useEffect(() => {
    if (route.page !== 'chapter') return
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return // arrows move the slider there
      const dir = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0
      const to = dir && neighbour(route.id, dir)
      if (to) location.hash = `#/${to}`
    }
    addEventListener('keydown', on)
    return () => removeEventListener('keydown', on)
  }, [route])

  const idx = route.page === 'chapter' ? CHAPTERS.findIndex((c) => c.id === route.id) : -1
  const Body = route.page === 'chapter' ? BODY[route.id] : undefined
  const prev = route.page === 'chapter' ? neighbour(route.id, -1) : null
  const next = route.page === 'chapter' ? neighbour(route.id, 1) : null
  return (
    <>
      <header className="console">
        <a href="#/" className="home">rfs</a>
        <span>/waypoint {idx < 0 ? '–' : idx + 1}/{CHAPTERS.length}</span>
        <span>/{route.page === 'chapter' ? route.id : 'plan'}</span>
        <span className="langs">
          {(['en', 'ja'] as const).map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
          ))}
        </span>
      </header>
      {route.page === 'overview' || !Body ? <Overview t={t} /> : (
        <main className="chapter">
          <h1><span className="num">{idx + 1}</span> {t.chapters[route.id]}</h1>
          <Body t={t} />
          <nav className="steps" aria-label={t.plan}>
            {prev ? <a href={`#/${prev}`}>← {t.back}: {t.chapters[prev]}</a> : <a href="#/">← {t.plan}</a>}
            {next ? <a href={`#/${next}`}>{t.next}: {t.chapters[next]} →</a> : <a href="#/">{t.plan} →</a>}
          </nav>
        </main>
      )}
    </>
  )
}
