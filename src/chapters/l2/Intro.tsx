import { useMemo } from 'react'
import Player from '../../anim/Player'
import { STRINGS, type Strings } from '../../i18n'
import { Chips, useIntro } from '../l1/Intro'
import { LEVEL2_CHAPTERS } from '.'
import { introScenario } from './intro'
import { INTRO2_STRINGS } from './intro.strings'
import { NODES_STRINGS } from './nodes.strings'
import NodeGraph from './NodeGraph'

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Level 2 intro: the 2.1 launch start-up plays while the seven chapter chips light up. */
export default function Intro2({ t }: { t: Strings }) {
  const ja = t === STRINGS.ja
  const s = INTRO2_STRINGS[ja ? 'ja' : 'en']
  const sc = useMemo(() => introScenario(), [])
  const { now, setTS } = useIntro(sc.durationMs)
  const f = sc.frame(now * 1000)
  return (
    <>
      <div className="figure">
        <NodeGraph f={f.graph} label={s.title} stateName={NODES_STRINGS[ja ? 'ja' : 'en'].state} />
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={2} autoplay={!still()} s={t}
          caption={s.caption(f.lit, f.graph.working.length)} />
      </div>
      <div className="panel">
        <p className="learn">{s.title}</p>
        <p>{s.lead}</p>
        <Chips list={LEVEL2_CHAPTERS} lit={f.lit} ja={ja} />
        <p><a href={`#/2/${LEVEL2_CHAPTERS[0].id}`}>{s.start}</a></p>
      </div>
    </>
  )
}
