import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { chapterDir, swap } from './anim/transition'
import './anim/transition.css'
import BringupChapter from './components/BringupChapter'
import CostmapChapter from './components/CostmapChapter'
import DetectChapter from './components/DetectChapter'
import GoalChapter from './components/GoalChapter'
import GridChapter from './components/GridChapter'
import MiniPlan from './components/MiniPlan'
import { waypointValues } from './content/waypoints'
import Overview from './components/Overview'
import ScanChapter from './components/ScanChapter'
import TfChapter from './components/TfChapter'
import { STRINGS, initialLang, type Lang, type Strings } from './i18n'
import { CHAPTER_ICON, Icon } from './icons'
import type { ChapterMeta } from './anim/contract'
import { LEVEL_BODY, levelPage, readingIndex, type LevelPage } from './content/levels'
import { markDone } from './lib/progress'
import { CHAPTERS, keyTarget, neighbour, parseRoute, type ChapterId } from './lib/route'

const BODY: Record<ChapterId, typeof ScanChapter> = { bringup: BringupChapter, tf: TfChapter, scan: ScanChapter, detect: DetectChapter, grid: GridChapter, costmap: CostmapChapter, goal: GoalChapter }

export default function App() {
  const [route, setRoute] = useState(() => parseRoute(location.hash))
  const [lvl, setLvl] = useState(() => levelPage(location.hash))
  const [lang, setLang] = useState<Lang>(initialLang)
  const t = STRINGS[lang]

  useEffect(() => {
    let shown = location.hash
    const on = () => {
      const to = location.hash, dir = chapterDir(readingIndex(shown), readingIndex(to))
      shown = to
      swap(() => flushSync(() => { setRoute(parseRoute(to)); setLvl(levelPage(to)) }), dir)
      window.scrollTo(0, 0)
    }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  useEffect(() => {
    if (route.page === 'chapter') markDone(localStorage, route.id)
    else if (lvl) markDone(localStorage, lvl.meta.id)
  }, [route, lvl])
  useEffect(() => {
    document.documentElement.lang = lang
    localStorage.setItem('r101-lang', lang)
  }, [lang])
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return // arrows move the slider there
      if (e.ctrlKey || e.metaKey || e.altKey) return // leave browser shortcuts alone
      const to = keyTarget(e.key, route)
      if (to) location.hash = `#/${to}`
    }
    addEventListener('keydown', on)
    return () => removeEventListener('keydown', on)
  }, [route])

  const idx = route.page === 'chapter' ? CHAPTERS.indexOf(route.id) : -1
  const spot = route.page === 'chapter' ? waypointValues(t.wv)[route.id] : null
  const Body = route.page === 'chapter' ? BODY[route.id] : null
  const prev = route.page === 'chapter' ? neighbour(route.id, -1) : null
  const next = route.page === 'chapter' ? neighbour(route.id, 1) : null
  return (
    <>
      <header className="console">
        <a href="#/" className="home">r101</a>
        {!lvl && <span>/waypoint {idx < 0 ? '–' : idx + 1}/{CHAPTERS.length}</span>}
        <span>/{lvl ? `${lvl.meta.level}/${lvl.meta.id}` : route.page === 'chapter' ? route.id : 'plan'}</span>
        <span className="langs">
          {(['en', 'ja'] as const).map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
          ))}
        </span>
      </header>
      {lvl ? <LevelChapter p={lvl} t={t} ja={lang === 'ja'} /> : route.page === 'overview' || !Body ? <Overview t={t} /> : (
        <main className="chapter">
          <div className="chead">
            <div>
              <h1><span className="num">{idx + 1}</span> <Icon name={CHAPTER_ICON[route.id]} /> {t.chapters[route.id]}</h1>
              <p className="spot" data-k="spot">{spot?.v} <b className="kind">{spot && t.kind[spot.kind]}</b></p>
            </div>
            <MiniPlan current={route.id} t={t} />
          </div>
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

function LevelChapter({ p, t, ja }: { p: LevelPage; t: Strings; ja: boolean }) {
  const Body = LEVEL_BODY[p.meta.id]
  const title = (c: ChapterMeta) => (ja ? c.titleJa : c.titleEn)
  const link = (c: ChapterMeta) => `#/${c.level}/${c.id}`
  return (
    <main className="chapter">
      <div className="chead">
        <div>
          <p className="eyebrow">{t.levels.heading} {p.meta.level} · {t.levels.names[p.meta.level]}</p>
          <h1><span className="num">{p.num}</span> <Icon name={p.meta.icon} /> {title(p.meta)}</h1>
        </div>
      </div>
      <Body t={t} />
      <nav className="steps" aria-label={t.plan}>
        {p.prev ? <a href={link(p.prev)}>← {t.back}: {title(p.prev)}</a> : <a href="#/">← {t.plan}</a>}
        {p.next ? <a href={link(p.next)}>{t.next}: {title(p.next)} →</a> : <a href="#/">{t.plan} →</a>}
      </nav>
    </main>
  )
}
