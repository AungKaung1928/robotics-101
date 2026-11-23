import { titleOf, type Strings } from '../i18n'
import { DOTS, GROWS_FROM, findChapter } from '../content/path'

/** Difficulty dots and the earlier chapter this one grows from (src/content/path.ts); nothing for chapters outside the scale. */
export default function PathLine({ id, t }: { id: string; t: Strings }) {
  const dots = DOTS[id], from = GROWS_FROM[id] ? findChapter(GROWS_FROM[id]) : null
  if (!dots && !from) return null
  return (
    <p className="pathline">
      {dots ? <span className="dots" role="img" aria-label={`${t.levels.difficulty} ${dots} / 5`} data-k="dots">{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= dots ? 'on' : undefined} />)}</span> : null}
      {from ? <span>{t.levels.knows}: <a href={from.href}>{from.num} {titleOf(from.meta, t)}</a></span> : null}
    </p>
  )
}
