import { useState } from 'react'
import { waypointValues } from '../content/waypoints'
import { SOURCE_REPO, STACK, WAYPOINTS } from '../content/world'
import { titleOf, type Strings } from '../i18n'
import { CHAPTERS, type ChapterId } from '../lib/route'
import { CHAPTER_ICON, Icon } from '../icons'
import { EP_CHAPTERS } from '../chapters/ep'
import { LEVEL0_GROUPS } from '../chapters/l0'
import { LEVELS } from '../content/levels'
import { readDone } from '../lib/progress'
import Arena from './Arena'

export default function Overview({ t }: { t: Strings }) {
  const [peek, setPeek] = useState<ChapterId>(CHAPTERS[0])
  const [done] = useState(() => readDone(localStorage))
  const VALUE = waypointValues(t.wv)
  const path = WAYPOINTS.map(({ x, y }, i) => `${i ? 'L' : 'M'}${x} ${y}`).join('') + 'Z'
  const labels = CHAPTERS.map((c, i) => {
    const { x, y, side } = WAYPOINTS[i]
    const left = side === 'left'
    const body = (
      <g className="wp" transform={`translate(${x} ${-y})`}>
        <circle r="0.32" />
        <text className="wp-n" y="0.11">{i + 1}</text>
        <g transform={`translate(${left ? -0.5 : 0.5} 0)`} textAnchor={left ? 'end' : 'start'}>
          <text className="wp-title" y="-0.08">{t.chapters[c]}</text>
          <text className="wp-value" y="0.3">
            {VALUE[c].v}
            <tspan className="wp-kind"> · {t.kind[VALUE[c].kind]}</tspan>
          </text>
        </g>
      </g>
    )
    return (
      <a key={c} href={`#/${c}`} aria-label={`${i + 1}. ${t.chapters[c]}`} className={c === peek ? 'is-peek' : undefined}
        onMouseEnter={() => setPeek(c)} onFocus={() => setPeek(c)}>{body}</a>
    )
  })
  const chip = (c: (typeof LEVELS)[number][number], n: number, i: number) => (
    <a key={c.id} href={`#/${n}/${c.id}`} className={done.has(c.id) ? 'is-done' : undefined}>
      <Icon name={c.icon} /> <span>{n}.{i + 1} {titleOf(c, t)}</span>
      {done.has(c.id) && <span className="tick" aria-label={t.levels.opened}>✓</span>}
    </a>
  )
  const map = (
    <section className="levelmap" aria-labelledby="levels-h">
      <h2 id="levels-h">{t.levels.heading}</h2>
      <ol>
        {LEVELS.map((chs, n) => (
          <li key={n} className={chs.length ? undefined : 'is-soon'}>
            <span className="lv-n">{n}</span>
            <span className="lv-name">{t.levels.names[n]}</span>
            {chs.length ? (n === 0 ? (
              <span className="lv-groups">
                {LEVEL0_GROUPS.map((ids, g) => (
                  <span key={g} className="lv-group" role="group" aria-label={t.levels.groups[g]}>
                    <span className="lv-gname" aria-hidden="true">{t.levels.groups[g]}</span>
                    <span className="lv-chs">{chs.filter((c) => ids.includes(c.id)).map((c) => chip(c, n, chs.indexOf(c)))}</span>
                  </span>
                ))}
              </span>
            ) : <span className="lv-chs">{chs.map((c, i) => chip(c, n, i))}</span>
            ) : <span className="lv-chs note">{t.levels.soon}</span>}
          </li>
        ))}
        <li className="is-ep">
          <span className="lv-n">EP</span>
          <span className="lv-name">{t.levels.ep} <span className="note">{t.levels.epNote}</span></span>
          <span className="lv-chs">
            {EP_CHAPTERS.map((c, i) => (
              <a key={c.id} href={`#/ep/${c.id}`} className={done.has(c.id) ? 'is-done' : undefined}>
                <Icon name={c.icon} /> <span>EP{i + 1} {titleOf(c, t)}</span>
                {done.has(c.id) && <span className="tick" aria-label={t.levels.opened}>✓</span>}
              </a>
            ))}
          </span>
        </li>
      </ol>
    </section>
  )
  return (
    <>
    <main className="overview">
      <div className="ov-text">
        <p className="eyebrow"><a href={SOURCE_REPO}>{STACK.join(' · ')}</a></p>
        <h1>{t.title}</h1>
        <p className="lede">{t.lede}</p>
        <p className="cta"><a className="btn" href={`#/0/${LEVELS[0][0].id}`}>{t.startR101} →</a> <a className="btn btn-2" href={`#/ep/${EP_CHAPTERS[0].id}`}>{t.levels.ep} →</a></p>
        <p className="note">{t.keys}</p>
        <a className="peek" href={`#/${peek}`}>
          <span className="peek-n" data-k="peek">{CHAPTERS.indexOf(peek) + 1} / {CHAPTERS.length} · {VALUE[peek].v}</span>
          <strong><Icon name={CHAPTER_ICON[peek]} /> {t.chapters[peek]}</strong>
          <span>{t[peek].lines[0]}</span>
        </a>
        <p className="note">{t.pathNote}</p>
      </div>
      <Arena label={t.open} overlay={labels} role="group" names={false}>
        <path className="patrol" d={path} />
        <circle className="patrol-bot" r="0.22" style={{ offsetPath: `path('${path}')` }} aria-hidden="true" />
      </Arena>
    </main>
    {map}
    </>
  )
}
