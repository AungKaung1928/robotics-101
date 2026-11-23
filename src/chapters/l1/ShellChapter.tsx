import { useMemo, useState } from 'react'
import Player from '../../components/Player'
import { STRINGS, type Strings } from '../../i18n'
import { SCRIPT, challengeOk, exec, fresh, prompt, scenario, session } from './shell'
import { SHELL_STRINGS } from './shell.strings'
import Term from './Term'
import './l1.css'
import Gloss from './Gloss'

const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const DOCS = 'https://docs.ros.org/en/humble/Tutorials/Beginner-CLI-Tools/Configuring-ROS2-Environment.html'

/** Prompts before each line of a session, so the folder in the prompt follows cd. */
const prompts = (cmds: string[]) => {
  let sh = fresh()
  return [prompt(sh), ...cmds.map((c) => { sh = exec(sh, c).sh; return prompt(sh) })]
}

/** 1.5: a typed demo of the 8 commands, then the reader's own pretend terminal. */
export default function ShellChapter({ t }: { t: Strings }) {
  const s = SHELL_STRINGS[t === STRINGS.ja ? 'ja' : 'en']
  const sc = useMemo(() => scenario(), [])
  const demo = useMemo(() => session(SCRIPT).lines, [])
  const demoPrompts = useMemo(() => prompts(SCRIPT), [])
  const [tS, setTS] = useState(() => (still() ? sc.durationMs / 1000 : 0))
  const now = Math.min(tS, sc.durationMs / 1000)
  const f = sc.frame(now * 1000)
  const [mine, setMine] = useState<string[]>([])
  const [input, setInput] = useState('')
  const own = session(mine)
  const ok = challengeOk(own.lines)
  return (
    <>
      <div className="figure">
        <Term lines={demo.slice(0, f.done)} start={demoPrompts} cursor={f.done < SCRIPT.length ? f.typing : undefined} />
        <Player t={now} setT={setTS} end={sc.durationMs / 1000} events={sc.eventsMs!.map((e) => e / 1000)} speed={1} autoplay={!still()} s={t}
          caption={<>{f.done}/{SCRIPT.length} · {SCRIPT[Math.min(f.done, SCRIPT.length - 1)]}</>} />
      </div>
      <div className="panel">
        <p className="learn">{s.learn}</p>
        {s.lines.map((l) => <p key={l}>{l}</p>)}
        <p className="group-h">{s.yours}</p>
        <Term lines={own.lines} start={prompts(mine)} cursor={input} />
        <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) setMine([...mine, input]); setInput('') }}>
          <input className="code" style={{ width: '100%', minWidth: 0 }} value={input} onChange={(e) => setInput(e.target.value)}
            aria-label={s.yours} placeholder="pwd" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        </form>
        <p className="runs">{s.runsHere}</p>
        <p><button type="button" className="break" onClick={() => { setMine([]); setInput('') }}>{s.newTerm}</button></p>
        <p><strong>{s.challenge}</strong></p>
        <p className={`verdict ${ok ? 'ok' : 'no'}`} data-k="challenge">{ok ? '✓ ' + s.solved : s.notYet}</p>
        <p className="group-h">{s.words}</p>
        <Gloss items={s.glossary} />
        <p className="src">{t.source}: <a href={DOCS}>ROS 2 Humble: Configuring environment</a> ("run this command on every new shell you open"), <a href="https://www.gnu.org/software/bash/manual/bash.html#Bourne-Shell-Builtins">Bash manual: cd, source, pwd, echo</a></p>
      </div>
    </>
  )
}
