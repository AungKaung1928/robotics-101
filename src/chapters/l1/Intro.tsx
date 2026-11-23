import { useMemo, useState } from 'react'
import Player from '../../anim/Player'
import type { ChapterMeta } from '../../anim/contract'
import { STRINGS, type Strings } from '../../i18n'
import { Icon } from '../../icons'
import { LEVEL1_CHAPTERS } from '.'
import { introScenario } from './intro'
import { INTRO1_STRINGS } from './intro.strings'
import RobotSide from './RobotSide'
import './l1.css'

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Chapter chips of one level: lit up to `lit`, each a link to its chapter (#/<level>/<id>). */
export function Chips({ list, lit, ja }: { list: ChapterMeta[]; lit: number; ja: boolean }) {
  return (
    <ol className="chips">
      {list.map((c, i) => (
        <li key={c.id} className={i < lit ? 'on' : ''}>
          <a href={`#/${c.level}/${c.id}`}><Icon name={c.icon} /> <span>{c.level}.{i + 1}</span> {ja ? c.titleJa : c.titleEn}</a>
        </li>
      ))}
    </ol>
  )
}

/** Shared frame of a level intro: title, one paragraph, the figure + player, chips, a start link. */
export function useIntro(durationMs: number) {
  const [tS, setTS] = useState(() => (still() ? durationMs / 1000 : 0))
  return { now: Math.min(tS, durationMs / 1000), setTS }
}

/** Level 1 intro: the 1.1 drive plays while the five chapter chips light up. */
export default function Intro1({ t }: { t: Strings }) {
  const ja = t === STRINGS.ja
  const s = INTRO1_STRINGS[ja ? 'ja' : 'en']
  const sc = useMemo(() => introScenario(), [])
  const { now, setTS } = useIntro(sc.durationMs)
  const f = sc.frame(now * 1000)
  return (
    <>
      <div className="figure">
        <RobotSide f={f.drive} stopAt={0.5} tS={now} label={s.title} crashed="" />
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t}
          caption={s.caption(f.lit)} />
      </div>
      <div className="panel">
        <p className="learn">{s.title}</p>
        <p>{s.lead}</p>
        <Chips list={LEVEL1_CHAPTERS} lit={f.lit} ja={ja} />
        <p><a href={`#/1/${LEVEL1_CHAPTERS[0].id}`}>{s.start}</a></p>
      </div>
    </>
  )
}
