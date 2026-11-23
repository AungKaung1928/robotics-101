import { langOf, stringsFor, type Strings } from '../../i18n'
import { ACT_STRINGS } from './act.strings'
import { MEET_STRINGS } from './meet.strings'
import { MOVE_STRINGS } from './move.strings'
import { GROWS_FROM } from './onramp'
import { SENSE_STRINGS } from './sense.strings'
import { SIMWHAT_STRINGS } from './simwhat.strings'
import { THINK_STRINGS } from './think.strings'

/** Titles of the Level 0 chapters a later chapter can grow from (GROWS_FROM targets inside Level 0). */
export const L0_TITLES: Record<string, { en: { title: string }; ja: { title: string } }> = {
  meet: MEET_STRINGS, move: MOVE_STRINGS, sense: SENSE_STRINGS, think: THINK_STRINGS, act: ACT_STRINGS, simwhat: SIMWHAT_STRINGS,
}
const LEAD = { en: 'You already know:', ja: 'もう知っていること：' }

/** "You already know: <chapter>" with a link back, for a chapter listed in GROWS_FROM whose source is a Level 0 chapter. */
export default function AlreadyKnow({ id, t }: { id: string; t: Strings }) {
  const from = GROWS_FROM[id]
  if (!from || !L0_TITLES[from]) return null
  const l = langOf(t) === 'ja' ? 'ja' : 'en' // LEAD has no Burmese yet: English
  const title = stringsFor(L0_TITLES[from], t, `l0.${from}.${from.toUpperCase()}_STRINGS`).title
  return <p className="note already" data-k="already-know">{LEAD[l]} <a href={`#/0/${from}`}>{title}</a></p>
}
