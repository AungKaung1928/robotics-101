import { useMemo, useState } from 'react'
import Player from '../../anim/Player'
import { SOURCE_REPO } from '../../content/world'
import { STRINGS, type Strings } from '../../i18n'
import Term from '../l1/Term'
import { SCRIPT, WS, challengeOk, prompts, scenario, session } from './ws'
import { WS_STRINGS } from './ws.strings'
import '../l1/l1.css'
import './l2.css'
import Gloss from '../l1/Gloss'
import RealProject from './RealProject'

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Folders under the workspace, drawn as an indented tree. */
function Tree({ dirs, root }: { dirs: string[]; root: string }) {
  const under = dirs.filter((d) => d.startsWith(WS + '/')).map((d) => d.slice(WS.length + 1)).sort()
  return (
    <pre className="code tree" aria-label={root}>
      <span className="ln">{root}</span>
      {under.map((d) => <span key={d} className="ln val">{'  '.repeat(d.split('/').length)}{d.split('/').at(-1)}/</span>)}
    </pre>
  )
}

/** 2.6: the README build steps typed out, the workspace tree growing beside them; then the reader's own terminal. */
export default function WsChapter({ t }: { t: Strings }) {
  const s = WS_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const [broken, setBroken] = useState(false)
  const script = broken ? SCRIPT.slice(1) : SCRIPT
  const sc = useMemo(() => scenario(script), [script])
  const demo = useMemo(() => session(script), [script])
  const [tS, setTS] = useState(() => (still() ? sc.durationMs / 1000 : 0))
  const now = Math.min(tS, sc.durationMs / 1000)
  const f = sc.frame(now * 1000)
  const sofar = session(script.slice(0, f.done))
  const [mine, setMine] = useState<string[]>([])
  const [input, setInput] = useState('')
  const own = session(mine)
  const ok = challengeOk(own.lines)
  return (
    <>
      <div className="figure">
        <Tree dirs={sofar.w.dirs} root={s.tree} />
        <Term lines={demo.lines.slice(0, f.done)} start={prompts(script)} cursor={f.done < script.length ? f.typing : undefined} />
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t}
          caption={<>{f.done}/{script.length} · {script[Math.min(f.done, script.length - 1)]}</>} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <p><button type="button" className="break" onClick={() => { setBroken(!broken); setTS(still() ? Infinity : 0) }}>{broken ? s.fixIt : s.breakIt}</button></p>
        {broken && <p className="note">{s.brokenNote}</p>}
        <p className="group-h">{s.yours}</p>
        <Tree dirs={own.w.dirs} root={s.tree} />
        <Term lines={own.lines} start={prompts(mine)} cursor={input} />
        <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) setMine([...mine, input]); setInput('') }}>
          <input className="code" style={{ width: '100%', minWidth: 0 }} value={input} onChange={(e) => setInput(e.target.value)}
            aria-label={s.yours} placeholder={SCRIPT[0]} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        </form>
        <p className="runs">{s.runsHere}</p>
        <p><button type="button" className="break" onClick={() => { setMine([]); setInput('') }}>{s.newTerm}</button></p>
        <p className="note">{s.insideSrc}</p>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? '✓ ' + s.solved : s.notYet}</p>
        <p className="group-h">{s.words}</p>
        <Gloss items={s.glossary} />
        <RealProject id="ws" t={t} />
        <p className="src">{t.source}: <a href={`${SOURCE_REPO}/blob/main/README.md`}>TF-Transform-Explorer README:27-33</a>, <a href={`${SOURCE_REPO}/blob/main/package.xml#L4-L24`}>package.xml:4-24</a>, <a href={`${SOURCE_REPO}/blob/main/CMakeLists.txt#L107-L113`}>CMakeLists.txt:107-113</a>, <a href={`${SOURCE_REPO}/blob/main/src/tf_anomaly_detector.cpp#L30-L31`}>tf_anomaly_detector.cpp:30-31</a> · <a href="https://docs.ros.org/en/humble/Tutorials/Beginner-Client-Libraries/Colcon-Tutorial.html">Humble: Using colcon</a>, <a href="https://docs.ros.org/en/humble/Tutorials/Beginner-Client-Libraries/Creating-A-Workspace/Creating-A-Workspace.html">Creating a workspace</a></p>
      </div>
    </>
  )
}
